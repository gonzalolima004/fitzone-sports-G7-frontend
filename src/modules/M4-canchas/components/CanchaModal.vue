<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import { validarConEsquema } from '@/common/utils/validation'
import {
  crearCanchaSchema,
  actualizarCanchaSchema,
} from '../schemas/cancha.schema'
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
  idSedeActual?: number | null
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
      disponible?: boolean
    }
  ): void
}>()

const form = ref<{
  nombre: string
  id_sede: number | ''
  id_cancha_tipo: number | ''
  costo_base: number | ''
  disponible: boolean
}>({
  nombre: '',
  id_sede: '',
  id_cancha_tipo: '',
  costo_base: '',
  disponible: true,
})

const errorValidacion = ref<string | null>(null)
const erroresCampos = ref<Record<string, string>>({})

// Sincronizar formulario al abrir o cambiar la cancha seleccionada
watch(
  () => [props.modelValue, props.cancha],
  ([abierto]) => {
    if (abierto) {
      errorValidacion.value = null
      erroresCampos.value = {}
      if (props.esEdicion && props.cancha) {
        form.value = {
          nombre: props.cancha.nombre,
          id_sede: props.cancha.id_sede,
          id_cancha_tipo: props.cancha.id_cancha_tipo,
          costo_base: props.cancha.costo_base,
          disponible: props.cancha.disponible !== false,
        }
      } else {
        // Pre-seleccionar automáticamente la sede actual del sedeStore si está disponible
        let sedeInicial: number | '' = ''
        if (
          props.idSedeActual &&
          props.sedes.some((s) => s.id_sede === props.idSedeActual)
        ) {
          sedeInicial = props.idSedeActual
        } else if (props.sedes.length > 0) {
          sedeInicial = props.sedes[0].id_sede
        }

        form.value = {
          nombre: '',
          id_sede: sedeInicial,
          id_cancha_tipo:
            props.tiposCancha.length > 0
              ? props.tiposCancha[0].id_cancha_tipo
              : '',
          costo_base: '',
          disponible: true,
        }
      }
    }
  },
  { immediate: true }
)

function limpiarErrorCampo(campo: string) {
  if (erroresCampos.value[campo]) {
    delete erroresCampos.value[campo]
  }
}

function validarCampoIndividual(
  campo: 'nombre' | 'costo_base' | 'id_sede' | 'id_cancha_tipo'
) {
  const resultado = props.esEdicion
    ? validarConEsquema(actualizarCanchaSchema, form.value)
    : validarConEsquema(crearCanchaSchema, form.value)
  if (resultado.errores[campo]) {
    erroresCampos.value[campo] = resultado.errores[campo]
  } else {
    limpiarErrorCampo(campo)
  }
}

function cerrar() {
  emit('update:modelValue', false)
}

function handleGuardar() {
  const resultado = props.esEdicion
    ? validarConEsquema(actualizarCanchaSchema, form.value)
    : validarConEsquema(crearCanchaSchema, form.value)

  if (!resultado.valido || !resultado.datos) {
    erroresCampos.value = resultado.errores
    errorValidacion.value =
      resultado.primerError ||
      'Por favor completa todos los campos requeridos con valores válidos.'
    if (resultado.primerError) {
      toast.warning(resultado.primerError)
    }
    return
  }

  erroresCampos.value = {}
  errorValidacion.value = null
  emit('guardar', {
    nombre: resultado.datos.nombre ?? form.value.nombre,
    id_sede: Number(resultado.datos.id_sede ?? form.value.id_sede),
    id_cancha_tipo: Number(
      resultado.datos.id_cancha_tipo ?? form.value.id_cancha_tipo
    ),
    costo_base: Number(resultado.datos.costo_base ?? form.value.costo_base),
    disponible: resultado.datos.disponible ?? form.value.disponible,
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
      <!-- Nombre de la cancha -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Nombre de la Cancha <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model="form.nombre"
          type="text"
          placeholder="Ej: Cancha 1 (Césped Techada)"
          class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all"
          :class="[
            erroresCampos.nombre
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
          ]"
          @input="limpiarErrorCampo('nombre')"
          @blur="validarCampoIndividual('nombre')"
        />
        <span
          v-if="erroresCampos.nombre"
          class="text-[11px] text-rose-600 font-medium"
        >
          {{ erroresCampos.nombre }}
        </span>
        <span v-else class="text-[11px] text-slate-400">
          Identificador visible para los usuarios y socios.
        </span>
      </div>

      <!-- Selector de Sede -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Sede Asignada <span class="text-[#F96167]">*</span>
        </label>
        <select
          v-model="form.id_sede"
          class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all"
          :class="[
            erroresCampos.id_sede
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
          ]"
          @change="validarCampoIndividual('id_sede')"
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
        <span
          v-if="erroresCampos.id_sede"
          class="text-[11px] text-rose-600 font-medium"
        >
          {{ erroresCampos.id_sede }}
        </span>
      </div>

      <!-- Selector de Tipo de Cancha / Deporte -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Tipo de Cancha / Disciplina <span class="text-[#F96167]">*</span>
        </label>
        <select
          v-model="form.id_cancha_tipo"
          class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all"
          :class="[
            erroresCampos.id_cancha_tipo
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
          ]"
          @change="validarCampoIndividual('id_cancha_tipo')"
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
        <span
          v-if="erroresCampos.id_cancha_tipo"
          class="text-[11px] text-rose-600 font-medium"
        >
          {{ erroresCampos.id_cancha_tipo }}
        </span>
      </div>

      <!-- Costo Base por Hora -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Costo Base por Hora ($ ARS) <span class="text-[#F96167]">*</span>
        </label>
        <input
          v-model="form.costo_base"
          type="number"
          min="1"
          step="100"
          placeholder="Ej: 8500"
          class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono"
          :class="[
            erroresCampos.costo_base
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-[#202759] focus:ring-[#202759]/20',
          ]"
          @input="limpiarErrorCampo('costo_base')"
          @blur="validarCampoIndividual('costo_base')"
        />
        <span
          v-if="erroresCampos.costo_base"
          class="text-[11px] text-rose-600 font-medium"
        >
          {{ erroresCampos.costo_base }}
        </span>
        <span v-else class="text-[11px] text-slate-400">
          Tarifa de referencia sobre la cual se aplicarán recargos o descuentos.
        </span>
      </div>

      <!-- Switch de Estado Operativo: Disponible para Reservas -->
      <div
        class="pt-2 border-t border-slate-100 flex items-center justify-between"
      >
        <div>
          <span class="text-xs font-semibold text-slate-700"
            >Disponible para Reservas</span
          >
          <p class="text-[11px] text-slate-400">
            Si se deshabilita, la cancha queda temporalmente no disponible para
            turnos.
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            v-model="form.disponible"
            type="checkbox"
            class="sr-only peer"
          />
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
        :disabled="guardando"
        @click="handleGuardar"
      >
        {{ esEdicion ? 'Actualizar Cancha' : 'Guardar Cancha' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
