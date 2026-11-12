<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhFire,
  PhBell,
  PhBarbell,
  PhBicycle,
  PhFlowerLotus,
  PhClock,
  PhPencilSimple,
  PhTrash,
  PhMedal,
  PhWarningCircle,
  PhMapPin,
} from '@phosphor-icons/vue'

import {
  formatearDiasSemana,
  formatearFechaDDMMAAAA,
  obtenerEstadoVentanaReserva,
} from '@/common/utils/date-formatter'

export interface ClaseCardProps {
  id: number
  nombre: string
  tipo: string
  icono: string
  horario: string
  fecha_inicio?: string
  fecha_fin?: string
  profesor?: string | null
  sala?: string | null
  descripcion?: string | null
  capacidadMaxima: number
  cuposOcupados: number
  cuposDisponibles?: number
  enListaEspera: number
  ordenEnCola?: number
  idReserva?: number
  idListaEspera?: number
  estado: 'DISPONIBLE' | 'COMPLETO' | 'MISMA_RESERVA' | 'EN_ESPERA'
  dias_semana?: number[]
  fecha?: string | null
  horario_inicio?: string
  horario_fin?: string
  fechaSeleccionada?: string
}

export type MotivoInhabilitacion =
  | 'EXTERNO'
  | 'MORA'
  | 'SUSPENDIDA'
  | 'SIN_MEMBRESIA'
  | 'CIUDAD_DIFERENTE'
  | null

const props = withDefaults(
  defineProps<{
    clase: ClaseCardProps
    esAdminOGerente?: boolean
    motivoInhabilitacion?: MotivoInhabilitacion
  }>(),
  {
    esAdminOGerente: false,
    motivoInhabilitacion: null,
  }
)

const emit = defineEmits<{
  (e: 'reservar', id: number): void
  (e: 'lista-espera', id: number): void
  (e: 'cancelar', id: number): void
  (e: 'editar', id: number): void
  (e: 'eliminar', id: number): void
}>()

const porcentajeOcupacion = computed(() => {
  if (!props.clase.capacidadMaxima || props.clase.capacidadMaxima <= 0) return 0
  return Math.min(
    (props.clase.cuposOcupados / props.clase.capacidadMaxima) * 100,
    100
  )
})

const lugaresDisponibles = computed(() => {
  return (
    props.clase.cuposDisponibles ??
    Math.max(0, props.clase.capacidadMaxima - props.clase.cuposOcupados)
  )
})

const estaCompleto = computed(() => props.clase.estado === 'COMPLETO')

const etiquetaPeriodicidad = computed(() => {
  if (props.clase.fecha) {
    return `Puntual: ${formatearFechaDDMMAAAA(props.clase.fecha)}`
  }
  if (props.clase.dias_semana && props.clase.dias_semana.length > 0) {
    return formatearDiasSemana(props.clase.dias_semana)
  }
  return null
})

