<script setup lang="ts">
import { computed } from 'vue'
import { PhSoccerBall, PhIdentificationCard } from '@phosphor-icons/vue'
import BotonPagar from './BotonPagar.vue'
import type { PagoPendiente } from '../services/pagos.service'

const props = defineProps<{
  pendiente: PagoPendiente
}>()

const esMembresia = computed(() => props.pendiente.tipo === 'membresia')

const montoFormateado = computed(() =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(props.pendiente.monto)
)
</script>

<template>
  <div
    class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-6 transition-shadow hover:shadow-md"
  >
    <div>
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-4"
        :class="
          esMembresia
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        "
      >
        <PhIdentificationCard v-if="esMembresia" :size="15" weight="bold" />
        <PhSoccerBall v-else :size="15" weight="bold" />
        {{ esMembresia ? 'Membresía' : 'Reserva de Cancha' }}
      </span>

      <h3 class="text-lg font-bold text-[#202759] m-0 mb-1">
        {{ pendiente.titulo }}
      </h3>
      <p class="text-xs text-slate-500 m-0 mb-4">{{ pendiente.detalle }}</p>

      <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <span class="text-xs text-slate-500 block">Total a pagar</span>
        <span class="text-2xl font-black text-[#202759]">
          {{ montoFormateado }}
        </span>
      </div>
    </div>

    <BotonPagar
      :concepto="pendiente.titulo"
      :detalle="pendiente.detalle"
      :monto="pendiente.monto"
      :id-membresia="esMembresia ? pendiente.id_referencia : undefined"
      :id-cancha-reserva="esMembresia ? undefined : pendiente.id_referencia"
      :button-text="esMembresia ? 'Pagar Membresía' : 'Pagar Reserva'"
      :button-variant="esMembresia ? 'primary' : 'secondary'"
    />
  </div>
</template>
