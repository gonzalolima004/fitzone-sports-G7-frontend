<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { excepcionSchema } from '../schemas/calendario.schema'
import { erroresPorCampo } from '../utils/validacion'
import type {
  ExcepcionSede,
  ExcepcionSedePayload,
} from '../types/gerencia.types'

/**
 * Alta y edición de una excepción de la sede en una fecha: cierre de todo el
 * día o apertura con horario especial. Si recibe una excepción, edita; si
 * recibe null, crea con la fecha inicial indicada.
 */
interface Props {
  modelValue: boolean
  excepcion: ExcepcionSede | null
  nombreSede: string
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
  (e: 'guardar', datos: ExcepcionSedePayload): void
}>()

const TIPOS = [
  {
    valor: 'cierre',
    titulo: 'Cerrada todo el día',
    detalle: 'Feriado local, mantenimiento o cierre de la sede.',
  },
  {
    valor: 'horario',
    titulo: 'Abre con horario especial',
    detalle: 'Reemplaza el horario semanal solo ese día.',
  },
] as const

const formulario = reactive<{
  fecha: string
  tipo: 'cierre' | 'horario'
  hora_apertura: string
  hora_cierre: string
  motivo: string
}>({
  fecha: '',
  tipo: 'cierre',
  hora_apertura: '',
  hora_cierre: '',
  motivo: '',
})
const errores = ref<Record<string, string>>({})
const esEdicion = computed(() => props.excepcion !== null)

watch(
  () => [props.modelValue, props.excepcion] as const,
  ([abierto]) => {
    if (!abierto) return

    errores.value = {}
    formulario.fecha = props.excepcion?.fecha ?? props.fechaInicial
    formulario.tipo =
      props.excepcion && !props.excepcion.cerrado ? 'horario' : 'cierre'
    formulario.hora_apertura = props.excepcion?.hora_apertura ?? ''
    formulario.hora_cierre = props.excepcion?.hora_cierre ?? ''
    formulario.motivo = props.excepcion?.motivo ?? ''
  },
  { immediate: true }
)

function guardar() {
  const resultado = excepcionSchema.safeParse(formulario)
  if (!resultado.success) {
    errores.value = erroresPorCampo(resultado.error)
    return
  }
  errores.value = {}

  const datos = resultado.data
  emit('guardar', {
    fecha: datos.fecha,
    cerrado: datos.tipo === 'cierre',
    ...(datos.tipo === 'horario'
      ? { hora_apertura: datos.hora_apertura, hora_cierre: datos.hora_cierre }
      : {}),
    motivo: datos.motivo || null,
  })
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="
      esEdicion
        ? `Editar excepción de ${nombreSede}`
        : `Nueva excepción para ${nombreSede}`
    "
    subtitle="Solo cambia esta sede: las demás mantienen su horario."
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
        id="excepcion-fecha"
        v-model="formulario.fecha"
        type="date"
        label="Fecha"
        required
        :error="errores.fecha"
      />

      <fieldset class="space-y-2">
        <legend class="text-xs font-bold text-[#202759] tracking-wide mb-1.5">
          Ese día la sede
        </legend>
        <label
          v-for="tipo in TIPOS"
          :key="tipo.valor"
          :for="`excepcion-tipo-${tipo.valor}`"
          class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
          :class="
            formulario.tipo === tipo.valor
              ? 'border-[#202759] bg-[#202759]/5'
              : 'border-slate-200'
          "
        >
          <input
            :id="`excepcion-tipo-${tipo.valor}`"
            v-model="formulario.tipo"
            type="radio"
            name="excepcion-tipo"
            :value="tipo.valor"
            class="mt-0.5 w-4 h-4 accent-[#202759]"
          />
          <span>
            <span class="block text-sm font-semibold text-slate-700">{{
              tipo.titulo
            }}</span>
            <span class="block text-xs text-slate-500">{{ tipo.detalle }}</span>
          </span>
        </label>
      </fieldset>

      <div
        v-if="formulario.tipo === 'horario'"
        class="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <BaseInput
          id="excepcion-apertura"
          v-model="formulario.hora_apertura"
          type="time"
          label="Abre a las"
          required
          :error="errores.hora_apertura"
        />
        <BaseInput
          id="excepcion-cierre"
          v-model="formulario.hora_cierre"
          type="time"
          label="Cierra a las"
          required
          :error="errores.hora_cierre"
        />
      </div>

      <BaseInput
        id="excepcion-motivo"
        v-model="formulario.motivo"
        label="Motivo"
        placeholder="Ej: Fumigación o feriado municipal"
        hint="Opcional. En un cierre, se informa como motivo."
        :error="errores.motivo"
      />
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
        {{ esEdicion ? 'Guardar cambios' : 'Cargar excepción' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
