<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import type { Cancha, CanchaTipo } from '../types/canchas.types'

interface SedeOpcion {
  id_sede: number
  nombre: string
}

interface Props {
  modelValue: boolean
  esEdicion: boolean
  cancha: Cancha | null
  sedes: SedeOpcion[]
  tiposCancha: CanchaTipo[]
  guardando: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'guardar',
    datos: {
      nombre: string
      id_sede: number
      id_cancha_tipo: number
      costo_base: number
      activo?: boolean
    }
  ): void
}>()

const form = ref<{
  nombre: string
  id_sede: number | ''
  id_cancha_tipo: number | ''
  costo_base: number | ''
  activo: boolean
}>({
  nombre: '',
  id_sede: '',
  id_cancha_tipo: '',
  costo_base: '',
  activo: true,
})

const errorValidacion = ref<string | null>(null)

// Sincronizar formulario al abrir o cambiar la cancha seleccionada
watch(
  () => [props.modelValue, props.cancha],
  ([abierto]) => {
    if (abierto) {
      errorValidacion.value = null
      if (props.esEdicion && props.cancha) {
        form.value = {
          nombre: props.cancha.nombre,
          id_sede: props.cancha.id_sede,
          id_cancha_tipo: props.cancha.id_cancha_tipo,
          costo_base: props.cancha.costo_base,
          activo: props.cancha.activo ?? true,
        }
      } else {
        form.value = {
          nombre: '',
          id_sede: props.sedes.length > 0 ? props.sedes[0].id_sede : '',
          id_cancha_tipo:
            props.tiposCancha.length > 0
              ? props.tiposCancha[0].id_cancha_tipo
              : '',
          costo_base: '',
          activo: true,
        }
      }
    }
  },
  { immediate: true }
)

const formularioValido = computed(() => {
  return (
    form.value.nombre.trim().length >= 3 &&
    form.value.id_sede !== '' &&
    Number(form.value.id_sede) > 0 &&
    form.value.id_cancha_tipo !== '' &&
    Number(form.value.id_cancha_tipo) > 0 &&
    form.value.costo_base !== '' &&
    Number(form.value.costo_base) > 0
  )
})

function cerrar() {
  emit('update:modelValue', false)
}

function handleGuardar() {
  if (!formularioValido.value) {
    errorValidacion.value =
      'Por favor completa todos los campos requeridos con valores válidos.'
    return
  }

  errorValidacion.value = null
  emit('guardar', {
    nombre: form.value.nombre.trim(),
    id_sede: Number(form.value.id_sede),
    id_cancha_tipo: Number(form.value.id_cancha_tipo),
    costo_base: Number(form.value.costo_base),
    activo: form.value.activo,
  })
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="esEdicion ? 'Editar Cancha' : 'Nueva Cancha'"
    :subtitle="
      esEdicion
        ? 'Modificá los datos básicos y tarifa de la cancha.'
        : 'Ingresá los datos para dar de alta una nueva cancha en la sede.'
    "
    max-width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="space-y-4" @submit.prevent="handleGuardar">
      <!-- Error de Validación -->
      <div
        v-if="errorValidacion"
        class="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl"
      >
        {{ errorValidacion }}
      </div>

      <!-- Nombre de la cancha -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Nombre de la Cancha <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model="form.nombre"
          type="text"
          placeholder="Ej: Cancha 1 (Césped Techada)"
          required
          class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all"
        />
        <span class="text-[11px] text-slate-400"
          >Identificador visible para los usuarios y socios.</span
        >
      </div>

      <!-- Selector de Sede -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Sede Asignada <span class="text-[#F96167]">*</span>
        </label>
        <select
          v-model="form.id_sede"
          required
          class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all"
        >
          <option value="" disabled>Seleccioná una sede...</option>
          <option
            v-for="sede in sedes"
            :key="sede.id_sede"
            :value="sede.id_sede"
          >
            {{ sede.nombre }}
          </option>
        </select>
      </div>

      <!-- Selector de Tipo de Cancha / Deporte -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Tipo de Cancha / Disciplina <span class="text-[#F96167]">*</span>
        </label>
        <select
          v-model="form.id_cancha_tipo"
          required
          class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all"
        >
          <option value="" disabled>Seleccioná el tipo...</option>
          <option
            v-for="tipo in tiposCancha"
            :key="tipo.id_cancha_tipo"
            :value="tipo.id_cancha_tipo"
          >
            {{ tipo.descripcion || `Tipo #${tipo.id_cancha_tipo}` }}
          </option>
        </select>
      </div>

      <!-- Costo Base por Hora -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Costo Base por Hora ($ ARS) <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model.number="form.costo_base"
          type="number"
          min="1"
          step="100"
          placeholder="Ej: 8500"
          required
          class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all font-mono"
        />
        <span class="text-[11px] text-slate-400"
          >Tarifa de referencia sobre la cual se aplicarán recargos o
          descuentos.</span
        >
      </div>

      <!-- Switch de Estado Activo (solo en edición) -->
      <div
        v-if="esEdicion"
        class="pt-2 border-t border-slate-100 flex items-center justify-between"
      >
        <div>
          <span class="text-xs font-semibold text-slate-700"
            >Cancha Activa</span
          >
          <p class="text-[11px] text-slate-400">
            Las canchas inactivas no reciben nuevas reservas.
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input v-model="form.activo" type="checkbox" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
          ></div>
        </label>
      </div>
    </form>

    <!-- Botones de Acción -->
    <template #actions>
      <BaseButton variant="outline" :disabled="guardando" @click="cerrar">
        Cancelar
      </BaseButton>
      <BaseButton
        variant="primary"
        :loading="guardando"
        :disabled="!formularioValido"
        @click="handleGuardar"
      >
        {{ esEdicion ? 'Actualizar Cancha' : 'Guardar Cancha' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
