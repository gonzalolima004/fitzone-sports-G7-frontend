<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { canchasService } from '@/modules/M4-canchas/services/canchas.service'
import type { CanchaTipo } from '@/modules/M4-canchas/types/canchas.types'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import {
  PhTennisBall,
  PhSoccerBall,
  PhTrophy,
  PhArrowRight,
  PhLightning,
} from '@phosphor-icons/vue'

interface DeporteCardMeta {
  id: number
  titulo: string
  descripcion: string
  cta: string
  icono: Component
  esGrande: boolean
}

const router = useRouter()
const authStore = useAuthStore()

const cargando = ref(true)
const tiposCancha = ref<CanchaTipo[]>([])

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function esCardGrande(index: number, total: number): boolean {
  if (total === 1) return false
  const fila = Math.floor(index / 2)
  const esPrimeroDeFila = index % 2 === 0
  const esUltimoImpar = index === total - 1 && total % 2 === 1
  if (esUltimoImpar) return false
  return fila % 2 === 0 ? esPrimeroDeFila : !esPrimeroDeFila
}

const tarjetasDeportes = computed<DeporteCardMeta[]>(() => {
  const total = tiposCancha.value.length
  return tiposCancha.value.map((tipo, index) => {
    const titulo = tipo.descripcion?.trim() || `Cancha #${tipo.id_cancha_tipo}`
    const norm = normalizar(titulo)
    const esGrande = esCardGrande(index, total)

    if (norm.includes('padel')) {
      return {
        id: tipo.id_cancha_tipo,
        titulo,
        descripcion:
          'Pistas de pádel con blindex e iluminación preparadas para jugar tanto de día como en horario nocturno.',
        cta: 'Reservar turno de pádel',
        icono: PhTennisBall,
        esGrande,
      }
    }

    if (norm.includes('futbol')) {
      return {
        id: tipo.id_cancha_tipo,
        titulo,
        descripcion:
          'Canchas de césped sintético para organizar partidos con amigos o entrenar en equipo.',
        cta: 'Ver canchas de fútbol',
        icono: PhSoccerBall,
        esGrande,
      }
    }

    return {
      id: tipo.id_cancha_tipo,
      titulo,
      descripcion: `Instalaciones deportivas de ${titulo.toLowerCase()} acondicionadas para reservar y jugar por turno.`,
      cta: `Ver canchas de ${titulo.toLowerCase()}`,
      icono: PhTrophy,
      esGrande,
    }
  })
})

const claseColumnaAlquilerLibre = computed(() => {
  return tarjetasDeportes.value.length % 2 === 1
    ? 'md:col-span-2'
    : 'md:col-span-3'
})

function irACanchas() {
  if (authStore.isAuthenticated) {
    router.push('/canchas')
  } else {
    router.push({
      path: '/login',
      query: { redirect: '/canchas' },
    })
  }
}

async function cargarTiposCancha() {
  try {
    cargando.value = true
    const data = await canchasService.getTiposCancha()
    tiposCancha.value = Array.isArray(data)
      ? data.filter((t) => t.activo !== false && Boolean(t.descripcion?.trim()))
      : []
  } catch (err: unknown) {
    console.error('Error al cargar tipos de cancha en la landing:', err)
    tiposCancha.value = []
  } finally {
    cargando.value = false
  }
}

onMounted(cargarTiposCancha)
</script>

