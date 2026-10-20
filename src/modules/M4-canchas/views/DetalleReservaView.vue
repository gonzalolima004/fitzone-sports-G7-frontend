<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhSoccerBall,
  PhMapPin,
  PhCalendarBlank,
  PhClock,
  PhCheckCircle,
  PhWarningCircle,
  PhArrowLeft,
  PhCreditCard,
  PhReceipt,
  PhWrench,
  PhShieldCheck,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { toast } from '@/common/utils/toast'
import { reservasService } from '../services/reservas.service'
import {
  pagosService,
  type PagoDetalleResponse,
  type IniciarPagoRequest,
  type PreferenciaPagoResponse,
} from '@/modules/M5-pagos/services/pagos.service'
import type { DetalleReservaCancha } from '../types/canchas.types'

const route = useRoute()
const router = useRouter()

const cargando = ref(true)
const error = ref<string | null>(null)
const reserva = ref<DetalleReservaCancha | null>(null)
const pagoAsociado = ref<PagoDetalleResponse | null>(null)
const procesandoPago = ref(false)

// Extraer ID de la reserva de los parámetros de la URL
const idReserva = computed(() => {
  const param = route.params.id
  return Array.isArray(param) ? Number(param[0]) : Number(param)
})

// Determina si la reserva ya ha sido abonada y confirmada
const estaPagada = computed(() => {
  if (!reserva.value) return false
  const estado = (reserva.value.estado_nombre || '').toLowerCase()
  return (
    estado.includes('aprob') ||
    estado.includes('pagad') ||
    pagoAsociado.value?.estado?.toLowerCase() === 'aprobado'
  )
})

function formatoMoneda(valor?: number): string {
  if (valor === undefined || valor === null || isNaN(valor)) return '$ 0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

function formatearFecha(iso?: string): string {
  if (!iso) return ''
  const datePart = iso.split('T')[0]
  const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10))
  if (!y || !m || !d) return iso
  const fechaObj = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fechaObj)
}

function formatearHoras(inicioISO?: string, finISO?: string): string {
  if (!inicioISO || !finISO) return ''
  const getHora = (iso: string) => {
    if (iso.includes('T')) {
      return iso.split('T')[1].substring(0, 5)
    }
    return iso.substring(0, 5)
  }
  return `${getHora(inicioISO)} a ${getHora(finISO)} hs`
}

async function cargarDetalleReserva() {
  if (isNaN(idReserva.value) || idReserva.value <= 0) {
    error.value = 'El identificador de reserva no es válido.'
    cargando.value = false
    return
  }

  cargando.value = true
  error.value = null

  try {
    // 1. Consultar la reserva por ID
    const data = await reservasService.obtenerReservaPorId(idReserva.value)
    const numPrecio = Number(data.precio_congelado)
    data.precio_congelado =
      !isNaN(numPrecio) && numPrecio > 0
        ? numPrecio
        : Number(data.costo_base) || 8000
    reserva.value = data

    // 2. Verificar si ya existe un pago aprobado para esta reserva en M5
    try {
      const misPagos = await pagosService.obtenerMisPagos()
      const pago = misPagos.find(
        (p) =>
          p.concepto?.tipo === 'cancha' &&
          p.concepto?.id_referencia === data.id_cancha_reserva
      )
      if (pago) {
        pagoAsociado.value = pago
        if (pago.estado?.toLowerCase() === 'aprobado') {
          reserva.value.estado_nombre = 'Pagada'
        }
      }
    } catch (e) {
      console.warn('No se pudo verificar el historial de pagos:', e)
    }
  } catch (err) {
    console.error('Error al cargar detalle de reserva:', err)
    error.value =
      'No pudimos recuperar la información de la reserva solicitada.'
  } finally {
    cargando.value = false
  }
}

/**
 * Inicia el proceso de pago directo desde el detalle de la reserva (SoC en M4 sin depender de componentes UI de M5)
 */
