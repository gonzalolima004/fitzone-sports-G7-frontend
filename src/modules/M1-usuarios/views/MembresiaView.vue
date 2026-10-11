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

    // Obtenemos el ID del usuario desde Pinia (ajusta 'id_usuario' según tu store)
    const userId = authStore.usuario?.id

    if (!userId) {
      throw new Error('Usuario no identificado')
    }

    const [planesData, estadoData] = (await Promise.all([
      membresiasService.getPlanes(),
      membresiasService.verificarEstado(userId),
    ])) as unknown as [PlanMembresia[], EstadoMembresia]

    // Mapeamos los planes para asegurar que tengan descripción para la UI
    planes.value = planesData.map((p) => ({
      ...p,
      descripcion:
        p.descripcion ||
        'Acceso ilimitado a 25+ sedes|Clases grupales incluidas|15% off en Canchas|Credencial QR dinámica',
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

  // Gestión del retorno desde el Checkout de Mercado Pago
  if (route.query.status || route.query.payment_id) {
    // Limpiamos la URL para que no quede sucia
    router.replace({ path: route.path })

    // Evaluamos el estado real devuelto por nuestro backend
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

const abrirCheckout = (planId: number) => {
  planSeleccionado.value = planes.value.find((p) => p.id === planId) || null
  if (planSeleccionado.value) {
    modalAbierto.value = true
  }
}

const confirmarPago = async (planId: number) => {
  isProcessingPayment.value = true
  try {
    // Estructura adaptada al IniciarPagoDto del backend
    const payload = {
      id_membresia: planId,
      monto: planSeleccionado.value?.precio ?? 0,
      email_pagador: authStore.usuario?.email || 'test@fitzone.com',
      titulo: `Suscripción - ${planSeleccionado.value?.nombre ?? ''}`,
    }

    const response = (await pagosService.iniciarPago(payload)) as {
      initPoint?: string
      sandboxInitPoint?: string
    }

    // Redirección al initPoint de Mercado Pago
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
  // Ajusta la zona horaria para evitar desfases de 1 día
  const date = new Date(fechaStr)
  return new Date(
    date.getTime() + date.getTimezoneOffset() * 60000
  ).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Computed properties para la UI
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

// Determinación visual del "Más elegido" basado en la duración (Ej. 90 días = Trimestral)
const isPopularPlan = (plan: PlanMembresia) => plan.duracion_dias === 90
</script>

<template>
  <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans animate-fade-in">
    <!-- Skeleton Loading -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="w-12 h-12 border-4 border-[#202759]/20 border-t-[#F96167] rounded-full animate-spin mb-4"
      ></div>
      <p class="text-slate-500 font-medium tracking-wide text-sm">
        Cargando estado de membresía...
      </p>
    </div>

    <template v-else>
      <!-- Cabecera -->
      <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8"
      >
        <div class="flex items-center gap-3">
          <PhMedal :size="32" weight="duotone" class="text-[#4285F4]" />
          <h1 class="text-2xl font-bold text-[#202759] m-0">
            Planes y Estado de Suscripción
          </h1>
        </div>

        <div class="flex items-center flex-wrap gap-3">
          <span
            class="px-3 py-1 text-[11px] font-bold tracking-wide rounded-full border bg-white text-slate-600 shadow-sm"
          >
            Cobertura: 25+ Sucursales
          </span>
          <span
            class="px-3 py-1 text-[11px] font-bold tracking-wide rounded-full border uppercase shadow-sm"
            :class="estadoConfig.class"
          >
            ESTADO: {{ estadoConfig.text }}
          </span>
        </div>
      </header>

      <!-- Panel de Vencimiento / Mora -->
      <div
        v-if="miEstado?.enMora"
        class="bg-red-50 border-l-4 border-[#F96167] p-5 rounded-r-xl shadow-sm mb-10"
      >
        <div class="flex items-start gap-4">
          <PhWarningCircle
            :size="28"
            weight="duotone"
            class="text-[#F96167] shrink-0 mt-0.5"
          />
          <div>
            <h3 class="text-red-800 font-bold text-base">
              Atención: Membresía Vencida
            </h3>
            <p class="text-red-700 text-sm mt-1 leading-relaxed">
              Tu plan actual finalizó el
              <strong>{{
                formatFecha(miEstado?.fechaVencimiento ?? null)
              }}</strong
              >. <br />
              Actualmente
              <strong>no tienes acceso para reservar clases grupales</strong> y
              la tarifa de alquiler de canchas se cobrará como Cliente Externo
              sin descuento.
            </p>
            <p class="text-red-700 font-semibold text-sm mt-2">
              Renueva tu plan a continuación para recuperar tus beneficios de
              socio.
            </p>
          </div>
        </div>
      </div>

      <!-- Sección de Planes -->
      <div class="text-center mb-10">
        <h2 class="text-3xl font-extrabold text-[#202759] mb-3">
          Elegí tu Plan FitZone
        </h2>
        <p class="text-slate-500 max-w-2xl mx-auto">
          Todos nuestros planes incluyen libre acceso a musculación en todas las
          sedes, reserva de clases grupales y 15% de descuento exclusivo en
          alquiler de canchas deportivas.
        </p>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6 xl:gap-8 max-w-6xl mx-auto"
      >
        <PlanCard
          v-for="plan in planes"
          :key="plan.id"
          :plan="plan"
          :is-current="miEstado?.planNombre === plan.nombre"
          :is-popular="isPopularPlan(plan)"
          :is-loading="isProcessingPayment && planSeleccionado?.id === plan.id"
          @subscribe="abrirCheckout"
        />
      </div>

      <!-- Footer Informativo -->
      <div
        class="mt-12 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-center sm:items-start gap-4"
      >
        <div class="bg-blue-100 p-2 rounded-full shrink-0">
          <PhShieldCheck :size="24" weight="duotone" class="text-blue-600" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-[#202759]">
            Seguridad de Datos y Tokenización
          </h4>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            FitZone Sports no almacena datos sensibles de tarjetas de crédito o
            débito en sus bases de datos locales. La transacción se procesa
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
    </template>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