const estadoVentana = computed(() => {
  return obtenerEstadoVentanaReserva(
    props.clase.fecha_inicio ||
      props.clase.fecha ||
      props.clase.fechaSeleccionada ||
      new Date(),
    props.clase.horario_inicio
  )
})
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
      <div class="flex items-center gap-2">
        <div
          class="font-extrabold text-sm"
          :class="estaCompleto ? 'text-rose-500' : 'text-slate-800'"
        >
          {{ clase.horario }}
        </div>

        <div
          v-if="esAdminOGerente"
          class="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2"
        >
          <button
            class="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-95 cursor-pointer"
            title="Editar clase"
            @click.stop="emit('editar', clase.id)"
          >
            <PhPencilSimple :size="16" weight="bold" />
          </button>
          <button
            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-95 cursor-pointer"
            title="Eliminar clase"
            @click.stop="emit('eliminar', clase.id)"
          >
            <PhTrash :size="16" weight="bold" />
          </button>
        </div>
      </div>
    </div>

    <!-- Info: Título, Profesor, Sala y Periodicidad -->
    <div class="mb-6 flex-grow">
      <div class="flex items-start justify-between gap-2 mb-1">
        <h3 class="text-xl font-bold text-slate-800 leading-tight">
          {{ clase.nombre }}
        </h3>
        <span
          v-if="etiquetaPeriodicidad"
          class="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
          :title="
            clase.fecha
              ? 'Clase especial de fecha única'
              : 'Días programados de la clase'
          "
        >
          {{ etiquetaPeriodicidad }}
        </span>
      </div>
      <p class="text-slate-500 text-sm font-medium">
        {{ clase.profesor || 'Sin profesor asignado' }} &middot;
        {{ clase.sala || 'Sala no especificada' }}
      </p>
      <p
        v-if="clase.descripcion"
        class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed"
      >
        {{ clase.descripcion }}
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
          {{
            clase.enListaEspera > 0
              ? `${clase.enListaEspera} socios en lista de espera actualmente.`
              : 'Sin socios en espera actualmente.'
          }}
        </span>
        <span v-else class="text-slate-500">
          Quedan {{ lugaresDisponibles }} lugares disponibles.
        </span>
      </div>
    </div>

    <!-- Botones de Acción -->
    <!-- 1. Si el usuario ya tiene reserva para esta clase -->
    <button
      v-if="clase.estado === 'MISMA_RESERVA' && estadoVentana.puedeReservar"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 shadow-sm"
      @click="emit('cancelar', clase.id)"
    >
      Cancelar mi Reserva
    </button>

    <!-- 2. Si el usuario ya está en lista de espera -->
    <button
      v-else-if="clase.estado === 'EN_ESPERA'"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 border-2 border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
      disabled
    >
      <PhBell :size="18" weight="fill" class="text-amber-500" />
      En Lista de Espera
      {{ clase.ordenEnCola ? `(#${clase.ordenEnCola})` : '' }}
    </button>

    <!-- 3. Si la clase ya finalizó o pasó su horario -->
    <button
      v-else-if="
        !estadoVentana.puedeReservar && estadoVentana.motivoBloqueo === 'PASADO'
      "
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
      disabled
    >
      <PhClock :size="18" weight="bold" />
      Clase finalizada
    </button>

    <!-- 4. Si la clase es a más de 48 hs (bloqueada: la reserva aún no abrió) -->
    <button
      v-else-if="
        !estadoVentana.puedeReservar &&
        estadoVentana.motivoBloqueo === 'FUTURO_LEJANO'
      "
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
      disabled
      title="Las reservas abren con 48 hs de anticipación"
    >
      <PhClock :size="18" weight="bold" class="text-slate-400" />
      Abre 48 hs antes
    </button>

    <!-- 5. Inhabilitación por falta de membresía activa / mora / externo -->
    <RouterLink
      v-else-if="motivoInhabilitacion === 'EXTERNO'"
      to="/membresia"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center justify-center gap-2 shadow-sm"
      title="Exclusivo para socios. Clic para ver planes de membresía."
    >
      <PhMedal :size="18" weight="bold" />
      Exclusivo Socios &middot; Ver Planes
    </RouterLink>

    <RouterLink
      v-else-if="motivoInhabilitacion === 'MORA'"
      to="/membresia"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all flex items-center justify-center gap-2 shadow-sm"
      title="Membresía vencida o cuota impaga. Clic para regularizar."
    >
      <PhWarningCircle :size="18" weight="bold" class="text-amber-600" />
      Cuota Pendiente &middot; Regularizar
    </RouterLink>

    <RouterLink
      v-else-if="motivoInhabilitacion === 'SUSPENDIDA'"
      to="/membresia"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center justify-center gap-2 shadow-sm"
      title="Membresía suspendida. Clic para gestionar."
    >
      <PhWarningCircle :size="18" weight="bold" class="text-rose-500" />
      Membresía Suspendida &middot; Gestionar
    </RouterLink>

    <RouterLink
      v-else-if="motivoInhabilitacion === 'SIN_MEMBRESIA'"
      to="/membresia"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm"
      title="Requiere membresía activa. Clic para adquirir."
    >
      <PhMedal :size="18" weight="bold" />
      Requiere Membresía &middot; Adquirir
    </RouterLink>

    <button
      v-else-if="motivoInhabilitacion === 'CIUDAD_DIFERENTE'"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
      disabled
      title="Las reservas de clases grupales están permitidas únicamente en sedes de tu misma ciudad"
    >
      <PhMapPin :size="18" weight="bold" class="text-amber-500" />
      Sede en otra ciudad
    </button>

    <!-- 6. Si está disponible para reservar dentro de la ventana de 48 hs -->
    <button
      v-else-if="!estaCompleto"
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 text-white shadow-md cursor-pointer bg-[#202759] hover:bg-[#161b3d] shadow-slate-300/50"
      @click="emit('reservar', clase.id)"
    >
      Reservar Clase
    </button>

    <!-- 7. Si está completo pero dentro de la ventana de 48 hs para lista de espera -->
    <button
      v-else
      class="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 bg-rose-50 text-rose-600 hover:bg-rose-100 border-2 border-rose-200 flex items-center justify-center gap-2 cursor-pointer"
      @click="emit('lista-espera', clase.id)"
    >
      <PhBell :size="18" weight="bold" />
      Anotarme en Lista de Espera
    </button>
  </div>
</template>
