<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/common/api/http'
import { useAuthStore } from '@/store/auth'
import { useSedeStore } from '@/store/sede'
import {
  clasesService,
  type ClaseAgendaResponse,
} from '@/modules/M3-clases-grupales/services/clases.service'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import {
  PhClock,
  PhUser,
  PhArrowRight,
  PhUsers,
  PhMapPin,
  PhBuildings,
  PhCaretDown,
  PhCheck,
  PhMagnifyingGlass,
} from '@phosphor-icons/vue'

interface CiudadApi {
  id_ciudad: number
  nombre: string
  activo?: boolean
}

interface SedeApi {
  id_sede: number
  nombre: string
  direccion?: string
  aforo_maximo?: number
  activo?: boolean
  id_ciudad: number
}

const router = useRouter()
const authStore = useAuthStore()
const sedeStore = useSedeStore()

const cargando = ref(true)
const cargandoClases = ref(false)
const error = ref<string | null>(null)

const ciudades = ref<CiudadApi[]>([])
const sedes = ref<SedeApi[]>([])
const idCiudadSeleccionada = ref<number | null>(null)
const idSedeSeleccionada = ref<number | null>(null)

// Estados para los custom dropdowns
const menuCiudadAbierto = ref(false)
const menuSedeAbierto = ref(false)
const filtroTextoCiudad = ref('')

const dropdownCiudadRef = ref<HTMLElement | null>(null)
const dropdownSedeRef = ref<HTMLElement | null>(null)

const clases = ref<ClaseAgendaResponse[]>([])

const ciudadSeleccionada = computed(() => {
  return (
    ciudades.value.find((c) => c.id_ciudad === idCiudadSeleccionada.value) ||
    null
  )
})

const sedeSeleccionada = computed(() => {
  return sedes.value.find((s) => s.id_sede === idSedeSeleccionada.value) || null
})

const sedesFiltradas = computed(() => {
  if (!idCiudadSeleccionada.value) return sedes.value
  return sedes.value.filter((s) => s.id_ciudad === idCiudadSeleccionada.value)
})

const ciudadesFiltradasPorBusqueda = computed(() => {
  if (!filtroTextoCiudad.value.trim()) return ciudades.value
  const q = filtroTextoCiudad.value.toLowerCase()
  return ciudades.value.filter((c) => c.nombre.toLowerCase().includes(q))
})

const primerasClases = computed(() => clases.value.slice(0, 3))
const restantes = computed(() => Math.max(0, clases.value.length - 3))
const hayMas = computed(() => clases.value.length > 3)

function irAClases() {
  if (authStore.isAuthenticated) {
    router.push('/clases')
  } else {
    router.push({ path: '/login', query: { redirect: '/clases' } })
  }
}

async function cargarClases(idSede: number) {
  try {
    cargandoClases.value = true
    error.value = null
    const data = await clasesService.obtenerClasesPorSede(idSede)
    if (Array.isArray(data)) {
      clases.value = data
    } else {
      clases.value = []
    }
  } catch (err: unknown) {
    console.error('Error al cargar clases para la landing:', err)
    error.value = 'No se pudieron sincronizar las clases en este momento.'
    clases.value = []
  } finally {
    cargandoClases.value = false
  }
}

function toggleMenuCiudad() {
  menuCiudadAbierto.value = !menuCiudadAbierto.value
  if (menuCiudadAbierto.value) {
    menuSedeAbierto.value = false
    filtroTextoCiudad.value = ''
  }
}

function toggleMenuSede() {
  menuSedeAbierto.value = !menuSedeAbierto.value
  if (menuSedeAbierto.value) {
    menuCiudadAbierto.value = false
  }
}

function seleccionarCiudad(id: number) {
  idCiudadSeleccionada.value = id
  menuCiudadAbierto.value = false
  filtroTextoCiudad.value = ''

  const sedesDeCiudad = sedes.value.filter((s) => s.id_ciudad === id)
  if (sedesDeCiudad.length > 0) {
    seleccionarSede(sedesDeCiudad[0].id_sede)
  } else {
    idSedeSeleccionada.value = null
    clases.value = []
  }
}

async function seleccionarSede(id: number) {
  idSedeSeleccionada.value = id
  menuSedeAbierto.value = false
  sedeStore.seleccionarSede(id)
  await cargarClases(id)
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (dropdownCiudadRef.value && !dropdownCiudadRef.value.contains(target)) {
    menuCiudadAbierto.value = false
  }
  if (dropdownSedeRef.value && !dropdownSedeRef.value.contains(target)) {
    menuSedeAbierto.value = false
  }
}

