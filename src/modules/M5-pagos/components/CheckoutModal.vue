<script setup lang="ts">
import { computed } from 'vue'
import {
  PhIdentificationCard,
  PhClock,
  PhCalendarBlank,
  PhLockKey,
  PhArrowSquareOut,
} from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'

const props = defineProps<{
  modelValue: boolean
  plan: {
    id: number
    precio: number
    duracion_dias?: number
    nombre?: string
  } | null
  isLoading: boolean
  emailPagador?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar', planId: number): void
}>()

const etiquetaDuracion = computed(() => {
  const dias = props.plan?.duracion_dias
  if (dias === 30) return 'Plan mensual (30 días)'
  if (dias === 90) return 'Plan trimestral (90 días)'
  if (dias === 365) return 'Plan anual (365 días)'
  return dias ? `Plan de ${dias} días` : 'Plan de membresía'
})

const formattedPrice = computed(() => {
  if (!props.plan) return '$0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(props.plan?.precio ?? 0)
})

function cerrarModal() {
  if (props.isLoading) return
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Confirmar Pago"
    subtitle="Verifica el detalle de la operación antes de continuar a la pasarela"
    max-width="lg"
    :close-on-backdrop="!isLoading"
    @update:model-value="emit('update:modelValue', $event)"
    @close="cerrarModal"
  >
    <div class="space-y-4">
      <!-- Resumen del concepto a pagar -->
      <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <span
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
          >
            <PhIdentificationCard :size="14" weight="bold" />
            Plan de Membresía
          </span>
        </div>

        <h4 class="text-base font-bold text-[#202759] m-0">
          Suscripción - {{ plan?.nombre ?? 'Plan FitZone' }}
        </h4>

        <div class="mt-2.5">
          <div
            class="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap overflow-x-auto no-scrollbar py-0.5"
          >
            <span
              class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-lg text-[11px] sm:text-xs font-medium bg-white text-slate-600 border border-slate-200/80 shadow-2xs whitespace-nowrap"
            >
              <PhClock :size="13" class="text-slate-400 shrink-0" />
              {{ etiquetaDuracion }}
            </span>
            <span
              v-if="plan?.duracion_dias"
              class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-lg text-[11px] sm:text-xs font-medium bg-white text-slate-600 border border-slate-200/80 shadow-2xs whitespace-nowrap"
            >
              <PhCalendarBlank :size="13" class="text-slate-400 shrink-0" />
              Vigencia por {{ plan.duracion_dias }} días
            </span>
          </div>
        </div>

        <p v-if="emailPagador" class="mt-2 text-xs text-slate-500 m-0">
          <span class="font-medium text-slate-700">Email pagador:</span>
          {{ emailPagador }}
        </p>
      </div>

      <!-- Desglose de importe -->
      <div
        class="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#202759]/5 to-transparent border border-[#202759]/10"
      >
        <div>
          <span class="text-xs font-medium text-slate-500 block">
            Total a pagar
          </span>
          <span class="text-[11px] sm:text-xs text-slate-400">
            Pesos Argentinos
          </span>
        </div>
        <div class="text-xl sm:text-2xl font-black text-[#202759]">
          {{ formattedPrice }}
        </div>
      </div>

      <!-- Garantía de seguridad -->
      <div
        class="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-3 text-xs text-slate-600"
      >
        <PhLockKey
          :size="18"
          class="shrink-0 text-emerald-600 mt-0.5"
          weight="duotone"
        />
        <p class="m-0 leading-relaxed">
          Serás redirigido a MercadoPago, FitZone no almacena datos de tarjeta
          ni credenciales bancarias.
        </p>
      </div>
    </div>

    <template #actions>
      <BaseButton
        variant="outline"
        size="md"
        :disabled="isLoading"
        @click="cerrarModal"
      >
        Cancelar
      </BaseButton>

      <BaseButton
        variant="secondary"
        size="md"
        :disabled="isLoading"
        :loading="isLoading"
        @click="emit('confirmar', props.plan?.id ?? 0)"
      >
        <template #icon>
          <PhArrowSquareOut :size="18" weight="bold" />
        </template>
        {{ isLoading ? 'Iniciando...' : 'Confirmar y Pagar' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
