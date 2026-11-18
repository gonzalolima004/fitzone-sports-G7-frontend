<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhCalendar,
  PhCourtBasketball,
  PhClockClockwise,
  PhQrCode,
  PhArrowRight,
  PhCheckCircle,
  PhBuildings,
  PhMedal,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/auth'
import { useSedeStore } from '@/store/sede'
import {
  clasesService,
  type MiReservaClaseResponse,
} from '@/modules/M3-clases-grupales/services/clases.service'
import { reservasService } from '@/modules/M4-canchas/services/reservas.service'
import type { DetalleReservaCancha } from '@/modules/M4-canchas/types/canchas.types'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { toast } from '@/common/utils/toast'

const authStore = useAuthStore()
const sedeStore = useSedeStore()

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const misClases = ref<MiReservaClaseResponse[]>([])
const misCanchas = ref<DetalleReservaCancha[]>([])

const nombreUsuario = computed(() => {
  const n = authStore.usuario?.nombre?.trim()
  const a = authStore.usuario?.apellido?.trim()
  if (n && a) return `${n} ${a}`
  if (n) return n
  return 'Socio FitZone'
})

const totalReservasClases = computed(() => misClases.value.length)
const totalReservasCanchas = computed(() => misCanchas.value.length)

const proximasActividades = computed(() => {
  const combinadas = [
    ...misClases.value.map((c) => ({
      id: `clase-${c.id_clase_reserva}`,
      tipo: 'Clase Grupal' as const,
      titulo: c.nombre_clase || 'Clase Grupal FitZone',
      fecha: c.fecha_inicio,
      sede: sedeStore.sedeSeleccionada?.nombre || 'Sede FitZone',
      estado: c.estado || 'Confirmada',
    })),
    ...misCanchas.value.map((can) => ({
      id: `cancha-${can.id_cancha_reserva}`,
      tipo: 'Reserva de Cancha' as const,
      titulo: can.nombre_cancha || can.tipo_cancha || 'Cancha Deportiva',
      fecha: can.fecha_inicio,
      sede:
        can.nombre_sede || sedeStore.sedeSeleccionada?.nombre || 'Sede FitZone',
      estado: can.estado_nombre || 'Confirmada',
    })),
  ]

  return combinadas
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(0, 5)
})