<template>
  <section
    id="canchas"
    class="py-20 sm:py-28 bg-[#f4f6fa]/60 border-b border-slate-100"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la Sección -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span
          class="text-xs font-bold uppercase tracking-wider text-[#b82a30] bg-[#f96167]/15 px-3.5 py-1.5 rounded-full inline-block mb-3"
        >
          Alquiler de Canchas
        </span>
        <h2
          class="text-3xl sm:text-5xl font-black tracking-tight text-[#202759] mb-4"
        >
          Nuestras canchas e instalaciones
        </h2>
        <p class="text-base sm:text-lg text-slate-600 leading-relaxed">
          Reservá turnos de cancha por hora de forma 100% online, sin cuotas
          fijas ni matrículas obligatorias.
        </p>
      </div>

      <!-- Estado de Carga (Skeletons) -->
      <div
        v-if="cargando"
        class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(220px,auto)]"
      >
        <div
          class="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 md:col-span-2 space-y-4 shadow-xs"
        >
          <BaseSkeleton
            variant="rounded"
            width="48px"
            height="48px"
            class="rounded-2xl"
          />
          <BaseSkeleton variant="text" width="40%" height="28px" />
          <BaseSkeleton variant="text" width="85%" />
          <BaseSkeleton variant="text" width="65%" />
        </div>
        <div
          class="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 md:col-span-1 space-y-4 shadow-xs"
        >
          <BaseSkeleton
            variant="rounded"
            width="48px"
            height="48px"
            class="rounded-2xl"
          />
          <BaseSkeleton variant="text" width="55%" height="28px" />
          <BaseSkeleton variant="text" width="90%" />
          <BaseSkeleton variant="text" width="70%" />
        </div>
      </div>

      <!-- Bento Grid Deportivo Dinámico -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(220px,auto)]"
      >
        <!-- Tarjetas Dinámicas por Tipo de Cancha -->
        <div
          v-for="deporte in tarjetasDeportes"
          :key="deporte.id"
          class="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
          :class="[deporte.esGrande ? 'md:col-span-2' : 'md:col-span-1']"
        >
          <div
            class="relative z-10"
            :class="[deporte.esGrande ? 'max-w-xl' : '']"
          >
            <div
              class="w-12 h-12 rounded-2xl bg-[#202759] text-[#F96167] flex items-center justify-center shrink-0 shadow-md shadow-[#202759]/10 mb-5"
            >
              <component :is="deporte.icono" class="w-6 h-6" weight="bold" />
            </div>

            <h3
              class="font-black text-[#202759] mb-3"
              :class="[
                deporte.esGrande
                  ? 'text-2xl sm:text-3xl'
                  : 'text-xl sm:text-2xl',
              ]"
            >
              {{ deporte.titulo }}
            </h3>
            <p
              class="text-slate-600 leading-relaxed"
              :class="[deporte.esGrande ? 'text-sm sm:text-base' : 'text-sm']"
            >
              {{ deporte.descripcion }}
            </p>
          </div>

          <div
            class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10"
          >
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-extrabold text-[#202759] hover:text-[#F96167] transition-colors cursor-pointer"
              @click="irACanchas"
            >
              <span>{{ deporte.cta }}</span>
              <PhArrowRight class="w-4 h-4" weight="bold" />
            </button>
          </div>

          <!-- Silueta abstracta de fondo en tarjetas grandes -->
          <div
            v-if="deporte.esGrande"
            class="absolute -right-6 -bottom-6 w-56 h-56 text-[#202759]/5 pointer-events-none group-hover:scale-110 transition-transform duration-500"
          >
            <component
              :is="deporte.icono"
              class="w-full h-full"
              weight="fill"
            />
          </div>
        </div>

        <!-- Card Modalidad Alquiler Libre -->
        <div
          class="bg-gradient-to-br from-[#202759] to-[#171d44] text-white border border-[#202759] rounded-3xl p-7 sm:p-9 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
          :class="[claseColumnaAlquilerLibre]"
        >
          <div class="relative z-10 max-w-2xl">
            <div
              class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F96167] mb-3"
            >
              <PhLightning class="w-4 h-4" weight="bold" />
              <span>Modalidad libre</span>
            </div>

            <h3 class="text-2xl sm:text-3xl font-black text-white mb-3">
              Alquilás solo el turno que jugás
            </h3>
            <p class="text-slate-300 text-sm sm:text-base leading-relaxed">
              Elegís tu sede, reservás el día y horario que te quede cómodo, y
              abonás únicamente el turno con Mercado Pago sin trámites ni
              compromisos mensuales.
            </p>
          </div>

          <div
            class="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10"
          >
            <span class="text-xs text-slate-300">
              Disponibilidad en tiempo real para todas las sedes.
            </span>
            <BaseButton
              variant="secondary"
              size="md"
              class="w-full sm:w-auto min-h-[44px]"
              @click="irACanchas"
            >
              <template #icon>
                <PhArrowRight class="w-4 h-4 mr-1.5" weight="bold" />
              </template>
              Buscar turnos disponibles
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