async function inicializarDatos() {
  try {
    cargando.value = true
    error.value = null

    // Cargar ciudades y sedes en paralelo
    const [resCiudades, resSedes] = await Promise.all([
      http.get<CiudadApi[]>('/ciudades'),
      http.get<SedeApi[]>('/sedes'),
    ])

    ciudades.value = Array.isArray(resCiudades.data) ? resCiudades.data : []
    sedes.value = Array.isArray(resSedes.data) ? resSedes.data : []

    if (ciudades.value.length > 0) {
      // Determinar ciudad y sede inicial
      const sedeGuardada = sedes.value.find(
        (s) => s.id_sede === sedeStore.idSedeSeleccionada
      )

      const ciudadInicial = sedeGuardada
        ? sedeGuardada.id_ciudad
        : ciudades.value[0].id_ciudad

      idCiudadSeleccionada.value = ciudadInicial

      const sedesDeCiudad = sedes.value.filter(
        (s) => s.id_ciudad === ciudadInicial
      )

      const sedeInicial =
        sedeGuardada?.id_sede || sedesDeCiudad[0]?.id_sede || 1
      idSedeSeleccionada.value = sedeInicial

      await cargarClases(sedeInicial)
    }
  } catch (err: unknown) {
    console.error('Error al inicializar filtros de clases:', err)
    error.value = 'No se pudieron cargar las ciudades y sedes.'
  } finally {
    cargando.value = false
  }
}

