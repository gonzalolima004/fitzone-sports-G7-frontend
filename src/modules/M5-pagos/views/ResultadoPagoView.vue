<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhCheckCircle,
  PhClock,
  PhXCircle,
  PhCircleNotch,
  PhReceipt,
  PhArrowLeft,
  PhCreditCard,
  PhWarningCircle,
  PhSoccerBall,
  PhArrowClockwise,
  PhMapPin,
  PhCalendarBlank,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import {
  pagosService,
  type PagoDetalleResponse,
} from '../services/pagos.service'

export type EstadoResultado =
  'verificando' | 'aprobado' | 'pendiente' | 'rechazado' | 'no_identificado'

const route = useRoute()
const router = useRouter()

const estado = ref<EstadoResultado>('verificando')
const idPago = ref<number | null>(null)
const conceptoTitulo = ref('')
const conceptoDetalle = ref('')
const monto = ref<number | null>(null)
const pagoDetalle = ref<PagoDetalleResponse | null>(null)

const tipoConcepto = computed(() => pagoDetalle.value?.concepto?.tipo)

const montoFormateado = computed(() => {
  if (monto.value === null) return null
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto.value)
})

function parsearDetalles(detalle?: string) {
  if (!detalle) return []
  if (detalle.includes(' • ')) {
    const [parte1, parte2] = detalle.split(' • ')
    if (parte2 && parte2.includes(' de ')) {
      const badges: Array<{ icono: Component | null; texto: string }> = [
        { icono: PhMapPin, texto: parte1.trim() },
      ]
      const [fecha, horas] = parte2.split(' de ')
      badges.push({ icono: PhCalendarBlank, texto: fecha.trim() })
      badges.push({ icono: PhClock, texto: horas.trim() })
      return badges
    }

    return [
      { icono: PhClock, texto: parte1.trim() },
      { icono: PhCalendarBlank, texto: parte2 ? parte2.trim() : '' },
    ]
  }

  if (detalle.toLowerCase().startsWith('vigencia:')) {
    return [{ icono: PhCalendarBlank, texto: detalle }]
  }

  return [{ icono: null, texto: detalle }]
}

const infoEstado = computed(() => {
  switch (estado.value) {
    case 'aprobado':
      return {
        badge: 'Aprobado',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        titulo: '¡Pago realizado con éxito!',
        descripcion:
          'Tu operación ha sido acreditada y certificada correctamente.',
        icono: PhCheckCircle,
        iconoClass: 'bg-emerald-50 text-emerald-600',
        spin: false,
      }
    case 'pendiente':
      return {
        badge: 'En Proceso',
        badgeClass: 'bg-amber-100 text-amber-800',
        titulo: 'Tu pago está pendiente',
        descripcion:
          'El medio de pago está procesando la transacción. Te informaremos apenas se acredite.',
        icono: PhClock,
        iconoClass: 'bg-amber-50 text-amber-500',
        spin: false,
      }
    case 'rechazado':
      return {
        badge: 'No completado',
        badgeClass: 'bg-red-100 text-red-800',
        titulo: 'No pudimos procesar tu pago',
        descripcion:
          'La transacción fue rechazada o cancelada. Podés intentar nuevamente o con otro medio.',
        icono: PhXCircle,
        iconoClass: 'bg-red-50 text-red-500',
        spin: false,
      }
    case 'no_identificado':
      return {
        badge: 'No identificado',
        badgeClass: 'bg-slate-100 text-slate-700',
        titulo: 'No pudimos identificar el pago',
        descripcion:
          'No encontramos un pago registrado o la referencia no es válida. Podés revisar tus deudas e historial en Pagos.',
        icono: PhWarningCircle,
        iconoClass: 'bg-slate-100 text-slate-600',
        spin: false,
      }
    case 'verificando':
    default:
      return {
        badge: 'Verificando',
        badgeClass: 'bg-slate-100 text-slate-700',
        titulo: 'Verificando tu pago...',
        descripcion:
          'Estamos consultando el estado oficial en nuestros servidores. Aguardá unos instantes.',
        icono: PhCircleNotch,
        iconoClass: 'bg-slate-50 text-[#202759]',
        spin: true,
      }
  }
})

