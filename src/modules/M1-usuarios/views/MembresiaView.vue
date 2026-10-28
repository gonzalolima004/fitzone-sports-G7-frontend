<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { PhMedal, PhWarningCircle, PhShieldCheck } from '@phosphor-icons/vue'

import PlanCard from '../components/PlanCard.vue'
import CheckoutModal from '../../M5-pagos/components/CheckoutModal.vue'
import {
  membresiasService,
  type PlanMembresia,
  type EstadoMembresia,
} from '../services/membresias.service'
import { pagosService } from '../../M5-pagos/services/pagos.service'
import { toast } from '@/common/utils/toast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const isProcessingPayment = ref(false)
const modalAbierto = ref(false)

const planes = ref<PlanMembresia[]>([])
const miEstado = ref<EstadoMembresia | null>(null)
const planSeleccionado = ref<PlanMembresia | null>(null)

const fetchDatos = async () => {
  try {
    isLoading.value = true
    const userId = authStore.usuario?.id

    if (!userId) throw new Error('Usuario no identificado')

    const [planesData, estadoData] = (await Promise.all([
      membresiasService.getPlanes(),
      membresiasService.verificarEstado(userId),
    ])) as unknown as [PlanMembresia[], EstadoMembresia]

    const BENEFICIOS_PLAN =
      'Acceso libre ilimitado a musculación y cardio|Acceso a todas las clases grupales sin límite|Acreditación digital instantánea por QR|15% de descuento en alquiler de canchas|Sin costos de matrícula ni inscripción'

    planes.value = planesData.map((p) => ({
      ...p,
      descripcion: BENEFICIOS_PLAN,
    }))

    miEstado.value = estadoData
  } catch {
    toast.error('Ocurrió un error al cargar la información de la membresía.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchDatos()

  if (route.query.status || route.query.payment_id) {
    router.replace({ path: route.path })

    if (miEstado.value?.esSocioActivo) {
      toast.success('¡Tu membresía ha sido activada exitosamente!')
    } else if (miEstado.value?.enMora) {
      toast.error('El pago no pudo procesarse. Tu membresía sigue vencida.')
    } else {
      toast.info(
        'Tu pago está siendo procesado. Se actualizará en unos minutos.'
      )
    }
  }
})

const abrirCheckout = (planRecibido: PlanMembresia) => {
  planSeleccionado.value = planRecibido
  modalAbierto.value = true
}

const confirmarPago = async (_planId?: number, renovacionAutomatica = true) => {
  isProcessingPayment.value = true
  try {
    const payload = {
      id_membresia_plan: planSeleccionado.value?.id,
      monto: planSeleccionado.value?.precio ?? 0,
      renovacion_automatica: renovacionAutomatica,
      email_pagador: authStore.usuario?.email || 'test@fitzone.com',
      titulo: `Suscripción - ${planSeleccionado.value?.nombre ?? ''}`,
    }

    const response = (await pagosService.iniciarPago(payload)) as {
      initPoint?: string
      sandboxInitPoint?: string
    }

    if (response?.initPoint || response?.sandboxInitPoint) {
      window.location.href = (response.initPoint ||
        response.sandboxInitPoint) as string
    }
  } catch {
    toast.error('No se pudo iniciar el proceso de pago. Inténtalo nuevamente.')
  } finally {
    isProcessingPayment.value = false
    modalAbierto.value = false
  }
}

const formatFecha = (fechaStr: string | null) => {
  if (!fechaStr) return '-'
  const date = new Date(fechaStr)
  return new Date(
    date.getTime() + date.getTimezoneOffset() * 60000
  ).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const estadoConfig = computed(() => {
  if (!miEstado.value)
    return {
      class: 'bg-slate-100 text-slate-600 border-slate-200',
      text: 'CARGANDO...',
    }

  if (miEstado.value.esSocioActivo) {
    return {
      class: 'bg-green-100 text-green-700 border-green-200',
      text: 'ACTIVA',
    }
  } else if (miEstado.value.enMora) {
    return { class: 'bg-red-100 text-red-700 border-red-200', text: 'VENCIDA' }
  } else {
    return {
      class: 'bg-slate-100 text-slate-600 border-slate-200',
      text: 'SIN SUSCRIPCIÓN',
    }
  }
})

const isPopularPlan = (plan: PlanMembresia) => plan.duracion_dias === 90
</script>

<template>
  <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden">
    <!-- Skeleton Loading -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="w-12 h-12 border-4 border-[#202759]/20 border-t-[#F96167] rounded-full animate-spin mb-4"
      ></div>
      <p class="text-slate-500 font-medium tracking-wide text-sm text-center">
        Cargando estado de membresía...
      </p>
    </div>

    <Transition
      v-else
      appear
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div>
        <!-- Cabecera -->
        <header
          class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8"
        >
          <div class="flex items-center gap-3">
            <PhMedal
              :size="32"
              weight="duotone"
              class="text-[#4285F4] shrink-0"
            />
            <h1 class="text-xl sm:text-2xl font-bold text-[#202759] m-0">
              Planes y Estado de Suscripción
            </h1>
          </div>

          <div class="flex items-center flex-wrap gap-2 sm:gap-3">
            <span
              class="px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wide rounded-full border bg-white text-slate-600 shadow-sm whitespace-nowrap"
            >
              Cobertura: 25+ Sucursales
            </span>
            <span
              class="px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wide rounded-full border uppercase shadow-sm whitespace-nowrap"
              :class="estadoConfig.class"
            >
              ESTADO: {{ estadoConfig.text }}
            </span>
          </div>
        </header>

        <!-- Panel de Vencimiento / Mora -->
        <div
          v-if="miEstado?.enMora"
          class="bg-red-50 border-l-4 border-[#F96167] p-4 sm:p-5 rounded-r-xl shadow-sm mb-8 sm:mb-10"
        >
          <div class="flex items-start gap-3 sm:gap-4">
            <PhWarningCircle
              :size="24"
              weight="duotone"
              class="text-[#F96167] shrink-0 sm:h-7 sm:w-7 mt-0.5"
            />
            <div>
              <h3 class="text-red-800 font-bold text-sm sm:text-base">
                Atención: Membresía Vencida
              </h3>
              <p class="text-red-700 text-xs sm:text-sm mt-1 leading-relaxed">
                Tu plan actual finalizó el
                <strong>{{
                  formatFecha(miEstado?.fechaVencimiento ?? null)
                }}</strong
                >. <br class="hidden sm:block" />
                Actualmente
                <strong>no tienes acceso para reservar clases grupales</strong>
                y la tarifa de alquiler de canchas se cobrará como Cliente
                Externo sin descuento.
              </p>
              <p class="text-red-700 font-semibold text-xs sm:text-sm mt-2">
                Renueva tu plan a continuación para recuperar tus beneficios de
                socio.
              </p>
            </div>
          </div>
        </div>

        <!-- Sección de Planes -->
        <div class="text-center px-2 mb-8 sm:mb-10">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#202759] mb-3">
            Elegí tu Plan FitZone
          </h2>
          <p
            class="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Todos nuestros planes incluyen libre acceso a musculación en todas
            las sedes, reserva de clases grupales y 15% de descuento exclusivo
            en alquiler de canchas deportivas.
          </p>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6 xl:gap-8 max-w-6xl mx-auto"
        >
          <PlanCard
            v-for="plan in planes"
            :key="plan.id"
            :plan="plan"
            :is-current="miEstado?.nombre_plan === plan.nombre"
            :is-popular="isPopularPlan(plan)"
            :is-loading="
              isProcessingPayment && planSeleccionado?.id === plan.id
            "
            @subscribe="abrirCheckout"
          />
        </div>

        <!-- Footer Informativo -->
        <div
          class="mt-10 sm:mt-12 bg-blue-50/50 border border-blue-100 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4"
        >
          <div class="bg-blue-100 p-2 rounded-full shrink-0">
            <PhShieldCheck :size="24" weight="duotone" class="text-blue-600" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-[#202759]">
              Seguridad de Datos y Tokenización
            </h4>
            <p class="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              FitZone Sports no almacena datos sensibles de tarjetas de crédito
              o débito en sus bases de datos locales. La transacción se procesa
              directamente mediante el checkout seguro oficial de la pasarela de
              pagos.
            </p>
          </div>
        </div>

        <!-- Modal de Checkout -->
        <CheckoutModal
          v-if="planSeleccionado"
          v-model="modalAbierto"
          :plan="planSeleccionado"
          :is-loading="isProcessingPayment"
          @confirmar="confirmarPago"
        />
      </div>
    </Transition>
  </div>
</template>
