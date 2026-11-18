<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSedeStore, type HorarioOperativo } from '@/store/sede'
import { useAuthStore } from '@/store/auth'
import canchasService from '@/modules/M4-canchas/services/canchas.service'
import { useCanchasRealtime } from '@/modules/M4-canchas/composables/useCanchasRealtime'
import GrillaTurnos from '@/modules/M4-canchas/components/GrillaTurnos.vue'
import ConfirmarReserva from '@/modules/M4-canchas/components/ConfirmarReserva.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import {
  obtenerFechaHoyLocal,
  formatearFechaDDMMAA,
  sumarDiasFechaLocal,
} from '@/common/utils/date'
import type {
  Cancha,
  CanchaTipo,
  TurnoSlot,
  TurnoSeleccionado,
  ReservaCanchaResponse,
  TurnoReservadoPayload,
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
const inicializado = ref(false)
const tiposCancha = ref<CanchaTipo[]>([])
const todasLasCanchasSede = ref<Cancha[]>([])
const disponibilidadMap = ref<Record<number, TurnoSlot[]>>({})
const turnoSeleccionado = ref<TurnoSeleccionado | null>(null)

// Horario operativo obtenido reactivamente desde la caché centralizada de sedeStore
const horarioOperativo = computed<HorarioOperativo | null>(() => {
  if (!sedeStore.sedeSeleccionada || !fechaSeleccionada.value) return null
  const key = `${sedeStore.sedeSeleccionada.id_sede}_${fechaSeleccionada.value}`
  return sedeStore.horariosCache[key] ?? null
})

// Modal de pre-confirmación de reserva
const modalConfirmarAbierto = ref(false)

// Canchas filtradas exclusivamente por el tipo de deporte seleccionado
const canchasFiltradas = computed(() => {
  return todasLasCanchasSede.value.filter(
    (c) => c.id_cancha_tipo === deporteSeleccionadoId.value
  )
})

// Disciplinas deportivas que efectivamente tienen canchas activas cargadas en la sede seleccionada
const tiposCanchaSede = computed<CanchaTipo[]>(() => {
  const canchasActivas = todasLasCanchasSede.value.filter(
    (c) => c.activo !== false
  )
  const idsTiposEnSede = new Set(canchasActivas.map((c) => c.id_cancha_tipo))
  const desdeCatalogo = tiposCancha.value.filter((t) =>
    idsTiposEnSede.has(t.id_cancha_tipo)
  )

  if (desdeCatalogo.length === idsTiposEnSede.size) {
    return desdeCatalogo
  }

  const idsIncluidos = new Set(desdeCatalogo.map((t) => t.id_cancha_tipo))
  const adicionales: CanchaTipo[] = []
  for (const cancha of canchasActivas) {
    if (
      !idsIncluidos.has(cancha.id_cancha_tipo) &&
      cancha.cancha_tipo?.descripcion
    ) {
      idsIncluidos.add(cancha.id_cancha_tipo)
      adicionales.push({
        id_cancha_tipo: cancha.id_cancha_tipo,
        descripcion: cancha.cancha_tipo.descripcion,
        activo: cancha.cancha_tipo.activo,
      })
    }
  }
  return [...desdeCatalogo, ...adicionales]
})

function sincronizarDeporteSeleccionado() {
  const disponibles = tiposCanchaSede.value
  if (
    disponibles.length > 0 &&
    !disponibles.some((t) => t.id_cancha_tipo === deporteSeleccionadoId.value)
  ) {
    deporteSeleccionadoId.value = disponibles[0].id_cancha_tipo
  }
}

/**
 * Consulta la disponibilidad de todas las canchas filtradas.
 * Consume de forma óptima la respuesta de GET /canchas/disponibilidad (que unifica
 * horario operativo y slots) o la caché central de sedeStore sin disparar peticiones redundantes.
 */
async function cargarDisponibilidad() {
  if (!sedeStore.sedeSeleccionada) return

  const idSede = sedeStore.sedeSeleccionada.id_sede
  const fecha = fechaSeleccionada.value
  const key = `${idSede}_${fecha}`

  // 1. Asegurar el horario operativo desde sedeStore (usa su caché interna si ya existe)
  if (!sedeStore.horariosCache[key]) {
    try {
      await sedeStore.obtenerHorarioOperativo(idSede, fecha)
    } catch (error) {
      console.error(
        '[CanchasView] Error al cargar horario operativo desde sedeStore:',
        error
      )
    }
  }

  // 2. Si la sede está cerrada y no tiene horario especial, no consultar turnos
  const horario = sedeStore.horariosCache[key]
  if (horario && !horario.abierto && !horario.es_horario_especial) {
    disponibilidadMap.value = {}
    return
  }

  // 3. Si no hay canchas configuradas para este deporte, limpiamos la grilla
  if (canchasFiltradas.value.length === 0) {
    disponibilidadMap.value = {}
    return
  }

  cargando.value = true
  turnoSeleccionado.value = null

  try {
    disponibilidadMap.value = await canchasService.getDisponibilidadPorSede(
      idSede,
      fecha,
      canchasFiltradas.value,
      esSocio.value,
      deporteSeleccionadoId.value
    )

    // Si la respuesta del backend no trajo el horario operativo, lo consultamos vía sedeStore
    if (!sedeStore.horariosCache[key]) {
      await sedeStore.obtenerHorarioOperativo(idSede, fecha)
    }
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
    // 1. Cargar catálogo de disciplinas y asegurar sedes en paralelo
    const [, tipos] = await Promise.all([
      sedeStore.sedes.length === 0
        ? sedeStore.cargarSedes()
        : Promise.resolve(),
      canchasService.getTiposCancha(),
    ])

    tiposCancha.value = tipos

    // 2. Con la sede activa y filtros listos, cargar canchas, sincronizar disciplina y consultar disponibilidad una sola vez
    if (sedeStore.sedeSeleccionada) {
      todasLasCanchasSede.value = await canchasService.getCanchasPorSede(
        sedeStore.sedeSeleccionada.id_sede
      )
      sincronizarDeporteSeleccionado()
      await cargarDisponibilidad()
    }
  } catch (error) {
    console.error('[CanchasView] Error al inicializar datos:', error)
    toast.error('Error al consultar canchas de la sede.')
  } finally {
    inicializado.value = true
  }
}

/**
 * Procesa en tiempo real el evento 'turno_reservado' emitido vía Supabase Broadcast
 */
function handleTurnoReservado(payload: TurnoReservadoPayload) {
  // Caso 1 (Fecha ajena): Si el payload no coincide con la fecha seleccionada en pantalla, ignorar mutación
  if (payload.fecha !== fechaSeleccionada.value) {
    return
  }

  // Caso 2 (Actualización de Grilla): Marcar el slot específico como 'RESERVADO' reactivamente
  const slots = disponibilidadMap.value[payload.id_cancha]
  if (slots && Array.isArray(slots)) {
    const slotEncontrado = slots.find(
      (s) => s.hora_inicio === payload.hora_inicio
    )
    if (slotEncontrado) {
      slotEncontrado.estado = 'RESERVADO'
      disponibilidadMap.value = { ...disponibilidadMap.value }
    }
  }

  // Verificar si coincide con el turno que el usuario tiene marcado actualmente
  const turno = turnoSeleccionado.value
  const esMismoTurno =
    turno !== null &&
    turno.cancha.id_cancha === payload.id_cancha &&
    turno.fecha === payload.fecha &&
    turno.slot.hora_inicio === payload.hora_inicio

  if (esMismoTurno) {
    // Caso 4 (Modal de confirmación abierto): Forzar cierre de modal y notificar advertencia
    if (modalConfirmarAbierto.value) {
      modalConfirmarAbierto.value = false
      turnoSeleccionado.value = null
      toast.warning(
        'El turno que estabas por confirmar fue ocupado por otro usuario.'
      )
      return
    }

    // Caso 3 (Slot seleccionado): Deseleccionar turno inmediatamente y alertar
    turnoSeleccionado.value = null
    toast.warning(
      'El turno que tenías seleccionado acaba de ser reservado por otro usuario.'
    )
  }
}

// Suscripción reactiva a Supabase Broadcast en el canal canchas:sede:${idSede}
useCanchasRealtime(() => sedeStore.idSedeSeleccionada, handleTurnoReservado)

const inputFechaRef = ref<HTMLInputElement | null>(null)

function cambiarDia(dias: number) {
  const nuevaFecha = sumarDiasFechaLocal(fechaSeleccionada.value, dias)
  if (nuevaFecha < fechaHoy) return
  fechaSeleccionada.value = nuevaFecha
}

function abrirSelectorFecha() {
  const input = inputFechaRef.value
  if (input && typeof input.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }
}

function handleSeleccionarTurno(payload: { cancha: Cancha; slot: TurnoSlot }) {
  const actual = turnoSeleccionado.value
  if (
    actual &&
    actual.cancha.id_cancha === payload.cancha.id_cancha &&
    actual.slot.hora_inicio === payload.slot.hora_inicio &&
    actual.fecha === fechaSeleccionada.value
  ) {
    turnoSeleccionado.value = null
    return
  }

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

function handleConflictoDisponibilidad(mensaje?: string) {
  console.warn('[CanchasView] Conflicto 409 en turno:', mensaje)
  modalConfirmarAbierto.value = false

  if (turnoSeleccionado.value) {
    const { cancha, slot, fecha } = turnoSeleccionado.value
    if (fecha === fechaSeleccionada.value) {
      const slots = disponibilidadMap.value[cancha.id_cancha]
      const slotEnGrilla = slots?.find(
        (s) => s.hora_inicio === slot.hora_inicio
      )
      if (slotEnGrilla) {
        slotEnGrilla.estado = 'RESERVADO'
        disponibilidadMap.value = { ...disponibilidadMap.value }
      }
    }
    turnoSeleccionado.value = null
  }
}

function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

// Reactividad a cambios en la sede activa (solo cuando el usuario cambia manualmente tras la inicialización)
watch(
  () => sedeStore.sedeSeleccionada?.id_sede,
  async (nuevoId, anteriorId) => {
    if (!inicializado.value || !nuevoId || nuevoId === anteriorId) return

    todasLasCanchasSede.value = await canchasService.getCanchasPorSede(nuevoId)
    const deporteAnterior = deporteSeleccionadoId.value
    sincronizarDeporteSeleccionado()
    if (deporteSeleccionadoId.value === deporteAnterior) {
      await cargarDisponibilidad()
    }
    toast.info(`Cargando canchas de ${sedeStore.sedeSeleccionada?.nombre}`)
  }
)

// Reactividad a cambios de fecha o deporte, deporte o estado de socio (solo tras inicialización)
watch([fechaSeleccionada, esSocio, deporteSeleccionadoId], async () => {
  sedeStore.fechaReferenciaHorario = fechaSeleccionada.value
  if (!inicializado.value) return
  await cargarDisponibilidad()
})

onMounted(() => {
  sedeStore.fechaReferenciaHorario = fechaSeleccionada.value
  inicializarDatos()
})

onUnmounted(() => {
  sedeStore.fechaReferenciaHorario = obtenerFechaHoyLocal()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado de la Sección -->
    <div class="pb-2 border-b border-slate-200">
      <h1 class="text-2xl font-bold text-[#202759] tracking-tight">
        Reserva de Canchas Deportivas
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Consultá los horarios disponibles en tu sede seleccionada.
      </p>
    </div>

    <!-- Barra de Filtros alineada en un único eje horizontal (h-10) -->
    <div
      class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-end justify-between gap-4"
    >
      <!-- Selector de Deporte / Disciplina -->
      <div class="flex-1 flex flex-col gap-1.5 min-w-0">
        <label class="text-xs font-semibold text-slate-700">
          Disciplina Deportiva
        </label>
        <div
          v-if="tiposCanchaSede.length > 0"
          class="h-10 flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80"
        >
          <button
            v-for="tipo in tiposCanchaSede"
            :key="tipo.id_cancha_tipo"
            type="button"
            :class="[
              'flex-1 h-full px-3 text-xs font-bold rounded-lg transition-all cursor-pointer select-none whitespace-nowrap flex items-center justify-center',
              deporteSeleccionadoId === tipo.id_cancha_tipo
                ? 'bg-[#202759] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60',
            ]"
            @click="deporteSeleccionadoId = tipo.id_cancha_tipo"
          >
            {{ tipo.descripcion }}
          </button>
        </div>
        <div
          v-else
          class="h-10 px-3 text-xs font-medium text-slate-500 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center"
        >
          Sin disciplinas cargadas en esta sede
        </div>
      </div>

      <!-- Selector de Fecha de Juego + Hoy + Actualizar (misma altura h-10) -->
      <div class="flex flex-col gap-1.5 shrink-0">
        <label
          for="input-fecha-juego"
          class="text-xs font-semibold text-slate-700"
        >
          Fecha de Juego
        </label>

        <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <!-- Stepper unificado de fecha: [ ‹ | 📅 dd/mm/aa | › ] -->
          <div
            class="h-10 p-1 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-1"
          >
            <button
              type="button"
              :disabled="fechaSeleccionada <= fechaHoy"
              title="Día anterior"
              aria-label="Día anterior"
              class="h-full w-8 rounded-lg text-slate-600 hover:bg-white hover:text-[#202759] hover:shadow-2xs transition-all cursor-pointer disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm select-none"
              @click="cambiarDia(-1)"
            >
              ‹
            </button>

            <div
              class="relative h-full px-3 bg-white rounded-lg shadow-2xs border border-slate-200/60 text-xs text-[#202759] flex items-center gap-2 hover:border-[#202759]/40 transition-all cursor-pointer"
              @click="abrirSelectorFecha"
            >
              <svg
                class="w-3.5 h-3.5 text-[#202759] shrink-0 pointer-events-none"
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
              <span class="font-mono font-bold tabular-nums select-none">
                {{ formatearFechaDDMMAA(fechaSeleccionada) }}
              </span>
              <input
                id="input-fecha-juego"
                ref="inputFechaRef"
                v-model="fechaSeleccionada"
                type="date"
                :min="fechaHoy"
                required
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <button
              type="button"
              title="Día siguiente"
              aria-label="Día siguiente"
              class="h-full w-8 rounded-lg text-slate-600 hover:bg-white hover:text-[#202759] hover:shadow-2xs transition-all cursor-pointer flex items-center justify-center font-bold text-sm select-none"
              @click="cambiarDia(1)"
            >
              ›
            </button>
          </div>

          <!-- Botón rápido Hoy (misma altura h-10) -->
          <button
            type="button"
            :disabled="fechaSeleccionada === fechaHoy"
            class="h-10 px-3 rounded-xl text-xs font-bold border transition-all select-none flex items-center justify-center shrink-0"
            :class="
              fechaSeleccionada === fechaHoy
                ? 'bg-slate-100 text-slate-400 border-slate-200/80 cursor-default'
                : 'bg-white text-[#202759] border-slate-300 hover:bg-slate-50 hover:border-[#202759] cursor-pointer shadow-2xs'
            "
            @click="fechaSeleccionada = fechaHoy"
          >
            Hoy
          </button>

          <!-- Botón Actualizar (misma altura h-10) -->
          <button
            type="button"
            :disabled="cargando"
            class="h-10 px-3.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-[#202759] hover:text-[#202759] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
            @click="cargarDisponibilidad"
          >
            <svg
              class="w-3.5 h-3.5 text-slate-600"
              :class="{ 'animate-spin': cargando }"
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
            <span>Actualizar</span>
          </button>
        </div>
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
              Socio
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
            <strong class="text-white">{{
              formatearFechaDDMMAA(turnoSeleccionado.fecha)
            }}</strong>
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
