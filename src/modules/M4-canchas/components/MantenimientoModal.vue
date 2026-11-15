<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import { obtenerFechaHoyLocal } from '@/common/utils/date'
import { validarConEsquema } from '@/common/utils/validation'
import {
  crearMantenimientoSchema,
  actualizarMantenimientoSchema,
} from '../schemas/mantenimiento.schema'
import type {
  Cancha,
  CrearMantenimientoDto,
  MantenimientoResponseDto,
} from '../types/canchas.types'
import type { Sede } from '@/store/sede'

interface Props {
  modelValue: boolean
  cancha?: Cancha | null
  mantenimiento?: MantenimientoResponseDto | null
  canchasDisponibles?: Cancha[]
  sedes?: Sede[]
  sedeInicialId?: number | ''
  guardando: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cancha: null,
  mantenimiento: null,
  canchasDisponibles: () => [],
  sedes: () => [],
  sedeInicialId: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  guardar: [
    dto: CrearMantenimientoDto,
    idMantenimiento?: number,
    idCancha?: number,
  ]
}>()

const selectedSedeId = ref<number | ''>('')
const selectedCanchaId = ref<number | ''>('')

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
const erroresCampos = ref<Record<string, string>>({})

const esEdicion = computed(() => !!props.mantenimiento)

const canchasFiltradas = computed(() => {
  const activas = props.canchasDisponibles.filter((c) => c.activo !== false)
  if (selectedSedeId.value === '') {
    return activas
  }
  return activas.filter((c) => c.id_sede === Number(selectedSedeId.value))
})

watch(selectedSedeId, (nuevaSede) => {
  if (nuevaSede !== '') {
    const canchaActual = props.canchasDisponibles.find(
      (c) => c.id_cancha === selectedCanchaId.value
    )
    if (canchaActual && canchaActual.id_sede !== Number(nuevaSede)) {
      selectedCanchaId.value = ''
      limpiarErrorCampo('id_cancha')
    }
  }
})

function normalizarParaDatetimeLocal(fechaStr?: string): string {
  if (!fechaStr) return ''
  return fechaStr.replace(' ', 'T').slice(0, 16)
}

function limpiarErrorCampo(campo: string) {
  if (erroresCampos.value[campo]) {
    delete erroresCampos.value[campo]
  }
}

function validarCampoIndividual(
  campo: 'id_cancha' | 'fecha_inicio' | 'fecha_fin' | 'motivo'
) {
  const idCanchaFinal =
    props.cancha?.id_cancha || Number(selectedCanchaId.value)
  const payload = {
    id_cancha: idCanchaFinal,
    fecha_inicio: form.value.fecha_inicio,
    fecha_fin: form.value.fecha_fin,
    motivo: form.value.motivo,
  }
  const resultado = esEdicion.value
    ? validarConEsquema(actualizarMantenimientoSchema, payload)
    : validarConEsquema(crearMantenimientoSchema, payload)

  if (resultado.errores[campo]) {
    erroresCampos.value[campo] = resultado.errores[campo]
  } else {
    limpiarErrorCampo(campo)
  }
}

// Inicializar fechas al abrir modal
watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      errorValidacion.value = null
      erroresCampos.value = {}

      if (props.mantenimiento) {
        selectedCanchaId.value = props.mantenimiento.id_cancha
        const canchaExistente =
          props.canchasDisponibles.find(
            (c) => c.id_cancha === props.mantenimiento?.id_cancha
          ) || props.cancha
        selectedSedeId.value = canchaExistente?.id_sede ?? ''

        form.value = {
          fecha_inicio: normalizarParaDatetimeLocal(
            props.mantenimiento.fecha_inicio
          ),
          fecha_fin: normalizarParaDatetimeLocal(props.mantenimiento.fecha_fin),
          motivo: props.mantenimiento.motivo || '',
        }
      } else {
        selectedSedeId.value =
          props.cancha?.id_sede ?? props.sedeInicialId ?? ''
        selectedCanchaId.value = props.cancha?.id_cancha ?? ''

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
  }
)

function cerrar() {
  emit('update:modelValue', false)
}

