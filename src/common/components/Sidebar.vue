<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore, type RolUsuario } from '../../store/auth'

defineProps<{
  abierto?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

interface NavItem {
  nombre: string
  ruta: string
  icono: string
  roles: RolUsuario[]
}

interface NavSection {
  titulo: string
  items: NavItem[]
}

const todasLasSecciones: NavSection[] = [
  {
    titulo: 'OPERACIONES',
    items: [
      {
        nombre: 'Dashboard',
        ruta: '/',
        icono: 'grid',
        roles: ['socio', 'recepcion', 'gerente', 'admin'],
      },
      {
        nombre: 'Clases Grupales',
        ruta: '/clases',
        icono: 'calendar',
        roles: ['socio', 'admin'],
      },
      {
        nombre: 'Canchas',
        ruta: '/canchas',
        icono: 'sports',
        roles: ['socio', 'admin'],
      },
      {
        nombre: 'Accesos y QR',
        ruta: '/accesos',
        icono: 'qr',
        roles: ['socio', 'recepcion', 'admin'],
      },
    ],
  },
  {
    titulo: 'ADMINISTRACIÓN',
    items: [
      {
        nombre: 'Pagos y Membresía',
        ruta: '/pagos',
        icono: 'credit-card',
        roles: ['socio', 'admin'],
      },
      {
        nombre: 'Reportes',
        ruta: '/reportes',
        icono: 'chart',
        roles: ['gerente', 'admin'],
      },
    ],
  },
]

// Filtrar las opciones del menú según el rol activo del usuario
const seccionesFiltradas = computed(() => {
  const rolActivo = authStore.rol
  return todasLasSecciones
    .map((seccion) => ({
      ...seccion,
      items: seccion.items.filter((item) => item.roles.includes(rolActivo)),
    }))
    .filter((seccion) => seccion.items.length > 0)
})

function cerrarSesion() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="w-64 bg-[#202759] text-white min-h-screen flex flex-col justify-between select-none shadow-md fixed inset-y-0 left-0 z-30 transition-transform duration-300 md:static md:translate-x-0"
    :class="abierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <!-- Header del Sidebar / Logo -->
    <div>
      <div
        class="px-6 py-5 border-b border-white/10 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-[#F96167] flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
          >
            FZ
          </div>
          <div>
            <h1
              class="text-base font-extrabold tracking-tight text-white leading-tight m-0"
            >
              FitZone
            </h1>
            <span
              class="text-[11px] font-semibold tracking-wider text-white/60 uppercase"
            >
              Sports Club
            </span>
          </div>
        </div>

        <!-- Botón cerrar visible únicamente en móviles -->
        <button
          type="button"
          class="md:hidden text-white/70 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
          title="Cerrar menú"
          @click="emit('cerrar')"
        >
          ✕
        </button>
      </div>

      <!-- Menú de Navegación Dinámico según el Rol -->
      <nav class="px-4 py-4 space-y-6">
        <div v-for="seccion in seccionesFiltradas" :key="seccion.titulo">
          <h2
            class="text-[11px] font-bold text-white/50 tracking-wider uppercase px-3 mb-2"
          >
            {{ seccion.titulo }}
          </h2>
          <ul class="space-y-1 list-none p-0 m-0">
            <li v-for="item in seccion.items" :key="item.ruta">
              <RouterLink
                :to="item.ruta"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                :class="
                  route.path === item.ruta
                    ? 'bg-[#F96167] text-white font-bold shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10 hover:translate-x-1'
                "
                @click="emit('cerrar')"
              >
                <!-- Iconos SVG en blanco -->
                <svg
                  v-if="item.icono === 'grid'"
                  class="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'calendar'"
                  class="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'sports'"
                  class="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'qr'"
                  class="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'credit-card'"
                  class="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <svg
                  v-else-if="item.icono === 'chart'"
                  class="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>{{ item.nombre }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <!-- Footer del Sidebar / Cerrar Sesión -->
    <div class="p-4 border-t border-white/10">
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-[#F96167] transition-all duration-200 cursor-pointer"
        @click="cerrarSesion"
      >
        <svg
          class="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>