function irAPagos() {
  router.push('/pagos')
}

function irARecurso() {
  if (tipoConcepto.value === 'cancha') {
    router.push('/canchas')
  } else if (tipoConcepto.value === 'membresia') {
    router.push('/perfil')
  } else {
    router.push('/pagos')
  }
}

function descargarComprobante() {
  if (idPago.value) {
    const url = pagosService.getComprobanteUrl(idPago.value)
    window.open(url, '_blank')
  }
}

/**
 * Obtiene el ID numérico del pago:
 * 1. Desde localStorage ('fitzone_pago_pendiente').
 * 2. Fallback desde query params de la URL.
 */
function recuperarIdPago(): number | null {
  try {
    const rawStorage = localStorage.getItem('fitzone_pago_pendiente')
    if (rawStorage) {
      const data = JSON.parse(rawStorage)
      if (data && typeof data.id_pago === 'number') {
        return data.id_pago
      }
    }
  } catch (err) {
    console.warn('No se pudo leer fitzone_pago_pendiente de localStorage:', err)
  }

  const qIdPago = route.query.id_pago || route.query.id
  if (qIdPago && !isNaN(Number(qIdPago))) {
    return Number(qIdPago)
  }

  const qExtRef = route.query.external_reference
  if (qExtRef && !isNaN(Number(qExtRef))) {
    return Number(qExtRef)
  }

  return null
}

/**
 * Consulta el estado real del pago al backend (GET /pagos/:id).
 */
async function verificarPagoReal() {
  estado.value = 'verificando'
  const id = recuperarIdPago()

  if (!id) {
    estado.value = 'no_identificado'
    return
  }

  try {
    const pago = await pagosService.obtenerPagoPorId(id)
    pagoDetalle.value = pago
    idPago.value = pago.id_pago
    monto.value = pago.monto
    conceptoTitulo.value = pago.concepto?.titulo || 'Servicio FitZone'
    conceptoDetalle.value = pago.concepto?.detalle || ''

    const estadoApi = (pago.estado || '').trim().toLowerCase()
    if (estadoApi === 'aprobado') {
      estado.value = 'aprobado'
    } else if (estadoApi === 'rechazado' || estadoApi === 'cancelado') {
      estado.value = 'rechazado'
    } else {
      estado.value = 'pendiente'
    }
  } catch (error) {
    console.error('Error al consultar el estado real del pago:', error)
    estado.value = 'no_identificado'
  } finally {
    localStorage.removeItem('fitzone_pago_pendiente')
  }
}

onMounted(() => {
  verificarPagoReal()
})

