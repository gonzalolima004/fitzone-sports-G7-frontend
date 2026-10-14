<script setup lang="ts">
import { computed } from 'vue'
import { PhWarning } from '@phosphor-icons/vue'

interface Props {
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
  id: '',
  error: '',
  hint: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const inputId = computed(() => {
  return (
    props.id ||
    (props.label
      ? 'input-' + props.label.toLowerCase().replace(/\s+/g, '-')
      : undefined)
  )
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-left">
    <!-- Etiqueta / Label del Input -->
    <label
      v-if="label"
      :for="inputId"
      class="text-xs font-bold text-[#202759] tracking-wide flex items-center justify-between"
    >
      <span>
        {{ label }}
        <span v-if="required" class="text-[#F96167] ml-0.5">*</span>
      </span>
    </label>

    <!-- Campo de entrada -->
    <div class="relative">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        :class="
          error
            ? 'border-[#F96167] focus:border-[#F96167] focus:ring-2 focus:ring-[#F96167]/20'
            : 'border-slate-300 focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15'
        "
        @input="handleInput"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
    </div>

    <!-- Mensaje de error de validación -->
    <p
      v-if="error"
      class="text-xs text-[#F96167] font-medium flex items-center gap-1 mt-0.5"
    >
      <PhWarning class="w-3.5 h-3.5 flex-shrink-0" weight="bold" />
      <span>{{ error }}</span>
    </p>

    <!-- Texto de ayuda opcional (hint) -->
    <p v-else-if="hint" class="text-xs text-slate-400 font-normal mt-0.5">
      {{ hint }}
    </p>
  </div>
</template>
