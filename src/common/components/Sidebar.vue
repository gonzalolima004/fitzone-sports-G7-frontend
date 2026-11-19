<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  PhSquaresFour,
  PhCalendar,
  PhCourtBasketball,
  PhQrCode,
  PhCreditCard,
  PhChartBar,
  PhMedal,
  PhSignOut,
  PhX,
  PhUserCheck,
  PhAddressBook,
  PhBuildings,
  PhTag,
  PhIdentificationCard,
  PhCaretDown,
  PhHouse,
} from '@phosphor-icons/vue'
import { useAuthStore, type RolUsuario } from '../../store/auth'

defineProps<{ abierto?: boolean }>()
const emit = defineEmits<{ (e: 'cerrar'): void }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

interface NavItem {
  nombre: string
  ruta: string
  icono: Component
  roles: RolUsuario[]
}

interface NavGrupo {
  id: string
  /** Sin título: el grupo se muestra siempre abierto y sin encabezado. */
  titulo?: string
  icono?: Component
  items: NavItem[]
}

const esGerente = computed(() => authStore.rol === 'gerente')

const gruposGerente: NavGrupo[] = [
  {
    id: 'inicio',
    items: [
      {
        nombre: 'Panel de gerencia',
        ruta: '/gerencia',
        icono: PhHouse,
        roles: ['gerente'],
      },
    ],
  },
  {
    id: 'operacion',
    titulo: 'Operación diaria',
    icono: PhUserCheck,
    items: [
      {
        nombre: 'Recepcion',
        ruta: '/recepcion',
        icono: PhUserCheck,
        roles: ['gerente'],
      },
      {
        nombre: 'Accesos y QR',
        ruta: '/accesos',
        icono: PhQrCode,
        roles: ['gerente'],
      },
      {
        nombre: 'Clases Grupales',
        ruta: '/clases',
        icono: PhCalendar,
        roles: ['gerente'],
      },
      {
        nombre: 'Canchas',
        ruta: '/canchas',
        icono: PhCourtBasketball,
        roles: ['gerente'],
      },
    ],
  },
  {
    id: 'socios',
    titulo: 'Socios y planes',
    icono: PhIdentificationCard,
    items: [
      {
        nombre: 'Directorio de Usuarios',
        ruta: '/gerencia/directorio-usuarios',
        icono: PhAddressBook,
        roles: ['gerente'],
      },
      {
        nombre: 'Planes',
        ruta: '/gerencia/planes',
        icono: PhTag,
        roles: ['gerente'],
      },
      {
        nombre: 'Membresías de socios',
        ruta: '/gerencia/membresias',
        icono: PhMedal,
        roles: ['gerente'],
      },
    ],
  },
  {
    id: 'instalaciones',
    titulo: 'Instalaciones',
    icono: PhBuildings,
    items: [
      // Sedes agrupa por pestañas Sedes / Horarios / Calendario.
      {
        nombre: 'Sedes y Horarios',
        ruta: '/gerencia/sedes',
        icono: PhBuildings,
        roles: ['gerente'],
      },
      {
        nombre: 'Gestión de Canchas',
        ruta: '/gerencia/canchas',
        icono: PhCourtBasketball,
        roles: ['gerente'],
      },
    ],
  },
  {
    id: 'finanzas',
    titulo: 'Finanzas',
    icono: PhCreditCard,
    items: [
      {
        nombre: 'Pagos y Facturación',
        ruta: '/pagos',
        icono: PhCreditCard,
        roles: ['gerente'],
      },
      // Reportes agrupa por pestañas Ingresos / Ocupación y reservas.
      {
        nombre: 'Reportes',
        ruta: '/gerencia/reportes',
        icono: PhChartBar,
        roles: ['gerente'],
      },
    ],
  },
]

const seccionesEstandar: NavGrupo[] = [
  {
    id: 'operaciones',
    titulo: 'OPERACIONES',
    items: [
      {
        nombre: 'Dashboard',
        ruta: '/socio-dashboard',
        icono: PhSquaresFour,
        roles: ['socio'],
      },
      {
        nombre: 'Recepcion',
        ruta: '/recepcion',
        icono: PhUserCheck,
        roles: ['recepcionista'],
      },
      {
        nombre: 'Historial',
        ruta: '/historial',
        icono: PhCalendar,
        roles: ['socio', 'externo'],
      },
      {
        nombre: 'Clases Grupales',
        ruta: '/clases',
        icono: PhCalendar,
        roles: ['socio', 'externo', 'recepcionista'],
      },
      {
        nombre: 'Canchas',
        ruta: '/canchas',
        icono: PhCourtBasketball,
        roles: ['socio', 'externo', 'recepcionista'],
      },
      {
        nombre: 'Accesos y QR',
        ruta: '/accesos',
        icono: PhQrCode,
        roles: ['socio', 'recepcionista'],
      },
    ],
  },
  {
    id: 'administracion',
    titulo: 'ADMINISTRACIÓN',
    items: [
      {
        nombre: 'Membresías',
        ruta: '/membresia',
        icono: PhMedal,
        roles: ['socio', 'externo', 'recepcionista'],
      },
      {
        nombre: 'Pagos y Facturación',
        ruta: '/pagos',
        icono: PhCreditCard,
        roles: ['socio', 'externo', 'recepcionista'],
      },
    ],
  },
]

