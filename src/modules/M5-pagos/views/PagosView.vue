<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhCreditCard,
  PhCheckCircle,
  PhWarningCircle,
  PhClockCounterClockwise,
  PhArrowLeft,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import PagoPendienteCard from '../components/PagoPendienteCard.vue'
import HistorialPagos from '../components/HistorialPagos.vue'
import { pagosService, type PagoPendiente } from '../services/pagos.service'

const route = useRoute()

// Vista activa: 'pendientes' (por defecto) o 'historial'
const vistaActual = ref<'pendientes' | 'historial'>(
  route.query.tab === 'historial' ? 'historial' : 'pendientes'
)

const pendientes = ref<PagoPendiente[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)

const membresias = computed(() =>
  pendientes.value.filter((p) => p.tipo === 'membresia')
)
const reservas = computed(() =>
  pendientes.value.filter((p) => p.tipo === 'cancha')
)

async function cargarPendientes() {
  cargando.value = true
  error.value = null
  try {
    pendientes.value = await pagosService.obtenerPendientes()
  } catch {
    error.value = 'No pudimos cargar tus pagos pendientes. Intentá nuevamente.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarPendientes)
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto py-4">
    <!-- Encabezado del módulo con botón de acceso al historial -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-[#202759] text-white flex items-center justify-center shadow-xs"
        >
          <PhCreditCard :size="22" weight="bold" />
        </div>
        <div>
          <h1 class="text-2xl font-black text-[#202759] m-0">
            Pagos y Facturación
          </h1>
          <p class="text-xs text-slate-500 m-0 mt-0.5">
            {{
              vistaActual === 'pendientes'
                ? 'Gestioná tus pagos pendientes y deudas'
                : 'Consultá tu historial de pagos y comprobantes oficiales'
            }}
          </p>
        </div>
      </div>

      <!-- Botón para alternar a Historial o volver a Pendientes -->
      <BaseButton
        :variant="vistaActual === 'pendientes' ? 'outline' : 'primary'"
        size="md"
        @click="
          vistaActual =
            vistaActual === 'pendientes' ? 'historial' : 'pendientes'
        "
      >
        <span class="inline-flex items-center gap-2">
          <PhClockCounterClockwise
            v-if="vistaActual === 'pendientes'"
            :size="18"
            weight="bold"
          />
          <PhArrowLeft v-else :size="18" weight="bold" />
          {{
            vistaActual === 'pendientes'
              ? 'Historial de Pagos'
              : 'Ver Pendientes'
          }}
        </span>
      </BaseButton>
    </div>

    <!-- Vista 1: Historial de Pagos -->
    <div v-if="vistaActual === 'historial'">
      <HistorialPagos />
    </div>

    <!-- Vista 2: Conceptos Pendientes -->
    <div v-else class="space-y-8">
      <!-- Cargando -->
      <div
        v-if="cargando"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
        aria-busy="true"
      >
        <div
          v-for="n in 2"
          :key="n"
          class="h-64 rounded-2xl bg-slate-100 animate-pulse"
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
        <BaseButton variant="danger-outline" size="sm" @click="cargarPendientes">
          Reintentar
        </BaseButton>
      </div>

      <!-- Sin pendientes -->
      <div
        v-else-if="pendientes.length === 0"
        class="p-10 bg-white border border-slate-200/80 rounded-2xl text-center"
      >
        <PhCheckCircle
          :size="40"
          weight="duotone"
          class="text-emerald-600 mx-auto mb-3"
        />
        <h2 class="text-lg font-bold text-[#202759] m-0 mb-1">
          Estás al día
        </h2>
        <p class="text-sm text-slate-500 m-0">
          No tenés membresías ni reservas de cancha pendientes de pago.
        </p>
      </div>

      <!-- Conceptos pendientes -->
      <template v-else>
        <section v-if="membresias.length">
          <h2 class="text-base font-bold text-slate-700 mb-3 sm:mb-4">
            Tu membresía
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <PagoPendienteCard
              v-for="p in membresias"
              :key="`membresia-${p.id_referencia}`"
              :pendiente="p"
            />
          </div>
        </section>

        <section v-if="reservas.length">
          <h2 class="text-base font-bold text-slate-700 mb-3 sm:mb-4">
            Reservas de cancha
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <PagoPendienteCard
              v-for="p in reservas"
              :key="`cancha-${p.id_referencia}`"
              :pendiente="p"
            />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
