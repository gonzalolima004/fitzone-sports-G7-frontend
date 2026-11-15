<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PhCalendar, PhCourtBasketball, PhWarningCircle } from '@phosphor-icons/vue'
import { clasesService, type MiReservaClaseResponse } from '@/modules/M3-clases-grupales/services/clases.service'
import { reservasService } from '@/modules/M4-canchas/services/reservas.service'
import type { DetalleReservaCancha } from '@/modules/M4-canchas/types/canchas.types'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

type FiltroTipo = 'Todas' | 'Canchas' | 'Clases'
const filtro = ref<FiltroTipo>('Todas')
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

const misClases = ref<MiReservaClaseResponse[]>([])
const misCanchas = ref<DetalleReservaCancha[]>([])

type Actividad = {
  id: string
  tipo: 'Cancha' | 'Clase'
  titulo: string
  fecha: string
  sede: string
  estado: string
}

const actividades = computed<Actividad[]>(() => {
  const c = misClases.value.map(cl => ({
    id: `clase-${cl.id_clase_reserva}`,
    tipo: 'Clase' as const,
    titulo: cl.nombre_clase || 'Clase Grupal',
    fecha: cl.fecha_inicio,
    sede: 'Sede FitZone',
    estado: cl.estado || 'Confirmada'
  }))
  const can = misCanchas.value.map(ca => ({
    id: `cancha-${ca.id_cancha_reserva}`,
    tipo: 'Cancha' as const,
    titulo: ca.nombre_cancha || 'Reserva Cancha',
    fecha: ca.fecha_inicio,
    sede: ca.nombre_sede || 'Sede FitZone',
    estado: ca.estado_nombre || 'Confirmada'
  }))

  const todas = [...c, ...can].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  if (filtro.value === 'Todas') return todas
  return todas.filter(a => a.tipo === filtro.value)
})

async function cargarHistorial() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const [c, can] = await Promise.all([
      clasesService.obtenerMisReservas().catch(() => []),
      reservasService.obtenerMisReservasCanchas().catch(() => [])
    ])
    misClases.value = c
    misCanchas.value = can
  } catch {
    errorMessage.value = 'Error al cargar el historial.'
    toast.error('No se pudo cargar el historial de reservas.')
  } finally {
    isLoading.value = false
  }
}

onMounted(cargarHistorial)
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-[#202759]">Historial de Reservas</h1>
      <div class="flex bg-slate-100 p-1 rounded-xl">
        <button v-for="f in ['Todas', 'Canchas', 'Clases']" :key="f"
          @click="filtro = f as FiltroTipo"
          :class="['px-4 py-2 text-sm font-bold rounded-lg transition-all', filtro === f ? 'bg-white text-[#202759] shadow-sm' : 'text-slate-500 hover:text-[#202759]']">
          {{ f }}
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="space-y-4">
      <BaseSkeleton v-for="i in 3" :key="i" variant="rounded" height="80px" />
    </div>

    <div v-else-if="errorMessage" class="text-center py-10 space-y-4">
      <PhWarningCircle :size="48" class="mx-auto text-red-400" />
      <p class="text-red-700">{{ errorMessage }}</p>
      <BaseButton variant="outline" @click="cargarHistorial">Reintentar</BaseButton>
    </div>

    <div v-else-if="actividades.length === 0" class="text-center py-10 text-slate-500">
      No tienes reservas registradas en este momento.
    </div>

    <div v-else class="space-y-3">
      <div v-for="act in actividades" :key="act.id" class="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#202759]">
            <PhCourtBasketball v-if="act.tipo === 'Cancha'" :size="24" weight="bold" class="text-[#F96167]" />
            <PhCalendar v-else :size="24" weight="bold" />
          </div>
          <div>
            <h3 class="font-bold text-[#202759]">{{ act.titulo }}</h3>
            <p class="text-xs text-slate-500">📅 {{ new Date(act.fecha).toLocaleString() }} · {{ act.sede }}</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-[#202759]">
          {{ act.estado }}
        </span>
      </div>
    </div>
  </div>
</template>