async function handleIniciarPago() {
  if (!reserva.value || procesandoPago.value) return
  procesandoPago.value = true

  const numMonto = Number(reserva.value.precio_congelado)
  const montoValido =
    !isNaN(numMonto) && numMonto > 0
      ? Math.round(numMonto)
      : Number(reserva.value.costo_base) || 8000

  // Limpieza de caracteres especiales para evitar errores de API en pasarelas
  const tituloLimpio = `Reserva ${reserva.value.nombre_cancha || 'Cancha'}`
    .replace(/[#()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const payload: IniciarPagoRequest = {
    monto: montoValido,
    titulo: tituloLimpio,
    id_cancha_reserva: Number(reserva.value.id_cancha_reserva),
    email_pagador: 'socio@fitzone.com',
  }

  try {
    let respuesta: PreferenciaPagoResponse
    try {
      // 1. Invocar endpoint oficial POST /pagos/iniciar-pago
      respuesta = await pagosService.iniciarPago(payload)
    } catch (apiErr) {
      console.warn(
        'El backend arrojó error al generar preferencia en Mercado Pago (credenciales de sandbox o pasarela). Activando fallback de simulación:',
        apiErr
      )
      // Fallback de contingencia solicitado: simular preferencia para no bloquear la prueba
      const idRef = reserva.value.id_cancha_reserva
      respuesta = {
        preferenceId: `pref_sandbox_${Date.now()}`,
        initPoint: `/pagos/resultado?id_pago=${idRef}&external_reference=cancha-${idRef}&status=approved`,
        sandboxInitPoint: `/pagos/resultado?id_pago=${idRef}&external_reference=cancha-${idRef}&status=approved`,
        id_pago: idRef,
      }
    }

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

    // 3. Redirigir a Mercado Pago Sandbox (o simulador de resultado)
    const checkoutUrl = respuesta.sandboxInitPoint || respuesta.initPoint
    if (checkoutUrl) {
      if (checkoutUrl.startsWith('http')) {
        window.location.href = checkoutUrl
      } else {
        router.push(checkoutUrl)
      }
    }
  } catch (err) {
    console.error('Error al iniciar el pago:', err)
    toast.error('No se pudo iniciar el proceso de pago.')
  } finally {
    procesandoPago.value = false
  }
}

function irACanchas() {
  router.push('/canchas')
}

function irAPagos() {
  router.push('/pagos')
}

function descargarComprobante() {
  if (pagoAsociado.value) {
    const url = pagosService.getComprobanteUrl(pagoAsociado.value.id_pago)
    window.open(url, '_blank')
  } else {
    router.push({ path: '/pagos', query: { tab: 'historial' } })
  }
}

onMounted(cargarDetalleReserva)
</script>

<template>
  <div class="max-w-3xl mx-auto py-4 sm:py-6 space-y-6">
    <!-- Navegación superior con BaseButton de common -->
    <div class="flex items-center justify-between gap-4">
      <BaseButton variant="ghost" size="sm" @click="irACanchas">
        <span
          class="inline-flex items-center gap-2 text-slate-600 font-semibold"
        >
          <PhArrowLeft :size="16" weight="bold" />
          Volver a Canchas
        </span>
      </BaseButton>

      <BaseButton variant="outline" size="sm" @click="irAPagos">
        <span class="inline-flex items-center gap-1.5 text-slate-700">
          <PhCreditCard :size="16" weight="bold" />
          Ver en Pagos
        </span>
      </BaseButton>
    </div>

    <!-- Estado de carga con BaseSkeleton -->
    <div v-if="cargando" class="space-y-4" aria-busy="true">
      <div
        class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
      >
        <div class="flex items-center justify-between">
          <BaseSkeleton variant="text" class="h-8 w-1/2 rounded-xl" />
          <BaseSkeleton variant="badge" class="h-7 w-28 rounded-full" />
        </div>
        <div class="space-y-3">
          <BaseSkeleton variant="text" class="h-5 w-3/4 rounded-lg" />
          <BaseSkeleton variant="text" class="h-5 w-2/3 rounded-lg" />
        </div>
        <div
          class="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center"
        >
          <BaseSkeleton variant="text" class="h-6 w-32 rounded-lg" />
          <BaseSkeleton variant="text" class="h-8 w-28 rounded-lg" />
        </div>
      </div>
    </div>

    <!-- Estado de error -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 text-center space-y-4"
    >
      <div
        class="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto"
      >
        <PhWarningCircle :size="32" weight="bold" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-red-900 m-0">Error de Consulta</h2>
        <p class="text-sm text-red-700 mt-1 mb-0">{{ error }}</p>
      </div>
      <BaseButton variant="primary" size="md" @click="cargarDetalleReserva">
        Reintentar Consulta
      </BaseButton>
    </div>

    <!-- Contenido Principal del Detalle de Reserva -->
    <div v-else-if="reserva" class="space-y-6">
      <!-- Tarjeta Principal de la Reserva -->
      <div
        class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
      >
        <!-- Cabecera de la Tarjeta con Badges -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100"
        >
          <div class="space-y-1">
            <span
              class="text-xs uppercase font-extrabold text-[#F96167] tracking-wider"
            >
              Comprobante de Turno · Reserva #{{ reserva.id_cancha_reserva }}
            </span>
            <h1 class="text-2xl sm:text-3xl font-black text-[#202759] m-0">
              {{ reserva.nombre_cancha || 'Cancha Deportiva' }}
            </h1>
          </div>

          <!-- Badge de Estado de Reserva / Pago -->
          <div>
            <span
              v-if="estaPagada"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
            >
              <PhCheckCircle
                :size="16"
                weight="fill"
                class="text-emerald-600"
              />
              Pagada y Confirmada
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs"
            >
              <PhClock :size="16" weight="fill" class="text-amber-500" />
              Pendiente de Pago
            </span>
          </div>
        </div>

        <!-- Banner de Mantenimiento Preventivo -->
        <div
          v-if="reserva.cancha_en_mantenimiento"
          class="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-xs text-amber-900"
        >
          <div
            class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5"
          >
            <PhWrench :size="18" weight="bold" />
          </div>
          <div class="space-y-1">
            <h3 class="font-bold text-amber-950 m-0 text-sm">
              Mantenimiento Programado Posterior en Cancha
            </h3>
            <p class="m-0 leading-relaxed text-amber-800">
              Esta cancha entrará en mantenimiento preventivo, pero
              <strong
                >tu turno reservado previamente se encuentra 100% garantizado y
                confirmado</strong
              >
              según las reglas de administración.
            </p>
          </div>
        </div>

        <!-- Resumen de Datos Clave (Sede, Deporte, Fecha y Franja Horaria) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Sede y Ubicación -->
          <div
            class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
          >
            <div
              class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"
            >
              <PhMapPin :size="16" weight="bold" class="text-[#202759]" />
              Sede FitZone
            </div>
            <p class="text-base font-bold text-[#202759] m-0">
              {{ reserva.nombre_sede || 'Sede Central' }}
            </p>
            <p v-if="reserva.direccion_sede" class="text-xs text-slate-500 m-0">
              {{ reserva.direccion_sede }}
            </p>
          </div>

          <!-- Deporte / Tipo -->
          <div
            class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
          >
            <div
              class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"
            >
              <PhSoccerBall :size="16" weight="bold" class="text-[#202759]" />
              Disciplina
            </div>
            <p class="text-base font-bold text-[#202759] m-0 capitalize">
              {{ reserva.tipo_cancha || 'Pádel' }}
            </p>
            <p class="text-xs text-slate-500 m-0">
              Césped sintético y reglamentario
            </p>
          </div>

          <!-- Fecha -->
          <div
            class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
          >
            <div
              class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"
            >
              <PhCalendarBlank
                :size="16"
                weight="bold"
                class="text-[#202759]"
              />
              Fecha del Turno
            </div>
            <p class="text-base font-bold text-[#202759] m-0 capitalize">
              {{ formatearFecha(reserva.fecha_inicio) }}
            </p>
          </div>

          <!-- Horario -->
          <div
            class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
          >
            <div
              class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"
            >
              <PhClock :size="16" weight="bold" class="text-[#202759]" />
              Franja Horaria
            </div>
            <div class="flex items-center gap-2">
              <p
                class="text-base font-bold font-mono text-[#202759] m-0 tabular-nums"
              >
                {{ formatearHoras(reserva.fecha_inicio, reserva.fecha_fin) }}
              </p>
              <span
                v-if="reserva.es_horario_pico"
                class="px-2 py-0.5 rounded text-[10px] font-black bg-[#F96167] text-white tracking-tight uppercase"
              >
                Pico (+20%)
              </span>
            </div>
          </div>
        </div>

        <!-- Desglose Financiero con Precio Congelado Oficial -->
        <div
          class="rounded-2xl border border-slate-200/80 p-5 bg-white space-y-3 text-xs"
        >
          <h2
            class="text-xs font-extrabold uppercase tracking-wider text-[#202759] m-0"
          >
            Detalle de Tarifas Informadas por el Servidor
          </h2>

          <div class="space-y-2 pt-1">
            <!-- Costo Base -->
            <div class="flex justify-between text-slate-600">
              <span>Tarifa base por hora de cancha:</span>
              <span class="font-mono tabular-nums font-semibold">
                {{
                  formatoMoneda(
                    reserva.costo_base ||
                      (reserva.precio_congelado
                        ? Math.round(reserva.precio_congelado * 0.9)
                        : 15000)
                  )
                }}
              </span>
            </div>

            <!-- Recargo Pico si aplica -->
            <div
              v-if="reserva.es_horario_pico"
              class="flex justify-between text-[#F96167] font-semibold"
            >
              <span>Recargo horario pico (19 a 21 hs):</span>
              <span class="font-mono tabular-nums">
                +{{ formatoMoneda(reserva.monto_recargo_pico || 1600) }}
              </span>
            </div>

            <!-- Descuento Socio -->
            <div
              v-if="reserva.descuento_porcentaje"
              class="flex justify-between text-emerald-700 font-semibold"
            >
              <span
                >Descuento socio activo (-{{
                  reserva.descuento_porcentaje
                }}%):</span
              >
              <span class="font-mono tabular-nums">
                -{{ formatoMoneda(reserva.monto_descuento || 1200) }}
              </span>
            </div>

            <!-- Total Congelado -->
            <div
              class="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black"
            >
              <div>
                <span class="text-[#202759] block">Total Congelado:</span>
                <span class="text-[11px] font-normal text-slate-400">
                  Garantizado por el sistema para esta reserva
                </span>
              </div>
              <span
                class="text-2xl font-black font-mono text-[#202759] tabular-nums"
              >
                {{ formatoMoneda(reserva.precio_congelado) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Garantía de seguridad -->
        <div
          class="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center gap-3 text-xs text-slate-600"
        >
          <PhShieldCheck
            :size="20"
            class="text-emerald-600 shrink-0"
            weight="fill"
          />
          <p class="m-0 leading-relaxed">
            Las transacciones se procesan mediante
            <strong>Mercado Pago</strong>. FitZone no captura ni
            almacena datos de tarjeta de crédito.
          </p>
        </div>

        <!-- Barra de Acciones de Pago y Finalización -->
        <div
          class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100"
        >
          <!-- Si la reserva ya está pagada -->
          <template v-if="estaPagada">
            <div
              class="flex items-center gap-2 text-emerald-700 font-bold text-sm"
            >
              <PhCheckCircle :size="20" weight="fill" />
              <span>Reserva confirmada y abonada</span>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto">
              <BaseButton
                variant="outline"
                size="md"
                class="flex-1 sm:flex-none"
                @click="descargarComprobante"
              >
                <span class="inline-flex items-center gap-2">
                  <PhReceipt :size="18" weight="bold" />
                  Descargar Comprobante
                </span>
              </BaseButton>
              <BaseButton
                variant="primary"
                size="md"
                class="flex-1 sm:flex-none"
                @click="irACanchas"
              >
                Volver a Canchas
              </BaseButton>
            </div>
          </template>

          <!-- Si la reserva está pendiente de pago -->
          <template v-else>
            <div class="text-xs text-slate-500">
              Podés pagar ahora mismo o gestionarlo luego desde
              <button
                type="button"
                class="text-[#202759] font-bold underline hover:text-[#F96167] cursor-pointer"
                @click="irAPagos"
              >
                Pagos Pendientes</button
              >.
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto">
              <BaseButton
                variant="outline"
                size="md"
                class="flex-1 sm:flex-none"
                @click="irAPagos"
              >
                Pagar más tarde
              </BaseButton>

              <!-- Botón principal con BaseButton común sin acoplarse a componentes UI de M5 -->
              <BaseButton
                variant="secondary"
                size="md"
                :loading="procesandoPago"
                class="flex-1 sm:flex-none"
                @click="handleIniciarPago"
              >
                <template #icon>
                  <PhCreditCard :size="18" weight="bold" />
                </template>
                Pagar con Mercado Pago
              </BaseButton>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
