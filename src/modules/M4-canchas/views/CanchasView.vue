<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSedeStore } from '@/store/sede'
import { useAuthStore } from '@/store/auth'
import canchasService from '@/modules/M4-canchas/services/canchas.service'
import GrillaTurnos from '@/modules/M4-canchas/components/GrillaTurnos.vue'
import ConfirmarReserva from '@/modules/M4-canchas/components/ConfirmarReserva.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import { toast } from '@/common/utils/toast'
import { obtenerFechaHoyLocal } from '@/common/utils/date'
import type {
  Cancha,
  CanchaTipo,
  TurnoSlot,
  TurnoSeleccionado,
  ReservaCanchaResponse,
  HorarioOperativoDia,
} from '@/modules/M4-canchas/types/canchas.types'
import { useRouter } from 'vue-router'

const sedeStore = useSedeStore()
const authStore = useAuthStore()
const router = useRouter()

// Determina si el usuario actual es socio activo para aplicar descuento en el estimado
const esSocio = computed(() => {
  return (
    (authStore.isAuthenticated || !!authStore.token) &&
    (authStore.rol === 'socio' || authStore.usuario?.rol === 'socio')
  )
})

// Obtener fecha de hoy en formato YYYY-MM-DD en zona horaria local
const fechaHoy = obtenerFechaHoyLocal()

// Estados reactivos de filtros
const fechaSeleccionada = ref<string>(fechaHoy)
const deporteSeleccionadoId = ref<number>(1) // 1: Pádel por defecto

// Estados reactivos de datos
const cargando = ref(false)
const tiposCancha = ref<CanchaTipo[]>([])
const todasLasCanchasSede = ref<Cancha[]>([])
const disponibilidadMap = ref<Record<number, TurnoSlot[]>>({})
const turnoSeleccionado = ref<TurnoSeleccionado | null>(null)
const horarioOperativo = ref<HorarioOperativoDia | null>(null)

// Modal de pre-confirmación de reserva
const modalConfirmarAbierto = ref(false)

// Canchas filtradas exclusivamente por el tipo de deporte seleccionado
const canchasFiltradas = computed(() => {
  return todasLasCanchasSede.value.filter(
    (c) => c.id_cancha_tipo === deporteSeleccionadoId.value
  )
})

// Desuscriptores de Supabase Realtime
const unsubscribeFns: Array<() => void> = []

/**
 * Consulta la disponibilidad de todas las canchas filtradas
 * consumiendo GET /canchas/:id/disponibilidad
 */
async function cargarDisponibilidad() {
  if (sedeStore.sedeSeleccionada) {
    horarioOperativo.value = await canchasService.getHorarioOperativo(
      sedeStore.sedeSeleccionada.id_sede,
      fechaSeleccionada.value
    )
  }

  if (
    canchasFiltradas.value.length === 0 ||
    (horarioOperativo.value && !horarioOperativo.value.abierto)
  ) {
    disponibilidadMap.value = {}
    return
  }

  cargando.value = true
  turnoSeleccionado.value = null

  try {
    disponibilidadMap.value = await canchasService.getDisponibilidadPorSede(
      sedeStore.sedeSeleccionada!.id_sede,
      fechaSeleccionada.value,
      canchasFiltradas.value,
      esSocio.value
    )
  } catch (error) {
    console.error('[CanchasView] Error al cargar disponibilidad:', error)
    toast.error('No se pudo cargar la disponibilidad de canchas.')
  } finally {
    cargando.value = false
  }
}

/**
 * Carga el catálogo de deportes y las canchas de la sede activa
 */
async function inicializarDatos() {
  try {
    tiposCancha.value = await canchasService.getTiposCancha()
    if (
      tiposCancha.value.length > 0 &&
      !tiposCancha.value.some(
        (t) => t.id_cancha_tipo === deporteSeleccionadoId.value
      )
    ) {
      deporteSeleccionadoId.value = tiposCancha.value[0].id_cancha_tipo
    }

    if (sedeStore.sedeSeleccionada) {
      todasLasCanchasSede.value = await canchasService.getCanchasPorSede(
        sedeStore.sedeSeleccionada.id_sede
      )
      await cargarDisponibilidad()
      //suscribirRealtime()
    }
  } catch (error) {
    console.error('[CanchasView] Error al inicializar datos:', error)
    toast.error('Error al consultar canchas de la sede.')
  }
}

