<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { membresiasService } from '@/modules/M1-usuarios/services/membresias.service'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { PhCheck, PhArrowRight, PhStar } from '@phosphor-icons/vue'

interface PlanApi {
  id?: number
  id_plan?: number
  nombre: string
  duracion_dias: number
  precio: number | string
  destacado?: boolean
}

const router = useRouter()
const cargando = ref(true)
const error = ref<string | null>(null)
const planes = ref<PlanApi[]>([])

// Ciclo de facturación: mensual o anual (con 30% OFF)
const cicloFacturacion = ref<'mensual' | 'anual'>('mensual')

// Planes por defecto en caso de retraso en la conexión
const PLANES_DEFAULT: PlanApi[] = [
  {
    id: 1,
    id_plan: 1,
    nombre: 'Pase 2 Días',
    duracion_dias: 30,
    precio: 35000,
    destacado: false,
  },
  {
    id: 2,
    id_plan: 2,
    nombre: 'Pase 3 Días',
    duracion_dias: 30,
    precio: 40000,
    destacado: true,
  },
  {
    id: 3,
    id_plan: 3,
    nombre: 'Pase Libre',
    duracion_dias: 30,
    precio: 45000,
    destacado: false,
  },
]

function formatearPrecio(monto: number | string): string {
  const num = Number(monto) || 0
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(num)
}

function calcularPrecioRegularAnual(precioBase: number | string): number {
  const num = Number(precioBase) || 0
  return num * 12
}

function calcularTotalAnual(precioBase: number | string): number {
  const num = Number(precioBase) || 0
  return Math.round(num * 12 * 0.7)
}

function calcularAhorroAnual(precioBase: number | string): number {
  const num = Number(precioBase) || 0
  return Math.round(num * 12 * 0.3)
}

function esDestacado(plan: PlanApi, index: number): boolean {
  if (plan.destacado) return true
  const nombre = plan.nombre.toLowerCase()
  if (nombre.includes('3')) return true
  if (planes.value.length === 3 && index === 1) return true
  return false
}

function obtenerBeneficios(plan: PlanApi): string[] {
  const nombre = plan.nombre.toLowerCase()

  if (nombre.includes('2')) {
    return [
      '2 accesos semanales a musculación o clases grupales',
      'Entrená en tu sede habitual elegida',
      'Acreditación digital instantánea por QR',
      '15% de descuento en alquiler de canchas',
      'Sin matrícula ni costos de inscripción',
    ]
  }

  if (nombre.includes('3')) {
    return [
      '3 accesos semanales a musculación o clases grupales',
      'Entrená en tu sede habitual elegida',
      'Acreditación digital instantánea por QR',
      '15% de descuento en alquiler de canchas',
      'Sin matrícula ni costos de inscripción',
    ]
  }

  // Pase Libre
  return [
    'Acceso ilimitado todos los días a musculación y clases',
    'Libre acceso a todas las sedes de la red provincial',
    'Acreditación digital instantánea por QR',
    '15% de descuento en alquiler de canchas',
    'Sin matrícula ni costos de inscripción',
  ]
}

function seleccionarPlan(plan: PlanApi) {
  const idPlan = plan.id || plan.id_plan || 1
  router.push({
    path: '/registro',
    query: {
      plan: idPlan.toString(),
      ciclo: cicloFacturacion.value,
    },
  })
}

async function cargarPlanes() {
  try {
    cargando.value = true
    error.value = null
    const data = await membresiasService.getPlanes()
    if (Array.isArray(data) && data.length > 0) {
      planes.value = data as PlanApi[]
    } else {
      planes.value = PLANES_DEFAULT
    }
  } catch (err: unknown) {
    console.error('Error al obtener planes, usando valores de respaldo:', err)
    planes.value = PLANES_DEFAULT
  } finally {
    cargando.value = false
  }
}

onMounted(cargarPlanes)
</script>