async function cargarDatosDashboard() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const [clasesRes, canchasRes] = await Promise.all([
      clasesService.obtenerMisReservas().catch(() => []),
      reservasService.obtenerMisReservasCanchas().catch(() => []),
    ])
    misClases.value = clasesRes
    misCanchas.value = canchasRes
  } catch (error: unknown) {
    console.error('Error al cargar dashboard del socio:', error)
    errorMessage.value = 'No se pudieron cargar tus actividades recientes.'
    toast.error('Error al sincronizar el dashboard.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!sedeStore.sedes.length) {
    await sedeStore.cargarSedes()
  }
  await cargarDatosDashboard()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header de bienvenida -->
    <div
      class="bg-gradient-to-r from-[#202759] to-[#2c3577] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div>
        <span
          class="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white/80 mb-2"
        >
          Dashboard Exclusivo · Socio
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          ¡Hola, {{ nombreUsuario }}! 👋
        </h1>
        <p class="text-white/80 text-sm mt-1">
          Sede activa:
          <strong class="text-white">{{
            sedeStore.sedeSeleccionada?.nombre || 'Selecciona una sede'
          }}</strong>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink to="/accesos">
          <BaseButton variant="secondary" size="md" class="cursor-pointer">
            <template #icon>
              <PhQrCode :size="18" weight="bold" />
            </template>
            Mi Código QR
          </BaseButton>
        </RouterLink>
      </div>
    </div>

    <!-- Estado de Carga / Skeleton -->
    <div v-if="isLoading" class="space-y-6 animate-pulse">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BaseSkeleton variant="rounded" height="100px" />
        <BaseSkeleton variant="rounded" height="100px" />
        <BaseSkeleton variant="rounded" height="100px" />
      </div>
      <BaseSkeleton variant="rounded" height="250px" />
    </div>

    <!-- Mensaje de Error -->
    <div
      v-else-if="errorMessage"
      class="bg-red-50 border border-red-200 p-6 rounded-2xl text-center space-y-4"
    >
      <p class="text-red-700 font-semibold">{{ errorMessage }}</p>
      <BaseButton variant="outline" size="sm" @click="cargarDatosDashboard">
        Reintentar
      </BaseButton>
    </div>

    <!-- Contenido del Dashboard -->
    <template v-else>
      <!-- Tarjetas de Resumen Estadístico -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4"
        >
          <div
            class="w-12 h-12 rounded-xl bg-[#202759]/10 text-[#202759] flex items-center justify-center font-bold"
          >
            <PhCalendar :size="24" weight="bold" />
          </div>
          <div>
            <p
              class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Clases Reservadas
            </p>
            <h3 class="text-2xl font-extrabold text-[#202759] mt-0.5">
              {{ totalReservasClases }}
            </h3>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4"
        >
          <div
            class="w-12 h-12 rounded-xl bg-[#F96167]/10 text-[#F96167] flex items-center justify-center font-bold"
          >
            <PhCourtBasketball :size="24" weight="bold" />
          </div>
          <div>
            <p
              class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Canchas Reservadas
            </p>
            <h3 class="text-2xl font-extrabold text-[#202759] mt-0.5">
              {{ totalReservasCanchas }}
            </h3>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4"
        >
          <div
            class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold"
          >
            <PhMedal :size="24" weight="bold" />
          </div>
          <div>
            <p
              class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Estado Membresía
            </p>
            <h3 class="text-lg font-extrabold text-emerald-600 mt-0.5">
              Activa / Al Día
            </h3>
          </div>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RouterLink
          to="/canchas"
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#202759] transition-all group"
        >
          <div class="flex items-center justify-between mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-[#F96167]/10 text-[#F96167] flex items-center justify-center"
            >
              <PhCourtBasketball :size="20" weight="bold" />
            </div>
            <PhArrowRight
              :size="18"
              class="text-slate-400 group-hover:text-[#202759] group-hover:translate-x-1 transition-all"
            />
          </div>
          <h3 class="font-bold text-[#202759] text-base">Reservar Cancha</h3>
          <p class="text-xs text-slate-500 mt-1">
            Elegí tu deporte, horario y cancha favorita con descuento de socio.
          </p>
        </RouterLink>

        <RouterLink
          to="/clases"
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#202759] transition-all group"
        >
          <div class="flex items-center justify-between mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-[#202759]/10 text-[#202759] flex items-center justify-center"
            >
              <PhCalendar :size="20" weight="bold" />
            </div>
            <PhArrowRight
              :size="18"
              class="text-slate-400 group-hover:text-[#202759] group-hover:translate-x-1 transition-all"
            />
          </div>
          <h3 class="font-bold text-[#202759] text-base">Clases Grupales</h3>
          <p class="text-xs text-slate-500 mt-1">
            Explorá la agenda semanal e inscribite a tus disciplinas preferidas.
          </p>
        </RouterLink>

        <RouterLink
          to="/historial"
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#202759] transition-all group"
        >
          <div class="flex items-center justify-between mb-3">
            <div
              class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center"
            >
              <PhClockClockwise :size="20" weight="bold" />
            </div>
            <PhArrowRight
              :size="18"
              class="text-slate-400 group-hover:text-[#202759] group-hover:translate-x-1 transition-all"
            />
          </div>
          <h3 class="font-bold text-[#202759] text-base">Historial Completo</h3>
          <p class="text-xs text-slate-500 mt-1">
            Consultá todas tus reservas pasadas y actuales en detalle.
          </p>
        </RouterLink>
      </div>

      <!-- Próximas Actividades -->
      <div
        class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-[#202759] flex items-center gap-2">
            <PhClockClockwise :size="20" weight="bold" class="text-[#F96167]" />
            <span>Próximas Reservas y Actividades</span>
          </h2>
          <RouterLink
            to="/historial"
            class="text-xs font-bold text-[#202759] hover:underline"
          >
            Ver todas →
          </RouterLink>
        </div>

        <div
          v-if="proximasActividades.length === 0"
          class="text-center py-8 text-slate-400 text-sm"
        >
          No tenés reservas próximas registradas. ¡Explorá nuestras canchas y
          clases grupales!
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="act in proximasActividades"
            :key="act.id"
            class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors gap-3"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#202759] shrink-0 mt-0.5"
              >
                <PhCourtBasketball
                  v-if="act.tipo === 'Reserva de Cancha'"
                  :size="20"
                  weight="bold"
                  class="text-[#F96167]"
                />
                <PhCalendar
                  v-else
                  :size="20"
                  weight="bold"
                  class="text-[#202759]"
                />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-xs font-bold px-2 py-0.5 rounded-md bg-[#202759]/10 text-[#202759]"
                  >
                    {{ act.tipo }}
                  </span>
                  <span
                    class="text-xs font-medium text-emerald-600 flex items-center gap-1"
                  >
                    <PhCheckCircle :size="14" weight="bold" /> {{ act.estado }}
                  </span>
                </div>
                <h4 class="font-bold text-[#202759] text-base mt-1">
                  {{ act.titulo }}
                </h4>
                <p
                  class="text-xs text-slate-500 flex items-center gap-2 mt-0.5"
                >
                  <span>📅 {{ new Date(act.fecha).toLocaleString() }}</span>
                  <span>•</span>
                  <span class="flex items-center gap-1"
                    ><PhBuildings :size="12" /> {{ act.sede }}</span
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