/**
 * Configura la suscripción a Supabase Realtime para la sede y canchas visibles
 */
function suscribirRealtime() {
  unsubscribeFns.forEach((fn) => fn())
  unsubscribeFns.length = 0

  canchasFiltradas.value.forEach((cancha) => {
    const unsub = canchasService.suscribirCambiosDisponibilidad(
      cancha.id_cancha,
      () => {
        toast.info(`Actualización en vivo en ${cancha.nombre}`)
        canchasService
          .getDisponibilidad(
            cancha.id_cancha,
            fechaSeleccionada.value,
            Number(cancha.costo_base),
            esSocio.value
          )
          .then((res) => {
            disponibilidadMap.value = {
              ...disponibilidadMap.value,
              [cancha.id_cancha]: res.slots,
            }
          })
      }
    )
    unsubscribeFns.push(unsub)
  })
}

function handleSeleccionarTurno(payload: { cancha: Cancha; slot: TurnoSlot }) {
  turnoSeleccionado.value = {
    cancha: payload.cancha,
    slot: payload.slot,
    fecha: fechaSeleccionada.value,
  }
}

function abrirConfirmacion() {
  if (!turnoSeleccionado.value) return
  modalConfirmarAbierto.value = true
}

function handleReservaConfirmada(reserva: ReservaCanchaResponse) {
  turnoSeleccionado.value = null
  router.push({
    name: 'canchas-detalle-reserva',
    params: { id: reserva.id_cancha_reserva },
  })
}

function handleConflictoDisponibilidad(mensaje: string) {
  console.warn('[CanchasView] Conflicto en turno:', mensaje)
  cargarDisponibilidad()
}

function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

// Reactividad a cambios en la sede activa
watch(
  () => sedeStore.sedeSeleccionada,
  async () => {
    if (sedeStore.sedeSeleccionada) {
      todasLasCanchasSede.value = await canchasService.getCanchasPorSede(
        sedeStore.sedeSeleccionada.id_sede
      )
      await cargarDisponibilidad()
      //suscribirRealtime()
      toast.info(`Cargando canchas de ${sedeStore.sedeSeleccionada.nombre}`)
    }
  }
)

// Reactividad a cambios de fecha o deporte, deporte o estado de socio
watch([fechaSeleccionada, esSocio], async () => {
  await cargarDisponibilidad()
  //suscribirRealtime()
})

onMounted(() => {
  //sedeStore.cargarSedes()
  inicializarDatos()
})

