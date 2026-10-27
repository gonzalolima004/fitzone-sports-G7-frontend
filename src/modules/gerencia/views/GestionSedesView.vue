<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PhArrowsClockwise,
  PhBuildings,
  PhMapPin,
  PhPencilSimple,
  PhPlus,
  PhTrash,
  PhUsersThree,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { toast } from '@/common/utils/toast'
import { useSedeStore } from '@/store/sede'
import EncabezadoGerencia from '../components/EncabezadoGerencia.vue'
import SedeFormModal from '../components/SedeFormModal.vue'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal.vue'
import { sedesService } from '../services/sedes.service'
import { obtenerMensajeDeError } from '../utils/errores'
import type { Ciudad, SedeGestion, SedePayload } from '../types/gerencia.types'

const sedeStore = useSedeStore()

const sedes = ref<SedeGestion[]>([])
const ciudades = ref<Ciudad[]>([])
const cargando = ref(true)
const errorCarga = ref('')

const formularioAbierto = ref(false)
const sedeEnEdicion = ref<SedeGestion | null>(null)
const guardando = ref(false)
const errorFormulario = ref('')

const confirmacionAbierta = ref(false)
const sedeParaBaja = ref<SedeGestion | null>(null)
const procesandoBaja = ref(false)
const errorBaja = ref('')

const nombresDeCiudades = computed(
  () => new Map(ciudades.value.map((c) => [c.id_ciudad, c.nombre]))
)
const sedesOrdenadas = computed(() =>
  [...sedes.value].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
)
const ciudadesConSede = computed(
  () => new Set(sedes.value.map((sede) => sede.id_ciudad)).size
)
const aforoTotal = computed(() =>
  sedes.value.reduce((total, sede) => total + sede.aforo_maximo, 0)
)

function nombreCiudad(idCiudad: number): string {
  return nombresDeCiudades.value.get(idCiudad) ?? `Ciudad #${idCiudad}`
}

async function cargarDatos() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const [listaSedes, listaCiudades] = await Promise.all([
      sedesService.listar(),
      sedesService.listarCiudades(),
    ])
    sedes.value = listaSedes
    ciudades.value = listaCiudades
  } catch (error: unknown) {
    errorCarga.value = obtenerMensajeDeError(
      error,
      'No se pudieron cargar las sedes. Revisá la conexión e intentá nuevamente.'
    )
  } finally {
    cargando.value = false
  }
}

/** Mantiene actualizados el selector del encabezado y el registro. */
async function refrescarSedesGlobales() {
  await sedeStore.cargarSedes()
}

function abrirAlta() {
  sedeEnEdicion.value = null
  errorFormulario.value = ''
  formularioAbierto.value = true
}

function abrirEdicion(sede: SedeGestion) {
  sedeEnEdicion.value = sede
  errorFormulario.value = ''
  formularioAbierto.value = true
}

async function guardarSede(datos: SedePayload) {
  guardando.value = true
  errorFormulario.value = ''
  try {
    if (sedeEnEdicion.value) {
      await sedesService.actualizar(sedeEnEdicion.value.id_sede, datos)
      toast.success(`Sede "${datos.nombre}" actualizada.`)
    } else {
      await sedesService.crear(datos)
      toast.success(`Sede "${datos.nombre}" creada.`)
    }
    formularioAbierto.value = false
    await Promise.all([cargarDatos(), refrescarSedesGlobales()])
  } catch (error: unknown) {
    errorFormulario.value = obtenerMensajeDeError(
      error,
      'No se pudo guardar la sede. Intentá nuevamente.'
    )
  } finally {
    guardando.value = false
  }
}

async function crearCiudad(nombre: string): Promise<Ciudad> {
  const ciudad = await sedesService.crearCiudad(nombre)
  ciudades.value = [...ciudades.value, ciudad]
  toast.success(`Ciudad "${ciudad.nombre}" agregada.`)
  return ciudad
}

