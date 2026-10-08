<script setup lang="ts">
import { computed } from 'vue'
import { PhCircleNotch } from '@phosphor-icons/vue'

interface Props {
  variant?:
    'primary' | 'secondary' | 'danger' | 'danger-outline' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

function handleClick(event: MouseEvent) {
  if (props.disabled || props.loading) return
  emit('click', event)
}

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-[#F96167] text-white hover:bg-[#F96167]/90 active:bg-[#e0484e] shadow-xs'
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-xs'
    case 'danger-outline':
      return 'bg-white border border-red-500 text-red-500 hover:bg-red-50 active:bg-red-100'
    case 'outline':
      return 'bg-white border border-[#202759] text-[#202759] hover:bg-[#202759]/5 active:bg-[#202759]/10'
    case 'ghost':
      return 'bg-transparent text-[#202759] hover:bg-slate-100 active:bg-slate-200'
    case 'primary':
    default:
      return 'bg-[#202759] text-white hover:bg-[#202759]/90 active:bg-[#161b3d] shadow-xs'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-xs rounded-lg gap-1.5'
    case 'lg':
      return 'px-6 py-3.5 text-base rounded-2xl gap-2.5 font-bold'
    case 'md':
    default:
      return 'px-4 py-2.5 text-sm rounded-xl gap-2 font-semibold'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center select-none transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[variantClasses, sizeClasses]"
    @click="handleClick"
  >
    <!-- Spinner animado de carga -->
    <PhCircleNotch
      v-if="loading"
      class="animate-spin -ml-0.5 w-4 h-4 text-current"
      weight="bold"
    />

    <!-- Slot para ícono a la izquierda -->
    <slot v-if="!loading" name="icon" />

    <!-- Contenido / Texto principal del botón -->
    <span>
      <slot />
    </span>
  </button>
</template>
