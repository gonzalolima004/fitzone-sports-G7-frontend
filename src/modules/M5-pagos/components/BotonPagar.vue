<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import {
  PhCreditCard,
  PhLockKey,
  PhSoccerBall,
  PhIdentificationCard,
  PhWarningCircle,
  PhArrowSquareOut,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import { toast } from '@/common/utils/toast'
import {
  pagosService,
  type IniciarPagoRequest,
  type PreferenciaPagoResponse,
} from '../services/pagos.service'

interface Props {
  /**
   * Título o descripción del concepto a pagar (ej. "Reserva Cancha Pádel 1")
   */
  concepto: string

  /**
   * Monto total a abonar en Pesos Argentinos (ARS)
   */
  monto: number

  /**
   * ID de la reserva de cancha (excluyente con idMembresia)
   */
  idCanchaReserva?: number

  /**
   * ID de la membresía (excluyente con idCanchaReserva)
   */
  idMembresia?: number

  /**
   * Email del pagador para precargar en Mercado Pago
   */
  emailPagador?: string

  /**
   * Detalle contextual opcional (ej. horario, sede, vigencia)
   */
  detalle?: string

  /**
   * Deshabilita la interacción
   */
  disabled?: boolean

  /**
   * Estado de carga externo
   */
  loading?: boolean

  /**
   * Texto del botón disparador
   */
  buttonText?: string

  /**
   * Estilo visual del botón disparador (usa BaseButton)
   */
  buttonVariant?:
    'primary' | 'secondary' | 'outline' | 'danger' | 'danger-outline' | 'ghost'

  /**
   * Tamaño del botón
   */
  buttonSize?: 'sm' | 'md' | 'lg'

  /**
   * Si es true, redirige automáticamente al checkout retornado por Mercado Pago
   */
  autoRedirect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  idCanchaReserva: undefined,
  idMembresia: undefined,
  emailPagador: undefined,
  detalle: undefined,
  disabled: false,
  loading: false,
  buttonText: 'Pagar con Mercado Pago',
  buttonVariant: 'secondary',
  buttonSize: 'md',
  autoRedirect: true,
})

const emit = defineEmits<{
  (e: 'pagar', payload: IniciarPagoRequest): void
  (e: 'iniciado', respuesta: PreferenciaPagoResponse): void
  (e: 'error', error: unknown): void
  (e: 'cancelar'): void
}>()

const modalAbierto = ref(false)
const procesandoPago = ref(false)
const errorMensaje = ref<string | null>(null)

// Estado consolidado de carga: bloquea doble envío y desactiva controles
const estaCargando = computed(() => props.loading || procesandoPago.value)

const tieneCancha = computed(
  () => props.idCanchaReserva !== undefined && props.idCanchaReserva !== null
)
const tieneMembresia = computed(
  () => props.idMembresia !== undefined && props.idMembresia !== null
)

// Regla de negocio: exactamente un concepto debe estar presente
const conceptoValido = computed(() => {
  return (
    (tieneCancha.value && !tieneMembresia.value) ||
    (!tieneCancha.value && tieneMembresia.value)
  )
})

const tipoConcepto = computed<'cancha' | 'membresia' | 'general'>(() => {
  if (tieneCancha.value) return 'cancha'
  if (tieneMembresia.value) return 'membresia'
  return 'general'
})

const tipoEtiqueta = computed(() => {
  if (tipoConcepto.value === 'cancha') {
    return `Reserva de Cancha #${props.idCanchaReserva}`
  }
  if (tipoConcepto.value === 'membresia') {
    return `Membresía #${props.idMembresia}`
  }
  return 'Pago General'
})

const montoFormateado = computed(() => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(props.monto)
})

function abrirModal() {
  if (props.disabled || estaCargando.value) return
  errorMensaje.value = null
  modalAbierto.value = true
}

function cerrarModal() {
  if (estaCargando.value) return
  modalAbierto.value = false
  errorMensaje.value = null
  emit('cancelar')
}

async function handleConfirmarPago() {
  // Evitar envíos repetidos o con concepto inválido
  if (!conceptoValido.value || estaCargando.value) return

  procesandoPago.value = true
  errorMensaje.value = null

  const payload: IniciarPagoRequest = {
    monto: props.monto,
    titulo: props.concepto,
    id_cancha_reserva: props.idCanchaReserva,
    id_membresia: props.idMembresia,
    email_pagador: props.emailPagador,
  }

  try {
    // 1. Consumir el endpoint POST /pagos/iniciar-pago
    const respuesta = await pagosService.iniciarPago(payload)

    // 2. Persistir identificador del pago para seguimiento al retornar
    if (respuesta.id_pago) {
      localStorage.setItem(
        'fitzone_pago_pendiente',
        JSON.stringify({
          id_pago: respuesta.id_pago,
          preferenceId: respuesta.preferenceId,
          fecha: new Date().toISOString(),
        })
      )
    }

    emit('pagar', payload)
    emit('iniciado', respuesta)

    // 3. Redirigir al Checkout Pro de Mercado Pago (Sandbox o Producción)
    if (props.autoRedirect) {
      const checkoutUrl = respuesta.sandboxInitPoint || respuesta.initPoint
      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      }
    }

    modalAbierto.value = false
  } catch (error: unknown) {
    let mensaje = 'No se pudo iniciar la operación de pago'

    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const respData = error.response?.data

      if (respData?.message) {
        mensaje = Array.isArray(respData.message)
          ? respData.message.join('. ')
          : String(respData.message)
      } else if (status === 400) {
        mensaje = 'Datos de pago inválidos o violación de concepto único.'
      } else if (status === 401) {
        mensaje = 'Sesión expirada. Por favor vuelve a iniciar sesión.'
      } else if (status === 404) {
        mensaje = 'La reserva de cancha o membresía no fue encontrada.'
      } else if (status === 500) {
        mensaje = 'Error al comunicarse con Mercado Pago. Intenta más tarde.'
      } else if (error.code === 'ECONNABORTED' || !error.response) {
        mensaje = 'Error de conexión. Verifica tu conexión a internet.'
      }
    }

    errorMensaje.value = mensaje
    toast.error(mensaje)
    emit('error', error)
  } finally {
    // Liberar estado de carga si ocurrió error o no hubo redirección inmediata
    procesandoPago.value = false
  }
}
</script>

