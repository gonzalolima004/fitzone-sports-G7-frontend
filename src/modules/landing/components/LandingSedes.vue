<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import http from '@/common/api/http'
import { useSedeStore } from '@/store/sede'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { PhMapPin, PhBuildings, PhSparkle } from '@phosphor-icons/vue'

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

interface CiudadConSedes {
  id_ciudad: number
  nombre: string
  sedes: SedeApi[]
  totalSedes: number
  lat: number
  lng: number
}

const sedeStore = useSedeStore()

const cargando = ref(true)
const error = ref<string | null>(null)
const ciudades = ref<CiudadApi[]>([])
const sedes = ref<SedeApi[]>([])
const ciudadActivaId = ref<number | null>(null)

const mapContainer = ref<HTMLElement | null>(null)
let mapa: L.Map | null = null
const markersMap = new Map<number, L.Marker>()

// Coordenadas GPS reales de las localidades de Entre Ríos
const COORDENADAS_GPS: Record<string, [number, number]> = {
  concordia: [-31.3929, -58.0209],
  parana: [-31.7333, -60.5333],
  gualeguaychu: [-33.0094, -58.5172],
  'concepcion del uruguay': [-32.4825, -58.2372],
  concepcion: [-32.4825, -58.2372],
  gualeguay: [-33.1416, -59.3097],
  villaguay: [-31.8653, -59.0269],
  chajari: [-30.7531, -57.9796],
  colon: [-32.2232, -58.1438],
  'san jose': [-32.2025, -58.2183],
  'san josé': [-32.2025, -58.2183],
  victoria: [-32.6184, -60.1583],
  'la paz': [-30.7424, -59.6457],
  nogoya: [-32.3941, -59.7881],
  diamante: [-32.0664, -60.6384],
  crespo: [-32.0294, -60.3072],
  federacion: [-30.9858, -57.9197],
  federal: [-30.9547, -58.7833],
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function obtenerGps(nombre: string): [number, number] {
  const norm = normalizar(nombre)
  for (const [key, coords] of Object.entries(COORDENADAS_GPS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return coords
    }
  }
  return [-32.0, -59.3]
}

const ciudadesConSedes = computed<CiudadConSedes[]>(() => {
  return ciudades.value.map((c) => {
    const sedesEnCiudad = sedes.value.filter((s) => s.id_ciudad === c.id_ciudad)
    const [lat, lng] = obtenerGps(c.nombre)
    return {
      id_ciudad: c.id_ciudad,
      nombre: c.nombre,
      sedes: sedesEnCiudad,
      totalSedes: sedesEnCiudad.length,
      lat,
      lng,
    }
  })
})

const ciudadActiva = computed(() => {
  return (
    ciudadesConSedes.value.find((c) => c.id_ciudad === ciudadActivaId.value) ||
    null
  )
})

function crearIcono(activo: boolean, totalSedes: number) {
  const bg = activo ? '#F96167' : '#202759'
  // pointer-events-none es crítico para que la animación no capture los clics del mouse
  const pulso = activo
    ? `<div class="pointer-events-none absolute -inset-1.5 rounded-full bg-[#F96167]/35 animate-ping"></div>`
    : ''
  const size = activo ? 32 : 26
  const fontSize = activo ? '12px' : '10px'

  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-150">
        ${pulso}
        <div style="background-color: ${bg}; width: ${size}px; height: ${size}px; font-size: ${fontSize}; line-height: ${size}px;" class="rounded-full flex items-center justify-center text-white font-extrabold shadow-md shadow-black/25 border-2 border-white select-none text-center">
          ${totalSedes > 0 ? totalSedes : '•'}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function actualizarMarcadoresVisuales() {
  markersMap.forEach((marker, id) => {
    const ciudad = ciudadesConSedes.value.find((c) => c.id_ciudad === id)
    if (ciudad) {
      const activo = ciudad.id_ciudad === ciudadActivaId.value
      marker.setIcon(crearIcono(activo, ciudad.totalSedes))
      marker.setZIndexOffset(activo ? 300 : 0)
    }
  })
}

function renderizarMarcadores() {
  if (!mapa) return

  // Remover marcadores anteriores
  markersMap.forEach((marker) => marker.remove())
  markersMap.clear()

  // Dibujar cada marcador
  ciudadesConSedes.value.forEach((ciudad) => {
    if (!mapa) return
    const activo = ciudad.id_ciudad === ciudadActivaId.value
    const marker = L.marker([ciudad.lat, ciudad.lng], {
      icon: crearIcono(activo, ciudad.totalSedes),
      zIndexOffset: activo ? 300 : 0,
    })

    marker.bindTooltip(
      `<div class="font-bold text-xs text-[#202759]">${ciudad.nombre} <span class="font-normal text-slate-500">(${ciudad.totalSedes > 0 ? `${ciudad.totalSedes} sedes` : 'Próxima'})</span></div>`,
      {
        direction: 'auto',
        offset: [0, -10],
        className: 'leaflet-tooltip-fitzone',
      }
    )

    marker.on('click', () => {
      seleccionarCiudad(ciudad.id_ciudad)
    })

    // Elevar temporalmente el marcador sobre el que se pasa el mouse para que sea 100% clickeable
    marker.on('mouseover', () => {
      marker.setZIndexOffset(9999)
    })
    marker.on('mouseout', () => {
      const isActivo = ciudad.id_ciudad === ciudadActivaId.value
      marker.setZIndexOffset(isActivo ? 300 : 0)
    })

    marker.addTo(mapa)
    markersMap.set(ciudad.id_ciudad, marker)
  })

  actualizarMarcadoresVisuales()
}

function inicializarMapa() {
  if (!mapContainer.value || mapa) return

  // Centro de Entre Ríos fijado (sin arrastre ni zoom accidental)
  mapa = L.map(mapContainer.value, {
    center: [-32.0, -59.3],
    zoom: 7,
    minZoom: 7,
    maxZoom: 7,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    zoomControl: false,
  })

  // OpenStreetMap oficial: 100% abierto, libre y sin requerimiento de API key
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapa)

  renderizarMarcadores()

  setTimeout(() => {
    mapa?.invalidateSize()
  }, 200)
}

function seleccionarCiudad(id: number) {
  ciudadActivaId.value = id
  actualizarMarcadoresVisuales()
}

function scrollA(href: string) {
  const target = document.querySelector(href)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

function irAClasesDeSede(sede: SedeApi) {
  sedeStore.seleccionarSede(sede.id_sede)
  scrollA('#actividades')
}

async function cargarDatos() {
  try {
    cargando.value = true
    error.value = null
    const [resCiudades, resSedes] = await Promise.all([
      http.get<CiudadApi[]>('/ciudades'),
      http.get<SedeApi[]>('/sedes'),
    ])
    ciudades.value = Array.isArray(resCiudades.data) ? resCiudades.data : []
    sedes.value = Array.isArray(resSedes.data) ? resSedes.data : []

    // Seleccionar ciudad inicial (priorizar la que tenga sedes activas)
    if (ciudades.value.length > 0) {
      const sedePrevia = sedes.value.find(
        (s) => s.id_sede === sedeStore.idSedeSeleccionada
      )
      if (sedePrevia) {
        ciudadActivaId.value = sedePrevia.id_ciudad
      } else {
        const conSedes = ciudadesConSedes.value.find((c) => c.totalSedes > 0)
        ciudadActivaId.value = conSedes
          ? conSedes.id_ciudad
          : ciudades.value[0].id_ciudad
      }
    }
  } catch (err: unknown) {
    console.error('Error al cargar ciudades/sedes:', err)
    error.value = 'No se pudieron sincronizar las sedes desde la base de datos.'
  } finally {
    cargando.value = false
    renderizarMarcadores()
  }
}

onMounted(async () => {
  if (sedeStore.sedes.length === 0) {
    sedeStore.cargarSedes().catch(() => {})
  }
  await nextTick()
  inicializarMapa()
  await cargarDatos()
})

onUnmounted(() => {
  if (mapa) {
    mapa.remove()
    mapa = null
  }
  markersMap.clear()
})
</script>

<template>
  <section
    id="sedes"
    class="py-20 sm:py-28 bg-[#f4f6fa]/60 border-b border-slate-100"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la Sección -->
      <div class="text-center max-w-3xl mx-auto mb-10">
        <h2
          class="text-3xl sm:text-5xl font-black tracking-tight text-[#202759] mb-4"
        >
          Nuestras sedes en Entre Ríos
        </h2>
        <p class="text-base sm:text-lg text-slate-600 leading-relaxed">
          Explorá el mapa o seleccioná una localidad para conocer las sedes
          activas, direcciones y horarios disponibles.
        </p>
      </div>

      <!-- Contenedor Principal: Mapa y Contenido -->
      <div class="space-y-6">
        <!-- Grilla Mapa Real (Izq) y Sedes (Der) -->
        <div
          class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start max-w-6xl mx-auto"
        >
          <!-- 1. Columna Mapa Interactivo con Leaflet (Siempre montado) -->
          <div
            class="lg:col-span-7 bg-white p-3 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden"
          >
            <!-- Barra superior del mapa -->
            <div class="flex items-center justify-between px-3 py-2 mb-1">
              <div class="flex items-center gap-2">
                <span
                  class="text-[11px] font-medium text-slate-400 hidden sm:inline"
                >
                  Hacé clic en cualquier punto para ver sus sedes
                </span>
              </div>
            </div>

            <!-- Contenedor del Mapa Leaflet -->
            <div
              ref="mapContainer"
              class="w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden z-10 border border-slate-100 bg-slate-50"
              style="min-height: 400px"
            ></div>
          </div>

          <!-- 2. Columna Ficha de Sedes de la Ciudad Activa -->
          <div class="lg:col-span-5 flex flex-col justify-center">
            <!-- Esqueleto de carga para la columna derecha -->
            <div v-if="cargando" class="space-y-4">
              <BaseSkeleton variant="badge" width="120px" />
              <BaseSkeleton variant="text" width="80%" height="32px" />
              <BaseSkeleton
                variant="rounded"
                height="120px"
                class="rounded-2xl"
              />
              <BaseSkeleton
                variant="rounded"
                height="120px"
                class="rounded-2xl"
              />
            </div>

            <!-- Datos cargados -->
            <div v-else-if="ciudadActiva" class="space-y-4">
              <!-- Encabezado de la Ciudad Seleccionada -->
              <div
                class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-[#F96167]/10 flex items-center justify-center text-[#F96167] shrink-0"
                >
                  <PhMapPin class="w-5 h-5" weight="bold" />
                </div>
                <div>
                  <h3 class="text-xl font-black text-[#202759]">
                    {{ ciudadActiva.nombre }}
                  </h3>
                  <p class="text-xs font-medium text-slate-500">
                    {{
                      ciudadActiva.totalSedes > 0
                        ? `${ciudadActiva.totalSedes} ${ciudadActiva.totalSedes === 1 ? 'sede activa' : 'sedes activas'}`
                        : 'Próxima apertura'
                    }}
                  </p>
                </div>
              </div>

              <!-- Listado de Sedes (Máximo 3 para no sobrepasar la altura del mapa) -->
              <div v-if="ciudadActiva.sedes.length > 0" class="space-y-3">
                <div
                  v-for="sede in ciudadActiva.sedes.slice(0, 3)"
                  :key="sede.id_sede"
                  class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#202759]/30 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div class="flex items-start justify-between gap-3 mb-1.5">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-7 h-7 rounded-lg bg-[#202759]/10 text-[#202759] flex items-center justify-center shrink-0"
                      >
                        <PhBuildings class="w-3.5 h-3.5" weight="bold" />
                      </div>
                      <h4 class="font-bold text-sm text-[#202759]">
                        {{ sede.nombre }}
                      </h4>
                    </div>

                    <button
                      type="button"
                      class="text-xs font-bold text-[#F96167] hover:underline cursor-pointer shrink-0"
                      @click="irAClasesDeSede(sede)"
                    >
                      Ver clases
                    </button>
                  </div>

                  <p
                    v-if="sede.direccion"
                    class="text-xs text-slate-500 pl-9.5 flex items-center gap-1.5"
                  >
                    <PhMapPin
                      class="w-3.5 h-3.5 text-slate-400 shrink-0"
                      weight="bold"
                    />
                    <span>{{ sede.direccion }}</span>
                  </p>
                </div>

                <!-- Indicador sutil si hay más de 3 sedes -->
                <div
                  v-if="ciudadActiva.sedes.length > 3"
                  class="px-4 py-2.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-center text-xs font-semibold text-slate-600 flex items-center justify-center gap-2"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-[#F96167]"></span>
                  <span>
                    +{{ ciudadActiva.sedes.length - 3 }}
                    {{
                      ciudadActiva.sedes.length - 3 === 1
                        ? 'sede adicional disponible'
                        : 'sedes adicionales disponibles'
                    }}
                    en {{ ciudadActiva.nombre }}
                  </span>
                </div>
              </div>

              <!-- Estado Próxima Apertura -->
              <div
                v-else
                class="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2 shadow-xs"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto"
                >
                  <PhSparkle class="w-5 h-5" weight="fill" />
                </div>
                <h4 class="font-bold text-sm text-[#202759]">
                  Próxima apertura en {{ ciudadActiva.nombre }}
                </h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Estamos acondicionando una nueva sede en esta localidad para
                  sumarla a la red provincial.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador Unificado al Pie -->
        <div class="pt-4 text-center">
          <p
            class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white px-5 py-2.5 rounded-full border border-slate-200/90 shadow-2xs"
          >
            <span
              class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
            ></span>
            <span>
              Tu membresía es 100% multisede: ingresás con acceso digital
              mediante QR en cualquiera de nuestras sedes
            </span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
/* Fix indispensable de Tailwind para imágenes de Leaflet */
.leaflet-container img {
  max-width: none !important;
  max-height: none !important;
}

.leaflet-container {
  font-family: inherit;
  background-color: #f8fafc;
  cursor: default !important;
}

.leaflet-grab {
  cursor: default !important;
}

/* Integración de color suave para OpenStreetMap */
.leaflet-tile {
  filter: saturate(0.85) contrast(1.02);
}

/* Tooltips estilizados (nunca interceptan clics del mouse) */
.leaflet-tooltip,
.leaflet-tooltip-fitzone {
  pointer-events: none !important;
  background-color: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  border-radius: 8px !important;
  padding: 4px 8px !important;
}

.leaflet-tooltip-fitzone::before {
  border-top-color: #ffffff !important;
}

/* Marcadores personalizados */
.custom-pin-marker {
  background: transparent !important;
  border: none !important;
}
</style>
