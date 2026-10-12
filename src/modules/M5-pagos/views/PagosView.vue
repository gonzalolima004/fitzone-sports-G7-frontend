<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  PhCreditCard,
  PhCheckCircle,
  PhWarningCircle,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import PagoPendienteCard from '../components/PagoPendienteCard.vue'
import { pagosService, type PagoPendiente } from '../services/pagos.service'

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
    <!-- Encabezado del módulo -->
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-xl bg-[#202759] text-white flex items-center justify-center shadow-xs"
      >
        <PhCreditCard :size="22" weight="bold" />
      </div>
      <h1 class="text-2xl font-black text-[#202759] m-0">
        Pagos y Facturación
      </h1>
    </div>

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
      <h2 class="text-lg font-bold text-[#202759] m-0 mb-1">Estás al día</h2>
      <p class="text-sm text-slate-500 m-0">
        No tenés membresías ni reservas de cancha pendientes de pago.
      </p>
    </div>

    <!-- Conceptos pendientes -->
    <template v-else>
      <section v-if="membresias.length">
        <h2 class="text-base font-bold text-slate-700 mb-4">Tu membresía</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PagoPendienteCard
            v-for="p in membresias"
            :key="`membresia-${p.id_referencia}`"
            :pendiente="p"
          />
        </div>
      </section>

      <section v-if="reservas.length">
        <h2 class="text-base font-bold text-slate-700 mb-4">
          Reservas de cancha
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PagoPendienteCard
            v-for="p in reservas"
            :key="`cancha-${p.id_referencia}`"
            :pendiente="p"
          />
        </div>
      </section>
    </template>
  </div>
</template>