function handleGuardar() {
  const idCanchaFinal =
    props.cancha?.id_cancha || Number(selectedCanchaId.value)

  const payload = {
    id_cancha: idCanchaFinal,
    fecha_inicio: form.value.fecha_inicio,
    fecha_fin: form.value.fecha_fin,
    motivo: form.value.motivo,
  }

  const resultado = esEdicion.value
    ? validarConEsquema(actualizarMantenimientoSchema, payload)
    : validarConEsquema(crearMantenimientoSchema, payload)

  if (!resultado.valido || !resultado.datos) {
    erroresCampos.value = resultado.errores
    errorValidacion.value =
      resultado.primerError || 'Revisá los datos ingresados del mantenimiento.'
    if (resultado.primerError) {
      toast.warning(resultado.primerError)
    }
    return
  }

  erroresCampos.value = {}
  errorValidacion.value = null

  const dto: CrearMantenimientoDto = {
    fecha_inicio: resultado.datos.fecha_inicio ?? form.value.fecha_inicio,
    fecha_fin: resultado.datos.fecha_fin ?? form.value.fecha_fin,
    motivo: resultado.datos.motivo || undefined,
  }

  const idMantenimiento = props.mantenimiento?.id_cancha_mantenimiento
  emit('guardar', dto, idMantenimiento, resultado.datos.id_cancha)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="esEdicion ? 'Editar Mantenimiento' : 'Programar Mantenimiento'"
    :subtitle="
      cancha
        ? `Inhabilitar turnos en: ${cancha.nombre}`
        : esEdicion
          ? 'Modificar fechas o motivo del mantenimiento'
          : 'Inhabilitar turnos de cancha por tareas de mantenimiento.'
    "
    max-width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="space-y-4" @submit.prevent="handleGuardar">
      <!-- Error de Validación General -->
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

      <!-- Selector de cancha (solo si no viene prefijada) -->
      <template v-if="!cancha && canchasDisponibles.length > 0">
        <!-- Selector de sede -->
        <div v-if="sedes && sedes.length > 0" class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-700"> Sede </label>
          <select
            v-model="selectedSedeId"
            :disabled="esEdicion"
            class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Todas las sedes</option>
            <option
              v-for="sede in sedes"
              :key="sede.id_sede"
              :value="sede.id_sede"
            >
              {{ sede.nombre }}
            </option>
          </select>
        </div>

        <!-- Selector de cancha -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-700">
            Cancha <span class="text-[#F96167]">*</span>
          </label>
          <select
            v-model="selectedCanchaId"
            :disabled="esEdicion"
            class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
            :class="[
              erroresCampos.id_cancha
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
            ]"
            @change="validarCampoIndividual('id_cancha')"
          >
            <option value="" disabled>Seleccionar cancha...</option>
            <option
              v-for="c in canchasFiltradas"
              :key="c.id_cancha"
              :value="c.id_cancha"
            >
              {{ c.nombre }}
            </option>
          </select>
          <span
            v-if="erroresCampos.id_cancha"
            class="text-[11px] text-rose-600 font-medium"
          >
            {{ erroresCampos.id_cancha }}
          </span>
        </div>
      </template>

      <!-- Fecha y hora de inicio -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Fecha y Hora de Inicio <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model="form.fecha_inicio"
          type="datetime-local"
          class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono"
          :class="[
            erroresCampos.fecha_inicio
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
          ]"
          @input="limpiarErrorCampo('fecha_inicio')"
          @blur="validarCampoIndividual('fecha_inicio')"
        />
        <span
          v-if="erroresCampos.fecha_inicio"
          class="text-[11px] text-rose-600 font-medium"
        >
          {{ erroresCampos.fecha_inicio }}
        </span>
      </div>

      <!-- Fecha y hora de fin -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Fecha y Hora de Finalización <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model="form.fecha_fin"
          type="datetime-local"
          class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono"
          :class="[
            erroresCampos.fecha_fin
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
          ]"
          @input="limpiarErrorCampo('fecha_fin')"
          @blur="validarCampoIndividual('fecha_fin')"
        />
        <span
          v-if="erroresCampos.fecha_fin"
          class="text-[11px] text-rose-600 font-medium"
        >
          {{ erroresCampos.fecha_fin }}
        </span>
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
          class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none"
          :class="[
            erroresCampos.motivo
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
          ]"
          @input="limpiarErrorCampo('motivo')"
          @blur="validarCampoIndividual('motivo')"
        ></textarea>
        <span
          v-if="erroresCampos.motivo"
          class="text-[11px] text-rose-600 font-medium"
        >
          {{ erroresCampos.motivo }}
        </span>
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
        :disabled="guardando"
        @click="handleGuardar"
      >
        {{ esEdicion ? 'Guardar Cambios' : 'Confirmar Mantenimiento' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