function pedirConfirmacionBaja(sede: SedeGestion) {
  sedeParaBaja.value = sede
  errorBaja.value = ''
  confirmacionAbierta.value = true
}

async function confirmarBaja() {
  if (!sedeParaBaja.value) return
  const sede = sedeParaBaja.value

  procesandoBaja.value = true
  errorBaja.value = ''
  try {
    await sedesService.darDeBaja(sede.id_sede)
    confirmacionAbierta.value = false
    toast.success(`Sede "${sede.nombre}" dada de baja.`)
    await Promise.all([cargarDatos(), refrescarSedesGlobales()])
  } catch (error: unknown) {
    errorBaja.value = obtenerMensajeDeError(
      error,
      'No se pudo dar de baja la sede. Intentá nuevamente.'
    )
  } finally {
    procesandoBaja.value = false
  }
}

onMounted(cargarDatos)
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Sedes de la cadena"
      descripcion="Alta, modificación y baja de sedes. Los cambios se reflejan en el registro de socios y en el selector de sedes."
      etiqueta="RNF-04 · Multi-sede"
    >
      <template #acciones>
        <BaseButton
          variant="outline"
          size="sm"
          title="Actualizar listado"
          :loading="cargando"
          @click="cargarDatos"
        >
          <template #icon>
            <PhArrowsClockwise :size="15" />
          </template>
          Actualizar
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="abrirAlta">
          <template #icon>
            <PhPlus :size="15" weight="bold" />
          </template>
          Nueva sede
        </BaseButton>
      </template>
    </EncabezadoGerencia>

    <section
      aria-label="Resumen de sedes"
      class="grid grid-cols-3 gap-2 sm:gap-3"
    >
      <div
        class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3"
      >
        <div
          class="hidden sm:flex w-10 h-10 rounded-xl bg-[#202759]/10 text-[#202759] items-center justify-center shrink-0"
        >
          <PhBuildings :size="20" weight="bold" />
        </div>
        <div>
          <p class="text-[11px] uppercase font-bold text-slate-400">
            Sedes activas
          </p>
          <BaseSkeleton v-if="cargando" width="w-10" height="h-6" />
          <p
            v-else
            data-testid="total-sedes"
            class="text-lg sm:text-xl font-bold text-[#202759] tabular-nums"
          >
            {{ sedes.length }}
          </p>
        </div>
      </div>
      <div
        class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3"
      >
        <div
          class="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center shrink-0"
        >
          <PhMapPin :size="20" weight="bold" />
        </div>
        <div>
          <p class="text-[11px] uppercase font-bold text-slate-400">
            Ciudades con sede
          </p>
          <BaseSkeleton v-if="cargando" width="w-10" height="h-6" />
          <p
            v-else
            class="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums"
          >
            {{ ciudadesConSede }}
          </p>
        </div>
      </div>
      <div
        class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3"
      >
        <div
          class="hidden sm:flex w-10 h-10 rounded-xl bg-amber-50 text-amber-600 items-center justify-center shrink-0"
        >
          <PhUsersThree :size="20" weight="bold" />
        </div>
        <div>
          <p class="text-[11px] uppercase font-bold text-slate-400">
            Aforo total
          </p>
          <BaseSkeleton v-if="cargando" width="w-14" height="h-6" />
          <p
            v-else
            class="text-lg sm:text-xl font-bold text-amber-700 tabular-nums"
          >
            {{ aforoTotal.toLocaleString('es-AR') }}
          </p>
        </div>
      </div>
    </section>

    <section
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      :aria-busy="cargando"
    >
      <div v-if="cargando" class="p-4 space-y-3">
        <div
          v-for="fila in 4"
          :key="fila"
          class="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0"
        >
          <BaseSkeleton width="w-40" height="h-4" />
          <BaseSkeleton width="w-24" height="h-4" />
          <BaseSkeleton width="w-16" height="h-4" />
          <BaseSkeleton variant="button" width="w-28" class="ml-auto" />
        </div>
      </div>

      <div
        v-else-if="errorCarga"
        role="alert"
        class="p-10 flex flex-col items-center gap-3 text-center"
      >
        <p class="text-sm text-rose-700">{{ errorCarga }}</p>
        <BaseButton variant="outline" size="sm" @click="cargarDatos">
          Reintentar
        </BaseButton>
      </div>

      <div
        v-else-if="sedes.length === 0"
        class="p-12 flex flex-col items-center gap-3 text-center"
      >
        <div
          class="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"
        >
          <PhBuildings :size="28" />
        </div>
        <h2 class="text-base font-bold text-[#202759]">
          Todavía no hay sedes activas
        </h2>
        <p class="text-sm text-slate-500 max-w-md">
          Sin sedes nadie puede registrarse. Creá la primera para habilitar el
          registro de socios.
        </p>
        <BaseButton size="sm" @click="abrirAlta"
          >Crear la primera sede</BaseButton
        >
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Sedes activas de la cadena
          </caption>
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" class="px-4 py-3 font-semibold">Sede</th>
              <th
                scope="col"
                class="hidden sm:table-cell px-4 py-3 font-semibold"
              >
                Ciudad
              </th>
              <th scope="col" class="px-4 py-3 font-semibold text-right">
                Aforo máximo
              </th>
              <th scope="col" class="px-4 py-3 font-semibold text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sede in sedesOrdenadas"
              :key="sede.id_sede"
              data-testid="fila-sede"
              class="border-t border-slate-100"
            >
              <th scope="row" class="px-4 py-3 font-medium text-slate-800">
                {{ sede.nombre }}
                <span class="block text-xs font-normal text-slate-500">
                  {{ sede.direccion }}
                </span>
                <span
                  class="block text-xs font-normal text-slate-500 sm:hidden"
                >
                  {{ nombreCiudad(sede.id_ciudad) }}
                </span>
              </th>
              <td class="hidden sm:table-cell px-4 py-3 text-slate-600">
                {{ nombreCiudad(sede.id_ciudad) }}
              </td>
              <td class="px-4 py-3 text-right tabular-nums">
                {{ sede.aforo_maximo.toLocaleString('es-AR') }}
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    :aria-label="`Editar sede ${sede.nombre}`"
                    @click="abrirEdicion(sede)"
                  >
                    <template #icon>
                      <PhPencilSimple :size="14" />
                    </template>
                    <span class="hidden sm:inline">Editar</span>
                  </BaseButton>
                  <BaseButton
                    variant="danger-outline"
                    size="sm"
                    :aria-label="`Dar de baja sede ${sede.nombre}`"
                    @click="pedirConfirmacionBaja(sede)"
                  >
                    <template #icon>
                      <PhTrash :size="14" />
                    </template>
                    <span class="hidden sm:inline">Dar de baja</span>
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <SedeFormModal
      v-model="formularioAbierto"
      :sede="sedeEnEdicion"
      :ciudades="ciudades"
      :guardando="guardando"
      :error-servidor="errorFormulario"
      :crear-ciudad="crearCiudad"
      @guardar="guardarSede"
    />

    <ConfirmarEliminacionModal
      v-model="confirmacionAbierta"
      :titulo="`¿Dar de baja la sede ${sedeParaBaja?.nombre ?? ''}?`"
      texto-confirmar="Sí, dar de baja"
      :procesando="procesandoBaja"
      :error="errorBaja"
      @confirmar="confirmarBaja"
    >
      La sede <strong>{{ sedeParaBaja?.nombre }}</strong> dejará de aparecer en
      el registro y en el selector de sedes. Es una baja lógica: sus accesos,
      reservas y pagos se conservan para los reportes.
    </ConfirmarEliminacionModal>
  </div>
</template>
