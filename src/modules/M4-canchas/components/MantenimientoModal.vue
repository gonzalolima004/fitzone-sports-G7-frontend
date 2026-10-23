<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { obtenerFechaHoyLocal } from '@/common/utils/date'
import type { Cancha, CrearMantenimientoDto } from '../types/canchas.types'

interface Props {
  modelValue: boolean
  cancha: Cancha | null
  guardando: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', dto: CrearMantenimientoDto): void
}>()

const form = ref<{
  fecha_inicio: string
  fecha_fin: string
  motivo: string
}>({
  fecha_inicio: '',
  fecha_fin: '',
  motivo: '',
})

const errorValidacion = ref<string | null>(null)

// Inicializar fechas al abrir modal
watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      errorValidacion.value = null
      const manana = new Date()
      manana.setDate(manana.getDate() + 1)
      const fechaMananaStr = obtenerFechaHoyLocal(manana)

      form.value = {
        fecha_inicio: `${fechaMananaStr}T08:00`,
        fecha_fin: `${fechaMananaStr}T14:00`,
        motivo: '',
      }
    }
  }
)

const formularioValido = computed(() => {
  return (
    form.value.fecha_inicio !== '' &&
    form.value.fecha_fin !== '' &&
    form.value.fecha_fin > form.value.fecha_inicio
  )
})

function cerrar() {
  emit('update:modelValue', false)
}

function handleGuardar() {
  if (!formularioValido.value) {
    errorValidacion.value =
      'La fecha de fin debe ser posterior a la fecha de inicio.'
    return
  }

  errorValidacion.value = null
  emit('guardar', {
    fecha_inicio: form.value.fecha_inicio,
    fecha_fin: form.value.fecha_fin,
    motivo: form.value.motivo.trim() || undefined,
  })
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Programar Mantenimiento"
    :subtitle="
      cancha
        ? `Inhabilitar turnos en: ${cancha.nombre}`
        : 'Inhabilitar turnos de cancha por tareas de mantenimiento.'
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

      <div
        class="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed"
      >
        Durante la ventana de tiempo especificada, la cancha se mostrará como
        <strong>En Mantenimiento</strong> y no permitirá reservas de turnos.
      </div>

      <!-- Fecha y hora de inicio -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Fecha y Hora de Inicio <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model="form.fecha_inicio"
          type="datetime-local"
          required
          class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all font-mono"
        />
      </div>

      <!-- Fecha y hora de fin -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Fecha y Hora de Finalización <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model="form.fecha_fin"
          type="datetime-local"
          required
          class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all font-mono"
        />
      </div>

      <!-- Motivo o descripción -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Motivo del Mantenimiento (opcional)
        </label>
        <textarea
          v-model="form.motivo"
          rows="3"
          placeholder="Ej: Pintura de líneas, cambio de luminarias LED o tensado de red..."
          class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all resize-none"
        ></textarea>
      </div>
    </form>

    <!-- Botones de Acción -->
    <template #actions>
      <BaseButton variant="outline" :disabled="guardando" @click="cerrar">
        Cancelar
      </BaseButton>
      <BaseButton
        variant="secondary"
        :loading="guardando"
        :disabled="!formularioValido"
        @click="handleGuardar"
      >
        Confirmar Mantenimiento
      </BaseButton>
    </template>
  </BaseModal>
</template>
