// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore, sincronizarColaOffline } from '../auth'
import { supabase } from '@/common/api/supabase'
import { authService } from '@/modules/M1-usuarios/services/auth.service'
import { accesosService } from '@/modules/M2-accesos/services/accesos.service'
import http from '@/common/api/http'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

vi.mock('@/common/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => {
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
  },
}))

vi.mock('@/modules/M1-usuarios/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    verifyLocalProfile: vi.fn(),
  },
}))

vi.mock('@/modules/M2-accesos/services/accesos.service', () => ({
  accesosService: {
    obtenerPerfilSocio: vi.fn(),
  },
}))

vi.mock('@/common/api/http', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('auth.ts - Store Complete Coverage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('resuelve user_metadata.avatar_url o picture de la sesión de Supabase', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'sup-1',
            user_metadata: {
              picture: 'https://lh3.googleusercontent.com/picture.jpg',
            },
          },
          access_token: 'fake-token',
        } as never,
      },
      error: null,
    })

    const store = useAuthStore()
    await store.initialize()

    store.setPerfilInterno({
      id: 1,
      nombre: 'Test',
      foto_url: undefined,
    })

    expect(store.usuario?.foto_url).toBe(
      'https://lh3.googleusercontent.com/picture.jpg'
    )
  })

  it('inicializa con perfil guardado en localStorage y sincroniza perfil de socio', async () => {
    const mockSession = { user: { id: '1' }, access_token: 'token' }
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as never },
      error: null,
    })

    localStorage.setItem(
      'fitzone_user_perfil',
      JSON.stringify({ id: 10, rol: 'socio', nombre: 'Carlos' })
    )

    vi.mocked(accesosService.obtenerPerfilSocio).mockResolvedValue({
      socioId: 10,
      nombre: 'Carlos',
      membresia: { membresia_estado: { descripcion: 'ACTIVA' } },
    } as never)

    const store = useAuthStore()
    await store.initialize()

    expect(store.isAuthenticated).toBe(true)
    expect(accesosService.obtenerPerfilSocio).toHaveBeenCalledWith(10)
  })

  it('maneja el cambio de estado de sesión a nulo mediante onAuthStateChange', async () => {
    let authListener: (
      event: AuthChangeEvent,
      session: Session | null
    ) => void = () => {}
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      authListener = cb as (
        event: AuthChangeEvent,
        session: Session | null
      ) => void
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never
    })

    const store = useAuthStore()
    await store.initialize()

    authListener('SIGNED_OUT', null)

    expect(store.session).toBeNull()
    expect(store.usuario).toBeNull()
    expect(store.perfilVerificado).toBe(false)
  })

  it('ejecuta cargarPerfilLocal y extrae rol y datos correctamente', async () => {
    vi.mocked(authService.verifyLocalProfile).mockResolvedValue({
      user: {
        id_usuario: 88,
        nombre: 'Lucia',
        roles: ['GERENTE'],
        id_sede: 1,
      },
    } as never)

    const store = useAuthStore()
    const user = await store.cargarPerfilLocal()

    expect(user?.id).toBe(88)
    expect(store.rol).toBe('gerente')
    expect(store.perfilVerificado).toBe(true)
  })

  it('ejecuta logout correctamente aun si falla authService.logout', async () => {
    const store = useAuthStore()
    store.setPerfilInterno({ id: 1, nombre: 'Ana' })
    vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'))

    await store.logout()

    expect(store.session).toBeNull()
    expect(store.usuario).toBeNull()
  })

  it('sincroniza la cola offline correctamente cuando hay elementos pendientes', async () => {
    const colaMock = [
      {
        tipo: 'INGRESO',
        data: { id_usuario: 1, id_sede: 1 },
        timestamp: '2026-11-19T00:00:00Z',
      },
    ]
    localStorage.setItem('fitzone_offline_queue', JSON.stringify(colaMock))
    vi.mocked(http.post).mockResolvedValue({ data: { success: true } } as never)

    await sincronizarColaOffline()

    expect(http.post).toHaveBeenCalled()
    const colaRestante = JSON.parse(
      localStorage.getItem('fitzone_offline_queue') || '[]'
    )
    expect(colaRestante).toHaveLength(0)
  })

  it('sincronizarColaOffline maneja cola vacía, elementos inválidos y errores manteniendo pendientes', async () => {
    await sincronizarColaOffline()
    expect(http.post).not.toHaveBeenCalled()

    localStorage.setItem('fitzone_offline_queue', JSON.stringify([]))
    await sincronizarColaOffline()
    expect(http.post).not.toHaveBeenCalled()

    const colaMixta = [
      { tipo: 'INGRESO' },
      {
        tipo: 'EGRESO',
        data: { id_usuario: 2, id_sede: 3 },
        timestamp: '2026-11-19T01:00:00Z',
      },
    ]
    localStorage.setItem('fitzone_offline_queue', JSON.stringify(colaMixta))
    vi.mocked(http.post).mockRejectedValueOnce(new Error('Offline'))

    await sincronizarColaOffline()
    const pendientes = JSON.parse(
      localStorage.getItem('fitzone_offline_queue') || '[]'
    ) as unknown[]
    expect(pendientes).toHaveLength(1)

    window.dispatchEvent(new Event('online'))
  })

  it('cubre login, avatar_url de sesión, JSON corrupto en initialize, perfil null y actualización parcial', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      session: {
        access_token: 'tok-login',
        user: {
          id: 'u1',
          user_metadata: { avatar_url: ' https://img/a.png ' },
        },
      },
    } as never)

    const store = useAuthStore()
    await store.login({ email: 'a@b.com', password: '123' } as never)
    expect(store.token).toBe('tok-login')

    vi.mocked(authService.login).mockResolvedValue({ session: null } as never)
    await store.login({ email: 'a@b.com', password: '123' } as never)

    localStorage.setItem('fitzone_user_perfil', '{bad-json')
    vi.stubGlobal('navigator', { onLine: false })
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'tok-login',
          user: {
            id: 'u1',
            user_metadata: { avatar_url: ' https://img/a.png ' },
          },
        } as never,
      },
      error: null,
    })
    await store.initialize()

    store.actualizarDatosUsuario({ nombre: 'Ignorado' })
    expect(store.usuario).toBeNull()

    store.setPerfilInterno({
      id: 5,
      nombre: 'Mario',
      id_ciudad: 1,
      estadoMembresia: 'ACTIVA',
      enMora: false,
    })
    expect(store.usuario?.foto_url).toBe('https://img/a.png')

    store.setPerfilInterno({ id: 5, nombre: 'Mario', rol: 'socio' })
    expect(store.usuario?.id_ciudad).toBe(1)
    expect(store.usuario?.estadoMembresia).toBe('ACTIVA')
    expect(store.usuario?.enMora).toBe(false)

    store.actualizarDatosUsuario({ apellido: 'López' })
    expect(store.usuario?.apellido).toBe('López')

    store.setPerfilInterno({ id: 9, nombre: 'Otro' })
    expect(store.usuario?.id_ciudad).toBeUndefined()

    vi.mocked(authService.verifyLocalProfile).mockResolvedValue({} as never)
    const nullResult = await store.cargarPerfilLocal()
    expect(nullResult).toBeNull()

    vi.mocked(authService.verifyLocalProfile).mockResolvedValue({
      user: { id_usuario: 9, nombre: 'Ext', rol: undefined, roles: [] },
    } as never)
    await store.cargarPerfilLocal()
    expect(store.rol).toBe('externo')

    vi.stubGlobal('navigator', { onLine: true })
  })

  it('cubre sincronizarPerfilSocio con arreglo vacío, membresía inactiva y catch de error', async () => {
    const store = useAuthStore()
    await store.sincronizarPerfilSocio()
    expect(accesosService.obtenerPerfilSocio).not.toHaveBeenCalled()

    store.setPerfilInterno({ id: 77, nombre: 'Pedro', rol: 'socio' })
    vi.mocked(accesosService.obtenerPerfilSocio).mockResolvedValueOnce({
      socioId: 77,
      nombre: 'Pedro',
      membresia: [{ membresia_estado: { descripcion: 'suspendida' } }],
    } as never)
    await store.sincronizarPerfilSocio()
    expect(store.usuario?.estadoMembresia).toBe('SUSPENDIDA')
    expect(store.usuario?.enMora).toBe(true)

    vi.mocked(accesosService.obtenerPerfilSocio).mockResolvedValueOnce({
      socioId: 77,
      nombre: 'Pedro',
      membresia: [],
    } as never)
    await store.sincronizarPerfilSocio()
    expect(store.usuario?.estadoMembresia).toBe('INACTIVA')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(accesosService.obtenerPerfilSocio).mockRejectedValueOnce(
      new Error('Fallo red')
    )
    await store.sincronizarPerfilSocio()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
