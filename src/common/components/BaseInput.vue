<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhWarning, PhEye, PhEyeSlash } from '@phosphor-icons/vue'

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

const showPassword = ref(false)

const inputId = computed(() => {
  return (
    props.id ||
    (props.label
      ? 'input-' + props.label.toLowerCase().replace(/\s+/g, '-')
      : undefined)
  )
})

// Alterna el tipo de input dinámicamente si es contraseña
const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

function togglePassword() {
  showPassword.value = !showPassword.value
}

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
    <div class="relative w-full">
      <input
        :id="inputId"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        :class="[
          error
            ? 'border-[#F96167] focus:border-[#F96167] focus:ring-2 focus:ring-[#F96167]/20'
            : 'border-slate-300 focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15',
          { 'pr-11': type === 'password' },
        ]"
        @input="handleInput"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />

      <!-- Botón de visibilidad de contraseña -->
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#F96167] transition-colors cursor-pointer"
        tabindex="-1"
        title="Mostrar/Ocultar contraseña"
        @click="togglePassword"
      >
        <PhEye v-if="!showPassword" class="w-5 h-5" />
        <PhEyeSlash v-else class="w-5 h-5" />
      </button>
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
