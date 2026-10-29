<script setup lang="ts">
import { computed } from 'vue'
import { PhArrowsClockwise, PhWarning } from '@phosphor-icons/vue'
import { useSedeStore } from '@/store/sede'

/**
 * Selector de sede conectado al store global de sedes (GET /sedes).
 * Muestra los estados de carga, error (con reintento) y ausencia de sedes,
 * y se deshabilita mientras no haya sedes para elegir: nadie puede
 * registrarse con una sede inventada.
 */
interface Props {
  modelValue: string
  id?: string
  label?: string
  required?: boolean
  mostrarDireccion?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: 'selector-sede',
  label: 'Sede',
  required: false,
  mostrarDireccion: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const sedeStore = useSedeStore()

const haySedes = computed(() => sedeStore.sedes.length > 0)
const deshabilitado = computed(() => sedeStore.cargando || !haySedes.value)
const sinSedes = computed(
  () => !sedeStore.cargando && !sedeStore.error && !haySedes.value
)

const textoOpcionVacia = computed(() => {
  if (sedeStore.cargando) return 'Cargando sedes...'
  if (sedeStore.error) return 'No se pudieron cargar las sedes'
  if (!haySedes.value) return 'No hay sedes disponibles'
  return 'Selecciona una sede'
})

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

function reintentar() {
  void sedeStore.cargarSedes()
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-left">
    <label
      :for="props.id"
      class="text-xs font-bold text-[#202759] tracking-wide"
    >
      {{ label }}
      <span v-if="required" class="text-[#F96167] ml-0.5">*</span>
    </label>
    <select
      :id="props.id"
      :value="modelValue"
      :disabled="deshabilitado"
      :required="required"
      :aria-busy="sedeStore.cargando"
      class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      @change="onChange"
    >
      <option value="" disabled>{{ textoOpcionVacia }}</option>
      <option
        v-for="sede in sedeStore.sedes"
        :key="sede.id_sede"
        :value="String(sede.id_sede)"
      >
        {{ sede.nombre
        }}{{ mostrarDireccion && sede.direccion ? ` - ${sede.direccion}` : '' }}
      </option>
    </select>

    <div
      v-if="sedeStore.error"
      role="alert"
      class="flex flex-wrap items-center gap-2 text-xs text-[#F96167] font-medium"
    >
      <PhWarning class="w-3.5 h-3.5 shrink-0" weight="bold" />
      <span
        >No se pudieron cargar las sedes. Sin sede no se puede registrar.</span
      >
      <button
        type="button"
        class="inline-flex items-center gap-1 underline text-[#202759] cursor-pointer"
        @click="reintentar"
      >
        <PhArrowsClockwise class="w-3.5 h-3.5" />
        Reintentar
      </button>
    </div>
    <p v-else-if="sinSedes" class="text-xs text-slate-500">
      Todavía no hay sedes habilitadas para registrarse.
    </p>
  </div>
</template>
