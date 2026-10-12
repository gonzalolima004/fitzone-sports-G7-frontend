<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSedeStore } from '@/store/sede'
import canchasService from '@/modules/M4-canchas/services/canchas.service'
import GrillaTurnos from '@/modules/M4-canchas/components/GrillaTurnos.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import { toast } from '@/common/utils/toast'
import type {
  Cancha,
  CanchaTipo,
  TurnoSlot,
  TurnoSeleccionado,
} from '@/modules/M4-canchas/types/canchas.types'

const sedeStore = useSedeStore()

// Obtener fecha de hoy en formato YYYY-MM-DD
const fechaHoy = new Date().toISOString().split('T')[0]

// Estados reactivos de filtros
const fechaSeleccionada = ref<string>(fechaHoy)
const deporteSeleccionadoId = ref<number>(1) // 1: Pádel por defecto

// Estados reactivos de datos
const cargando = ref(false)
const tiposCancha = ref<CanchaTipo[]>([])
const todasLasCanchasSede = ref<Cancha[]>([])
const disponibilidadMap = ref<Record<number, TurnoSlot[]>>({})
const turnoSeleccionado = ref<TurnoSeleccionado | null>(null)

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
  if (canchasFiltradas.value.length === 0) {
    disponibilidadMap.value = {}
    return
  }

  cargando.value = true
  turnoSeleccionado.value = null

  try {
    const mapa: Record<number, TurnoSlot[]> = {}

    // Consultamos la disponibilidad en paralelo para las canchas del deporte
    await Promise.all(
      canchasFiltradas.value.map(async (cancha) => {
        const res = await canchasService.getDisponibilidad(
          cancha.id_cancha,
          fechaSeleccionada.value
        )
        mapa[cancha.id_cancha] = res.slots
      })
    )

    disponibilidadMap.value = mapa
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
      suscribirRealtime()
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
  // Limpiar suscripciones previas
  unsubscribeFns.forEach((fn) => fn())
  unsubscribeFns.length = 0

  canchasFiltradas.value.forEach((cancha) => {
    const unsub = canchasService.suscribirCambiosDisponibilidad(
      cancha.id_cancha,
      (payload) => {
        console.log(
          '[Supabase Realtime] Cambio en cancha:',
          cancha.id_cancha,
          payload
        )
        toast.info(`Actualización en vivo en ${cancha.nombre}`)
        // Refrescar slots de la cancha
        canchasService
          .getDisponibilidad(cancha.id_cancha, fechaSeleccionada.value)
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
      suscribirRealtime()
      toast.info(`Cargando canchas de ${sedeStore.sedeSeleccionada.nombre}`)
    }
  }
)

// Reactividad a cambios de fecha o deporte
watch([fechaSeleccionada, deporteSeleccionadoId], async () => {
  await cargarDisponibilidad()
  suscribirRealtime()
})

onMounted(() => {
  sedeStore.cargarSedes()
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

      <!-- Indicador de Sede Activa (Consumida del store global) -->
      <div
        class="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs"
      >
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
            {{ tipo.nombre }}
          </button>
        </div>
      </div>

      <!-- Selector de Fecha de Juego con BaseInput y restricción a fecha actual -->
      <div class="w-full md:w-64">
        <BaseInput
          v-model="fechaSeleccionada"
          label="Fecha de Juego"
          type="date"
          :min="fechaHoy"
          required
          hint="Turnos disponibles de 08:00 a 23:00 hs."
        />
      </div>

      <!-- Botón de Refresco Manual / Sincronización -->
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

    <!-- Grilla de Disponibilidad (GrillaTurnos.vue) -->
    <GrillaTurnos
      :canchas="canchasFiltradas"
      :disponibilidad-map="disponibilidadMap"
      :turno-seleccionado="turnoSeleccionado"
      :cargando="cargando"
      :fecha="fechaSeleccionada"
      @seleccionar-turno="handleSeleccionarTurno"
    />

    <!-- Barra Inferior Flotante de Turno Seleccionado -->
    <Transition
      enter-active-class="transform transition ease-out duration-200"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="turnoSeleccionado"
        class="sticky bottom-4 z-30 bg-[#202759] text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4"
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
                Horario Pico (Recargo 20%)
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
    </Transition>

    <!-- Modal de Revisión y Confirmación Inicial (BaseModal de common components) -->
    <BaseModal
      v-model="modalConfirmarAbierto"
      title="Confirmar Selección de Cancha"
      subtitle="Revisá los datos antes de proceder a la confirmación de la reserva."
    >
      <div v-if="turnoSeleccionado" class="space-y-4 py-2">
        <div
          class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs"
        >
          <div class="flex justify-between py-1 border-b border-slate-200/60">
            <span class="text-slate-500">Sede:</span>
            <span class="font-bold text-[#202759]">{{
              sedeStore.sedeSeleccionada?.nombre
            }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-200/60">
            <span class="text-slate-500">Cancha:</span>
            <span class="font-bold text-[#202759]">{{
              turnoSeleccionado.cancha.nombre
            }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-200/60">
            <span class="text-slate-500">Fecha elegida:</span>
            <span class="font-bold text-[#202759]">{{
              turnoSeleccionado.fecha
            }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-200/60">
            <span class="text-slate-500">Franja horaria:</span>
            <span class="font-mono font-bold text-[#202759]"
              >{{ turnoSeleccionado.slot.hora_inicio }} a
              {{ turnoSeleccionado.slot.hora_fin }} hs</span
            >
          </div>
          <div class="flex justify-between py-1 items-center">
            <span class="text-slate-500">Precio estimado:</span>
            <span class="text-base font-bold text-[#F96167] font-mono">
              {{ formatoMoneda(turnoSeleccionado.slot.precio_estimado) }}
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-500 leading-relaxed">
          Al confirmar la reserva, se validará tu membresía activa (descuento
          del 15% para socios activos).
        </p>
      </div>

      <template #actions>
        <BaseButton variant="outline" @click="modalConfirmarAbierto = false">
          Volver a la grilla
        </BaseButton>

        <BaseButton
          variant="primary"
          @click="
            (toast.success('Turno seleccionado.'),
            (modalConfirmarAbierto = false))
          "
        >
          Confirmar y continuar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
