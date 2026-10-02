<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue?: boolean
  title?: string
  subtitle?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  subtitle: '',
  maxWidth: 'md',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

function cerrar() {
  emit('update:modelValue', false)
  emit('close')
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    cerrar()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    cerrar()
  }
}

// Bloqueo de scroll en body mientras el modal está abierto
watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

const maxWidthClasses = computed(() => {
  switch (props.maxWidth) {
    case 'sm':
      return 'max-w-sm'
    case 'lg':
      return 'max-w-lg'
    case 'xl':
      return 'max-w-xl'
    case 'md':
    default:
      return 'max-w-md'
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none"
        @click.self="handleBackdropClick"
      >
        <!-- Tarjeta del Modal con fondo blanco claro -->
        <div
          class="w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden transform transition-all"
          :class="maxWidthClasses"
          role="dialog"
          aria-modal="true"
        >
          <!-- Encabezado del modal -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <slot name="title">
              <div>
                <h3 class="text-base sm:text-lg font-bold text-[#202759] m-0">
                  {{ title }}
                </h3>
                <p v-if="subtitle" class="text-xs text-slate-500 mt-1 m-0">
                  {{ subtitle }}
                </p>
              </div>
            </slot>
            <button
              type="button"
              @click="cerrar"
              class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#F96167] hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <!-- Cuerpo del modal -->
          <div class="p-6 text-sm text-slate-700">
            <slot />
          </div>

          <!-- Acciones / Pie del modal con proporción y distribución 50/50 -->
          <div
            v-if="$slots.actions"
            class="px-6 py-4 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center gap-3 w-full [&>*]:w-full [&>*]:sm:flex-1"
          >
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
