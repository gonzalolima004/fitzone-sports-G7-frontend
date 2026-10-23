<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  PhPlus,
  PhPencilSimple,
  PhTrash,
  PhCheck,
  PhX,
  PhTag,
  PhWarningCircle,
  PhCourtBasketball,
  PhArrowCounterClockwise,
} from '@phosphor-icons/vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import axios from 'axios'
import canchasService from '../services/canchas.service'
import type { Cancha, CanchaTipo } from '../types/canchas.types'

interface Props {
  modelValue: boolean
  tipos: CanchaTipo[]
  canchas: Cancha[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'actualizado'): void
}>()

// Lista local reactiva para soportar filtrado por inactivos
const tiposLocales = ref<CanchaTipo[]>([])
const cargandoTipos = ref(false)

// Checkbox para incluir dados de baja / inactivos
const incluirInactivos = ref(false)

// Estado para creación
const nuevoNombre = ref('')
const guardandoNuevo = ref(false)

// Estado para edición inline
const idTipoEditando = ref<number | null>(null)
const nombreEditado = ref('')
const guardandoEdicion = ref(false)

// Estado para reactivación
const reactivandoId = ref<number | null>(null)

// Estado para confirmación de eliminación
const tipoAEliminar = ref<CanchaTipo | null>(null)
const procesandoEliminacion = ref(false)

// Cargar catálogo de tipos según el checkbox de inactivos
async function cargarListaTipos() {
  cargandoTipos.value = true
  try {
    // Si incluirInactivos es true enviamos inactivos=true para incluir dados de baja; sino omitimos
    const data = await canchasService.getTiposCancha(
      incluirInactivos.value ? true : undefined
    )
    tiposLocales.value = data
  } catch (error) {
    console.warn('Error al cargar tipos en el modal:', error)
    tiposLocales.value = props.tipos
  } finally {
    cargandoTipos.value = false
  }
}

// Sincronizar al abrir el modal o cambiar el prop
watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      cargarListaTipos()
    }
  },
  { immediate: true }
)

watch(
  () => props.tipos,
  () => {
    if (!cargandoTipos.value && !incluirInactivos.value) {
      tiposLocales.value = props.tipos.filter((t) => t.activo !== false)
    }
  }
)

// Calcula cuántas canchas activas utilizan un tipo determinado
function canchasActivasPorTipo(idTipo: number): number {
  return props.canchas.filter(
    (c) => c.id_cancha_tipo === idTipo && c.activo !== false
  ).length
}

// Iniciar creación
async function handleCrearTipo() {
  const nombreLimpio = nuevoNombre.value.trim()
  if (!nombreLimpio) {
    toast.warning('Por favor ingresá el nombre o descripción del deporte.')
    return
  }

  guardandoNuevo.value = true
  try {
    await canchasService.crearTipoCancha(nombreLimpio)
    toast.success(`Tipo de cancha "${nombreLimpio}" creado con éxito.`)
    nuevoNombre.value = ''
    await cargarListaTipos()
    emit('actualizado')
  } catch (error) {
    console.error('Error al crear tipo de cancha:', error)
    const mensajeBackend =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'No se pudo crear el tipo de cancha.'
    toast.error(mensajeBackend)
  } finally {
    guardandoNuevo.value = false
  }
}

// Iniciar edición
function iniciarEdicion(tipo: CanchaTipo) {
  idTipoEditando.value = tipo.id_cancha_tipo
  nombreEditado.value = tipo.descripcion || ''
}

function cancelarEdicion() {
  idTipoEditando.value = null
  nombreEditado.value = ''
}

// Guardar edición
async function handleGuardarEdicion(idTipo: number) {
  const nombreLimpio = nombreEditado.value.trim()
  if (!nombreLimpio) {
    toast.warning('El nombre del deporte no puede estar vacío.')
    return
  }

  guardandoEdicion.value = true
  try {
    await canchasService.actualizarTipoCancha(idTipo, {
      descripcion: nombreLimpio,
    })
    toast.success('Tipo de cancha actualizado correctamente.')
    idTipoEditando.value = null
    nombreEditado.value = ''
    await cargarListaTipos()
    emit('actualizado')
  } catch (error) {
    console.error('Error al actualizar tipo de cancha:', error)
    toast.error('No se pudo actualizar el tipo de cancha.')
  } finally {
    guardandoEdicion.value = false
  }
}

// Reactivar tipo de cancha
async function handleReactivar(tipo: CanchaTipo) {
  reactivandoId.value = tipo.id_cancha_tipo
  try {
    await canchasService.reactivarTipoCancha(tipo.id_cancha_tipo)
    toast.success(
      `Tipo de cancha "${tipo.descripcion}" reactivado exitosamente.`
    )
    await cargarListaTipos()
    emit('actualizado')
  } catch (error) {
    console.error('Error al reactivar tipo de cancha:', error)
    toast.error('No se pudo reactivar el tipo de cancha.')
  } finally {
    reactivandoId.value = null
  }
}