<template>
  <div class="inline-block">
    <!-- Botón activador con BaseButton -->
    <BaseButton
      :variant="buttonVariant"
      :size="buttonSize"
      :disabled="disabled || estaCargando"
      :loading="estaCargando"
      @click="abrirModal"
    >
      <template #icon>
        <PhCreditCard :size="18" weight="bold" />
      </template>
      <slot>{{ buttonText }}</slot>
    </BaseButton>

    <!-- Modal de confirmación y presentación con BaseModal -->
    <BaseModal
      v-model="modalAbierto"
      title="Confirmar Pago"
      subtitle="Verifica el detalle de la operación antes de continuar a la pasarela"
      max-width="md"
      :close-on-backdrop="!estaCargando"
      @close="cerrarModal"
    >
      <div class="space-y-4">
        <!-- Advertencia si no cumple concepto único -->
        <div
          v-if="!conceptoValido"
          class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800"
        >
          <PhWarningCircle :size="18" class="shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p class="font-semibold m-0">Concepto inconsistente</p>
            <p class="mt-0.5 m-0">
              El pago debe asociarse exactamente a una reserva de cancha o a una
              membresía.
            </p>
          </div>
        </div>

        <!-- Alerta visual si ocurrió un error en la solicitud -->
        <div
          v-if="errorMensaje"
          class="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700"
        >
          <PhWarningCircle :size="18" class="shrink-0 text-red-600 mt-0.5" />
          <div>
            <p class="font-semibold m-0">Problema al iniciar el pago</p>
            <p class="mt-0.5 m-0">{{ errorMensaje }}</p>
          </div>
        </div>

        <!-- Resumen del concepto a pagar -->
        <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <span
              v-if="tipoConcepto === 'cancha'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
            >
              <PhSoccerBall :size="14" weight="bold" />
              {{ tipoEtiqueta }}
            </span>
            <span
              v-else-if="tipoConcepto === 'membresia'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
            >
              <PhIdentificationCard :size="14" weight="bold" />
              {{ tipoEtiqueta }}
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800"
            >
              <PhCreditCard :size="14" weight="bold" />
              {{ tipoEtiqueta }}
            </span>
          </div>

          <h4 class="text-base font-bold text-[#202759] m-0">
            {{ concepto }}
          </h4>
          <p v-if="detalle" class="text-xs text-slate-500 mt-1 m-0">
            {{ detalle }}
          </p>

          <p v-if="emailPagador" class="mt-2 text-xs text-slate-500 m-0">
            <span class="font-medium text-slate-700">Email pagador:</span>
            {{ emailPagador }}
          </p>
        </div>

        <!-- Desglose de importe -->
        <div
          class="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-[#202759]/5 to-transparent border border-[#202759]/10"
        >
          <div>
            <span class="text-xs font-medium text-slate-500 block">
              Total a pagar
            </span>
            <span class="text-xs text-slate-400">Pesos Argentinos</span>
          </div>
          <div class="text-2xl font-black text-[#202759]">
            {{ montoFormateado }}
          </div>
        </div>

        <!-- Garantía de seguridad RNF-02 -->
        <div
          class="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-3 text-xs text-slate-600"
        >
          <PhLockKey
            :size="18"
            class="shrink-0 text-emerald-600 mt-0.5"
            weight="duotone"
          />
          <p class="m-0 leading-relaxed">
            Serás redirigido a MercadoPago, FitZone no almacena datos de tarjeta
            ni credenciales bancarias.
          </p>
        </div>
      </div>

      <!-- Acciones del modal usando BaseButton -->
      <template #actions>
        <BaseButton
          variant="outline"
          size="md"
          :disabled="estaCargando"
          @click="cerrarModal"
        >
          Cancelar
        </BaseButton>

        <BaseButton
          :variant="buttonVariant"
          size="md"
          :disabled="!conceptoValido || estaCargando"
          :loading="estaCargando"
          @click="handleConfirmarPago"
        >
          <template #icon>
            <PhArrowSquareOut :size="18" weight="bold" />
          </template>
          {{ estaCargando ? 'Iniciando...' : 'Confirmar y Pagar' }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