defineExpose({
  estado,
  idPago,
  conceptoTitulo,
  conceptoDetalle,
  monto,
  pagoDetalle,
  tipoConcepto,
  irARecurso,
  descargarComprobante,
  verificarPagoReal,
})
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-[#202759] text-white flex items-center justify-center shadow-xs"
        >
          <PhCreditCard :size="22" weight="bold" />
        </div>
        <h1 class="text-2xl font-black text-[#202759] m-0">
          Resultado del Pago
        </h1>
      </div>

      <BaseButton variant="ghost" size="sm" @click="irAPagos">
        <span class="inline-flex items-center gap-1.5 text-slate-600">
          <PhArrowLeft :size="16" weight="bold" />
          Volver a Pagos
        </span>
      </BaseButton>
    </div>

    <!-- Tarjeta de Estado Unificada -->
    <div
      class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-6"
    >
      <!-- Icono de estado -->
      <div class="flex justify-center">
        <div
          class="w-20 h-20 rounded-full flex items-center justify-center shadow-xs"
          :class="infoEstado.iconoClass"
        >
          <component
            :is="infoEstado.icono"
            :size="52"
            :weight="infoEstado.spin ? 'bold' : 'fill'"
            :class="{ 'animate-spin': infoEstado.spin }"
          />
        </div>
      </div>

      <!-- Mensajes de estado -->
      <div>
        <span
          v-if="!infoEstado.spin"
          class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2"
          :class="infoEstado.badgeClass"
        >
          {{ infoEstado.badge }}
        </span>
        <h2 class="text-2xl font-black text-[#202759] m-0">
          {{ infoEstado.titulo }}
        </h2>
        <p class="text-sm text-slate-500 max-w-md mx-auto mt-2 mb-0">
          {{ infoEstado.descripcion }}
        </p>
      </div>

      <!-- Resumen del concepto y monto -->
      <div
        v-if="
          estado !== 'verificando' &&
          estado !== 'no_identificado' &&
          conceptoTitulo
        "
        class="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 text-left space-y-3"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <span
              class="text-xs uppercase font-bold text-slate-400 block tracking-wider"
            >
              Concepto
            </span>
            <span class="text-base font-bold text-[#202759]">
              {{ conceptoTitulo }}
            </span>
            <div
              v-if="conceptoDetalle"
              class="flex items-center gap-2 flex-wrap pt-1.5"
            >
              <span
                v-for="(badge, idx) in parsearDetalles(conceptoDetalle)"
                :key="idx"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-600 border border-slate-200/80 shadow-2xs"
              >
                <component
                  :is="badge.icono"
                  v-if="badge.icono"
                  :size="14"
                  class="text-slate-400 shrink-0"
                />
                {{ badge.texto }}
              </span>
            </div>
          </div>

          <div v-if="montoFormateado" class="text-right">
            <span
              class="text-xs uppercase font-bold text-slate-400 block tracking-wider"
            >
              Total
            </span>
            <span
              class="text-lg font-black"
              :class="
                estado === 'aprobado' ? 'text-emerald-600' : 'text-[#202759]'
              "
            >
              {{ montoFormateado }}
            </span>
          </div>
        </div>

        <div
          v-if="idPago"
          class="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400"
        >
          <span>Identificador de pago:</span>
          <span class="font-mono font-semibold text-slate-600">
            #{{ idPago }}
          </span>
        </div>
      </div>

      <!-- Acciones contextuales con BaseButton -->
      <div
        v-if="estado !== 'verificando'"
        class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
      >
        <!-- Aprobado -->
        <template v-if="estado === 'aprobado'">
          <!-- Redirección contextual según concepto -->
          <BaseButton
            v-if="tipoConcepto === 'cancha'"
            variant="primary"
            size="md"
            class="w-full sm:w-auto"
            @click="irARecurso"
          >
            <span class="inline-flex items-center gap-2">
              <PhSoccerBall :size="18" weight="bold" />
              Ver mis reservas
            </span>
          </BaseButton>

          <!-- Descargar Comprobante PDF oficial (nueva pestaña) -->
          <BaseButton
            variant="secondary"
            size="md"
            class="w-full sm:w-auto"
            @click="descargarComprobante"
          >
            <span class="inline-flex items-center gap-2">
              <PhReceipt :size="18" weight="bold" />
              Descargar comprobante
            </span>
          </BaseButton>

          <BaseButton
            variant="outline"
            size="md"
            class="w-full sm:w-auto"
            @click="irAPagos"
          >
            Volver a Pagos
          </BaseButton>
        </template>

        <!-- Pendiente -->
        <template v-else-if="estado === 'pendiente'">
          <BaseButton
            variant="primary"
            size="md"
            class="w-full sm:w-auto"
            @click="irAPagos"
          >
            Volver a Pagos
          </BaseButton>
        </template>

        <!-- Rechazado -->
        <template v-else-if="estado === 'rechazado'">
          <BaseButton
            variant="secondary"
            size="md"
            class="w-full sm:w-auto"
            @click="irAPagos"
          >
            <span class="inline-flex items-center gap-2">
              <PhArrowClockwise :size="18" weight="bold" />
              Reintentar pago
            </span>
          </BaseButton>

          <BaseButton
            variant="outline"
            size="md"
            class="w-full sm:w-auto"
            @click="irAPagos"
          >
            Volver a Pagos
          </BaseButton>
        </template>

        <!-- No identificado / Error -->
        <template v-else-if="estado === 'no_identificado'">
          <BaseButton
            variant="primary"
            size="md"
            class="w-full sm:w-auto"
            @click="irAPagos"
          >
            Volver a Pagos
          </BaseButton>
        </template>
      </div>
    </div>
  </div>
</template>
