<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  PhSquaresFour,
  PhCalendar,
  PhCourtBasketball,
  PhQrCode,
  PhCreditCard,
  PhChartBar,
  PhSignOut,
  PhX,
} from '@phosphor-icons/vue'
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
          <PhX :size="20" weight="bold" />
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
                <!-- Iconos de Phosphor -->
                <PhSquaresFour
                  v-if="item.icono === 'grid'"
                  class="w-5 h-5 flex-shrink-0"
                  :weight="route.path === item.ruta ? 'bold' : 'regular'"
                />
                <PhCalendar
                  v-else-if="item.icono === 'calendar'"
                  class="w-5 h-5 flex-shrink-0"
                  :weight="route.path === item.ruta ? 'bold' : 'regular'"
                />
                <PhCourtBasketball
                  v-else-if="item.icono === 'sports'"
                  class="w-5 h-5 flex-shrink-0"
                  :weight="route.path === item.ruta ? 'bold' : 'regular'"
                />
                <PhQrCode
                  v-else-if="item.icono === 'qr'"
                  class="w-5 h-5 flex-shrink-0"
                  :weight="route.path === item.ruta ? 'bold' : 'regular'"
                />
                <PhCreditCard
                  v-else-if="item.icono === 'credit-card'"
                  class="w-5 h-5 flex-shrink-0"
                  :weight="route.path === item.ruta ? 'bold' : 'regular'"
                />
                <PhChartBar
                  v-else-if="item.icono === 'chart'"
                  class="w-5 h-5 flex-shrink-0"
                  :weight="route.path === item.ruta ? 'bold' : 'regular'"
                />
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
        <PhSignOut class="w-5 h-5 flex-shrink-0" weight="bold" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>