<template>
  <section
    id="planes"
    class="py-20 sm:py-28 bg-white border-b border-slate-100"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la Sección -->
      <div class="text-center max-w-3xl mx-auto mb-10">
        <span
          class="text-xs font-bold uppercase tracking-[0.2em] text-[#b82a30] bg-[#f96167]/15 px-3.5 py-1.5 rounded-full inline-block mb-3"
        >
          Membresías y Precios
        </span>
        <h2
          class="text-3xl sm:text-5xl font-black tracking-tight text-[#202759] mb-4"
        >
          Elegí el plan a la medida de tus objetivos
        </h2>
        <p class="text-base sm:text-lg text-slate-600 leading-relaxed">
          Precios claros, sin matrícula de inscripción y con acreditación
          instantánea en tu celular.
        </p>
      </div>

      <!-- Selector de Ciclo de Facturación (Mensual / Anual 30% OFF) -->
      <div class="flex items-center justify-center gap-3 sm:gap-5 mb-14">
        <button
          type="button"
          class="text-sm sm:text-base font-bold transition-colors cursor-pointer"
          :class="
            cicloFacturacion === 'mensual'
              ? 'text-[#202759]'
              : 'text-slate-400 hover:text-slate-600'
          "
          @click="cicloFacturacion = 'mensual'"
        >
          Pago Mensual
        </button>

        <button
          type="button"
          role="switch"
          :aria-checked="cicloFacturacion === 'anual'"
          class="relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none shadow-inner"
          :class="
            cicloFacturacion === 'anual' ? 'bg-[#202759]' : 'bg-slate-200'
          "
          @click="
            cicloFacturacion =
              cicloFacturacion === 'mensual' ? 'anual' : 'mensual'
          "
        >
          <span
            class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
            :class="
              cicloFacturacion === 'anual' ? 'translate-x-8' : 'translate-x-0'
            "
          />
        </button>

        <button
          type="button"
          class="text-sm sm:text-base font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
          :class="
            cicloFacturacion === 'anual'
              ? 'text-[#202759]'
              : 'text-slate-400 hover:text-slate-600'
          "
          @click="cicloFacturacion = 'anual'"
        >
          <span>Pago Anual</span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 tracking-wide"
          >
            30% OFF
          </span>
        </button>
      </div>

      <!-- Estado de Carga (Skeletons) -->
      <div
        v-if="cargando"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="p-8 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-xs"
        >
          <BaseSkeleton variant="badge" width="80px" />
          <BaseSkeleton variant="text" width="60%" height="24px" />
          <BaseSkeleton variant="text" width="40%" height="36px" />
          <div class="space-y-3 pt-4 border-t border-slate-100">
            <BaseSkeleton v-for="j in 4" :key="j" variant="text" width="90%" />
          </div>
          <BaseSkeleton variant="button" width="100%" />
        </div>
      </div>

      <!-- Grilla de Planes -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch"
      >
        <div
          v-for="(plan, index) in planes"
          :key="plan.id || plan.id_plan || index"
          class="p-8 rounded-3xl bg-white relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
          :class="[
            esDestacado(plan, index)
              ? 'border-2 border-[#F96167] shadow-2xl shadow-[#F96167]/15 lg:-translate-y-2'
              : 'border border-slate-200/90 shadow-lg shadow-slate-100',
          ]"
        >
          <!-- Badge Destacado -->
          <div
            v-if="esDestacado(plan, index)"
            class="absolute -top-3.5 right-6 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F96167] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#F96167]/30"
          >
            <PhStar class="w-3.5 h-3.5" weight="fill" />
            <span>Más popular</span>
          </div>

          <div>
            <span
              class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block"
            >
              {{
                cicloFacturacion === 'anual'
                  ? 'Pase Anual (12 Meses)'
                  : 'Pase Mensual (30 Días)'
              }}
            </span>
            <h3 class="text-2xl font-black text-[#202759] mb-4">
              {{ plan.nombre }}
            </h3>

            <!-- Precio y Duración con Espacio Preasignado Compacto (Cero CLS) -->
            <div class="mb-3.5 pb-2.5 border-b border-slate-100">
              <!-- Fila 1: Gran número y unidad (siempre 1 línea sin quiebre) -->
              <div class="flex items-baseline gap-1.5">
                <span
                  class="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#202759] tracking-tight leading-none"
                >
                  {{
                    cicloFacturacion === 'anual'
                      ? formatearPrecio(calcularTotalAnual(plan.precio))
                      : formatearPrecio(plan.precio)
                  }}
                </span>
                <span class="text-sm font-semibold text-slate-500 shrink-0">
                  {{ cicloFacturacion === 'anual' ? '/ año' : '/ mes' }}
                </span>
              </div>

              <!-- Fila 2: Información de ahorro (espacio fijo compacto de 20px) -->
              <div class="h-5 mt-1.5 flex items-center">
                <div
                  v-if="cicloFacturacion === 'anual'"
                  class="flex items-center gap-1.5 text-xs leading-none"
                >
                  <span
                    class="text-slate-400 font-semibold line-through shrink-0"
                  >
                    {{
                      formatearPrecio(calcularPrecioRegularAnual(plan.precio))
                    }}
                  </span>
                  <span class="font-bold text-emerald-700 truncate">
                    Ahorrás
                    {{ formatearPrecio(calcularAhorroAnual(plan.precio)) }}
                    (-30%)
                  </span>
                </div>
              </div>
            </div>

            <!-- Beneficios con Checkmarks -->
            <ul class="space-y-3.5 text-sm text-slate-700 mb-8 list-none p-0">
              <li
                v-for="beneficio in obtenerBeneficios(plan)"
                :key="beneficio"
                class="flex items-start gap-3"
              >
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  :class="[
                    esDestacado(plan, index)
                      ? 'bg-[#F96167]/15 text-[#b82a30]'
                      : 'bg-[#202759]/10 text-[#202759]',
                  ]"
                >
                  <PhCheck class="w-3.5 h-3.5" weight="bold" />
                </div>
                <span class="leading-snug">{{ beneficio }}</span>
              </li>
            </ul>
          </div>

          <!-- Botón CTA -->
          <BaseButton
            :variant="esDestacado(plan, index) ? 'secondary' : 'primary'"
            size="lg"
            class="w-full justify-center shadow-md font-bold min-h-[46px]"
            :class="[
              esDestacado(plan, index)
                ? 'shadow-[#F96167]/30 hover:shadow-lg hover:shadow-[#F96167]/40'
                : '',
            ]"
            @click="seleccionarPlan(plan)"
          >
            <template #icon>
              <PhArrowRight class="w-4 h-4 mr-1.5" weight="bold" />
            </template>
            Elegir este plan
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
