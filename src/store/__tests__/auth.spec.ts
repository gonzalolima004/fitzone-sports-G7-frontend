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
})
