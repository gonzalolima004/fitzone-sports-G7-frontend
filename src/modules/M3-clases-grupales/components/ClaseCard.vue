<script setup lang="ts">
import { computed } from 'vue'
import {
  PhFire,
  PhBell,
  PhBarbell,
  PhBicycle,
  PhFlowerLotus,
} from '@phosphor-icons/vue'

export interface ClaseCardProps {
  id: number
  nombre: string
  tipo: string
  icono: string
  horario: string
  profesor: string
  sala: string
  capacidadMaxima: number
  cuposOcupados: number
  enListaEspera: number
  estado: 'DISPONIBLE' | 'COMPLETO' | 'MISMA_RESERVA' | 'EN_ESPERA'
}

const props = defineProps<{
  clase: ClaseCardProps
}>()

const emit = defineEmits<{
  (e: 'reservar', id: number): void
  (e: 'lista-espera', id: number): void
  (e: 'cancelar', id: number): void
}>()

const porcentajeOcupacion = computed(() => {
  return Math.min(
    (props.clase.cuposOcupados / props.clase.capacidadMaxima) * 100,
    100
  )
})

const lugaresDisponibles = computed(() => {
  return props.clase.capacidadMaxima - props.clase.cuposOcupados
})

const estaCompleto = computed(() => props.clase.estado === 'COMPLETO')
</script>

<template>
  <div
    class="bg-white rounded-3xl p-6 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    :class="[
      estaCompleto
        ? 'border-2 border-rose-200 shadow-rose-100'
        : 'border border-slate-100 shadow-lg shadow-slate-200/50',
    ]"
  >
    <!-- Header: Tipo y Horario -->
    <div class="flex justify-between items-center mb-5">
      <div
        class="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 tracking-wider uppercase"
      >
        <PhBicycle
          v-if="clase.icono === 'bicycle' || clase.tipo === 'SPINNING'"
          :size="16"
          weight="bold"
        />
        <PhFlowerLotus
          v-else-if="clase.icono === 'lotus' || clase.tipo.includes('YOGA')"
          :size="16"
          weight="bold"
        />
        <PhBarbell v-else :size="16" weight="bold" />
        {{ clase.tipo }}
      </div>
      <div
        class="font-extrabold text-sm"
        :class="estaCompleto ? 'text-rose-500' : 'text-slate-800'"
      >
        {{ clase.horario }}
      </div>
    </div>

    <!-- Info: Título, Profesor y Sala -->
    <div class="mb-6 flex-grow">
      <h3 class="text-xl font-bold text-slate-800 mb-1 leading-tight">
        {{ clase.nombre }}
      </h3>
      <p class="text-slate-500 text-sm font-medium">
        {{ clase.profesor }} &middot; {{ clase.sala }}
      </p>
    </div>

    <!-- Progreso y Cupos -->
    <div class="mb-6">
      <div class="flex justify-between items-end mb-2 text-sm">
        <span class="text-slate-600 font-medium">Capacidad:</span>
        <span
          class="font-bold"
          :class="estaCompleto ? 'text-rose-600' : 'text-emerald-600'"
        >
          {{ clase.cuposOcupados }} / {{ clase.capacidadMaxima }}
          {{ estaCompleto ? '(COMPLETO)' : 'Ocupados' }}
        </span>
      </div>

      <!-- Barra -->
      <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          class="h-full rounded-full transition-all duration-1000 ease-out"
          :class="estaCompleto ? 'bg-rose-500' : 'bg-emerald-500'"
          :style="{ width: `${porcentajeOcupacion}%` }"
        ></div>
      </div>

      <!-- Mensaje inferior -->
      <div class="text-xs font-semibold h-4">
        <span
          v-if="estaCompleto"
          class="text-rose-500 flex items-center gap-1.5"
        >
          <PhFire :size="15" weight="fill" class="shrink-0" />
          {{ clase.enListaEspera }} socios en lista de espera actualmente.
        </span>
        <span v-else class="text-slate-500">
          Quedan {{ lugaresDisponibles }} lugares disponibles.
        </span>
      </div>
    </div>

    <!-- Botones de Acción -->
    <button
      v-if="clase.estado === 'MISMA_RESERVA'"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 shadow-sm"
      @click="emit('cancelar', clase.id)"
    >
      Cancelar mi Reserva
    </button>

    <button
      v-else-if="!estaCompleto"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 text-white shadow-md"
      :class="
        clase.tipo.includes('CROSSFIT') || clase.tipo.includes('FUNCIONAL')
          ? 'bg-slate-800 hover:bg-slate-700 shadow-slate-200'
          : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
      "
      @click="emit('reservar', clase.id)"
    >
      Reservar Lugar
    </button>

    <button
      v-else-if="clase.estado === 'EN_ESPERA'"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-500 border-2 border-slate-200 cursor-not-allowed"
      disabled
    >
      En Lista de Espera
    </button>

    <button
      v-else
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 bg-rose-50 text-rose-600 hover:bg-rose-100 border-2 border-rose-200 flex items-center justify-center gap-2"
      @click="emit('lista-espera', clase.id)"
    >
      <PhBell :size="18" weight="bold" />
      Anotarme en Lista de Espera
    </button>
  </div>
</template>
