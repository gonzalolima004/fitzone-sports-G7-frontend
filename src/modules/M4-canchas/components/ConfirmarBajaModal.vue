<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import type { Cancha } from '../types/canchas.types'

interface Props {
  modelValue: boolean
  cancha: Cancha | null
  procesando: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmar', cancha: Cancha): void
}>()

function cerrar() {
  emit('update:modelValue', false)
}

function handleConfirmar() {
  if (!props.cancha) return
  emit('confirmar', props.cancha)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Dar de Baja Cancha"
    max-width="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div
        class="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-800"
      >
        <PhWarningCircle :size="24" class="text-[#F96167] shrink-0 mt-0.5" />
        <div class="text-xs leading-relaxed">
          ¿Estás seguro de que deseas eliminar o dar de baja la cancha
          <strong>{{ cancha?.nombre }}</strong
          >?
        </div>
      </div>

      <p class="text-xs text-slate-500 leading-relaxed">
        Esta acción desactivará la cancha para que no aparezca en las búsquedas
        ni en la grilla de disponibilidad de turnos.
      </p>
    </div>

    <template #actions>
      <BaseButton variant="outline" :disabled="procesando" @click="cerrar">
        Cancelar
      </BaseButton>
      <BaseButton
        variant="danger"
        :loading="procesando"
        @click="handleConfirmar"
      >
        Dar de Baja
      </BaseButton>
    </template>
  </BaseModal>
</template>
