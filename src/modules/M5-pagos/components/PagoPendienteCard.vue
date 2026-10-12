<script setup lang="ts">
import { computed } from 'vue'
import {
  PhSoccerBall,
  PhIdentificationCard,
  PhMapPin,
  PhCalendarBlank,
  PhClock,
} from '@phosphor-icons/vue'
import BotonPagar from './BotonPagar.vue'
import type { PagoPendiente } from '../services/pagos.service'

const props = defineProps<{
  pendiente: PagoPendiente
}>()

const esMembresia = computed(() => props.pendiente.tipo === 'membresia')

const montoFormateado = computed(() =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(props.pendiente.monto)
)

const detalleDesglosado = computed(() => {
  const detalle = props.pendiente.detalle
  if (!detalle) return null

  if (props.pendiente.tipo === 'cancha') {
    if (detalle.includes(' • ')) {
      const [sede, horarioStr] = detalle.split(' • ')
      let fecha = ''
      let horario = ''
      if (horarioStr) {
        if (horarioStr.includes(' de ')) {
          const partes = horarioStr.split(' de ')
          fecha = partes[0].trim()
          horario = partes[1].trim()
        } else {
          horario = horarioStr.trim()
        }
      }
      return {
        tipo: 'cancha' as const,
        sede: sede.trim(),
        fecha,
        horario,
      }
    }
  }

  if (props.pendiente.tipo === 'membresia') {
    if (detalle.includes(' • ')) {
      const [plan, vigencia] = detalle.split(' • ')
      return {
        tipo: 'membresia' as const,
        plan: plan.trim(),
        vigencia: vigencia.trim(),
      }
    }
    const matchDias = detalle.match(/\(?plan de (\d+)\s*días\)?/i)
    const matchHasta = detalle.match(/(?:hasta|venció el)\s+([\d/]+)/i)
    const dias = matchDias ? matchDias[1] : ''
    const fecha = matchHasta ? matchHasta[1] : ''
    return {
      tipo: 'membresia' as const,
      plan: dias ? `Plan de ${dias} días` : 'Plan de membresía',
      vigencia: fecha ? `Hasta ${fecha}` : detalle,
    }
  }

  return {
    tipo: 'otro' as const,
    texto: detalle,
  }
})
</script>

<template>
  <div
    class="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4 sm:gap-5 transition-shadow hover:shadow-md"
  >
    <div class="space-y-3.5 sm:space-y-4">
      <!-- Cabecera: Tipo a la izquierda, Estado Pendiente a la derecha -->
      <div class="flex items-center justify-between gap-2.5 sm:gap-3">
        <span
          class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border"
          :class="
            esMembresia
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          "
        >
          <PhIdentificationCard v-if="esMembresia" :size="15" weight="bold" />
          <PhSoccerBall v-else :size="15" weight="bold" />
          {{ esMembresia ? 'Membresía' : 'Reserva de Cancha' }}
        </span>

        <span
          class="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"
        >
          <PhClock :size="14" weight="fill" />
          Pendiente
        </span>
      </div>

      <!-- Título y detalles -->
      <div>
        <h3 class="text-base sm:text-lg font-bold text-[#202759] m-0 mb-2">
          {{ pendiente.titulo }}
        </h3>

        <div v-if="detalleDesglosado" class="space-y-1.5">
          <!-- Cancha: Los 3 badges en la misma línea -->
          <template v-if="detalleDesglosado.tipo === 'cancha'">
            <div
              class="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap overflow-x-auto no-scrollbar py-0.5"
            >
              <span
                v-if="detalleDesglosado.sede"
                class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap"
              >
                <PhMapPin :size="13" class="text-slate-400 shrink-0 sm:w-3.5 sm:h-3.5" />
                {{ detalleDesglosado.sede }}
              </span>

              <span
                v-if="detalleDesglosado.fecha"
                class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap"
              >
                <PhCalendarBlank :size="13" class="text-slate-400 shrink-0 sm:w-3.5 sm:h-3.5" />
                {{ detalleDesglosado.fecha }}
              </span>

              <span
                v-if="detalleDesglosado.horario"
                class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap"
              >
                <PhClock :size="13" class="text-slate-400 shrink-0 sm:w-3.5 sm:h-3.5" />
                {{ detalleDesglosado.horario }}
              </span>
            </div>
          </template>

          <!-- Membresía: Badges en la MISMA LÍNEA -->
          <template v-else-if="detalleDesglosado.tipo === 'membresia'">
            <div
              class="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap overflow-x-auto no-scrollbar py-0.5"
            >
              <span
                v-if="detalleDesglosado.plan"
                class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap"
              >
                <PhClock :size="13" class="text-slate-400 shrink-0 sm:w-3.5 sm:h-3.5" />
                {{ detalleDesglosado.plan }}
              </span>
              <span
                v-if="detalleDesglosado.vigencia"
                class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap"
              >
                <PhCalendarBlank :size="13" class="text-slate-400 shrink-0 sm:w-3.5 sm:h-3.5" />
                {{ detalleDesglosado.vigencia }}
              </span>
            </div>
          </template>

          <!-- Otros conceptos -->
          <template v-else>
            <div class="flex items-center">
              <span
                class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap"
              >
                <PhCalendarBlank :size="13" class="text-slate-400 shrink-0 sm:w-3.5 sm:h-3.5" />
                {{ detalleDesglosado.texto }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Barra de cobro inferior integrada: Total a la izquierda, Botón Pagar a la derecha -->
    <div
      class="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-100 flex items-center justify-between gap-3 sm:gap-4 mt-2"
    >
      <div class="min-w-0">
        <span
          class="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider"
        >
          Total a pagar
        </span>
        <span class="text-xl sm:text-2xl font-black text-[#202759] tracking-tight">
          {{ montoFormateado }}
        </span>
      </div>

      <BotonPagar
        :concepto="pendiente.titulo"
        :detalle="pendiente.detalle"
        :monto="pendiente.monto"
        :id-membresia="esMembresia ? pendiente.id_referencia : undefined"
        :id-cancha-reserva="esMembresia ? undefined : pendiente.id_referencia"
        :button-text="esMembresia ? 'Pagar Membresía' : 'Pagar Reserva'"
        :button-variant="esMembresia ? 'primary' : 'secondary'"
      />
    </div>
  </div>
</template>
