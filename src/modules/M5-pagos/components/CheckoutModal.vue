<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhCreditCard, PhWallet } from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'

const props = defineProps<{
  modelValue: boolean
  plan: { id: number; precio: number } | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar', planId: number): void
}>()

const metodoSeleccionado = ref('tarjeta')
const renovacionAuto = ref(true)

const formattedPrice = computed(() => {
  if (!props.plan) return '$0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(props.plan?.precio ?? 0)
})
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    max-width="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #title>
      <div class="flex justify-between items-start w-full">
        <div>
          <span
            class="text-[10px] font-bold text-slate-500 tracking-wider uppercase bg-slate-100 px-2 py-1 rounded-md"
            >Checkout Seguro</span
          >
          <h3 class="text-xl font-bold text-[#202759] mt-2">
            Checkout Seguro FitZone
          </h3>
        </div>
        <div class="text-right pr-4">
          <p class="text-xs text-slate-500 font-medium">Total a Pagar</p>
          <p class="text-2xl font-black text-[#202759]">{{ formattedPrice }}</p>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
      <!-- Columna Izquierda: Métodos de Pago -->
      <div class="space-y-4">
        <h4 class="text-sm font-bold text-[#202759] mb-3">
          Seleccionar Método de Pago
        </h4>

        <button
          type="button"
          class="w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3"
          :class="
            metodoSeleccionado === 'tarjeta'
              ? 'border-[#202759] bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          "
          @click="metodoSeleccionado = 'tarjeta'"
        >
          <div class="text-[#202759]">
            <PhCreditCard :size="32" weight="duotone" />
          </div>
          <div>
            <p class="font-bold text-sm text-[#202759]">
              Tarjeta de Crédito / Débito
            </p>
            <p class="text-xs text-slate-500">Tokenización segura</p>
          </div>
        </button>

        <button
          type="button"
          class="w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3"
          :class="
            metodoSeleccionado === 'mercadopago'
              ? 'border-[#202759] bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          "
          @click="metodoSeleccionado = 'mercadopago'"
        >
          <div class="text-[#009EE3]">
            <PhWallet :size="32" weight="duotone" />
          </div>
          <div>
            <p class="font-bold text-sm text-[#202759]">Mercado Pago</p>
            <p class="text-xs text-slate-500">Dinero en cuenta o QR</p>
          </div>
        </button>
      </div>

      <!-- Columna Derecha: Formulario de Tarjeta -->
      <div
        class="space-y-4"
        :class="{
          'opacity-50 pointer-events-none': metodoSeleccionado !== 'tarjeta',
        }"
      >
        <BaseInput
          label="Número de Tarjeta"
          placeholder="•••• •••• •••• 4821"
        />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput label="Vencimiento" placeholder="08/29" />
          <BaseInput label="CVV" placeholder="•••" type="password" />
        </div>
        <BaseInput
          label="Titular de la Tarjeta"
          placeholder="GONZALO MORALES"
        />

        <label class="flex items-center gap-2 mt-4 cursor-pointer">
          <input
            v-model="renovacionAuto"
            type="checkbox"
            class="w-4 h-4 text-[#F96167] rounded border-slate-300 focus:ring-[#F96167]"
          />
          <span class="text-sm text-slate-600"
            >Activar renovación automática mensual</span
          >
        </label>
      </div>
    </div>

    <template #actions>
      <!-- En el <template> (botón al final): -->
      <BaseButton
        variant="secondary"
        :loading="isLoading"
        @click="emit('confirmar', props.plan?.id ?? 0)"
      >
        Procesar Pago ({{ formattedPrice }}) &rarr;
      </BaseButton>
    </template>
  </BaseModal>
</template>
