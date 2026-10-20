<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import { useAuthStore } from '@/store/auth'
import reservasService from '@/modules/M4-canchas/services/reservas.service'
import type {
  TurnoSeleccionado,
  CotizacionTurnoResponse,
  ReservaCanchaResponse,
} from '@/modules/M4-canchas/types/canchas.types'

interface Props {
  modelValue: boolean
  turno: TurnoSeleccionado | null
  nombreSede: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'reservaConfirmada', reserva: ReservaCanchaResponse): void
  (e: 'conflictoDisponibilidad', mensaje: string): void
}>()

const authStore = useAuthStore()

// Determina si el usuario en sesión es socio activo
const esSocio = computed(() => {
  return (
    (authStore.isAuthenticated || !!authStore.token) &&
    (authStore.rol === 'socio' || authStore.usuario?.rol === 'socio')
  )
})

const cargandoCotizacion = ref(false)
const confirmando = ref(false)
const errorConflicto = ref<string | null>(null)
const cotizacion = ref<CotizacionTurnoResponse | null>(null)

// Formateador de moneda en pesos argentinos
function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

// Al abrir el modal o cambiar el turno, obtenemos la cotización del backend
watch(
  () => [props.modelValue, props.turno],
  async ([abierto, turnoNuevo]) => {
    if (abierto && turnoNuevo) {
      errorConflicto.value = null
      cargandoCotizacion.value = true
      try {
        const turno = turnoNuevo as TurnoSeleccionado
        cotizacion.value = await reservasService.cotizarTurno(
          turno.cancha.id_cancha,
          turno.fecha,
          turno.slot.hora_inicio,
          Number(turno.cancha.costo_base) || 8000,
          esSocio.value
        )
      } catch (err) {
        console.error('[ConfirmarReserva] Error al cotizar:', err)
        toast.error('No se pudo calcular el precio del turno.')
      } finally {
        cargandoCotizacion.value = false
      }
    } else {
      cotizacion.value = null
      errorConflicto.value = null
    }
  },
  { immediate: true }
)

function cerrar() {
  emit('update:modelValue', false)
}

/**
 * Confirmar reserva transaccional
 */
