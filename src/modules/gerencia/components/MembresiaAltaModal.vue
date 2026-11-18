<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { PhInfo } from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import {
  formatearFechaDDMMAAAA,
  obtenerFechaLocalISO,
} from '@/common/utils/date-formatter'
import { membresiaAltaSchema } from '../schemas/membresia.schema'
import { erroresPorCampo } from '../utils/validacion'
import { formatearMoneda } from '../utils/formato'
import {
  calcularVencimiento,
  coincideConBusqueda,
  nombreCompleto,
} from '../utils/membresias'
import type {
  MembresiaAltaPayload,
  MembresiaSocio,
  PlanMembresia,
  SocioResumen,
} from '../types/gerencia.types'

/**
 * Alta de la membresía de un socio: titular, plan, fecha de inicio y
 * renovación automática. Muestra el vencimiento que calculará el backend y
 * avisa si el socio ya tiene una membresía activa. Puede abrirse con el socio
 * y el plan elegidos (acciones Asociar y Renovar del listado).
 */
interface Props {
  modelValue: boolean
  socios: SocioResumen[]
  planes: PlanMembresia[]
  membresias: MembresiaSocio[]
  guardando: boolean
  errorServidor?: string
  titulo?: string
  socioInicial?: number | null
  planInicial?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  errorServidor: '',
  titulo: 'Nueva membresía',
  socioInicial: null,
  planInicial: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', datos: MembresiaAltaPayload): void
}>()

const busquedaSocio = ref('')
const formulario = reactive({
  id_usuario: '',
  id_membresia_plan: '',
  fecha_inicio: '',
  renovacion_automatica: false,
})
const errores = ref<Record<string, string>>({})

watch(
  () => props.modelValue,
  (abierto) => {
    if (!abierto) return
    errores.value = {}
    busquedaSocio.value = ''
    formulario.id_usuario = props.socioInicial ? String(props.socioInicial) : ''
    formulario.id_membresia_plan = props.planInicial
      ? String(props.planInicial)
      : ''
    formulario.fecha_inicio = obtenerFechaLocalISO()
    formulario.renovacion_automatica = false
  },
  { immediate: true }
)

const sociosFiltrados = computed(() =>
  props.socios
    .filter((socio) => coincideConBusqueda(socio, busquedaSocio.value))
    .sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
    )
)

const planSeleccionado = computed(() =>
  props.planes.find((plan) => String(plan.id) === formulario.id_membresia_plan)
)

const vencimientoEstimado = computed(() => {
  if (
    !planSeleccionado.value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(formulario.fecha_inicio)
  ) {
    return ''
  }
  return calcularVencimiento(
    formulario.fecha_inicio,
    planSeleccionado.value.duracion_dias
  )
})

const membresiaActivaDelSocio = computed(() =>
  props.membresias.find(
    (membresia) =>
      String(membresia.id_usuario) === formulario.id_usuario &&
      membresia.membresia_estado.descripcion.trim().toLowerCase() === 'activa'
  )
)

function guardar() {
  const resultado = membresiaAltaSchema.safeParse(formulario)
  if (!resultado.success) {
    errores.value = erroresPorCampo(resultado.error)
    return
  }
  errores.value = {}
  emit('guardar', resultado.data)
}

const claseSelect = (conError: boolean) =>
  conError
    ? 'border-[#F96167] focus:ring-[#F96167]/20'
    : 'border-slate-300 focus:border-[#202759] focus:ring-[#202759]/15'
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="titulo"
    subtitle="Asigná un plan a un socio. El vencimiento se calcula según la duración del plan."
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

      <div class="flex flex-col gap-1.5">
        <label
          for="membresia-socio"
          class="text-xs font-bold text-[#202759] tracking-wide"
        >
          Socio <span class="text-[#F96167] ml-0.5">*</span>
        </label>

        <input
          id="membresia-buscar-socio"
          v-model="busquedaSocio"
          type="search"
          aria-label="Buscar socio por nombre, DNI o email"
          placeholder="Buscar por nombre, DNI o email"
          class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-[#202759] focus:ring-[#202759]/15"
        />
        <select
          id="membresia-socio"
          v-model="formulario.id_usuario"
          class="w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2"
          :class="claseSelect(Boolean(errores.id_usuario))"
        >
          <option value="" disabled>
            {{
              sociosFiltrados.length
                ? 'Seleccioná un socio'
                : 'No hay socios que coincidan'
            }}
          </option>
          <option
            v-for="socio in sociosFiltrados"
            :key="socio.id_usuario"
            :value="String(socio.id_usuario)"
          >
            {{ nombreCompleto(socio) }} · DNI {{ socio.dni }}
          </option>
        </select>

        <p
          v-if="errores.id_usuario"
          class="text-xs text-[#F96167] font-medium mt-0.5"
        >
          {{ errores.id_usuario }}
        </p>
      </div>

      <div
        v-if="membresiaActivaDelSocio"
        data-testid="aviso-membresia-activa"
        class="flex items-start gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl"
      >
        <PhInfo :size="16" class="shrink-0 mt-0.5" />
        <span>
          Este socio ya tiene una membresía activa ({{
            membresiaActivaDelSocio.membresia_plan.nombre
          }}, vence el
          {{ formatearFechaDDMMAAAA(membresiaActivaDelSocio.fecha_fin) }}). Al
          dar de alta la nueva, la anterior pasa a Suspendida.
        </span>
      </div>

      <div class="flex flex-col gap-1.5">
        <label
          for="membresia-plan"
          class="text-xs font-bold text-[#202759] tracking-wide"
        >
          Plan <span class="text-[#F96167] ml-0.5">*</span>
        </label>
        <select
          id="membresia-plan"
          v-model="formulario.id_membresia_plan"
          class="w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2"
          :class="claseSelect(Boolean(errores.id_membresia_plan))"
        >
          <option value="" disabled>Seleccioná un plan</option>
          <option
            v-for="plan in planes"
            :key="plan.id"
            :value="String(plan.id)"
          >
            {{ plan.nombre }} · {{ formatearMoneda(plan.precio) }}
          </option>
        </select>
        <p
          v-if="errores.id_membresia_plan"
          class="text-xs text-[#F96167] font-medium mt-0.5"
        >
          {{ errores.id_membresia_plan }}
        </p>
      </div>

      <div>
        <BaseInput
          id="membresia-inicio"
          v-model="formulario.fecha_inicio"
          type="date"
          label="Fecha de inicio"
          required
          :error="errores.fecha_inicio"
        />
        <p
          v-if="vencimientoEstimado && !errores.fecha_inicio"
          data-testid="vencimiento-estimado"
          class="text-xs text-slate-500 mt-1.5"
        >
          Vence el
          <strong class="text-[#202759]">{{
            formatearFechaDDMMAAAA(vencimientoEstimado)
          }}</strong>
          según el plan.
        </p>
      </div>

      <label
        for="membresia-renovacion"
        class="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer"
      >
        <input
          id="membresia-renovacion"
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
        Dar de alta
      </BaseButton>
    </template>
  </BaseModal>
</template>
