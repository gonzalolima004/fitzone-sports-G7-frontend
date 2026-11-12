<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { PhInfo } from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { feriadoSchema } from '../schemas/calendario.schema'
import { erroresPorCampo } from '../utils/validacion'
import type {
  FechaCalendario,
  FechaCalendarioPayload,
} from '../types/gerencia.types'

/**
 * Alta y edición de fechas del calendario general (feriados de toda la
 * cadena). Si recibe una fecha, edita; si recibe null, crea con la fecha
 * inicial indicada. Valida con Zod antes de emitir `guardar`.
 */
interface Props {
  modelValue: boolean
  fecha: FechaCalendario | null
  fechaInicial?: string
  guardando: boolean
  errorServidor?: string
}

const props = withDefaults(defineProps<Props>(), {
  fechaInicial: '',
  errorServidor: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', datos: FechaCalendarioPayload): void
}>()

const formulario = reactive({
  fecha: '',
  descripcion: '',
  es_feriado: true,
  es_dia_habil: false,
})
const errores = ref<Record<string, string>>({})
const esEdicion = computed(() => props.fecha !== null)

watch(
  () => [props.modelValue, props.fecha] as const,
  ([abierto]) => {
    if (!abierto) return

    errores.value = {}
    formulario.fecha = props.fecha?.fecha ?? props.fechaInicial
    formulario.descripcion = props.fecha?.descripcion ?? ''
    formulario.es_feriado = props.fecha?.es_feriado ?? true
    formulario.es_dia_habil = props.fecha?.es_dia_habil ?? false
  },
  { immediate: true }
)

function guardar() {
  const resultado = feriadoSchema.safeParse(formulario)
  if (!resultado.success) {
    errores.value = erroresPorCampo(resultado.error)
    return
  }
  errores.value = {}
  emit('guardar', resultado.data)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="esEdicion ? 'Editar fecha del calendario' : 'Nuevo feriado'"
    subtitle="Se muestra en el calendario de todas las sedes."
    max-width="md"
    :close-on-backdrop="!guardando"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="space-y-4" novalidate @submit.prevent="guardar">
      <p
        v-if="errorServidor"
        role="alert"
        class="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl"
      >
        {{ errorServidor }}
      </p>

      <BaseInput
        id="feriado-fecha"
        v-model="formulario.fecha"
        type="date"
        label="Fecha"
        required
        :error="errores.fecha"
      />

      <BaseInput
        id="feriado-descripcion"
        v-model="formulario.descripcion"
        label="Descripción"
        placeholder="Ej: Día de la Independencia"
        required
        :error="errores.descripcion"
      />

      <div class="space-y-2">
        <label
          for="feriado-es-feriado"
          class="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer"
        >
          <input
            id="feriado-es-feriado"
            v-model="formulario.es_feriado"
            type="checkbox"
            class="mt-0.5 w-4 h-4 accent-[#202759]"
          />
          <span>
            <span class="block text-sm font-semibold text-slate-700"
              >Es feriado</span
            >
            <span class="block text-xs text-slate-500"
              >Feriado nacional o de toda la cadena.</span
            >
          </span>
        </label>
        <label
          for="feriado-es-habil"
          class="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer"
        >
          <input
            id="feriado-es-habil"
            v-model="formulario.es_dia_habil"
            type="checkbox"
            class="mt-0.5 w-4 h-4 accent-[#202759]"
          />
          <span>
            <span class="block text-sm font-semibold text-slate-700"
              >Es día hábil</span
            >
            <span class="block text-xs text-slate-500"
              >Desmarcalo si ese día no se trabaja.</span
            >
          </span>
        </label>
      </div>

      <p
        class="flex items-start gap-2 p-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl"
      >
        <PhInfo :size="16" class="shrink-0 mt-0.5 text-[#202759]" />
        <span>
          Para cerrar una sede o cambiarle el horario ese día, cargá una
          excepción de la sede.
        </span>
      </p>
    </form>

    <template #actions>
      <BaseButton
        variant="outline"
        :disabled="guardando"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </BaseButton>
      <BaseButton variant="primary" :loading="guardando" @click="guardar">
        {{ esEdicion ? 'Guardar cambios' : 'Agregar al calendario' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
