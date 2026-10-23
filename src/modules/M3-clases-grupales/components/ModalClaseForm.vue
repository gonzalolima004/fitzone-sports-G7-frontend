<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import {
  clasesService,
  type CreateClaseRequest,
  type UpdateClaseRequest,
} from '../services/clases.service'
import { toast } from '@/common/utils/toast'
import axios from 'axios'

interface Props {
  modelValue?: boolean
  idSede: number
  claseAEditar?: {
    id: number
    nombre: string
    descripcion?: string | null
    profesor?: string | null
    sala?: string | null
    horario_inicio?: string
    horario_fin?: string
    capacidadMaxima: number
    dias_semana?: number[]
    fecha?: string | null
  } | null
  fechaPorDefecto?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  claseAEditar: null,
  fechaPorDefecto: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardado'): void
}>()

const DIAS_OPCIONES = [
  { valor: 1, etiqueta: 'Lun', nombre: 'Lunes' },
  { valor: 2, etiqueta: 'Mar', nombre: 'Martes' },
  { valor: 3, etiqueta: 'Mié', nombre: 'Miércoles' },
  { valor: 4, etiqueta: 'Jue', nombre: 'Jueves' },
  { valor: 5, etiqueta: 'Vie', nombre: 'Viernes' },
  { valor: 6, etiqueta: 'Sáb', nombre: 'Sábado' },
  { valor: 0, etiqueta: 'Dom', nombre: 'Domingo' },
]

const guardando = ref(false)
const errorForm = ref<string | null>(null)

// Campos del formulario
const nombre = ref('')
const descripcion = ref('')
const profesor = ref('')
const sala = ref('')
const horarioInicio = ref('08:00')
const horarioFin = ref('09:00')
const capacidadMaxima = ref(20)
const tipoProgramacion = ref<'semanal' | 'puntual'>('semanal')
const diasSemanaSeleccionados = ref<number[]>([1, 3, 5]) // Lun, Mié, Vie por defecto
const fechaPuntual = ref('')

const esEdicion = computed(() => !!props.claseAEditar)
const modalTitulo = computed(() =>
  esEdicion.value ? 'Editar Clase Grupal' : 'Crear Nueva Clase Grupal'
)
const modalSubtitulo = computed(() =>
  esEdicion.value
    ? 'Modifica los datos y el cronograma de la clase'
    : 'Completa los datos para dar de alta la clase en la sede activa'
)

// Sincronizar campos cuando se abre el modal o cambia claseAEditar
watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      errorForm.value = null
      if (props.claseAEditar) {
        nombre.value = props.claseAEditar.nombre || ''
        descripcion.value = props.claseAEditar.descripcion || ''
        profesor.value = props.claseAEditar.profesor || ''
        sala.value = props.claseAEditar.sala || ''
        horarioInicio.value = props.claseAEditar.horario_inicio || '08:00'
        horarioFin.value = props.claseAEditar.horario_fin || '09:00'
        capacidadMaxima.value = props.claseAEditar.capacidadMaxima || 20

        if (props.claseAEditar.fecha) {
          tipoProgramacion.value = 'puntual'
          fechaPuntual.value = props.claseAEditar.fecha.split('T')[0] || ''
          diasSemanaSeleccionados.value = []
        } else {
          tipoProgramacion.value = 'semanal'
          fechaPuntual.value = ''
          diasSemanaSeleccionados.value = props.claseAEditar.dias_semana?.length
            ? [...props.claseAEditar.dias_semana]
            : [1, 3, 5]
        }
      } else {
        // Valores limpios por defecto
        nombre.value = ''
        descripcion.value = ''
        profesor.value = ''
        sala.value = ''
        horarioInicio.value = '08:00'
        horarioFin.value = '09:00'
        capacidadMaxima.value = 20
        tipoProgramacion.value = 'semanal'
        diasSemanaSeleccionados.value = [1, 3, 5]
        fechaPuntual.value = props.fechaPorDefecto || ''
      }
    }
  }
)

function toggleDia(dia: number) {
  const index = diasSemanaSeleccionados.value.indexOf(dia)
  if (index > -1) {
    diasSemanaSeleccionados.value.splice(index, 1)
  } else {
    diasSemanaSeleccionados.value.push(dia)
  }
}

function seleccionarLunesAViernes() {
  diasSemanaSeleccionados.value = [1, 2, 3, 4, 5]
}

function seleccionarFinDeSemana() {
  diasSemanaSeleccionados.value = [6, 0]
}

function seleccionarTodos() {
  diasSemanaSeleccionados.value = [1, 2, 3, 4, 5, 6, 0]
}