onUnmounted(() => {
  unsubscribeFns.forEach((fn) => fn())
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado de la Sección -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200"
    >
      <div>
        <h1 class="text-2xl font-bold text-[#202759] tracking-tight">
          Reserva de Canchas Deportivas
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Consultá los horarios disponibles para Pádel y Fútbol 5 en tu sede
          seleccionada.
        </p>
      </div>

      <!-- Indicador de Sede Activa y Horario Operativo -->
      <div
        class="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs"
      >
        <div class="flex items-center gap-1.5">
          <svg
            class="w-4 h-4 text-[#202759]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span
            >Sede activa:
            <strong class="text-[#202759]">{{
              sedeStore.sedeSeleccionada?.nombre
            }}</strong></span
          >
        </div>

        <span class="text-slate-300">|</span>

        <!-- Horario del día según SedeHorario / Calendario -->
        <div v-if="horarioOperativo" class="flex items-center gap-1">
          <span
            v-if="horarioOperativo.abierto"
            class="text-emerald-700 font-semibold font-mono tabular-nums"
          >
            Horario: {{ horarioOperativo.hora_apertura }} a
            {{ horarioOperativo.hora_cierre }} hs
          </span>
          <span v-else class="text-[#F96167] font-bold"> Sede Cerrada </span>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div
      class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-end gap-5"
    >
      <!-- Selector de Deporte / Disciplina -->
      <div class="flex-1 flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-700">
          Disciplina Deportiva
        </label>
        <div
          class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80"
        >
          <button
            v-for="tipo in tiposCancha"
            :key="tipo.id_cancha_tipo"
            type="button"
            :class="[
              'flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer select-none whitespace-nowrap',
              deporteSeleccionadoId === tipo.id_cancha_tipo
                ? 'bg-[#202759] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60',
            ]"
            @click="deporteSeleccionadoId = tipo.id_cancha_tipo"
          >
            {{ tipo.descripcion }}
          </button>
        </div>
      </div>

      <!-- Selector de Fecha de Juego -->
      <div class="w-full md:w-64">
        <BaseInput
          v-model="fechaSeleccionada"
          label="Fecha de Juego"
          type="date"
          :min="fechaHoy"
          required
          hint="Turnos disponibles según horario de sede."
        />
      </div>

      <!-- Botón de Refresco Manual -->
      <div class="shrink-0">
        <BaseButton
          variant="outline"
          :loading="cargando"
          @click="cargarDisponibilidad"
        >
          <svg
            class="w-4 h-4 mr-1 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </BaseButton>
      </div>
    </div>

    <!-- Grilla de Disponibilidad -->
    <GrillaTurnos
      :canchas="canchasFiltradas"
      :disponibilidad-map="disponibilidadMap"
      :turno-seleccionado="turnoSeleccionado"
      :cargando="cargando"
      :fecha="fechaSeleccionada"
      :fecha-hoy="fechaHoy"
      :horario-operativo="horarioOperativo"
      @seleccionar-turno="handleSeleccionarTurno"
    />

    <!-- Barra Inferior Flotante de Turno Seleccionado (sin Transition conflictivo) -->
    <div
      v-if="turnoSeleccionado"
      class="sticky bottom-4 z-30 bg-[#202759] text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200"
    >
      <div class="flex items-center gap-4 text-left">
        <div
          class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0"
        >
          <svg
            class="w-6 h-6 text-[#F96167]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-300">
              Turno Seleccionado
            </span>
            <span
              v-if="turnoSeleccionado.slot.es_horario_pico"
              class="text-[10px] bg-[#F96167] text-white px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider"
            >
              Horario Pico (+20%)
            </span>
            <span
              v-if="esSocio"
              class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider"
            >
              Socio (-15%)
            </span>
          </div>

          <div
            class="text-base font-bold text-white flex items-center gap-2 mt-0.5"
          >
            <span>{{ turnoSeleccionado.cancha.nombre }}</span>
            <span class="text-slate-400">·</span>
            <span class="font-mono tabular-nums text-slate-200"
              >{{ turnoSeleccionado.slot.hora_inicio }} a
              {{ turnoSeleccionado.slot.hora_fin }} hs</span
            >
          </div>

          <div class="text-xs text-slate-300 mt-0.5">
            Fecha:
            <strong class="text-white">{{ turnoSeleccionado.fecha }}</strong>
            <span class="mx-1 text-slate-400">|</span>
            Tarifa estimada:
            <strong class="text-[#F96167] font-mono text-sm ml-1">{{
              formatoMoneda(turnoSeleccionado.slot.precio_estimado)
            }}</strong>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <BaseButton
          variant="outline"
          size="md"
          class="flex-1 sm:flex-none !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
          @click="turnoSeleccionado = null"
        >
          Deseleccionar
        </BaseButton>

        <BaseButton
          variant="secondary"
          size="md"
          class="flex-1 sm:flex-none shadow-md"
          @click="abrirConfirmacion"
        >
          Continuar Reserva
        </BaseButton>
      </div>
    </div>

    <!-- Modal con v-if condicional para desmontaje limpio -->
    <ConfirmarReserva
      v-if="modalConfirmarAbierto"
      v-model="modalConfirmarAbierto"
      :turno="turnoSeleccionado"
      :nombre-sede="sedeStore.sedeSeleccionada?.nombre || 'Sede Seleccionada'"
      @reserva-confirmada="handleReservaConfirmada"
      @conflicto-disponibilidad="handleConflictoDisponibilidad"
    />
  </div>
</template>
