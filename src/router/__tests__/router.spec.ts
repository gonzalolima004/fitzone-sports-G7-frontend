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
})
