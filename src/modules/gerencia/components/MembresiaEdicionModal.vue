<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { formatearFechaDDMMAAAA } from '@/common/utils/date-formatter'
import { crearMembresiaEdicionSchema } from '../schemas/membresia.schema'
import { erroresPorCampo } from '../utils/validacion'
import { nombreCompleto } from '../utils/membresias'
import type {
  EstadoMembresia,
  MembresiaEdicionPayload,
  MembresiaSocio,
} from '../types/gerencia.types'

/**
 * Edición de la membresía de un socio: estado (tabla membresia_estado),
 * vencimiento y renovación automática. Valida con Zod antes de emitir.
 */
interface Props {
  modelValue: boolean
  membresia: MembresiaSocio | null
  estados: EstadoMembresia[]
  guardando: boolean
  errorServidor?: string
}

const props = withDefaults(defineProps<Props>(), {
  errorServidor: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', datos: MembresiaEdicionPayload): void
  (e: 'eliminar'): void
}>()

const formulario = reactive({
  id_membresia_estado: '',
  fecha_fin: '',
  renovacion_automatica: false,
})
const errores = ref<Record<string, string>>({})

watch(
  () => [props.modelValue, props.membresia] as const,
  ([abierto, membresia]) => {
    if (!abierto || !membresia) return
    errores.value = {}
    formulario.id_membresia_estado = String(membresia.id_membresia_estado)
    formulario.fecha_fin = membresia.fecha_fin.slice(0, 10)
    formulario.renovacion_automatica = membresia.renovacion_automatica
  },
  { immediate: true }
)

function guardar() {
  if (!props.membresia) return
  const esquema = crearMembresiaEdicionSchema(
    props.membresia.fecha_inicio.slice(0, 10)
  )
  const resultado = esquema.safeParse(formulario)
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
    title="Editar membresía"
    subtitle="El estado y el vencimiento definen si el socio puede ingresar y reservar con precio de socio."
    max-width="md"
    :close-on-backdrop="!guardando"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form
      v-if="membresia"
      class="space-y-4"
      novalidate
      @submit.prevent="guardar"
    >
      <p
        v-if="errorServidor"
        role="alert"
        class="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl"
      >
        {{ errorServidor }}
      </p>

      <dl
        class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
      >
        <div class="col-span-2">
          <dt class="font-bold text-slate-400 uppercase">Socio</dt>
          <dd class="text-sm font-semibold text-slate-800">
            {{ nombreCompleto(membresia.usuario) }}
            <span class="font-normal text-slate-500"
              >· DNI {{ membresia.usuario.dni }}</span
            >
          </dd>
        </div>
        <div>
          <dt class="font-bold text-slate-400 uppercase">Plan</dt>
          <dd class="text-slate-700">{{ membresia.membresia_plan.nombre }}</dd>
        </div>
        <div>
          <dt class="font-bold text-slate-400 uppercase">Inicio</dt>
          <dd class="text-slate-700">
            {{ formatearFechaDDMMAAAA(membresia.fecha_inicio) }}
          </dd>
        </div>
      </dl>

      <div class="flex flex-col gap-1.5">
        <label
          for="membresia-estado"
          class="text-xs font-bold text-[#202759] tracking-wide"
        >
          Estado <span class="text-[#F96167] ml-0.5">*</span>
        </label>
        <select
          id="membresia-estado"
          v-model="formulario.id_membresia_estado"
          class="w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2"
          :class="
            errores.id_membresia_estado
              ? 'border-[#F96167] focus:ring-[#F96167]/20'
              : 'border-slate-300 focus:border-[#202759] focus:ring-[#202759]/15'
          "
        >
          <option
            v-for="estado in estados"
            :key="estado.id_membresia_estado"
            :value="String(estado.id_membresia_estado)"
          >
            {{ estado.descripcion }}
          </option>
        </select>
        <p
          v-if="errores.id_membresia_estado"
          class="text-xs text-[#F96167] font-medium mt-0.5"
        >
          {{ errores.id_membresia_estado }}
        </p>
      </div>

      <BaseInput
        id="membresia-vencimiento"
        v-model="formulario.fecha_fin"
        type="date"
        label="Vencimiento"
        hint="Podés extenderlo, por ejemplo, si la sede estuvo cerrada."
        required
        :error="errores.fecha_fin"
      />

      <label
        for="membresia-edicion-renovacion"
        class="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer"
      >
        <input
          id="membresia-edicion-renovacion"
          v-model="formulario.renovacion_automatica"
          type="checkbox"
          class="mt-0.5 w-4 h-4 accent-[#202759]"
        />
        <span>
          <span class="block text-sm font-semibold text-slate-700"
            >Renovación automática</span
          >
          <span class="block text-xs text-slate-500"
            >Al vencer, la membresía se renueva con el mismo plan.</span
          >
        </span>
      </label>

      <p class="text-xs text-slate-500">
        ¿Se cargó por error?
        <button
          type="button"
          class="font-semibold text-[#F96167] hover:underline cursor-pointer disabled:opacity-50"
          :disabled="guardando"
          @click="emit('eliminar')"
        >
          Eliminar membresía
        </button>
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
        Guardar cambios
      </BaseButton>
    </template>
  </BaseModal>
</template>
