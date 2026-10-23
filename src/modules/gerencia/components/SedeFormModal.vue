<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { PhPlus } from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { sedeSchema } from '../schemas/sede.schema'
import { erroresPorCampo } from '../utils/validacion'
import { obtenerMensajeDeError } from '../utils/errores'
import type { Ciudad, SedeGestion, SedePayload } from '../types/gerencia.types'

/**
 * Formulario de alta y edición de sedes. Si recibe una sede, edita; si recibe
 * null, crea. Valida con Zod antes de emitir `guardar`; los errores del
 * servidor llegan por la prop `errorServidor`.
 */
interface Props {
  modelValue: boolean
  sede: SedeGestion | null
  ciudades: Ciudad[]
  guardando: boolean
  errorServidor?: string
  crearCiudad: (nombre: string) => Promise<Ciudad>
}

const props = withDefaults(defineProps<Props>(), {
  errorServidor: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', datos: SedePayload): void
}>()

const formulario = reactive({
  nombre: '',
  direccion: '',
  aforo_maximo: '',
  id_ciudad: '',
})
const errores = ref<Record<string, string>>({})
const esEdicion = computed(() => props.sede !== null)

const agregandoCiudad = ref(false)
const nombreCiudadNueva = ref('')
const creandoCiudad = ref(false)
const errorCiudad = ref('')

watch(
  () => [props.modelValue, props.sede] as const,
  ([abierto]) => {
    if (!abierto) return

    errores.value = {}
    agregandoCiudad.value = false
    nombreCiudadNueva.value = ''
    errorCiudad.value = ''

    if (props.sede) {
      formulario.nombre = props.sede.nombre
      formulario.direccion = props.sede.direccion
      formulario.aforo_maximo = String(props.sede.aforo_maximo)
      formulario.id_ciudad = String(props.sede.id_ciudad)
    } else {
      formulario.nombre = ''
      formulario.direccion = ''
      formulario.aforo_maximo = ''
      formulario.id_ciudad =
        props.ciudades.length === 1 ? String(props.ciudades[0].id_ciudad) : ''
    }
  },
  { immediate: true }
)

function guardar() {
  const resultado = sedeSchema.safeParse(formulario)
  if (!resultado.success) {
    errores.value = erroresPorCampo(resultado.error)
    return
  }
  errores.value = {}
  emit('guardar', resultado.data)
}

async function agregarCiudad() {
  const nombre = nombreCiudadNueva.value.trim()
  if (!nombre) {
    errorCiudad.value = 'Ingresá el nombre de la ciudad.'
    return
  }

  creandoCiudad.value = true
  errorCiudad.value = ''
  try {
    const ciudad = await props.crearCiudad(nombre)
    formulario.id_ciudad = String(ciudad.id_ciudad)
    agregandoCiudad.value = false
    nombreCiudadNueva.value = ''
  } catch (error: unknown) {
    errorCiudad.value = obtenerMensajeDeError(
      error,
      'No se pudo crear la ciudad. Intentá nuevamente.'
    )
  } finally {
    creandoCiudad.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="esEdicion ? 'Editar sede' : 'Nueva sede'"
    :subtitle="
      esEdicion
        ? 'Modificá los datos de la sede. Los cambios se ven en todo el sistema.'
        : 'Al guardarla, la sede queda disponible en el registro y en el selector de sedes.'
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
        id="sede-nombre"
        v-model="formulario.nombre"
        label="Nombre de la sede"
        placeholder="Ej: FitZone Norte"
        required
        :error="errores.nombre"
      />
      <BaseInput
        id="sede-direccion"
        v-model="formulario.direccion"
        label="Dirección"
        placeholder="Ej: Av. San Martín 1200"
        required
        :error="errores.direccion"
      />
      <BaseInput
        id="sede-aforo"
        v-model="formulario.aforo_maximo"
        type="number"
        label="Aforo máximo"
        placeholder="Ej: 150"
        hint="Cantidad máxima de personas en simultáneo (RF-05)."
        required
        :error="errores.aforo_maximo"
      />

      <div class="flex flex-col gap-1.5">
        <label
          for="sede-ciudad"
          class="text-xs font-bold text-[#202759] tracking-wide"
        >
          Ciudad <span class="text-[#F96167] ml-0.5">*</span>
        </label>
        <select
          id="sede-ciudad"
          v-model="formulario.id_ciudad"
          class="w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2"
          :class="
            errores.id_ciudad
              ? 'border-[#F96167] focus:ring-[#F96167]/20'
              : 'border-slate-300 focus:border-[#202759] focus:ring-[#202759]/15'
          "
        >
          <option value="" disabled>Seleccioná una ciudad</option>
          <option
            v-for="ciudad in ciudades"
            :key="ciudad.id_ciudad"
            :value="String(ciudad.id_ciudad)"
          >
            {{ ciudad.nombre }}
          </option>
        </select>
        <p
          v-if="errores.id_ciudad"
          class="text-xs text-[#F96167] font-medium mt-0.5"
        >
          {{ errores.id_ciudad }}
        </p>

        <button
          v-if="!agregandoCiudad"
          type="button"
          class="self-start inline-flex items-center gap-1 text-xs font-semibold text-[#202759] hover:text-[#F96167] cursor-pointer"
          @click="agregandoCiudad = true"
        >
          <PhPlus :size="12" weight="bold" />
          ¿No está la ciudad? Agregala
        </button>
        <div
          v-else
          class="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <BaseInput
            id="ciudad-nueva"
            v-model="nombreCiudadNueva"
            label="Nueva ciudad"
            placeholder="Ej: Paraná"
            :error="errorCiudad"
          />
          <div class="flex gap-2">
            <BaseButton
              size="sm"
              variant="ghost"
              :disabled="creandoCiudad"
              @click="agregandoCiudad = false"
            >
              Cancelar
            </BaseButton>
            <BaseButton
              size="sm"
              :loading="creandoCiudad"
              @click="agregarCiudad"
            >
              Agregar ciudad
            </BaseButton>
          </div>
        </div>
      </div>
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
        {{ esEdicion ? 'Guardar cambios' : 'Crear sede' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
