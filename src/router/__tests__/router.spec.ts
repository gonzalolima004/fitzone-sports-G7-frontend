// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '../index'
import type { RouteRecordRaw } from 'vue-router'

// Mock de la vista Landing para evitar la resolución de recursos estáticos en entorno Node de Windows
vi.mock('@/modules/landing/views/LandingView.vue', () => ({
  default: {
    template: '<div>Landing Mock</div>',
  },
}))

const mockAuthStore = vi.hoisted(() => ({
  isInitialized: true,
  isAuthenticated: false,
  perfilVerificado: false,
  rol: 'socio' as string,
  usuario: null as Record<string, unknown> | null,
  initialize: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
  setPerfilInterno: vi.fn(),
  marcarPerfilVerificado: vi.fn(),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('@/modules/M1-usuarios/services/auth.service', () => ({
  authService: {
    verifyLocalProfile: vi.fn(async () => ({
      success: true,
      user: {
        id_usuario: 10,
        nombre: 'Carlos',
        apellido: 'Gómez',
        email: 'carlos@example.com',
        dni: '12345678',
        telefono: '1123456789',
        rol: 'socio',
      },
    })),
  },
}))

vi.mock('@/common/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

import { authService } from '@/modules/M1-usuarios/services/auth.service'

describe('Router Configuration & Navigation Guards', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.perfilVerificado = false
    mockAuthStore.rol = 'socio'
    mockAuthStore.usuario = null
  })

  it('configura todas las rutas principales y dinámicas con Lazy Loading (component function)', () => {
    const flattenRoutes = (
      routeList: readonly RouteRecordRaw[]
    ): RouteRecordRaw[] => {
      let result: RouteRecordRaw[] = []
      for (const route of routeList) {
        result.push(route)
        if (route.children) {
          result = result.concat(flattenRoutes(route.children))
        }
      }
      return result
    }

    const allRoutes = flattenRoutes(router.options.routes)

    // Verificar que las rutas hijas y vistas dinámicas sean funciones (lazy-loaded)
    const lazyRoutePaths = [
      '/login',
      '/registro',
      '/cambiar-password',
      '/completar-perfil',
      'perfil',
      'membresia',
      'canchas',
      'pagos',
      'clases',
    ]

    for (const path of lazyRoutePaths) {
      const match = allRoutes.find((r) => r.path === path)
      if (match && match.component) {
        expect(typeof match.component).toBe('function')
      }
    }
  })

  it('no posee nombres de rutas duplicados', () => {
    const names: string[] = []
    const duplicates: string[] = []

    const checkNames = (routeList: readonly RouteRecordRaw[]) => {
      for (const r of routeList) {
        if (r.name) {
          const strName = String(r.name)
          if (names.includes(strName)) {
            duplicates.push(strName)
          } else {
            names.push(strName)
          }
        }
        if (r.children) {
          checkNames(r.children)
        }
      }
    }

    checkNames(router.options.routes)
    expect(duplicates).toEqual([])
  })

  it('redirige a /login cuando un usuario no autenticado intenta acceder a una ruta protegida', async () => {
    mockAuthStore.isAuthenticated = false
    await router.push('/perfil')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('bloquea mediante RBAC a un usuario con rol "externo" cuando intenta acceder a /gerencia', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.perfilVerificado = true
    mockAuthStore.rol = 'externo'
    mockAuthStore.usuario = { id: 1, rol: 'externo' }

    await router.push('/gerencia')
    // El rol externo es redirigido a /canchas según rutaPorRol
    expect(router.currentRoute.value.path).toBe('/canchas')
  })

  it('permite el acceso a /perfil e hidrata el perfil en el store si no estaba verificado', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.perfilVerificado = false
    mockAuthStore.rol = 'socio'
    mockAuthStore.usuario = null

    await router.push('/perfil')

    expect(mockAuthStore.setPerfilInterno).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        nombre: 'Carlos',
        apellido: 'Gómez',
        email: 'carlos@example.com',
        dni: '12345678',
        telefono: '1123456789',
        rol: 'socio',
      })
    )
    expect(mockAuthStore.marcarPerfilVerificado).toHaveBeenCalledWith(true)
    expect(router.currentRoute.value.path).toBe('/perfil')
  })

  it('inicializa authStore si no está inicializado, limpia hash access_token y redirige según rol desde login/registro', async () => {
    mockAuthStore.isInitialized = false
    mockAuthStore.isAuthenticated = true
    mockAuthStore.perfilVerificado = true
    window.history.replaceState({}, '', '/login#access_token=abc')

    mockAuthStore.rol = 'gerente'
    await router.push('/login')
    expect(mockAuthStore.initialize).toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/gerencia')

    mockAuthStore.rol = 'recepcionista'
    await router.push('/registro')
    expect(router.currentRoute.value.path).toBe('/recepcion')

    mockAuthStore.rol = 'socio'
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/socio-dashboard')
  })

  it('permite navegar offline con perfil local en caché y cierra sesión ante error no-red al verificar perfil', async () => {
    mockAuthStore.isInitialized = true
    mockAuthStore.isAuthenticated = true
    mockAuthStore.perfilVerificado = false
    mockAuthStore.rol = 'socio'
    mockAuthStore.usuario = { id: 10, rol: 'socio' }

    vi.stubGlobal('navigator', { onLine: false })
    await router.push('/perfil')
    expect(authService.verifyLocalProfile).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/perfil')

    vi.stubGlobal('navigator', { onLine: true })
    vi.mocked(authService.verifyLocalProfile).mockRejectedValueOnce({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    })
    await router.push('/accesos')
    expect(router.currentRoute.value.path).toBe('/accesos')

    mockAuthStore.usuario = null
    mockAuthStore.logout.mockImplementationOnce(async () => {
      mockAuthStore.isAuthenticated = false
    })
    vi.mocked(authService.verifyLocalProfile).mockRejectedValueOnce({
      response: { status: 401 },
    })
    await router.push('/canchas')
    expect(mockAuthStore.logout).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('login')
  })
})
