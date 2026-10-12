<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Component } from 'vue'
import {
  PhReceipt,
  PhCheckCircle,
  PhClock,
  PhXCircle,
  PhSoccerBall,
  PhIdentificationCard,
  PhWarningCircle,
  PhCalendarBlank,
  PhMapPin,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import {
  pagosService,
  type PagoDetalleResponse,
} from '../services/pagos.service'

const historial = ref<PagoDetalleResponse[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)

function formatearMonto(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

function formatearFecha(fechaIso: string): string {
  if (!fechaIso) return '-'
  return new Date(fechaIso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

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

function normalizarEstado(
  estado: string
): 'aprobado' | 'pendiente' | 'rechazado' {
  const norm = (estado || '').trim().toLowerCase()
  if (norm === 'aprobado') return 'aprobado'
  if (norm === 'rechazado' || norm === 'cancelado') return 'rechazado'
  return 'pendiente'
}

function descargarComprobante(idPago: number) {
  try {
    const url = pagosService.getComprobanteUrl(idPago)
    const win = window.open(url, '_blank')
    if (!win) {
      toast.warn(
        'Por favor habilitá las ventanas emergentes para ver el comprobante'
      )
    }
  } catch {
    toast.error('No se pudo abrir el comprobante en este momento')
  }
}

async function cargarHistorial() {
  cargando.value = true
  error.value = null
  try {
    historial.value = await pagosService.obtenerMisPagos()
  } catch {
    error.value = 'No pudimos cargar tu historial de pagos. Intentá nuevamente.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarHistorial)

defineExpose({ historial, cargando, error, cargarHistorial })
</script>

<template>
  <div class="space-y-6">
    <!-- Estado de carga: Skeletons -->
    <div v-if="cargando" class="space-y-4" aria-busy="true">
      <div
        v-for="n in 3"
        :key="n"
        class="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60"
      ></div>
    </div>

    <!-- Error al cargar -->
    <div
      v-else-if="error"
      class="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4 text-sm text-red-700"
    >
      <span class="flex items-center gap-2">
        <PhWarningCircle :size="20" class="shrink-0" />
        {{ error }}
      </span>
      <BaseButton variant="danger-outline" size="sm" @click="cargarHistorial">
        Reintentar
      </BaseButton>
    </div>

    <!-- Historial vacío -->
    <div
      v-else-if="historial.length === 0"
      class="p-10 bg-white border border-slate-200/80 rounded-2xl text-center space-y-3"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto"
      >
        <PhReceipt :size="32" weight="bold" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-[#202759] m-0 mb-1">
          Aún no registrás pagos
        </h3>
        <p class="text-sm text-slate-500 max-w-sm mx-auto m-0">
          Todas las operaciones y pagos que realices se registrarán aquí junto
          a sus comprobantes oficiales.
        </p>
      </div>
    </div>

    <!-- Listado del historial -->
    <div v-else class="space-y-4">
      <div
        v-for="pago in historial"
        :key="pago.id_pago"
        class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-md transition-shadow"
      >
        <!-- Información del pago -->
        <div class="space-y-2 flex-1">
          <div class="flex items-center gap-2.5 flex-wrap">
            <!-- Badge de Tipo de Concepto -->
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              :class="
                pago.concepto?.tipo === 'membresia'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              "
            >
              <PhIdentificationCard
                v-if="pago.concepto?.tipo === 'membresia'"
                :size="14"
                weight="bold"
              />
              <PhSoccerBall v-else :size="14" weight="bold" />
              {{
                pago.concepto?.tipo === 'membresia'
                  ? 'Membresía'
                  : 'Reserva de Cancha'
              }}
            </span>

            <!-- Badge de Estado de Pago -->
            <span
              v-if="normalizarEstado(pago.estado) === 'aprobado'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <PhCheckCircle :size="14" weight="fill" />
              Aprobado
            </span>
            <span
              v-else-if="normalizarEstado(pago.estado) === 'pendiente'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"
            >
              <PhClock :size="14" weight="fill" />
              Pendiente
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200"
            >
              <PhXCircle :size="14" weight="fill" />
              Rechazado
            </span>

            <!-- Fecha del pago -->
            <span
              class="inline-flex items-center gap-1 text-xs text-slate-400 font-medium"
            >
              <PhCalendarBlank :size="14" />
              {{ formatearFecha(pago.fecha_pago) }}
            </span>
          </div>

          <div>
            <h4 class="text-base font-bold text-[#202759] m-0">
              {{ pago.concepto?.titulo || 'Servicio FitZone' }}
            </h4>
            <div
              v-if="pago.concepto?.detalle"
              class="flex items-center gap-2 flex-wrap pt-1"
            >
              <span
                v-for="(badge, idx) in parsearDetalles(pago.concepto.detalle)"
                :key="idx"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80"
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
        </div>

        <!-- Monto y Acción de Comprobante -->
        <div
          class="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100"
        >
          <div class="text-left md:text-right">
            <span
              class="text-xs uppercase font-bold text-slate-400 block tracking-wider"
            >
              Total
            </span>
            <span class="text-xl font-black text-[#202759]">
              {{ formatearMonto(pago.monto) }}
            </span>
          </div>

          <!-- Botón de comprobante (solo disponible para pagos aprobados) -->
          <BaseButton
            v-if="normalizarEstado(pago.estado) === 'aprobado'"
            variant="outline"
            size="sm"
            @click="descargarComprobante(pago.id_pago)"
          >
            <span class="inline-flex items-center gap-1.5">
              <PhReceipt :size="16" weight="bold" />
              Comprobante
            </span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