watch(
  () => sedeStore.idSedeSeleccionada,
  async (nuevoId) => {
    if (!nuevoId || nuevoId === idSedeSeleccionada.value) return
    const sedeEncontrada = sedes.value.find((s) => s.id_sede === nuevoId)
    if (sedeEncontrada) {
      idCiudadSeleccionada.value = sedeEncontrada.id_ciudad
      idSedeSeleccionada.value = nuevoId
      await cargarClases(nuevoId)
    }
  }
)

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (sedeStore.sedes.length === 0) {
    await sedeStore.cargarSedes().catch(() => {})
  }
  await inicializarDatos()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <section
    id="actividades"
    class="py-20 sm:py-28 bg-white border-b border-slate-100"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de Sección -->
      <div class="text-center max-w-3xl mx-auto mb-10">
        <span
          class="text-xs font-bold uppercase tracking-wider text-[#b82a30] bg-[#f96167]/15 px-3.5 py-1.5 rounded-full inline-block mb-3"
        >
          Clases Grupales y Actividades
        </span>
        <h2
          class="text-3xl sm:text-5xl font-black tracking-tight text-[#202759] mb-4"
        >
          Entrená en equipo con profesores certificados
        </h2>
        <p class="text-base sm:text-lg text-slate-600 leading-relaxed">
          Seleccioná tu ciudad y sede para consultar las clases disponibles en
          tiempo real y reservar tu lugar desde la plataforma.
        </p>
      </div>

      <!-- Filtros Personalizados (Custom Dropdowns Estilo Stripe / Linear) -->
      <div
        v-if="ciudades.length > 0 && sedes.length > 0"
        class="max-w-2xl mx-auto mb-14 p-2 sm:p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 relative z-30"
      >
        <!-- 1. Dropdown Personalizado Ciudad -->
        <div ref="dropdownCiudadRef" class="relative flex-1">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#202759]/40 transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202759]"
            :class="{
              'ring-2 ring-[#202759]/20 border-[#202759]': menuCiudadAbierto,
            }"
            aria-haspopup="listbox"
            :aria-expanded="menuCiudadAbierto"
            @click="toggleMenuCiudad"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-8 h-8 rounded-lg bg-[#F96167]/10 flex items-center justify-center shrink-0"
              >
                <PhMapPin class="w-4 h-4 text-[#F96167]" weight="bold" />
              </div>
              <div class="flex flex-col min-w-0">
                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Ciudad
                </span>
                <span class="text-sm font-bold text-[#202759] truncate">
                  {{ ciudadSeleccionada?.nombre || 'Seleccionar ciudad' }}
                </span>
              </div>
            </div>
            <PhCaretDown
              class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180 text-[#202759]': menuCiudadAbierto }"
              weight="bold"
            />
          </button>

          <!-- Menú Flotante de Ciudades -->
          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="transform scale-95 opacity-0 -translate-y-1"
            enter-to-class="transform scale-100 opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="transform scale-100 opacity-100 translate-y-0"
            leave-to-class="transform scale-95 opacity-0 -translate-y-1"
          >
            <div
              v-if="menuCiudadAbierto"
              class="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden py-2"
              role="listbox"
            >
              <!-- Input de Búsqueda si hay más de 5 ciudades -->
              <div
                v-if="ciudades.length > 5"
                class="px-3 pb-2 border-b border-slate-100"
              >
                <div class="relative flex items-center">
                  <PhMagnifyingGlass
                    class="w-3.5 h-3.5 text-slate-400 absolute left-2.5"
                  />
                  <input
                    v-model="filtroTextoCiudad"
                    type="text"
                    placeholder="Buscar ciudad..."
                    class="w-full text-xs font-medium pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-none focus:border-[#202759]/40 text-slate-800"
                    @click.stop
                  />
                </div>
              </div>

              <!-- Lista con Scroll Estilizado -->
              <ul
                class="max-h-56 overflow-y-auto px-1.5 py-1 space-y-0.5 list-none m-0"
              >
                <li
                  v-for="ciudad in ciudadesFiltradasPorBusqueda"
                  :key="ciudad.id_ciudad"
                  role="option"
                  :aria-selected="ciudad.id_ciudad === idCiudadSeleccionada"
                  class="px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  :class="[
                    ciudad.id_ciudad === idCiudadSeleccionada
                      ? 'bg-[#202759]/5 text-[#202759] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#202759]',
                  ]"
                  @click="seleccionarCiudad(ciudad.id_ciudad)"
                >
                  <span>{{ ciudad.nombre }}</span>
                  <PhCheck
                    v-if="ciudad.id_ciudad === idCiudadSeleccionada"
                    class="w-4 h-4 text-[#F96167]"
                    weight="bold"
                  />
                </li>
                <li
                  v-if="ciudadesFiltradasPorBusqueda.length === 0"
                  class="px-3 py-4 text-xs text-slate-400 text-center"
                >
                  No se encontraron ciudades
                </li>
              </ul>
            </div>
          </transition>
        </div>

        <!-- 2. Dropdown Personalizado Sede -->
        <div ref="dropdownSedeRef" class="relative flex-1">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#202759]/40 transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202759]"
            :class="{
              'ring-2 ring-[#202759]/20 border-[#202759]': menuSedeAbierto,
            }"
            aria-haspopup="listbox"
            :aria-expanded="menuSedeAbierto"
            @click="toggleMenuSede"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-8 h-8 rounded-lg bg-[#202759]/10 flex items-center justify-center shrink-0"
              >
                <PhBuildings class="w-4 h-4 text-[#202759]" weight="bold" />
              </div>
              <div class="flex flex-col min-w-0">
                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Sede
                </span>
                <span class="text-sm font-bold text-[#202759] truncate">
                  {{ sedeSeleccionada?.nombre || 'Seleccionar sede' }}
                </span>
              </div>
            </div>
            <PhCaretDown
              class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180 text-[#202759]': menuSedeAbierto }"
              weight="bold"
            />
          </button>

          <!-- Menú Flotante de Sedes -->
          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="transform scale-95 opacity-0 -translate-y-1"
            enter-to-class="transform scale-100 opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="transform scale-100 opacity-100 translate-y-0"
            leave-to-class="transform scale-95 opacity-0 -translate-y-1"
          >
            <div
              v-if="menuSedeAbierto"
              class="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden py-2"
              role="listbox"
            >
              <ul
                class="max-h-56 overflow-y-auto px-1.5 py-1 space-y-0.5 list-none m-0"
              >
                <li
                  v-for="sede in sedesFiltradas"
                  :key="sede.id_sede"
                  role="option"
                  :aria-selected="sede.id_sede === idSedeSeleccionada"
                  class="px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  :class="[
                    sede.id_sede === idSedeSeleccionada
                      ? 'bg-[#202759]/5 text-[#202759] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#202759]',
                  ]"
                  @click="seleccionarSede(sede.id_sede)"
                >
                  <div class="flex flex-col text-left">
                    <span>{{ sede.nombre }}</span>
                    <span
                      v-if="sede.direccion"
                      class="text-[11px] text-slate-400 font-normal"
                    >
                      {{ sede.direccion }}
                    </span>
                  </div>
                  <PhCheck
                    v-if="sede.id_sede === idSedeSeleccionada"
                    class="w-4 h-4 text-[#F96167] shrink-0 ml-2"
                    weight="bold"
                  />
                </li>
                <li
                  v-if="sedesFiltradas.length === 0"
                  class="px-3 py-4 text-xs text-slate-400 text-center"
                >
                  No hay sedes en esta ciudad
                </li>
              </ul>
            </div>
          </transition>
        </div>
      </div>

      <!-- Estado de Carga (Skeletons) -->
      <div
        v-if="cargando || cargandoClases"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="p-7 rounded-2xl bg-[#f4f6fa]/70 border border-slate-200/80 space-y-4 shadow-xs"
        >
          <div class="flex justify-between items-center">
            <BaseSkeleton variant="badge" width="90px" />
            <BaseSkeleton variant="circular" width="36px" height="36px" />
          </div>
          <BaseSkeleton variant="text" width="70%" height="24px" />
          <BaseSkeleton variant="text" width="95%" />
          <BaseSkeleton variant="text" width="80%" />
          <div class="pt-4 border-t border-slate-200/60 space-y-2">
            <BaseSkeleton variant="text" width="50%" />
            <BaseSkeleton variant="text" width="60%" />
          </div>
        </div>
      </div>

      <!-- Estado Sin clases para la sede seleccionada -->
      <div
        v-else-if="clases.length === 0"
        class="p-8 sm:p-10 rounded-3xl bg-[#f4f6fa] border border-slate-200 text-center max-w-lg mx-auto space-y-4 shadow-xs"
      >
        <PhUsers class="w-12 h-12 text-[#202759] mx-auto opacity-70" />
        <h3 class="text-xl font-bold text-[#202759]">
          Agenda de clases en preparación
        </h3>
        <p class="text-sm text-slate-600 leading-relaxed">
          Actualmente no hay clases grupales programadas para la sede
          seleccionada. Podés elegir otra sede en el filtro o consultar el
          calendario completo.
        </p>
        <BaseButton variant="primary" size="md" @click="irAClases">
          Ver calendario de clases
        </BaseButton>
      </div>

      <!-- Grilla de Primeras 3 Clases + Card "+X más" -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch"
      >
        <!-- Primeras 3 Clases Reales de la BD -->
        <div
          v-for="clase in primerasClases"
          :key="clase.id_clase"
          class="group p-6 sm:p-7 rounded-2xl bg-[#f4f6fa]/70 hover:bg-white border border-slate-200/80 hover:border-[#202759]/20 hover:shadow-xl hover:-translate-y-1 transition-[transform,box-shadow,border-color,background-color] duration-300 motion-reduce:transition-none flex flex-col justify-between"
        >
          <div>
            <!-- Header de Tarjeta: Sala y Estado -->
            <div class="flex items-center justify-between mb-4">
              <span
                class="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 group-hover:border-[#b82a30]/30 group-hover:text-[#b82a30] transition-colors"
              >
                {{ clase.sala || 'Sala Fitness' }}
              </span>
              <div
                class="w-9 h-9 rounded-xl bg-[#202759] text-white flex items-center justify-center group-hover:bg-[#b82a30] transition-colors duration-300 shadow-2xs"
              >
                <PhUsers class="w-5 h-5" weight="bold" />
              </div>
            </div>

            <!-- Título de la Clase -->
            <h3 class="text-xl font-bold text-[#202759] mb-2 leading-snug">
              {{ clase.nombre }}
            </h3>

            <!-- Descripción -->
            <p class="text-xs text-slate-600 leading-relaxed mb-6 line-clamp-3">
              {{
                clase.descripcion ||
                'Entrenamiento grupal supervisado por profesores certificados de FitZone.'
              }}
            </p>

            <!-- Metadata: Horario y Profesor -->
            <div
              class="space-y-2 py-3 border-t border-slate-200/60 text-xs text-slate-700"
            >
              <div
                v-if="clase.horario_inicio && clase.horario_fin"
                class="flex items-center gap-2"
              >
                <PhClock class="w-4 h-4 text-[#b82a30] flex-shrink-0" />
                <span class="font-semibold"
                  >{{ clase.horario_inicio }} a {{ clase.horario_fin }} hs</span
                >
              </div>
              <div v-if="clase.profesor" class="flex items-center gap-2">
                <PhUser class="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>Prof. {{ clase.profesor }}</span>
              </div>
            </div>
          </div>

          <!-- Pie de Tarjeta / Acción -->
          <div class="pt-4 border-t border-slate-200/60 mt-4">
            <button
              type="button"
              class="w-full flex items-center justify-between text-xs font-bold text-[#202759] group-hover:text-[#b82a30] transition-colors cursor-pointer min-h-[32px]"
              @click="irAClases"
            >
              <span>Reservar mi lugar</span>
              <PhArrowRight
                class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform motion-reduce:transition-none"
                weight="bold"
              />
            </button>
          </div>
        </div>

        <!-- Card Adicional: "+X más" si hay más de 3 clases -->
        <div
          v-if="hayMas"
          class="p-7 sm:p-8 rounded-2xl bg-[#202759] text-white shadow-xl flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-[transform,box-shadow] duration-300 motion-reduce:transition-none border border-slate-700"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <span
                class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-[#F96167]"
              >
                Agenda Activa
              </span>
            </div>

            <div
              class="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight"
            >
              +{{ restantes }} más
            </div>
            <h3 class="text-lg font-bold text-slate-200 mb-3">
              Clases en esta sede
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed mb-6">
              Descubrí toda la grilla de actividades disponibles.
            </p>
          </div>

          <BaseButton
            variant="secondary"
            size="md"
            class="w-full justify-center min-h-[44px]"
            @click="irAClases"
          >
            <template #icon>
              <PhArrowRight class="w-4 h-4 mr-1.5" weight="bold" />
            </template>
            Ver todas las clases
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
