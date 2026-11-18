<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'

/**
 * Confirmación previa a una acción destructiva (patrón acordado en
 * common/components/README.md: modal antes de la acción, toast después).
 * El contenido del aviso va en el slot por defecto.
 */
interface Props {
  modelValue: boolean
  titulo: string
  textoConfirmar?: string
  procesando?: boolean
  error?: string
}

withDefaults(defineProps<Props>(), {
  textoConfirmar: 'Confirmar',
  procesando: false,
  error: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar'): void
}>()
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="titulo"
    max-width="sm"
    :close-on-backdrop="!procesando"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-3">
      <div
        class="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-800"
      >
        <PhWarningCircle :size="24" class="text-[#F96167] shrink-0 mt-0.5" />
        <div class="text-xs leading-relaxed">
          <slot />
        </div>
      </div>
      <p
        v-if="error"
        role="alert"
        class="text-xs text-rose-700 leading-relaxed"
      >
        {{ error }}
      </p>
    </div>

    <template #actions>
      <BaseButton
        variant="outline"
        :disabled="procesando"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </BaseButton>
      <BaseButton
        variant="danger"
        :loading="procesando"
        @click="emit('confirmar')"
      >
        {{ textoConfirmar }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
