<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  PhWrench,
  PhCalendarBlank,
  PhSlidersHorizontal,
  PhPlus,
  PhArrowsClockwise,
  PhPencilSimple,
  PhTrash,
  PhWarningCircle,
  PhClock,
  PhCheckCircle,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import { toast } from '@/common/utils/toast'
import axios from 'axios'
import canchasService from '../services/canchas.service'
import MantenimientoModal from './MantenimientoModal.vue'
import type {
  Cancha,
  CrearMantenimientoDto,
  MantenimientoResponseDto,
} from '../types/canchas.types'
import type { Sede } from '@/store/sede'

interface Props {
  sedes: Sede[]
  canchas: Cancha[]
  sedeSeleccionadaId?: number | ''
}

const props = withDefaults(defineProps<Props>(), {
  sedeSeleccionadaId: '',
})

const mantenimientos = ref<MantenimientoResponseDto[]>([])
const cargando = ref(false)
const guardando = ref(false)
const eliminando = ref(false)

const idSedeFiltro = ref<number | ''>(props.sedeSeleccionadaId)
const idCanchaFiltro = ref<number | ''>('')
const fechaDesde = ref('')
const fechaHasta = ref('')
const estadoFiltro = ref<'todos' | 'en_curso' | 'programados' | 'finalizados'>(
  'todos'
)

const modalMantenimientoAbierto = ref(false)
const mantenimientoParaEditar = ref<MantenimientoResponseDto | null>(null)
const canchaParaMantenimiento = ref<Cancha | null>(null)

const modalEliminarAbierto = ref(false)
const mantenimientoParaEliminar = ref<MantenimientoResponseDto | null>(null)

watch(
  () => props.sedeSeleccionadaId,
  (val) => {
    if (val !== undefined) idSedeFiltro.value = val
  }
)

const canchasFiltradasPorSede = computed(() => {
  if (idSedeFiltro.value === '') {
    return props.canchas.filter((c) => c.activo !== false)
  }
  return props.canchas.filter(
    (c) => c.activo !== false && c.id_sede === Number(idSedeFiltro.value)
  )
})

function extraerMensajeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined
    if (Array.isArray(data?.message)) {
      return data.message.join('. ')
    }
    if (typeof data?.message === 'string') {
      return data.message
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

async function cargarMantenimientos() {
  cargando.value = true
  try {
    const filtros = {
      sedeId:
        idSedeFiltro.value !== '' ? Number(idSedeFiltro.value) : undefined,
      canchaId:
        idCanchaFiltro.value !== '' ? Number(idCanchaFiltro.value) : undefined,
      fechaInicio: fechaDesde.value || undefined,
      fechaFin: fechaHasta.value || undefined,
    }
    mantenimientos.value = await canchasService.getMantenimientos(filtros)
  } catch (error) {
    console.error('Error al cargar mantenimientos:', error)
    toast.error(
      extraerMensajeError(error, 'No se pudieron consultar los mantenimientos.')
    )
  } finally {
    cargando.value = false
  }
}

function resolverNombreCancha(idCancha: number): string {
  const c = props.canchas.find((item) => item.id_cancha === idCancha)
  return c ? c.nombre : `Cancha #${idCancha}`
}

function resolverNombreSede(idCancha: number): string {
  const c = props.canchas.find((item) => item.id_cancha === idCancha)
  if (!c) return 'Sede desconocida'
  const s = props.sedes.find((item) => item.id_sede === c.id_sede)
  return s ? s.nombre : `Sede #${c.id_sede}`
}

function determinarEstado(
  inicioStr: string,
  finStr: string
): 'en_curso' | 'programado' | 'finalizado' {
  const ahora = Date.now()
  const inicio = new Date(inicioStr).getTime()
  const fin = new Date(finStr).getTime()
  if (ahora >= inicio && ahora <= fin) return 'en_curso'
  if (ahora < inicio) return 'programado'
  return 'finalizado'
}

const mantenimientosFiltrados = computed(() => {
  return mantenimientos.value.filter((m) => {
    if (idSedeFiltro.value !== '') {
      const c = props.canchas.find((item) => item.id_cancha === m.id_cancha)
      if (c && c.id_sede !== Number(idSedeFiltro.value)) return false
    }
    if (
      idCanchaFiltro.value !== '' &&
      m.id_cancha !== Number(idCanchaFiltro.value)
    ) {
      return false
    }
    if (estadoFiltro.value !== 'todos') {
      const estado = determinarEstado(m.fecha_inicio, m.fecha_fin)
      if (estadoFiltro.value === 'en_curso' && estado !== 'en_curso')
        return false
      if (estadoFiltro.value === 'programados' && estado !== 'programado')
        return false
      if (estadoFiltro.value === 'finalizados' && estado !== 'finalizado')
        return false
    }
    return true
  })
})

function formatearRangoFechas(inicioStr: string, finStr: string): string {
  try {
    const inicio = new Date(inicioStr)
    const fin = new Date(finStr)
    const fInicio = inicio.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const hInicio = inicio
      .toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      .replace(/([pa]\.)\s(m\.)/g, '$1$2')
    const fFin = fin.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const hFin = fin
      .toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      .replace(/([pa]\.)\s(m\.)/g, '$1$2')
    if (fInicio === fFin) return `${fInicio} · ${hInicio} a ${hFin}`
    return `${fInicio} ${hInicio} - ${fFin} ${hFin}`
  } catch {
    return `${inicioStr} - ${finStr}`
  }
}

function abrirCrear() {
  mantenimientoParaEditar.value = null
  canchaParaMantenimiento.value = null
  modalMantenimientoAbierto.value = true
}

function abrirEditar(m: MantenimientoResponseDto) {
  mantenimientoParaEditar.value = m
  canchaParaMantenimiento.value =
    props.canchas.find((c) => c.id_cancha === m.id_cancha) || null
  modalMantenimientoAbierto.value = true
}

async function handleGuardarMantenimiento(
  dto: CrearMantenimientoDto,
  idMantenimiento?: number,
  idCancha?: number
) {
  guardando.value = true
  try {
    if (idMantenimiento) {
      await canchasService.actualizarMantenimiento(idMantenimiento, dto)
      toast.success('Mantenimiento actualizado exitosamente.')
    } else {
      const cid = idCancha || canchaParaMantenimiento.value?.id_cancha
      if (!cid) {
        toast.error('Debe indicar una cancha válida.')
        return
      }
      await canchasService.programarMantenimiento(cid, dto)
      toast.success('Mantenimiento programado exitosamente.')
    }
    modalMantenimientoAbierto.value = false
    await cargarMantenimientos()
  } catch (error) {
    console.error('Error al guardar mantenimiento:', error)
    toast.error(
      extraerMensajeError(error, 'No se pudo guardar el mantenimiento.')
    )
  } finally {
    guardando.value = false
  }
}

function abrirEliminar(m: MantenimientoResponseDto) {
  mantenimientoParaEliminar.value = m
  modalEliminarAbierto.value = true
}

async function handleConfirmarEliminar() {
  if (!mantenimientoParaEliminar.value) return
  eliminando.value = true
  try {
    await canchasService.eliminarMantenimiento(
      mantenimientoParaEliminar.value.id_cancha_mantenimiento
    )
    toast.success('Mantenimiento cancelado exitosamente.')
    modalEliminarAbierto.value = false
    await cargarMantenimientos()
  } catch (error) {
    console.error('Error al cancelar mantenimiento:', error)
    toast.error(
      extraerMensajeError(error, 'No se pudo cancelar el mantenimiento.')
    )
  } finally {
    eliminando.value = false
  }
}

onMounted(() => {
  cargarMantenimientos()
})
</script>

<template>
  <div class="space-y-6">
    <div
      class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
    >
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-[#202759]/10 text-[#202759] flex items-center justify-center font-bold"
          >
            <PhWrench :size="18" weight="bold" />
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-[#202759]">
              Bloqueos y Mantenimientos Programados
            </h2>
            <p class="text-xs text-slate-500">
              Consultá y gestioná las ventanas donde las canchas quedan
              inhabilitadas para reserva.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <BaseButton
            variant="outline"
            size="md"
            title="Recargar listado"
            :loading="cargando"
            @click="cargarMantenimientos"
          >
            <template #icon>
              <PhArrowsClockwise :size="16" />
            </template>
            Refrescar
          </BaseButton>

          <BaseButton variant="primary" size="md" @click="abrirCrear">
            <template #icon>
              <PhPlus :size="16" weight="bold" />
            </template>
            Programar Mantenimiento
          </BaseButton>
        </div>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100"
      >
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-semibold text-slate-600 flex items-center gap-1.5"
          >
            <PhSlidersHorizontal :size="14" class="text-slate-400" />
            Sede
          </label>
          <select
            v-model="idSedeFiltro"
            class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
            @change="cargarMantenimientos"
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

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-600">Cancha</label>
          <select
            v-model="idCanchaFiltro"
            class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
            @change="cargarMantenimientos"
          >
            <option value="">Todas las canchas</option>
            <option
              v-for="cancha in canchasFiltradasPorSede"
              :key="cancha.id_cancha"
              :value="cancha.id_cancha"
            >
              {{ cancha.nombre }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-semibold text-slate-600 flex items-center gap-1.5"
          >
            <PhCalendarBlank :size="14" class="text-slate-400" />
            Desde
          </label>
          <input
            v-model="fechaDesde"
            type="date"
            class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
            @change="cargarMantenimientos"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-semibold text-slate-600 flex items-center gap-1.5"
          >
            <PhCalendarBlank :size="14" class="text-slate-400" />
            Hasta
          </label>
          <input
            v-model="fechaHasta"
            type="date"
            class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
            @change="cargarMantenimientos"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-600">Estado</label>
          <select
            v-model="estadoFiltro"
            class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
          >
            <option value="todos">Todos los estados</option>
            <option value="en_curso">En Curso Actualmente</option>
            <option value="programados">Programados (Futuros)</option>
            <option value="finalizados">Finalizados (Pasados)</option>
          </select>
        </div>
      </div>
    </div>

    <div
      v-if="cargando"
      class="p-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs"
    >
      <div
        class="animate-spin w-8 h-8 border-3 border-[#202759] border-t-transparent rounded-full"
      ></div>
      <p class="text-xs sm:text-sm font-medium text-slate-500">
        Cargando historial de mantenimientos...
      </p>
    </div>

    <div
      v-else-if="mantenimientosFiltrados.length === 0"
      class="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs"
    >
      <div
        class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1"
      >
        <PhWrench :size="28" />
      </div>
      <h3 class="text-base font-bold text-[#202759]">
        No hay mantenimientos registrados
      </h3>
      <p class="text-xs sm:text-sm text-slate-500 max-w-md">
        No se encontraron bloqueos por mantenimiento que coincidan con los
        filtros seleccionados. Podés programar uno nuevo con el botón superior.
      </p>
      <div class="mt-2">
        <BaseButton variant="primary" size="sm" @click="abrirCrear">
          Programar Mantenimiento
        </BaseButton>
      </div>
    </div>

    <div
      v-else
      class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead
            class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider"
          >
            <tr>
              <th class="py-3 px-4">Cancha / Sede</th>
              <th class="py-3 px-4">Período de Mantenimiento</th>
              <th class="py-3 px-4">Estado</th>
              <th class="py-3 px-4">Motivo</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="item in mantenimientosFiltrados"
              :key="item.id_cancha_mantenimiento"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="py-3.5 px-4 font-medium">
                <div class="font-bold text-[#202759]">
                  {{ resolverNombreCancha(item.id_cancha) }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ resolverNombreSede(item.id_cancha) }}
                </div>
              </td>

              <td class="py-3.5 px-4 font-mono text-xs text-slate-600">
                <div class="flex items-center gap-1.5">
                  <PhClock :size="15" class="text-slate-400 shrink-0" />
                  <span>
                    {{
                      formatearRangoFechas(item.fecha_inicio, item.fecha_fin)
                    }}
                  </span>
                </div>
              </td>

              <td class="py-3.5 px-4">
                <span
                  v-if="
                    determinarEstado(item.fecha_inicio, item.fecha_fin) ===
                    'en_curso'
                  "
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                  ></span>
                  En Curso
                </span>
                <span
                  v-else-if="
                    determinarEstado(item.fecha_inicio, item.fecha_fin) ===
                    'programado'
                  "
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <PhCalendarBlank :size="13" />
                  Programado
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                >
                  <PhCheckCircle :size="13" />
                  Finalizado
                </span>
              </td>

              <td class="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                {{ item.motivo || 'Sin motivo detallado' }}
              </td>

              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-600 hover:text-[#202759] hover:bg-slate-100 transition-colors"
                    title="Editar mantenimiento"
                    @click="abrirEditar(item)"
                  >
                    <PhPencilSimple :size="16" weight="bold" />
                  </button>

                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Cancelar o eliminar mantenimiento"
                    @click="abrirEliminar(item)"
                  >
                    <PhTrash :size="16" weight="bold" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <MantenimientoModal
      v-model="modalMantenimientoAbierto"
      :cancha="canchaParaMantenimiento"
      :mantenimiento="mantenimientoParaEditar"
      :canchas-disponibles="canchas"
      :sedes="sedes"
      :sede-inicial-id="idSedeFiltro"
      :guardando="guardando"
      @guardar="handleGuardarMantenimiento"
    />

    <BaseModal
      :model-value="modalEliminarAbierto"
      title="Cancelar Mantenimiento"
      max-width="sm"
      @update:model-value="modalEliminarAbierto = $event"
    >
      <div class="space-y-4">
        <div
          class="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-800"
        >
          <PhWarningCircle :size="24" class="text-[#F96167] shrink-0 mt-0.5" />
          <div class="text-xs leading-relaxed">
            ¿Estás seguro de que deseas cancelar este mantenimiento para la
            cancha
            <strong>{{
              mantenimientoParaEliminar
                ? resolverNombreCancha(mantenimientoParaEliminar.id_cancha)
                : ''
            }}</strong
            >?
          </div>
        </div>

        <p class="text-xs text-slate-500 leading-relaxed">
          Los turnos bloqueados dentro de esta franja horaria volverán a quedar
          disponibles para reserva según el horario operativo de la sede.
        </p>
      </div>

      <template #actions>
        <BaseButton
          variant="outline"
          :disabled="eliminando"
          @click="modalEliminarAbierto = false"
        >
          Volver
        </BaseButton>
        <BaseButton
          variant="danger"
          :loading="eliminando"
          @click="handleConfirmarEliminar"
        >
          Confirmar Cancelación
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
