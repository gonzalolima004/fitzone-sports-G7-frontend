<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /**
   * Tipo visual o rol estructural del skeleton
   * @default 'text'
   */
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular' | 'badge' | 'button'

  /**
   * Ancho explícito en formato CSS ('120px', '100%') o clase Tailwind ('w-24', 'w-full')
   */
  width?: string

  /**
   * Alto explícito en formato CSS ('32px') o clase Tailwind ('h-6', 'h-full')
   */
  height?: string

  /**
   * Activa la animación pulsante (animate-pulse)
   * @default true
   */
  animated?: boolean

  /**
   * Radio de curvatura personalizado
   */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | 'none'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  width: undefined,
  height: undefined,
  animated: true,
  rounded: undefined,
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'circular':
      return 'rounded-full shrink-0'
    case 'badge':
      return 'rounded-full h-6 shrink-0'
    case 'button':
      return 'rounded-xl h-10'
    case 'rectangular':
      return 'rounded-none'
    case 'rounded':
      return 'rounded-2xl'
    case 'text':
    default:
      return 'rounded-md h-4'
  }
})

const roundedClass = computed(() => {
  if (!props.rounded) return ''
  switch (props.rounded) {
    case 'sm':
      return 'rounded-sm'
    case 'md':
      return 'rounded-md'
    case 'lg':
      return 'rounded-lg'
    case 'xl':
      return 'rounded-xl'
    case '2xl':
      return 'rounded-2xl'
    case '3xl':
      return 'rounded-3xl'
    case 'full':
      return 'rounded-full'
    case 'none':
      return 'rounded-none'
    default:
      return ''
  }
})

const customStyles = computed(() => {
  const styles: Record<string, string> = {}
  if (props.width && !props.width.startsWith('w-')) {
    styles.width = props.width
  }
  if (props.height && !props.height.startsWith('h-')) {
    styles.height = props.height
  }
  return styles
})

const customWidthClass = computed(() => {
  if (props.width && props.width.startsWith('w-')) {
    return props.width
  }
  return ''
})

const customHeightClass = computed(() => {
  if (props.height && props.height.startsWith('h-')) {
    return props.height
  }
  return ''
})
</script>

<template>
  <div
    class="bg-slate-200/80 select-none"
    :class="[
      animated ? 'animate-pulse' : '',
      variantClasses,
      roundedClass,
      customWidthClass,
      customHeightClass,
    ]"
    :style="customStyles"
    aria-hidden="true"
  ></div>
</template>
