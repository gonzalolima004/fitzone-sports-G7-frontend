import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../common/layouts/MainLayout.vue'
import { useAuthStore, type RolUsuario } from '../store/auth'
import { rutaPorRol } from '@/common/guards/ruta-por-rol'
import { rutasLanding } from '@/modules/landing/routes'
import { authService } from '@/modules/M1-usuarios/services/auth.service'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: RolUsuario[]
  }
}

interface PerfilBackendResponse {
  success?: boolean
  user?: {
    id_usuario: number
    dni?: string
    nombre?: string
    apellido?: string
    email?: string
    telefono?: string | null
    foto_url?: string | null
    rol?: string
    roles?: string[]
    id_sede?: number
    sede?: {
      id_sede: number
      nombre?: string
      id_ciudad?: number
    }
  }
}

const routes: RouteRecordRaw[] = [
  ...rutasLanding,

  {
    path: '/login',
    name: 'login',
    component: () => import('../modules/M1-usuarios/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('@/modules/M1-usuarios/views/RegistroView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/cambiar-password',
    name: 'cambiar-password',
    component: () =>
      import('@/modules/M1-usuarios/views/CambiarPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/completar-perfil',
    name: 'completar-perfil',
    component: () =>
      import('@/modules/M1-usuarios/views/CompletarPerfilView.vue'),
    meta: { requiresAuth: true },
  },

  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'inicio',
        name: 'home',
        component: () => import('../common/views/HomeView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'recepcionista', 'gerente'],
        },
        beforeEnter: (_to, _from, next) => {
          const authStore = useAuthStore()
          if (
            authStore.rol === 'recepcionista' ||
            authStore.rol === 'gerente'
          ) {
            next({ name: 'recepcion' })
          } else {
            next()
          }
        },
      },

      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('@/modules/M1-usuarios/views/PerfilView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'membresia',
        name: 'membresia',
        component: () =>
          import('../modules/M1-usuarios/views/MembresiaView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },

      {
        path: 'accesos',
        name: 'accesos',
        component: () =>
          import('../modules/M2-accesos/views/CredencialView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'recepcion',
        name: 'recepcion',
        component: () =>
          import('../modules/M2-accesos/views/RecepcionView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['recepcionista', 'gerente'],
        },
      },
      {
        path: 'aforo',
        name: 'aforo',
        component: () => import('../modules/M2-accesos/views/AforoView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['gerente'],
        },
      },

      {
        path: 'clases',
        name: 'clases',
        component: () =>
          import('../modules/M3-clases-grupales/views/ClasesView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },

      {
        path: 'canchas',
        name: 'canchas',
        component: () => import('../modules/M4-canchas/views/CanchasView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'canchas/reservas/:id',
        name: 'canchas-detalle-reserva',
        component: () =>
          import('../modules/M4-canchas/views/DetalleReservaView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },

      {
        path: 'pagos',
        name: 'pagos',
        component: () => import('../modules/M5-pagos/views/PagosView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'pagos/resultado',
        name: 'pagos-resultado',
        alias: ['/pagos/exito', '/pagos/error', '/pagos/pendiente'],
        component: () =>
          import('../modules/M5-pagos/views/ResultadoPagoView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },

      {
        path: 'gerencia',
        meta: {
          requiresAuth: true,
          roles: ['gerente'],
        },
        children: [
          {
            path: '',
            name: 'gerencia',
            component: () =>
              import('../modules/gerencia/views/GerenciaDashboardView.vue'),
          },
          {
            path: 'directorio-usuarios',
            name: 'directorio-usuarios',
            component: () =>
              import('@/modules/M1-usuarios/views/DirectorioUsuariosView.vue'),
          },
          {
            path: 'canchas',
            name: 'gerencia-canchas',
            component: () =>
              import('../modules/M4-canchas/views/GerenciaCanchasView.vue'),
          },
          {
            path: 'sedes',
            name: 'gerencia-sedes',
            component: () =>
              import('../modules/gerencia/views/GestionSedesView.vue'),
          },
          {
            path: 'planes',
            name: 'gerencia-planes',
            component: () =>
              import('../modules/gerencia/views/GestionPlanesView.vue'),
          },
          {
            path: 'membresias',
            name: 'gerencia-membresias',
            component: () =>
              import('../modules/gerencia/views/GestionMembresiasView.vue'),
          },
          {
            path: 'calendario',
            name: 'gerencia-calendario',
            component: () =>
              import('../modules/gerencia/views/GestionCalendarioView.vue'),
          },
          {
            path: 'reportes',
            component: () =>
              import('../modules/M6-reportes/views/PanelGerenciaView.vue'),
            children: [
              {
                path: '',
                name: 'reportes',
                component: () =>
                  import('../modules/M6-reportes/views/ReportesView.vue'),
              },
              {
                path: 'ocupacion',
                name: 'reportes-ocupacion',
                component: () =>
                  import('../modules/M6-reportes/views/OcupacionView.vue'),
              },
            ],
          },
        ],
      },

      {
        path: 'reportes',
        redirect: '/gerencia/reportes',
      },
      {
        path: 'reportes/ocupacion',
        redirect: '/gerencia/reportes/ocupacion',
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../common/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  if (window.location.hash.includes('access_token=')) {
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search
    )
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  if (
    authStore.isAuthenticated &&
    to.path !== '/completar-perfil' &&
    (requiresAuth || to.name === 'login' || to.name === 'registro')
  ) {
    if (!authStore.perfilVerificado) {
      try {
        const respuesta =
          (await authService.verifyLocalProfile()) as PerfilBackendResponse
        const u = respuesta?.user
        if (u) {
          const rolBackend = String(
            u.rol ?? u.roles?.[0] ?? 'externo'
          ).toLowerCase() as RolUsuario

          authStore.setPerfilInterno({
            id: u.id_usuario,
            dni: u.dni,
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            telefono: u.telefono ?? undefined,
            foto_url: u.foto_url ?? undefined,
            rol: rolBackend,
            id_sede: u.id_sede,
            sede: u.sede,
          })
          authStore.marcarPerfilVerificado(true)
        }
      } catch (error) {
        const err = error as { response?: { status?: number } }
        if (err.response?.status === 403) {
          return
        }
        await authStore.logout()
        return next({ name: 'login' })
      }
    }
  }

  if (
    (to.name === 'login' || to.name === 'registro') &&
    authStore.isAuthenticated
  ) {
    return next(rutaPorRol(authStore.rol))
  }

  if (authStore.isAuthenticated) {
    const rolActual = authStore.rol
    const tienePermiso = to.matched.every((record) => {
      const roles = record.meta?.roles as RolUsuario[] | undefined
      return !roles || (rolActual && roles.includes(rolActual))
    })

    if (!tienePermiso) {
      return next(rutaPorRol(rolActual))
    }
  }

  next()
})

export default router