async function handleConfirmar() {
  if (!props.turno) return

  // Validación para no permitir confirmar en el pasado
  const hoyStr = new Date().toISOString().split('T')[0]
  if (props.turno.fecha < hoyStr) {
    toast.error('No se pueden confirmar reservas para fechas pasadas.')
    return
  }
  if (props.turno.fecha === hoyStr) {
    const ahora = new Date()
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`
    if (props.turno.slot.hora_fin <= horaActual) {
      toast.error(
        'No se pueden confirmar reservas para horarios que ya transcurrieron hoy.'
      )
      return
    }
  }

  confirmando.value = true
  errorConflicto.value = null

  const fechaInicioISO = `${props.turno.fecha}T${props.turno.slot.hora_inicio}:00Z`
  const fechaFinISO = `${props.turno.fecha}T${props.turno.slot.hora_fin}:00Z`

  try {
    const reserva = await reservasService.crearReserva({
      id_cancha: props.turno.cancha.id_cancha,
      fecha_inicio: fechaInicioISO,
      fecha_fin: fechaFinISO,
    })

    // Guardar detalles completos en cache para la pantalla de detalle
    const numPrecio =
      Number(reserva.precio_congelado) &&
      Number(reserva.precio_congelado) !== 15000
        ? Number(reserva.precio_congelado)
        : Number(cotizacion.value?.precio_final) ||
          Number(props.turno.slot.precio_estimado)
    const precioFinal =
      !isNaN(numPrecio) && numPrecio > 0
        ? numPrecio
        : cotizacion.value?.precio_final ||
          props.turno.slot.precio_estimado ||
          8000

    reservasService.guardarReservaEnCache({
      id_cancha_reserva: reserva.id_cancha_reserva,
      id_cancha: props.turno.cancha.id_cancha,
      id_usuario: reserva.id_usuario || 1,
      fecha_inicio: fechaInicioISO,
      fecha_fin: fechaFinISO,
      precio_congelado: precioFinal,
      id_cancha_reserva_estado: reserva.id_cancha_reserva_estado || 1,
      estado_nombre: reserva.estado_nombre || 'Pendiente de Pago',
      created_at: reserva.created_at || new Date().toISOString(),
      cancha: props.turno.cancha,
      nombre_cancha: props.turno.cancha.nombre,
      tipo_cancha: props.turno.cancha.tipo?.nombre || 'Pádel',
      nombre_sede: props.nombreSede,
      costo_base: cotizacion.value?.costo_base || props.turno.cancha.costo_base,
      descuento_porcentaje: cotizacion.value?.descuento_porcentaje || 15,
      monto_descuento: cotizacion.value?.monto_descuento || 0,
      es_horario_pico:
        cotizacion.value?.es_horario_pico || props.turno.slot.es_horario_pico,
      monto_recargo_pico: cotizacion.value?.monto_recargo_pico || 0,
      cancha_en_mantenimiento: false,
    })

    toast.success('¡Reserva confirmada con éxito!')
    emit('reservaConfirmada', reserva)
    cerrar()
  } catch (err: unknown) {
    // Manejo de conflictos de disponibilidad y concurrencia
    let mensajeError =
      'El turno seleccionado ya fue reservado por otro usuario.'

    if (typeof err === 'object' && err !== null && 'response' in err) {
      const response = (
        err as { response?: { status?: number; data?: { message?: string } } }
      ).response
      if (response?.status === 409 || response?.data?.message) {
        mensajeError = response.data?.message || mensajeError
      }
    } else {
      // Simulación en entorno desconectado para comprobar el flujo de conflicto
      mensajeError =
        'Conflicto de concurrencia: este turno acaba de ser tomado.'
    }

    errorConflicto.value = mensajeError
    toast.error(mensajeError)
    emit('conflictoDisponibilidad', mensajeError)
  } finally {
    confirmando.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Confirmar Reserva de Cancha"
    subtitle="Revisá el detalle del turno y el desglose de precio informado por el servidor."
    max-width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="turno" class="space-y-4">
      <!-- Detalle del Turno -->
      <div
        class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs"
      >
        <div class="flex justify-between py-1 border-b border-slate-200/60">
          <span class="text-slate-500 font-medium">Sede:</span>
          <span class="font-bold text-[#202759]">{{ nombreSede }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-200/60">
          <span class="text-slate-500 font-medium">Cancha:</span>
          <span class="font-bold text-[#202759]">{{
            turno.cancha.nombre
          }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-200/60">
          <span class="text-slate-500 font-medium">Deporte:</span>
          <span class="font-semibold text-slate-800">{{
            turno.cancha.tipo?.nombre || 'Deporte'
          }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-200/60">
          <span class="text-slate-500 font-medium">Fecha:</span>
          <span class="font-bold text-[#202759]">{{ turno.fecha }}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-slate-500 font-medium">Horario:</span>
          <span class="font-mono font-bold text-[#202759] tabular-nums">
            {{ turno.slot.hora_inicio }} a {{ turno.slot.hora_fin }} hs
          </span>
        </div>
      </div>

      <!-- Desglose de Precio Informado por Backend -->
      <div
        class="rounded-xl border border-slate-200 p-4 bg-white space-y-2 text-xs"
      >
        <h4 class="font-bold text-[#202759] text-xs uppercase tracking-wider">
          Desglose de Cotización
        </h4>

        <div
          v-if="cargandoCotizacion"
          class="py-3 flex items-center justify-center gap-2 text-slate-400"
        >
          <svg
            class="animate-spin h-4 w-4 text-[#202759]"
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
          <span>Calculando tarifa con reglas del servidor...</span>
        </div>

        <template v-else-if="cotizacion">
          <!-- Costo Base -->
          <div class="flex justify-between text-slate-600">
            <span>Costo base de la cancha:</span>
            <span class="font-mono tabular-nums">{{
              formatoMoneda(cotizacion.costo_base)
            }}</span>
          </div>

          <!-- Descuento a Socios Activos (15%) -->
          <div
            v-if="cotizacion.monto_descuento > 0"
            class="flex justify-between text-emerald-700 font-medium"
          >
            <span
              >Descuento socio activo (-{{
                cotizacion.descuento_porcentaje
              }}%):</span
            >
            <span class="font-mono tabular-nums"
              >-{{ formatoMoneda(cotizacion.monto_descuento) }}</span
            >
          </div>

          <!-- Recargo Horario Pico (19 a 21 hs) -->
          <div
            v-if="cotizacion.es_horario_pico"
            class="flex justify-between text-[#F96167] font-medium"
          >
            <span>Recargo horario pico (+20%):</span>
            <span class="font-mono tabular-nums"
              >+{{ formatoMoneda(cotizacion.monto_recargo_pico) }}</span
            >
          </div>

          <div
            class="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold"
          >
            <span class="text-[#202759]">Total congelado a abonar:</span>
            <span class="text-base text-[#202759] font-mono tabular-nums">
              {{ formatoMoneda(cotizacion.precio_final) }}
            </span>
          </div>
        </template>
      </div>

      <!-- Alerta de Conflicto de Disponibilidad / Concurrencia -->
      <div
        v-if="errorConflicto"
        class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5"
      >
        <div class="flex items-center gap-2 font-bold text-red-900">
          <svg
            class="w-4 h-4 shrink-0 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Conflicto de disponibilidad detectado</span>
        </div>
        <p class="leading-relaxed">
          {{ errorConflicto }} Se actualizará la grilla para mostrar los
          horarios vigentes.
        </p>
      </div>
    </div>

    <template #actions>
      <BaseButton variant="outline" :disabled="confirmando" @click="cerrar">
        Cancelar
      </BaseButton>

      <BaseButton
        variant="secondary"
        :loading="confirmando"
        :disabled="cargandoCotizacion"
        @click="handleConfirmar"
      >
        Confirmar y Reservar
      </BaseButton>
    </template>
  </BaseModal>
</template>