async function guardarClase() {
  // Validaciones
  if (!nombre.value.trim()) {
    errorForm.value = 'El nombre de la clase es obligatorio.'
    return
  }
  if (!horarioInicio.value || !horarioFin.value) {
    errorForm.value = 'Debes especificar el horario de inicio y fin.'
    return
  }
  if (horarioInicio.value >= horarioFin.value) {
    errorForm.value =
      'El horario de inicio debe ser anterior al horario de fin.'
    return
  }
  if (capacidadMaxima.value <= 0) {
    errorForm.value = 'La capacidad máxima debe ser de al menos 1 persona.'
    return
  }

  if (
    tipoProgramacion.value === 'semanal' &&
    diasSemanaSeleccionados.value.length === 0
  ) {
    errorForm.value = 'Debes seleccionar al menos un día de la semana.'
    return
  }
  if (tipoProgramacion.value === 'puntual' && !fechaPuntual.value) {
    errorForm.value = 'Debes indicar la fecha puntual para la clase.'
    return
  }

  guardando.value = true
  errorForm.value = null

  try {
    const payloadComun = {
      id_sede: props.idSede,
      nombre: nombre.value.trim(),
      descripcion: descripcion.value.trim() || null,
      profesor: profesor.value.trim() || null,
      sala: sala.value.trim() || null,
      horario_inicio: horarioInicio.value,
      horario_fin: horarioFin.value,
      capacidad_maxima: Number(capacidadMaxima.value),
      dias_semana:
        tipoProgramacion.value === 'semanal'
          ? diasSemanaSeleccionados.value
          : [],
      fecha: tipoProgramacion.value === 'puntual' ? fechaPuntual.value : null,
    }

    if (esEdicion.value && props.claseAEditar) {
      await clasesService.actualizarClase(
        props.claseAEditar.id,
        payloadComun as UpdateClaseRequest
      )
      toast.success(`Clase "${nombre.value}" actualizada con éxito`)
    } else {
      await clasesService.crearClase(payloadComun as CreateClaseRequest)
      toast.success(`Clase "${nombre.value}" creada con éxito`)
    }

    emit('guardado')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      errorForm.value =
        err.response?.data?.message || 'Error al guardar la clase grupal.'
    } else {
      errorForm.value = 'Ocurrió un error inesperado al guardar.'
    }
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="modalTitulo"
    :subtitle="modalSubtitulo"
    max-width="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div
        v-if="errorForm"
        class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
      >
        {{ errorForm }}
      </div>

      <!-- Nombre y Capacidad -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Nombre de la clase <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="nombre"
            type="text"
            placeholder="Ej: Spinning HIIT, Yoga Vinyasa"
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Cupos máx. <span class="text-rose-500">*</span>
          </label>
          <input
            v-model.number="capacidadMaxima"
            type="number"
            min="1"
            max="150"
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800"
          />
        </div>
      </div>

      <!-- Profesor y Sala -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Profesor
          </label>
          <input
            v-model="profesor"
            type="text"
            placeholder="Ej: Laura Gómez"
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Sala / Espacio
          </label>
          <input
            v-model="sala"
            type="text"
            placeholder="Ej: Sala 1 - Spinning"
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800"
          />
        </div>
      </div>

      <!-- Horarios -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Horario de inicio <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="horarioInicio"
            type="time"
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Horario de fin <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="horarioFin"
            type="time"
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800"
          />
        </div>
      </div>

      <!-- Descripción opcional -->
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">
          Descripción
        </label>
        <textarea
          v-model="descripcion"
          rows="2"
          placeholder="Breve detalle de la actividad, nivel o requerimientos..."
          class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800 resize-none"
        ></textarea>
      </div>

      <!-- Tipo de Programación / Periodicidad -->
      <div class="pt-2 border-t border-slate-100">
        <label class="block text-xs font-bold text-slate-700 mb-2">
          Programación y Periodicidad
        </label>
        <div class="flex items-center gap-4 mb-3">
          <label
            class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700"
          >
            <input
              v-model="tipoProgramacion"
              type="radio"
              value="semanal"
              class="text-rose-500 focus:ring-rose-400"
            />
            Días recurrentes de la semana
          </label>
          <label
            class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700"
          >
            <input
              v-model="tipoProgramacion"
              type="radio"
              value="puntual"
              class="text-rose-500 focus:ring-rose-400"
            />
            Evento / Clase puntual (fecha única)
          </label>
        </div>

        <!-- Selector de Días Semanales -->
        <div v-if="tipoProgramacion === 'semanal'" class="space-y-2">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="dia in DIAS_OPCIONES"
              :key="dia.valor"
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
              :class="
                diasSemanaSeleccionados.includes(dia.valor)
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-200'
              "
              @click="toggleDia(dia.valor)"
            >
              {{ dia.etiqueta }}
            </button>
          </div>

          <!-- Atajos rápidos -->
          <div
            class="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium"
          >
            <span>Accesos rápidos:</span>
            <button
              type="button"
              class="hover:text-rose-600 underline cursor-pointer"
              @click="seleccionarLunesAViernes"
            >
              Lun a Vie
            </button>
            <span>&middot;</span>
            <button
              type="button"
              class="hover:text-rose-600 underline cursor-pointer"
              @click="seleccionarFinDeSemana"
            >
              Fines de semana
            </button>
            <span>&middot;</span>
            <button
              type="button"
              class="hover:text-rose-600 underline cursor-pointer"
              @click="seleccionarTodos"
            >
              Todos los días
            </button>
          </div>
        </div>

        <!-- Selector de Fecha Puntual -->
        <div v-else class="space-y-1">
          <input
            v-model="fechaPuntual"
            type="date"
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all font-medium text-slate-800"
          />
          <p class="text-[11px] text-slate-400">
            Esta clase solo aparecerá en la agenda de la fecha especificada.
          </p>
        </div>
      </div>
    </div>

    <template #actions>
      <BaseButton
        variant="outline"
        :disabled="guardando"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </BaseButton>
      <BaseButton
        variant="secondary"
        :loading="guardando"
        @click="guardarClase"
      >
        {{ esEdicion ? 'Actualizar Clase' : 'Crear Clase' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