const gruposFiltrados = computed(() => {
  const rolActivo = authStore.rol
  const fuente = esGerente.value ? gruposGerente : seccionesEstandar
  return fuente
    .map((grupo) => ({
      ...grupo,
      items: grupo.items.filter((item) => item.roles.includes(rolActivo)),
    }))
    .filter((grupo) => grupo.items.length > 0)
})

// Se marca solo el ítem de ruta más específica: así "Panel de gerencia"
// (/gerencia) no queda resaltado junto con otros ítems bajo /gerencia.
const rutaActiva = computed(() =>
  gruposFiltrados.value
    .flatMap((grupo) => grupo.items.map((item) => item.ruta))
    .filter(
      (ruta) =>
        route.path === ruta ||
        (ruta !== '/' && route.path.startsWith(ruta + '/'))
    )
    .reduce(
      (masEspecifica, ruta) =>
        ruta.length > masEspecifica.length ? ruta : masEspecifica,
      ''
    )
)

// Acordeón exclusivo (solo gerente): mantiene un único grupo abierto a la vez.
// undefined = usar el grupo de la ruta activa; null = todos cerrados manualmente.
const grupoAbiertoId = ref<string | null | undefined>(undefined)

watch(rutaActiva, () => {
  grupoAbiertoId.value = undefined
})

function grupoActivo(grupo: NavGrupo): boolean {
  return grupo.items.some((item) => item.ruta === rutaActiva.value)
}

function estaAbierto(grupo: NavGrupo): boolean {
  if (!esGerente.value || !grupo.titulo) return true
  if (grupoAbiertoId.value !== undefined) {
    return grupoAbiertoId.value === grupo.id
  }
  return grupoActivo(grupo)
}

function alternar(grupo: NavGrupo) {
  grupoAbiertoId.value = estaAbierto(grupo) ? null : grupo.id
}

async function cerrarSesion() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="w-64 bg-[#202759] text-white min-h-screen flex flex-col select-none shadow-md fixed inset-y-0 left-0 z-30 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0"
    :class="abierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <!-- Header del Sidebar / Logo -->
    <div
      class="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0"
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
            >Sports Club</span
          >
        </div>
      </div>
      <button
        type="button"
        class="md:hidden text-white/70 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
        @click="emit('cerrar')"
      >
        <PhX :size="20" weight="bold" />
      </button>
    </div>

    <!-- Menú (con scroll propio) -->
    <nav
      class="flex-1 overflow-y-auto px-4 py-4"
      :class="esGerente ? 'space-y-2' : 'space-y-6'"
    >
      <div v-for="grupo in gruposFiltrados" :key="grupo.id">
        <button
          v-if="esGerente && grupo.titulo"
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wider cursor-pointer transition-colors duration-200"
          :class="
            grupoActivo(grupo)
              ? 'text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          "
          :aria-expanded="estaAbierto(grupo)"
          @click="alternar(grupo)"
        >
          <component :is="grupo.icono" class="w-5 h-5 shrink-0" />
          <span class="flex-1 text-left">{{ grupo.titulo }}</span>
          <PhCaretDown
            class="w-4 h-4 shrink-0 transition-transform duration-200"
            :class="estaAbierto(grupo) ? 'rotate-180' : ''"
          />
        </button>

        <h2
          v-else-if="grupo.titulo"
          class="text-[11px] font-bold text-white/50 tracking-wider uppercase px-3 mb-2"
        >
          {{ grupo.titulo }}
        </h2>

        <ul
          v-if="estaAbierto(grupo)"
          class="space-y-1 list-none p-0 m-0"
          :class="
            esGerente && grupo.titulo
              ? 'mt-1 ml-3 pl-3 border-l border-white/10'
              : ''
          "
        >
          <li v-for="item in grupo.items" :key="item.ruta">
            <RouterLink
              :to="item.ruta"
              class="flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-all duration-200"
              :class="[
                esGerente ? 'py-2' : 'py-2.5',
                item.ruta === rutaActiva
                  ? 'bg-[#F96167] text-white font-bold shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:translate-x-1',
              ]"
              @click="emit('cerrar')"
            >
              <component
                :is="item.icono"
                class="w-5 h-5 shrink-0"
                :weight="item.ruta === rutaActiva ? 'bold' : 'regular'"
              />
              <span>{{ item.nombre }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Footer / Cerrar Sesión -->
    <div class="p-4 border-t border-white/10 shrink-0">
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-[#F96167] transition-all duration-200 cursor-pointer"
        @click="cerrarSesion"
      >
        <PhSignOut class="w-5 h-5 shrink-0" weight="bold" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>