// Solicitar eliminación con validación estricta de canchas activas
function solicitarEliminar(tipo: CanchaTipo) {
  const cantActivas = canchasActivasPorTipo(tipo.id_cancha_tipo)
  if (cantActivas > 0) {
    toast.warning(
      `No podés dar de baja "${tipo.descripcion}". Hay ${cantActivas} cancha(s) activa(s) asignada(s) a este deporte.`
    )
    return
  }
  tipoAEliminar.value = tipo
}

function cancelarEliminar() {
  tipoAEliminar.value = null
}

// Confirmar baja lógica
async function confirmarEliminar() {
  if (!tipoAEliminar.value) return

  procesandoEliminacion.value = true
  try {
    await canchasService.eliminarTipoCancha(tipoAEliminar.value.id_cancha_tipo)
    toast.success(
      `Tipo de cancha "${tipoAEliminar.value.descripcion}" dado de baja exitosamente.`
    )
    tipoAEliminar.value = null
    await cargarListaTipos()
    emit('actualizado')
  } catch (error) {
    console.error('Error al eliminar tipo de cancha:', error)
    toast.error('No se pudo eliminar el tipo de cancha.')
  } finally {
    procesandoEliminacion.value = false
  }
}

function cerrarModal() {
  cancelarEdicion()
  cancelarEliminar()
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Tipos de Cancha"
    subtitle="Administrá las disciplinas deportivas del club para habilitar nuevas canchas"
    max-width="lg"
    @update:model-value="emit('update:modelValue', $event)"
    @close="cerrarModal"
  >
    <div class="space-y-6">
      <!-- Formulario para Agregar Nuevo Tipo -->
      <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <label
          class="block text-xs font-bold text-[#202759] uppercase tracking-wider mb-2"
        >
          Nuevo Deporte / Disciplina
        </label>
        <form
          class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          @submit.prevent="handleCrearTipo"
        >
          <div class="relative flex-1">
            <PhTag
              :size="18"
              class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              v-model="nuevoNombre"
              type="text"
              placeholder="Ej: Tenis, Pádel, Básquetbol..."
              class="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-800 placeholder:text-slate-400"
              :disabled="guardandoNuevo"
            />
          </div>
          <BaseButton
            type="submit"
            variant="primary"
            size="md"
            :loading="guardandoNuevo"
            :disabled="!nuevoNombre.trim()"
          >
            <template #icon>
              <PhPlus :size="16" weight="bold" />
            </template>
            Agregar
          </BaseButton>
        </form>
      </div>

      <!-- Diálogo de Confirmación de Eliminación Integrado -->
      <div
        v-if="tipoAEliminar"
        class="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-150"
      >
        <div class="flex items-start gap-3">
          <PhWarningCircle :size="24" class="text-[#F96167] shrink-0 mt-0.5" />
          <div>
            <h4 class="text-xs font-bold text-rose-900 uppercase tracking-wide">
              Confirmar baja de tipo de cancha
            </h4>
            <p class="text-xs text-rose-800 mt-1">
              ¿Estás seguro de que deseás dar de baja el tipo
              <strong>"{{ tipoAEliminar.descripcion }}"</strong>? No afectará
              registros históricos, pero ya no estará disponible para nuevas
              canchas.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="procesandoEliminacion"
            @click="cancelarEliminar"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            size="sm"
            :loading="procesandoEliminacion"
            @click="confirmarEliminar"
          >
            Confirmar Baja
          </BaseButton>
        </div>
      </div>

      <!-- Lista de Tipos Existentes -->
      <div>
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"
        >
          <div>
            <h4
              class="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Disciplinas Registradas ({{ tiposLocales.length }})
            </h4>
            <span class="text-[11px] text-slate-400">
              Solo se pueden dar de baja tipos sin canchas activas
            </span>
          </div>

          <!-- Checkbox para incluir dados de baja / inactivos -->
          <label
            class="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-[#202759] font-semibold bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-xl transition-colors"
          >
            <input
              v-model="incluirInactivos"
              type="checkbox"
              class="w-4 h-4 rounded text-[#202759] border-slate-300 focus:ring-[#202759] cursor-pointer"
              @change="cargarListaTipos"
            />
            <span>Incluir dados de baja</span>
          </label>
        </div>

        <!-- Indicador de carga -->
        <div
          v-if="cargandoTipos"
          class="p-6 text-center text-slate-400 text-xs font-medium"
        >
          Actualizando lista de disciplinas...
        </div>

        <!-- Estado vacío -->
        <div
          v-else-if="tiposLocales.length === 0"
          class="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400"
        >
          <PhCourtBasketball :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-xs font-medium">No hay tipos de cancha registrados.</p>
        </div>

        <!-- Lista de tipos -->
        <div
          v-else
          class="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white"
        >
          <div
            v-for="tipo in tiposLocales"
            :key="tipo.id_cancha_tipo"
            class="p-3.5 sm:px-4 flex items-center justify-between gap-3 transition-colors"
            :class="[
              tipo.activo === false
                ? 'bg-slate-50/70 opacity-90'
                : 'hover:bg-slate-50/70',
            ]"
          >
            <!-- Lado izquierdo: Edición o Visualización -->
            <div class="flex-1 min-w-0">
              <!-- Modo Edición Inline -->
              <div
                v-if="idTipoEditando === tipo.id_cancha_tipo"
                class="flex items-center gap-2"
              >
                <input
                  v-model="nombreEditado"
                  type="text"
                  class="w-full max-w-xs px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759]"
                  placeholder="Nombre de la disciplina"
                  :disabled="guardandoEdicion"
                  @keyup.enter="handleGuardarEdicion(tipo.id_cancha_tipo)"
                  @keyup.esc="cancelarEdicion"
                />
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  title="Guardar cambios"
                  :disabled="guardandoEdicion || !nombreEditado.trim()"
                  @click="handleGuardarEdicion(tipo.id_cancha_tipo)"
                >
                  <PhCheck :size="16" weight="bold" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Cancelar"
                  :disabled="guardandoEdicion"
                  @click="cancelarEdicion"
                >
                  <PhX :size="16" weight="bold" />
                </button>
              </div>

              <!-- Modo Lectura Normal -->
              <div v-else class="flex flex-wrap items-center gap-2">
                <span
                  class="text-sm font-semibold"
                  :class="[
                    tipo.activo === false ? 'text-slate-500' : 'text-[#202759]',
                  ]"
                >
                  {{ tipo.descripcion || `Tipo #${tipo.id_cancha_tipo}` }}
                </span>

                <!-- Badge si está dado de baja -->
                <span
                  v-if="tipo.activo === false"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70"
                >
                  Dado de baja
                </span>

                <!-- Badge de canchas activas -->
                <span
                  v-else-if="canchasActivasPorTipo(tipo.id_cancha_tipo) > 0"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                >
                  {{ canchasActivasPorTipo(tipo.id_cancha_tipo) }}
                  {{
                    canchasActivasPorTipo(tipo.id_cancha_tipo) === 1
                      ? 'cancha activa'
                      : 'canchas activas'
                  }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500"
                >
                  Sin canchas activas
                </span>
              </div>
            </div>

            <!-- Lado derecho: Acciones de Fila -->
            <div
              v-if="idTipoEditando !== tipo.id_cancha_tipo"
              class="flex items-center gap-1 shrink-0"
            >
              <!-- Si el tipo está dado de baja: Botón Reactivar -->
              <BaseButton
                v-if="tipo.activo === false"
                variant="outline"
                size="sm"
                :loading="reactivandoId === tipo.id_cancha_tipo"
                title="Reactivar esta disciplina deportiva"
                @click="handleReactivar(tipo)"
              >
                <template #icon>
                  <PhArrowCounterClockwise :size="14" weight="bold" />
                </template>
                Reactivar
              </BaseButton>

              <!-- Si el tipo está activo: Botón Editar y Botón Eliminar -->
              <template v-else>
                <!-- Botón Editar -->
                <button
                  type="button"
                  class="p-2 rounded-lg text-slate-400 hover:text-[#202759] hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Editar nombre"
                  @click="iniciarEdicion(tipo)"
                >
                  <PhPencilSimple :size="16" />
                </button>

                <!-- Botón Eliminar / Dar de baja -->
                <button
                  type="button"
                  class="p-2 rounded-lg transition-colors cursor-pointer"
                  :class="[
                    canchasActivasPorTipo(tipo.id_cancha_tipo) > 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-400 hover:text-[#F96167] hover:bg-rose-50',
                  ]"
                  :title="
                    canchasActivasPorTipo(tipo.id_cancha_tipo) > 0
                      ? `Bloqueado: existen ${canchasActivasPorTipo(tipo.id_cancha_tipo)} cancha(s) activa(s) con este tipo`
                      : 'Dar de baja tipo de cancha'
                  "
                  @click="solicitarEliminar(tipo)"
                >
                  <PhTrash :size="16" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pie del Modal -->
    <template #actions>
      <BaseButton variant="outline" @click="cerrarModal"> Cerrar </BaseButton>
    </template>
  </BaseModal>
</template>
