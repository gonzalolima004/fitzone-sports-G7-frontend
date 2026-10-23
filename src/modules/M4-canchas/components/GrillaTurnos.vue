<script setup lang="ts">
import { computed } from 'vue'
import { obtenerFechaHoyLocal } from '@/common/utils/date'
import type {
  Cancha,
  TurnoSlot,
  TurnoSeleccionado,
  HorarioOperativoDia,
} from '@/modules/M4-canchas/types/canchas.types'

interface Props {
  canchas: Cancha[]
  disponibilidadMap: Record<number, TurnoSlot[]>
  turnoSeleccionado: TurnoSeleccionado | null
  cargando: boolean
  fecha: string
  fechaHoy?: string
  horarioOperativo?: HorarioOperativoDia | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'seleccionarTurno', payload: { cancha: Cancha; slot: TurnoSlot }): void
}>()

// Comprueba si un slot ya transcurrió en el tiempo para el día actual
function esSlotPasado(slot: TurnoSlot): boolean {
  const hoyRef = props.fechaHoy || obtenerFechaHoyLocal()
  if (props.fecha < hoyRef) return true
  if (props.fecha === hoyRef) {
    const ahora = new Date()
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`
    return slot.hora_inicio <= horaActual
  }
  return false
}

// Lista dinámica de horas según los slots de la sede y fecha (SedeHorario y Calendario)
const franjasHorarias = computed(() => {
  const horasSet = new Set<string>()
  if (props.disponibilidadMap) {
    Object.values(props.disponibilidadMap).forEach((slots) => {
      if (Array.isArray(slots)) {
        slots.forEach((s) => {
          if (s && s.hora_inicio) {
            horasSet.add(s.hora_inicio)
          }
        })
      }
    })
  }

  if (horasSet.size > 0) {
    return Array.from(horasSet).sort()
  }

  if (props.horarioOperativo && props.horarioOperativo.abierto) {
    const inicio = parseInt(
      props.horarioOperativo.hora_apertura.split(':')[0],
      10
    )
    const fin = parseInt(props.horarioOperativo.hora_cierre.split(':')[0], 10)
    const res: string[] = []
    for (let h = inicio; h < fin; h++) {
      res.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return res
  }
  return []
})

function getSlot(canchaId: number, horaInicio: string): TurnoSlot | undefined {
  const slots = props.disponibilidadMap?.[canchaId]
  if (!Array.isArray(slots)) return undefined
  return slots.find((s) => s && s.hora_inicio === horaInicio)
}

function esSlotSeleccionado(canchaId: number, slot: TurnoSlot): boolean {
  if (!props.turnoSeleccionado) return false
  return (
    props.turnoSeleccionado.cancha.id_cancha === canchaId &&
    props.turnoSeleccionado.slot.hora_inicio === slot.hora_inicio
  )
}

function handleSlotClick(cancha: Cancha, slot: TurnoSlot) {
  if (esSlotPasado(slot) || slot.estado !== 'DISPONIBLE') return
  emit('seleccionarTurno', { cancha, slot })
}

function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}
</script>

<template>
  <div
    class="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
  >
    <!-- Encabezado de la Grilla con Leyenda -->
    <div
      class="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4"
    >
      <div>
        <h3 class="text-sm font-bold text-[#202759]">
          Grilla Horaria de Disponibilidad
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">
          Seleccioná un casillero libre para reservar tu turno en el día.
        </p>
      </div>

      <!-- Leyenda de Estados -->
      <div
        class="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600"
      >
        <div class="flex items-center gap-1.5">
          <span
            class="w-3.5 h-3.5 rounded-md border border-slate-300 bg-white inline-block shadow-2xs"
          />
          <span class="text-slate-700 font-medium">Disponible</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            class="w-3.5 h-3.5 rounded-md border border-[#F96167]/40 bg-[#F96167]/10 inline-block"
          />
          <span class="text-[#F96167] font-bold">Horario Pico (19 a 21h)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 rounded-md bg-slate-200 inline-block" />
          <span class="text-slate-400">Ocupado / Pasado</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            class="w-3.5 h-3.5 rounded-md bg-amber-100 border-2 border-dashed border-amber-400 inline-block"
          />
          <span class="text-amber-800 font-bold">Mantenimiento</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 rounded-md bg-[#202759] inline-block" />
          <span class="text-[#202759] font-bold">Seleccionado</span>
        </div>
      </div>
    </div>

    <!-- Estado de Carga / Skeleton -->
    <div
      v-if="cargando"
      class="p-8 flex flex-col items-center justify-center gap-3 text-slate-400"
    >
      <svg
        class="animate-spin h-7 w-7 text-[#202759]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span class="text-xs font-medium text-slate-500"
        >Consultando disponibilidad en tiempo real...</span
      >
    </div>

    <!-- Estado de Sede Cerrada o Fecha No Programada en Calendario -->
    <div
      v-else-if="horarioOperativo && !horarioOperativo.abierto"
      class="p-12 text-center flex flex-col items-center justify-center gap-3"
    >
      <div
        :class="[
          'w-12 h-12 rounded-full flex items-center justify-center mb-1',
          horarioOperativo.no_programado
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-50 text-[#F96167]',
        ]"
      >
        <svg
          v-if="horarioOperativo.no_programado"
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h4 class="text-sm font-bold text-slate-800">
        {{
          horarioOperativo.no_programado
            ? 'Fecha no programada en el calendario'
            : horarioOperativo.es_pasado
              ? 'Fecha pasada no disponible'
              : 'Sede Cerrada'
        }}
      </h4>
      <p class="text-xs text-slate-500 max-w-md leading-relaxed">
        {{
          horarioOperativo.motivo_cierre ||
          'La sede no se encuentra abierta en la fecha seleccionada según el calendario oficial.'
        }}
      </p>
    </div>

    <!-- Empty State: sin canchas para el filtro -->
    <div
      v-else-if="canchas.length === 0"
      class="p-12 text-center flex flex-col items-center justify-center gap-2"
    >
      <div
        class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h4 class="text-sm font-bold text-slate-800">
        No hay canchas registradas
      </h4>
      <p class="text-xs text-slate-500 max-w-sm">
        No se encontraron canchas activas para la disciplina seleccionada en
        esta sede. Probá eligiendo otro deporte o sede.
      </p>
    </div>

    <!-- Matriz Horaria Interactiva -->
    <div v-else class="overflow-x-auto w-full">
      <table class="w-full border-collapse text-left min-w-[620px]">
        <thead>
          <tr
            class="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-600 font-semibold"
          >
            <!-- Columna Horario -->
            <th
              class="py-3 px-4 w-28 whitespace-nowrap text-center uppercase tracking-wider text-slate-500"
            >
              Horario
            </th>

            <!-- Columnas por Cancha -->
            <th
              v-for="cancha in canchas"
              :key="cancha.id_cancha"
              class="py-3 px-3 text-center border-l border-slate-200 min-w-[150px]"
            >
              <div class="font-bold text-[#202759] text-xs leading-snug">
                {{ cancha.nombre }}
              </div>
              <div class="text-[11px] font-medium text-slate-500 tabular-nums">
                Base: {{ formatoMoneda(cancha.costo_base) }}/h
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 text-xs">
          <tr
            v-for="hora in franjasHorarias"
            :key="hora"
            class="hover:bg-slate-50/50 transition-colors"
          >
            <!-- Celda de Hora -->
            <td
              class="py-2.5 px-4 text-center font-mono text-slate-600 font-semibold tabular-nums select-none bg-slate-50/40"
            >
              {{ hora }}
            </td>

            <!-- Celdas por Cancha -->
            <td
              v-for="cancha in canchas"
              :key="cancha.id_cancha"
              class="py-1.5 px-2.5 border-l border-slate-100 text-center align-middle"
            >
              <template v-if="getSlot(cancha.id_cancha, hora)">
                <!-- SLOT PASADO / HORARIO TRANSCURRIDO HOY O FECHA PASADA -->
                <div
                  v-if="esSlotPasado(getSlot(cancha.id_cancha, hora)!)"
                  class="w-full py-2 px-2 rounded-xl text-xs bg-slate-100 text-slate-400 select-none cursor-not-allowed flex flex-col items-center justify-center gap-0.5 border border-slate-200/60"
                  title="Este horario ya transcurrió en el día de hoy"
                >
                  <span class="font-medium text-[11px] leading-none"
                    >Pasado</span
                  >
                  <span
                    class="text-[9px] text-slate-400 uppercase tracking-wider font-mono"
                    >No disp.</span
                  >
                </div>

                <!-- SLOT DISPONIBLE -->
                <button
                  v-else-if="
                    getSlot(cancha.id_cancha, hora)!.estado === 'DISPONIBLE'
                  "
                  type="button"
                  :class="[
                    'w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#202759]',
                    esSlotSeleccionado(
                      cancha.id_cancha,
                      getSlot(cancha.id_cancha, hora)!
                    )
                      ? 'bg-[#202759] text-white shadow-md ring-2 ring-[#202759]'
                      : getSlot(cancha.id_cancha, hora)!.es_horario_pico
                        ? 'bg-rose-50/90 border-2 border-rose-300 text-[#202759] hover:bg-rose-100 hover:border-[#F96167] shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-[#202759]/60 hover:bg-slate-50 hover:text-[#202759] shadow-2xs',
                  ]"
                  @click="
                    handleSlotClick(cancha, getSlot(cancha.id_cancha, hora)!)
                  "
                >
                  <div class="flex items-center gap-1 leading-none">
                    <span
                      v-if="
                        esSlotSeleccionado(
                          cancha.id_cancha,
                          getSlot(cancha.id_cancha, hora)!
                        )
                      "
                      class="text-white"
                    >
                      Elegido
                    </span>
                    <span
                      v-else
                      :class="
                        getSlot(cancha.id_cancha, hora)!.es_horario_pico
                          ? 'text-[#202759] font-bold'
                          : ''
                      "
                    >
                      Disponible
                    </span>

                    <span
                      v-if="
                        getSlot(cancha.id_cancha, hora)!.es_horario_pico &&
                        !esSlotSeleccionado(
                          cancha.id_cancha,
                          getSlot(cancha.id_cancha, hora)!
                        )
                      "
                      class="text-[9px] font-black bg-[#F96167] text-white px-1.5 py-0.5 rounded shadow-2xs tracking-tight uppercase"
                    >
                      Pico
                    </span>
                  </div>

                  <!-- Precio con cifras tabulares y cálculo correcto -->
                  <span
                    :class="[
                      'text-[10px] font-mono tabular-nums leading-none',
                      esSlotSeleccionado(
                        cancha.id_cancha,
                        getSlot(cancha.id_cancha, hora)!
                      )
                        ? 'text-slate-200'
                        : getSlot(cancha.id_cancha, hora)!.es_horario_pico
                          ? 'text-[#F96167] font-extrabold'
                          : 'text-slate-500',
                    ]"
                  >
                    {{
                      formatoMoneda(
                        getSlot(cancha.id_cancha, hora)!.precio_estimado
                      )
                    }}
                  </span>
                </button>

                <!-- SLOT RESERVADO -->
                <div
                  v-else-if="
                    getSlot(cancha.id_cancha, hora)!.estado === 'RESERVADO'
                  "
                  class="w-full py-2 px-2 rounded-xl text-xs bg-slate-100 text-slate-400 select-none cursor-not-allowed flex flex-col items-center justify-center gap-0.5 border border-slate-200/60"
                >
                  <span class="font-medium text-[11px] leading-none"
                    >Ocupado</span
                  >
                  <span
                    class="text-[9px] text-slate-400 uppercase tracking-wider font-mono"
                    >No disp.</span
                  >
                </div>

                <!-- SLOT EN MANTENIMIENTO -->
                <div
                  v-else-if="
                    getSlot(cancha.id_cancha, hora)!.estado === 'MANTENIMIENTO'
                  "
                  class="w-full py-2 px-2 rounded-xl text-xs bg-amber-50 text-amber-950 border-2 border-dashed border-amber-400 select-none cursor-not-allowed flex flex-col items-center justify-center gap-0.5 shadow-2xs"
                  title="Cancha bloqueada por mantenimiento preventivo"
                >
                  <div class="flex items-center gap-1 leading-none">
                    <span
                      class="font-bold text-[11px] text-amber-900 leading-none"
                      >Mantenimiento</span
                    >
                  </div>
                  <span class="text-[9px] text-amber-700 font-mono font-medium"
                    >Bloqueado</span
                  >
                </div>
              </template>

              <!-- Slot no disponible en la grilla -->
              <div v-else class="text-slate-300 text-xs py-2">-</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
