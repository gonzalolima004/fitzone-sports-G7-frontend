<script setup lang="ts">
import { computed } from 'vue'
import { PhCheckCircle } from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import type { PlanMembresia } from '../services/membresias.service'

const props = defineProps<{
  plan: PlanMembresia
  isCurrent: boolean
  hasActivePlan?: boolean
  isPopular?: boolean
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'subscribe', plan: PlanMembresia): void // <-- Pasamos el objeto entero
}>()

const buttonText = computed(() => {
  if (props.isCurrent) return 'Renovar'
  if (props.hasActivePlan) return 'Cambiar a este Plan'
  return 'Suscribirme'
})

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(props.plan.precio)
})

const periodoLabel = computed(() => {
  if (props.plan.duracion_dias === 30) return '1 MES (30 DÍAS)'
  if (props.plan.duracion_dias === 90) return '3 MESES (90 DÍAS)'
  if (props.plan.duracion_dias === 365) return '1 AÑO (365 DÍAS)'
  return `${props.plan.duracion_dias} DÍAS`
})

const subtextoPrecio = computed(() => {
  if (props.plan.duracion_dias === 90) {
    const mensual = Math.round(props.plan.precio / 3)
    const precioFmt = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(mensual)
    return {
      texto: `Equivale a ${precioFmt}/mes`,
      ahorro: '12.5% OFF',
    }
  }
  if (props.plan.duracion_dias === 365) {
    const mensual = Math.round(props.plan.precio / 12)
    const precioFmt = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(mensual)
    return {
      texto: `Equivale a ${precioFmt}/mes`,
      ahorro: '25% OFF',
    }
  }
  return {
    texto: 'Facturación mensual',
    ahorro: null,
  }
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
    class="relative border rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300"
    :class="
      isCurrent
        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg bg-emerald-50/15 transform hover:-translate-y-1'
        : isPopular
          ? 'border-[#F96167] shadow-xl bg-white transform hover:-translate-y-1'
          : 'border-slate-200 bg-white hover:shadow-md hover:border-[#202759]/30'
    "
  >
    <div
      v-if="isCurrent"
      class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-[10px] sm:text-xs font-black px-4 py-1 rounded-full tracking-wider uppercase whitespace-nowrap shadow-sm"
    >
      TU PLAN ACTUAL
    </div>
    <div
      v-else-if="isPopular"
      class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#F96167] text-white text-[10px] sm:text-xs font-black px-4 py-1 rounded-full tracking-wider uppercase whitespace-nowrap shadow-sm"
    >
      MÁS ELEGIDO
    </div>

    <div class="text-center mb-6">
      <span
        class="text-xs font-bold text-slate-400 tracking-widest uppercase"
        >{{ periodoLabel }}</span
      >
      <h3 class="text-xl sm:text-2xl font-bold text-[#202759] mt-1">
        {{ plan.nombre }}
      </h3>

      <div class="mt-4 flex flex-col items-center justify-center">
        <div class="flex items-baseline justify-center gap-1">
          <span
            class="text-3xl sm:text-4xl font-extrabold"
            :class="
              isCurrent
                ? 'text-emerald-700'
                : isPopular
                  ? 'text-[#F96167]'
                  : 'text-[#202759]'
            "
            >{{ formattedPrice }}</span
          >
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span>{{ subtextoPrecio.texto }}</span>
          <span
            v-if="subtextoPrecio.ahorro"
            class="px-1.5 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-50 text-[11px]"
          >
            {{ subtextoPrecio.ahorro }}
          </span>
        </div>
      </div>
    </div>

    <ul class="space-y-3 mb-8 flex-1">
      <li
        v-for="(feat, idx) in features"
        :key="idx"
        class="flex items-start gap-3 text-sm text-slate-600"
      >
        <PhCheckCircle
          :size="20"
          weight="fill"
          class="text-green-500 shrink-0 mt-0.5"
        />
        <span :class="{ 'font-bold text-slate-800': isPopular && idx === 0 }">{{
          feat
        }}</span>
      </li>
    </ul>

    <!-- En el botón al final del template -->
    <BaseButton
      class="w-full"
      :variant="isCurrent ? 'primary' : isPopular ? 'secondary' : 'outline'"
      :loading="isLoading"
      @click="emit('subscribe', plan)"
    >
      {{ buttonText }}
    </BaseButton>
  </div>
</template>
