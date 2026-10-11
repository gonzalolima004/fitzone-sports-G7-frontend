<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/common/components/BaseButton.vue'
import type { PlanMembresia } from '../services/membresias.service'

const props = defineProps<{
  plan: PlanMembresia
  isCurrent: boolean
  isPopular?: boolean
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'subscribe', planId: number): void
}>()

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(props.plan.precio)
})

const features = computed(() => {
  return props.plan.descripcion
    .split('|')
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
})
</script>

<template>
  <div
    class="relative border rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 bg-white"
    :class="
      isPopular
        ? 'border-[#F96167] shadow-xl transform hover:-translate-y-1'
        : 'border-slate-200 hover:shadow-md hover:border-[#202759]/30'
    "
  >
    <!-- Etiqueta de Popular -->
    <div
      v-if="isPopular"
      class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#F96167] text-white text-[10px] sm:text-xs font-black px-4 py-1 rounded-full tracking-wider uppercase whitespace-nowrap shadow-sm"
    >
      MÁS ELEGIDO
    </div>

    <!-- Encabezado del Plan -->
    <div class="text-center mb-6">
      <span class="text-xs font-bold text-slate-400 tracking-widest uppercase"
        >{{ plan.duracion_dias }} DÍAS</span
      >
      <h3 class="text-xl sm:text-2xl font-bold text-[#202759] mt-1">
        {{ plan.nombre }}
      </h3>

      <div class="mt-4 flex items-baseline justify-center gap-1">
        <span
          class="text-3xl sm:text-4xl font-extrabold"
          :class="isPopular ? 'text-[#F96167]' : 'text-[#202759]'"
          >{{ formattedPrice }}</span
        >
      </div>
    </div>

    <!-- Lista de Características -->
    <ul class="space-y-3 mb-8 flex-1">
      <li
        v-for="(feat, idx) in features"
        :key="idx"
        class="flex items-start gap-3 text-sm text-slate-600"
      >
        <svg
          class="w-5 h-5 text-green-500 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span :class="{ 'font-bold text-slate-800': isPopular && idx === 0 }">{{
          feat
        }}</span>
      </li>
    </ul>

    <!-- Acción -->
    <BaseButton
      class="w-full"
      :variant="isPopular || isCurrent ? 'secondary' : 'outline'"
      :loading="isLoading"
      @click="emit('subscribe', plan.id)"
    >
      {{ isCurrent ? 'Renovar / Cambiar Plan' : 'Suscribirme' }}
    </BaseButton>
  </div>
</template>
