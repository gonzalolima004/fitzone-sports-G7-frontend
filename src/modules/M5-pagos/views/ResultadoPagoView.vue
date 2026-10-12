<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhCheckCircle,
  PhClock,
  PhXCircle,
  PhCircleNotch,
  PhReceipt,
  PhArrowLeft,
  PhCreditCard,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'

export type EstadoResultado =
  | 'verificando'
  | 'aprobado'
  | 'pendiente'
  | 'rechazado'

const router = useRouter()

const estado = ref<EstadoResultado>('verificando')
const idPago = ref<number | null>(null)
const conceptoTitulo = ref('Pago FitZone')
const conceptoDetalle = ref('Servicio deportivo')
const monto = ref<number | null>(null)

const montoFormateado = computed(() => {
  if (monto.value === null) return null
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(monto.value)
})

const infoEstado = computed(() => {
  switch (estado.value) {
    case 'aprobado':
      return {
        badge: 'Aprobado',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        titulo: '¡Pago realizado con éxito!',
        descripcion: 'Tu operación ha sido acreditada correctamente.',
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

defineExpose({ estado, idPago, conceptoTitulo, conceptoDetalle, monto })
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

      <!-- Resumen del pago (cuando no está en verificación inicial) -->
      <div
        v-if="estado !== 'verificando'"
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
            <p v-if="conceptoDetalle" class="text-xs text-slate-500 m-0 mt-0.5">
              {{ conceptoDetalle }}
            </p>
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
          <span>Identificador:</span>
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
          <BaseButton
            variant="primary"
            size="md"
            class="w-full sm:w-auto"
            @click="irAPagos"
          >
            <span class="inline-flex items-center gap-2">
              <PhReceipt :size="18" weight="bold" />
              Ver Comprobante
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
            Ir a mis pagos
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
            Intentar nuevamente
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
      </div>
    </div>
  </div>
</template>
