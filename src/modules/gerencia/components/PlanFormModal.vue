<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { planSchema } from '../schemas/plan.schema'
import { erroresPorCampo } from '../utils/validacion'
import type { PlanMembresia, PlanPayload } from '../types/gerencia.types'

/**
 * Formulario de alta y edición de planes de membresía. Si recibe un plan,
 * edita; si recibe null, crea. Valida con Zod antes de emitir `guardar`.
 */
interface Props {
  modelValue: boolean
  plan: PlanMembresia | null
  guardando: boolean
  errorServidor?: string
}

const props = withDefaults(defineProps<Props>(), {
  errorServidor: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', datos: PlanPayload): void
}>()

/** Planes del RF-02: Mensual, Trimestral y Anual. */
const DURACIONES_SUGERIDAS = [
  { dias: 30, nombre: 'Mensual' },
  { dias: 90, nombre: 'Trimestral' },
  { dias: 365, nombre: 'Anual' },
] as const

const formulario = reactive({
  nombre: '',
  duracion_dias: '',
  precio: '',
})
const errores = ref<Record<string, string>>({})
const esEdicion = computed(() => props.plan !== null)

watch(
  () => [props.modelValue, props.plan] as const,
  ([abierto]) => {
    if (!abierto) return

    errores.value = {}
    formulario.nombre = props.plan?.nombre ?? ''
    formulario.duracion_dias = props.plan
      ? String(props.plan.duracion_dias)
      : ''
    formulario.precio = props.plan ? String(props.plan.precio) : ''
  },
  { immediate: true }
)

function usarDuracion(dias: number) {
  formulario.duracion_dias = String(dias)
}

function guardar() {
  const resultado = planSchema.safeParse(formulario)
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
    :title="esEdicion ? 'Editar plan' : 'Nuevo plan de membresía'"
    :subtitle="
      esEdicion
        ? 'El nuevo precio se aplica a las próximas contrataciones y renovaciones.'
        : 'El plan queda disponible en la pantalla de membresías y en la landing.'
    "
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
        id="plan-nombre"
        v-model="formulario.nombre"
        label="Nombre del plan"
        placeholder="Ej: Plan Trimestral"
        required
        :error="errores.nombre"
      />

      <div class="flex flex-col gap-2">
        <BaseInput
          id="plan-duracion"
          v-model="formulario.duracion_dias"
          type="number"
          label="Duración (días)"
          placeholder="Ej: 90"
          required
          :error="errores.duracion_dias"
        />
        <div class="flex flex-wrap gap-2" aria-label="Duraciones sugeridas">
          <button
            v-for="duracion in DURACIONES_SUGERIDAS"
            :key="duracion.dias"
            type="button"
            class="px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors cursor-pointer"
            :class="
              formulario.duracion_dias === String(duracion.dias)
                ? 'bg-[#202759] border-[#202759] text-white'
                : 'bg-white border-slate-300 text-slate-600 hover:border-[#202759]'
            "
            @click="usarDuracion(duracion.dias)"
          >
            {{ duracion.nombre }} · {{ duracion.dias }} días
          </button>
        </div>
      </div>

      <BaseInput
        id="plan-precio"
        v-model="formulario.precio"
        type="number"
        label="Precio ($ ARS)"
        placeholder="Ej: 25000"
        hint="Precio base del plan. Admite hasta 2 decimales."
        required
        :error="errores.precio"
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
        {{ esEdicion ? 'Guardar cambios' : 'Crear plan' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
