<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
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
const authStore = useAuthStore()
const cargando = ref(true)
const planes = ref<PlanApi[]>([])

// Planes por defecto en caso de retraso o falla de conexión
const PLANES_DEFAULT: PlanApi[] = [
  {
    id: 1,
    id_plan: 1,
    nombre: 'Plan Mensual',
    duracion_dias: 30,
    precio: 40000,
    destacado: false,
  },
  {
    id: 2,
    id_plan: 2,
    nombre: 'Plan Trimestral',
    duracion_dias: 90,
    precio: 105000,
    destacado: true,
  },
  {
    id: 3,
    id_plan: 3,
    nombre: 'Plan Anual',
    duracion_dias: 365,
    precio: 360000,
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

function esDestacado(plan: PlanApi): boolean {
  if (plan.destacado) return true
  if (plan.duracion_dias === 90) return true
  const nombre = plan.nombre.toLowerCase()
  return nombre.includes('trimestral')
}

function obtenerPeriodoLabel(plan: PlanApi): string {
  if (plan.duracion_dias === 30) return 'Pase Mensual (30 Días)'
  if (plan.duracion_dias === 90) return 'Pase Trimestral (90 Días)'
  if (plan.duracion_dias === 365) return 'Pase Anual (12 Meses)'
  return `Pase de ${plan.duracion_dias} Días`
}

function obtenerUnidadPeriodo(plan: PlanApi): string {
  if (plan.duracion_dias === 30) return '/ mes'
  if (plan.duracion_dias === 90) return '/ 3 meses'
  if (plan.duracion_dias === 365) return '/ año'
  return ''
}

function obtenerSubtextoAhorro(plan: PlanApi) {
  const num = Number(plan.precio) || 0
  if (plan.duracion_dias === 90) {
    const equiv = Math.round(num / 3)
    return {
      texto: `Equivale a ${formatearPrecio(equiv)}/mes`,
      ahorro: '12.5% OFF',
    }
  }
  if (plan.duracion_dias === 365) {
    const equiv = Math.round(num / 12)
    return {
      texto: `Equivale a ${formatearPrecio(equiv)}/mes`,
      ahorro: '25% OFF',
    }
  }
  return {
    texto: 'Facturación mes a mes sin permanencia',
    ahorro: null,
  }
}

const BENEFICIOS_PLAN: string[] = [
  'Acceso libre ilimitado a musculación y cardio',
  'Acceso a todas las clases grupales sin límite',
  'Acreditación digital instantánea por QR',
  '15% de descuento en alquiler de canchas',
  'Sin costos de matrícula ni inscripción',
]

function seleccionarPlan() {
  if (authStore.isAuthenticated) {
    router.push('/membresia')
  } else {
    router.push('/login')
  }
}

async function cargarPlanes() {
  try {
    cargando.value = true
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
      <div class="text-center max-w-3xl mx-auto mb-14">
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
          Precios transparentes, sin matrícula de inscripción y con acreditación
          instantánea por QR en tu celular.
        </p>
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
            esDestacado(plan)
              ? 'border-2 border-[#F96167] shadow-2xl shadow-[#F96167]/15 lg:-translate-y-2'
              : 'border border-slate-200/90 shadow-lg shadow-slate-100',
          ]"
        >
          <!-- Badge Destacado -->
          <div
            v-if="esDestacado(plan)"
            class="absolute -top-3.5 right-6 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F96167] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#F96167]/30"
          >
            <PhStar class="w-3.5 h-3.5" weight="fill" />
            <span>Más popular</span>
          </div>

          <div>
            <span
              class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block"
            >
              {{ obtenerPeriodoLabel(plan) }}
            </span>
            <h3 class="text-2xl font-black text-[#202759] mb-4">
              {{ plan.nombre }}
            </h3>

            <!-- Precio y Duración -->
            <div class="mb-4 pb-3 border-b border-slate-100">
              <div class="flex items-baseline gap-1.5">
                <span
                  class="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#202759] tracking-tight leading-none"
                >
                  {{ formatearPrecio(plan.precio) }}
                </span>
                <span class="text-sm font-semibold text-slate-500 shrink-0">
                  {{ obtenerUnidadPeriodo(plan) }}
                </span>
              </div>

              <!-- Fila 2: Información de ahorro -->
              <div class="h-6 mt-1.5 flex items-center gap-2">
                <span class="text-xs text-slate-500 leading-none">
                  {{ obtenerSubtextoAhorro(plan).texto }}
                </span>
                <span
                  v-if="obtenerSubtextoAhorro(plan).ahorro"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 tracking-wide"
                >
                  {{ obtenerSubtextoAhorro(plan).ahorro }}
                </span>
              </div>
            </div>

            <!-- Beneficios con Checkmarks -->
            <ul class="space-y-3.5 text-sm text-slate-700 mb-8 list-none p-0">
              <li
                v-for="beneficio in BENEFICIOS_PLAN"
                :key="beneficio"
                class="flex items-start gap-3"
              >
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  :class="[
                    esDestacado(plan)
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
            :variant="esDestacado(plan) ? 'secondary' : 'primary'"
            size="lg"
            class="w-full justify-center shadow-md font-bold min-h-[46px]"
            :class="[
              esDestacado(plan)
                ? 'shadow-[#F96167]/30 hover:shadow-lg hover:shadow-[#F96167]/40'
                : '',
            ]"
            @click="seleccionarPlan()"
          >
            <template #icon>
              <PhArrowRight class="w-4 h-4 mr-1.5" weight="bold" />
            </template>
            Elegir {{ plan.nombre }}
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
