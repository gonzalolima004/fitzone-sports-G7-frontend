<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import {
  PhBicycle,
  PhPlug,
  PhTray,
  PhWarning,
  PhCaretLeft,
  PhCaretRight,
  PhClock,
  PhDoor,
} from '@phosphor-icons/vue'
import { useSedeStore } from '@/store/sede'
import axios from 'axios'
import {
  clasesService,
  type ClaseAgendaResponse,
  type MiReservaClaseResponse,
  type MiInscripcionListaEsperaResponse,
  type HorarioOperativoSedeResponse,
} from '../services/clases.service'
import {
  formatearFechaCompleta,
  obtenerFechaLocalISO,
  generarDiasAgenda,
  compararHorarios,
  normalizarFecha,
  coincideFechaClase,
  obtenerEstadoVentanaReserva,
  type DiaAgendaItem,
} from '@/common/utils/date-formatter'
import ClaseCard, { type ClaseCardProps } from '../components/ClaseCard.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/common/utils/supabase'

const sedeStore = useSedeStore()
const authStore = useAuthStore()

// Fecha seleccionada actual (YYYY-MM-DD en hora local)
const fechaSeleccionada = ref<string>(obtenerFechaLocalISO())

// Fecha base de inicio para la tira de días visibles (7 días)
const fechaBaseSemana = ref<Date>(new Date())

// Días de la semana interactiva para el calendario
const diasVisibles = computed<DiaAgendaItem[]>(() => {
  return generarDiasAgenda(fechaBaseSemana.value, 7)
})

// Horario operativo de la sede para la fecha actual
const horarioSede = ref<HorarioOperativoSedeResponse | null>(null)

const clases = ref<ClaseAgendaResponse[]>([])
const misReservas = ref<MiReservaClaseResponse[]>([])
const misInscripciones = ref<MiInscripcionListaEsperaResponse[]>([])

const cargando = ref(false)
const error = ref<string | null>(null)

// Mapeo dinámico y ordenamiento cronológico por horario de inicio
const clasesAgendadas = computed<ClaseCardProps[]>(() => {
  // Si la sede está confirmada como cerrada en esta fecha, la agenda no tiene clases disponibles
  if (horarioSede.value && !horarioSede.value.abierto) {
    return []
  }

  // Filtrar según coincidencia con la fecha actual seleccionada (días de semana recurrentes o fecha puntual)
  const clasesFiltradas = clases.value.filter((clase) =>
    coincideFechaClase(
      { fecha: clase.fecha, dias_semana: clase.dias_semana },
      fechaSeleccionada.value
    )
  )

  const mapeadas = clasesFiltradas.map((clase) => {
    const esSpinning = clase.nombre.toLowerCase().includes('spinning')
    const esYoga = clase.nombre.toLowerCase().includes('yoga')

    let tipo = 'CROSSFIT'
    let icono = 'barbell'
    if (esSpinning) {
      tipo = 'SPINNING'
      icono = 'bicycle'
    } else if (esYoga) {
      tipo = 'YOGA VINYASA'
      icono = 'lotus'
    }

    // Identificar si el usuario tiene reserva activa para esta clase en este horario
    const miReserva = misReservas.value.find(
      (r) => r.id_clase === clase.id_clase
    )
    const miInscripcion = misInscripciones.value.find(
      (i) => i.id_clase === clase.id_clase
    )

    let estado: ClaseCardProps['estado'] = clase.estado
    if (miReserva) {
      estado = 'MISMA_RESERVA'
    } else if (miInscripcion) {
      estado = 'EN_ESPERA'
    }

    const horarioTexto =
      clase.horario_inicio && clase.horario_fin
        ? `${clase.horario_inicio} - ${clase.horario_fin} hs`
        : 'Horario a confirmar'

    // Construir fecha_inicio y fecha_fin precisas combinando la fecha seleccionada y los horarios
    const horaInicio = clase.horario_inicio || '00:00'
    const horaFin = clase.horario_fin || '00:00'

    const [hI = '0', mI = '0'] = horaInicio.split(':')
    const dInicio = normalizarFecha(fechaSeleccionada.value)
    dInicio.setHours(Number(hI), Number(mI), 0, 0)

    const [hF = '0', mF = '0'] = horaFin.split(':')
    const dFin = normalizarFecha(fechaSeleccionada.value)
    dFin.setHours(Number(hF), Number(mF), 0, 0)

    const fechaInicioISO = dInicio.toISOString()
    const fechaFinISO = dFin.toISOString()

    return {
      id: clase.id_clase,
      nombre: clase.nombre,
      tipo,
      icono,
      horario: horarioTexto,
      fecha_inicio: fechaInicioISO,
      fecha_fin: fechaFinISO,
      profesor: clase.profesor || null,
      sala: clase.sala || null,
      capacidadMaxima: clase.capacidad_maxima,
      cuposOcupados: clase.cupos_ocupados,
      cuposDisponibles: clase.cupos_disponibles,
      enListaEspera: clase.en_espera,
      ordenEnCola: miInscripcion?.orden_en_cola,
      idReserva: miReserva?.id_clase_reserva,
      idListaEspera: miInscripcion?.id_clase_lista_espera,
      estado,
      dias_semana: clase.dias_semana,
      fecha: clase.fecha,
      horario_inicio: clase.horario_inicio,
      horario_fin: clase.horario_fin,
      fechaSeleccionada: fechaSeleccionada.value,
    }
  })

  // Ordenar cronológicamente por horario de inicio
  return mapeadas.sort((a, b) => compararHorarios(a.horario, b.horario))
})

// Escuchar cambios en tiempo real desde Supabase para aviso de vacantes
let vacantesSubscription: ReturnType<typeof supabase.channel> | null = null

function setupRealtimeNotifications() {
  if (!authStore.usuario?.id) return

  vacantesSubscription = supabase
    .channel('lista-espera-vacantes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'clase_lista_espera',
        filter: `id_usuario=eq.${authStore.usuario.id}`,
      },
      (payload: { new: Record<string, unknown> }) => {
        const newData = payload.new as {
          id_clase_lista_espera_estado: number
        }
        // Estado 1 = En Espera, 2 = Notificado / Promovido
        if (newData.id_clase_lista_espera_estado === 2) {
          toast.success(
            `¡Se ha liberado un lugar en tu clase! Revisa tus notificaciones para confirmar la reserva.`,
            { autoClose: false }
          )
          cargarClases()
        }
      }
    )
    .subscribe()
}

onMounted(() => {
  if (!fechaSeleccionada.value) {
    fechaSeleccionada.value = obtenerFechaLocalISO()
  }
  if (sedeStore.idSedeSeleccionada) {
    cargarClases()
  }
  setupRealtimeNotifications()
})

onUnmounted(() => {
  if (vacantesSubscription) {
    supabase.removeChannel(vacantesSubscription)
  }
})

// Reaccionar ante cambios de sede
watch(
  () => sedeStore.idSedeSeleccionada,
  (nuevoId) => {
    if (nuevoId) {
      cargarClases()
    } else {
      clases.value = []
      misReservas.value = []
      misInscripciones.value = []
      horarioSede.value = null
    }
  }
)

// Reaccionar ante cambios de fecha en el filtro de la agenda
watch(fechaSeleccionada, (nuevaFecha) => {
  if (nuevaFecha && sedeStore.idSedeSeleccionada) {
    cargarClases()
  }
})

async function cargarClases() {
  if (!sedeStore.idSedeSeleccionada) return
  cargando.value = true
  error.value = null
  try {
    const promises: [
      Promise<ClaseAgendaResponse[]>,
      Promise<MiReservaClaseResponse[]>,
      Promise<MiInscripcionListaEsperaResponse[]>,
      Promise<HorarioOperativoSedeResponse | null>,
    ] = [
      clasesService.obtenerClasesPorSede(
        sedeStore.idSedeSeleccionada,
        fechaSeleccionada.value
      ),
      authStore.isAuthenticated
        ? clasesService
            .obtenerMisReservas(fechaSeleccionada.value)
            .catch(() => [])
        : Promise.resolve([]),
      authStore.isAuthenticated
        ? clasesService
            .obtenerMisInscripciones(fechaSeleccionada.value)
            .catch(() => [])
        : Promise.resolve([]),
      clasesService
        .obtenerHorarioOperativoSede(
          sedeStore.idSedeSeleccionada,
          fechaSeleccionada.value
        )
        .catch(() => null),
    ]

    const [agendaData, reservasData, inscripcionesData, horarioData] =
      await Promise.all(promises)

    clases.value = agendaData
    misReservas.value = reservasData
    misInscripciones.value = inscripcionesData
    horarioSede.value = horarioData
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      error.value = err.response?.data?.message || 'Error al cargar las clases.'
    } else {
      error.value = 'Error al cargar las clases.'
    }
  } finally {
    cargando.value = false
  }
}

// Navegación de Calendario
function seleccionarFecha(fechaStr: string) {
  fechaSeleccionada.value = fechaStr
}

function irAHoy() {
  const hoy = new Date()
  fechaBaseSemana.value = hoy
  fechaSeleccionada.value = obtenerFechaLocalISO(hoy)
}

function cambiarDia(offset: number) {
  const d = normalizarFecha(fechaSeleccionada.value)
  d.setDate(d.getDate() + offset)
  const nuevaFecha = obtenerFechaLocalISO(d)
  fechaSeleccionada.value = nuevaFecha

  // Asegurar que la tira semanal contenga la fecha seleccionada
  const inicioTira = normalizarFecha(fechaBaseSemana.value)
  const finTira = new Date(inicioTira.getTime())
  finTira.setDate(finTira.getDate() + 6)
  if (d < inicioTira || d > finTira) {
    fechaBaseSemana.value = d
  }
}

function cambiarSemana(offsetSemanas: number) {
  const nuevaBase = new Date(fechaBaseSemana.value.getTime())
  nuevaBase.setDate(nuevaBase.getDate() + offsetSemanas * 7)
  fechaBaseSemana.value = nuevaBase
  fechaSeleccionada.value = obtenerFechaLocalISO(nuevaBase)
}

// ESTADO MODAL RESERVA
const modalReservaVisible = ref(false)
const claseAReservar = ref<ClaseCardProps | null>(null)
const reservando = ref(false)
const errorReserva = ref<string | null>(null)

function handleReservar(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    const ventana = obtenerEstadoVentanaReserva(clase.fecha_inicio)
    if (!ventana.puedeReservar) {
      toast.warning(ventana.mensajeBloqueo || 'Reserva no disponible')
      return
    }
    claseAReservar.value = clase
    errorReserva.value = null
    modalReservaVisible.value = true
  }
}

async function confirmarReserva() {
  if (!claseAReservar.value) return

  const ventana = obtenerEstadoVentanaReserva(claseAReservar.value.fecha_inicio)
  if (!ventana.puedeReservar) {
    toast.error(ventana.mensajeBloqueo || 'Reserva no disponible')
    modalReservaVisible.value = false
    return
  }

  reservando.value = true
  try {
    await clasesService.reservarClase({
      id_clase: claseAReservar.value.id,
      fecha_inicio: claseAReservar.value.fecha_inicio,
      fecha_fin: claseAReservar.value.fecha_fin,
    })

    toast.success(`Reserva confirmada para ${claseAReservar.value.nombre}`)
    modalReservaVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      errorReserva.value =
        err.response?.data?.message ||
        'Ocurrió un error al intentar reservar la clase.'
    } else {
      errorReserva.value = 'Ocurrió un error inesperado.'
    }
  } finally {
    reservando.value = false
    await cargarClases()
  }
}

// ESTADO MODAL LISTA DE ESPERA
const modalEsperaVisible = ref(false)
const claseAEsperar = ref<ClaseCardProps | null>(null)
const esperando = ref(false)
const errorEspera = ref<string | null>(null)

function handleListaEspera(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    const ventana = obtenerEstadoVentanaReserva(clase.fecha_inicio)
    if (!ventana.puedeReservar) {
      toast.warning(ventana.mensajeBloqueo || 'Inscripción no disponible')
      return
    }
    claseAEsperar.value = clase
    errorEspera.value = null
    modalEsperaVisible.value = true
  }
}

async function confirmarListaEspera() {
  if (!claseAEsperar.value) return

  const ventana = obtenerEstadoVentanaReserva(claseAEsperar.value.fecha_inicio)
  if (!ventana.puedeReservar) {
    toast.error(ventana.mensajeBloqueo || 'Inscripción no disponible')
    modalEsperaVisible.value = false
    return
  }

  esperando.value = true
  try {
    const res = await clasesService.inscribirListaEspera({
      id_clase: claseAEsperar.value.id,
      fecha_inicio: claseAEsperar.value.fecha_inicio,
      fecha_fin: claseAEsperar.value.fecha_fin,
    })

    const orden = res.orden_en_cola ? ` (Posición #${res.orden_en_cola})` : ''
    toast.success(
      `Estás en lista de espera para ${claseAEsperar.value.nombre}${orden}`
    )
    modalEsperaVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      errorEspera.value =
        err.response?.data?.message || 'Error al anotarse en lista de espera.'
    } else {
      errorEspera.value = 'Ocurrió un error inesperado al anotarse.'
    }
  } finally {
    esperando.value = false
    await cargarClases()
  }
}

// ESTADO MODAL CANCELACIÓN
const modalCancelacionVisible = ref(false)
const cancelando = ref(false)
const claseACancelar = ref<ClaseCardProps | null>(null)
const errorCancelacion = ref<string | null>(null)

function handleCancelar(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    claseACancelar.value = clase
    errorCancelacion.value = null
    modalCancelacionVisible.value = true
  }
}

async function confirmarCancelacion() {
  if (!claseACancelar.value) return
  const idReserva =
    claseACancelar.value.idReserva ||
    misReservas.value.find((r) => r.id_clase === claseACancelar.value?.id)
      ?.id_clase_reserva

  if (!idReserva) {
    errorCancelacion.value = 'No se encontró la reserva activa para cancelar.'
    return
  }

  cancelando.value = true
  try {
    await clasesService.cancelarReserva(idReserva)
    toast.info(`Reserva de ${claseACancelar.value.nombre} cancelada.`)
    modalCancelacionVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      errorCancelacion.value =
        err.response?.data?.message || 'Error al cancelar la reserva.'
    } else {
      errorCancelacion.value = 'Ocurrió un error inesperado al cancelar.'
    }
  } finally {
    cancelando.value = false
    await cargarClases()
  }
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
    >
      <div class="flex items-center gap-3">
        <PhBicycle :size="32" weight="duotone" class="text-rose-500" />
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">
          Agenda de Clases Grupales
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs md:text-sm">
        <div
          class="bg-white text-slate-600 px-4 py-2 rounded-full font-semibold border border-slate-200 shadow-sm flex items-center gap-2"
        >
          <span class="text-slate-400">Sede:</span>
          <span class="text-slate-800 font-bold">{{
            sedeStore.sedeSeleccionada?.nombre || 'Sin seleccionar'
          }}</span>
        </div>

        <!-- Badge de Horario Operativo de la Sede -->
        <div
          v-if="horarioSede?.abierto"
          class="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-semibold border border-emerald-200 shadow-sm flex items-center gap-2"
        >
          <PhClock :size="16" weight="bold" class="text-emerald-600" />
          <span
            >Horario Sede: {{ horarioSede.hora_apertura }} -
            {{ horarioSede.hora_cierre }} hs</span
          >
          <span
            v-if="horarioSede.es_horario_especial"
            class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider"
          >
            Especial
          </span>
        </div>
        <div
          v-else-if="horarioSede && !horarioSede.abierto"
          class="bg-rose-50 text-rose-700 px-4 py-2 rounded-full font-semibold border border-rose-200 shadow-sm flex items-center gap-2"
        >
          <PhDoor :size="16" weight="bold" class="text-rose-600" />
          <span>Sede Cerrada</span>
        </div>

        <div
          class="bg-white text-slate-600 px-4 py-2 rounded-full font-semibold border border-slate-200 shadow-sm uppercase tracking-wide hidden sm:block"
        >
          Reserva con 48 hs de anticipación
        </div>
      </div>
    </div>

    <!-- Calendario y Navegación de Agenda -->
    <div
      class="bg-white border border-slate-200 rounded-3xl p-5 mb-8 shadow-sm"
    >
      <!-- Barra superior de navegación de fecha -->
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-100"
      >
        <div>
          <span
            class="text-xs font-semibold uppercase tracking-wider text-slate-400"
            >Fecha seleccionada</span
          >
          <h2 class="text-lg md:text-xl font-extrabold text-slate-800">
            {{ formatearFechaCompleta(fechaSeleccionada) }}
          </h2>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto">
          <!-- Botón Volver a Hoy -->
          <button
            class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-slate-50"
            @click="irAHoy"
          >
            Hoy
          </button>

          <!-- Flecha Día Anterior -->
          <button
            class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-white"
            title="Día anterior"
            @click="cambiarDia(-1)"
          >
            <PhCaretLeft :size="18" weight="bold" />
          </button>

          <!-- Flecha Día Siguiente -->
          <button
            class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-white"
            title="Día siguiente"
            @click="cambiarDia(1)"
          >
            <PhCaretRight :size="18" weight="bold" />
          </button>
        </div>
      </div>

      <!-- Tira interactiva de 7 días con navegación semanal -->
      <div class="flex items-center gap-2">
        <button
          class="p-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-slate-50 hidden sm:flex items-center justify-center shrink-0"
          title="Semana anterior"
          @click="cambiarSemana(-1)"
        >
          <PhCaretLeft :size="16" weight="bold" />
        </button>

        <div
          class="grid grid-cols-7 gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide flex-grow"
        >
          <button
            v-for="dia in diasVisibles"
            :key="dia.fechaISO"
            :class="[
              'flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-200 border relative select-none',
              fechaSeleccionada === dia.fechaISO
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200 scale-102 font-bold'
                : 'bg-slate-50/70 text-slate-600 border-slate-100 hover:bg-rose-50/50 hover:border-rose-200 hover:text-rose-500',
            ]"
            @click="seleccionarFecha(dia.fechaISO)"
          >
            <span
              :class="[
                'text-[11px] uppercase tracking-wider mb-1',
                fechaSeleccionada === dia.fechaISO
                  ? 'text-rose-100 font-semibold'
                  : 'text-slate-400 font-medium',
              ]"
            >
              {{ dia.nombreDiaCorto }}
            </span>
            <span class="text-lg md:text-xl font-extrabold leading-none">
              {{ dia.diaNumero }}
            </span>
            <span
              v-if="dia.esHoy"
              :class="[
                'text-[9px] font-bold mt-1 px-1.5 py-0.2 rounded-full uppercase tracking-tight',
                fechaSeleccionada === dia.fechaISO
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 text-rose-600',
              ]"
            >
              Hoy
            </span>
          </button>
        </div>

        <button
          class="p-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-slate-50 hidden sm:flex items-center justify-center shrink-0"
          title="Semana siguiente"
          @click="cambiarSemana(1)"
        >
          <PhCaretRight :size="16" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Grilla de Clases -->
    <div
      v-if="cargando"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white rounded-3xl p-6 h-[380px] border border-slate-100 shadow-sm flex flex-col justify-between"
      >
        <div class="flex justify-between items-center mb-5">
          <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
          <div class="h-4 w-32 bg-slate-200 rounded-full"></div>
        </div>
        <div class="mb-6 flex-grow">
          <div class="h-6 w-3/4 bg-slate-200 rounded-md mb-3"></div>
          <div class="h-4 w-1/2 bg-slate-100 rounded-md"></div>
        </div>
        <div class="mb-6">
          <div class="flex justify-between mb-2">
            <div class="h-4 w-20 bg-slate-200 rounded-md"></div>
            <div class="h-4 w-16 bg-slate-200 rounded-md"></div>
          </div>
          <div class="h-2.5 w-full bg-slate-100 rounded-full mb-3"></div>
          <div class="h-3 w-4/5 bg-slate-100 rounded-md"></div>
        </div>
        <div class="h-12 w-full bg-slate-200 rounded-xl"></div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="bg-rose-50 rounded-3xl p-8 text-center border-2 border-rose-100 animate-fade-in shadow-sm"
    >
      <PhPlug :size="48" weight="duotone" class="text-rose-500 mx-auto mb-4" />
      <h3 class="text-xl font-bold text-rose-700 mb-2">
        Oops, tuvimos un problema de conexión
      </h3>
      <p class="text-rose-600 font-medium mb-6 max-w-md mx-auto">{{ error }}</p>
      <button
        class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95"
        @click="cargarClases"
      >
        Volver a intentar
      </button>
    </div>

    <!-- Estado Sede Cerrada en esta fecha -->
    <div
      v-else-if="horarioSede && !horarioSede.abierto"
      class="bg-amber-50/70 border-2 border-amber-200/80 rounded-3xl p-10 text-center animate-fade-in shadow-sm max-w-xl mx-auto"
    >
      <div
        class="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
      >
        <PhDoor :size="36" weight="duotone" />
      </div>
      <h3 class="text-xl font-bold text-amber-900 mb-2">Sede Cerrada</h3>
      <p class="text-amber-800 font-medium mb-3">
        {{
          horarioSede.motivo_cierre ||
          'La sede no se encuentra abierta en la fecha seleccionada.'
        }}
      </p>
      <p class="text-slate-500 text-xs mb-6 max-w-md mx-auto">
        No hay clases grupales programadas porque las instalaciones permanecerán
        cerradas. Podés seleccionar otro día en el calendario para consultar el
        cronograma.
      </p>
      <button
        class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95 text-sm"
        @click="irAHoy"
      >
        Volver a hoy
      </button>
    </div>

    <div
      v-else-if="clasesAgendadas.length === 0"
      class="text-center p-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl animate-fade-in flex flex-col items-center justify-center"
    >
      <PhTray :size="52" weight="duotone" class="text-slate-400 mx-auto mb-4" />
      <h3 class="text-xl font-bold text-slate-700 mb-2">Agenda despejada</h3>
      <p class="text-slate-500 font-medium max-w-sm">
        No hay clases grupales programadas para la Sede actual en la fecha que
        seleccionaste.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
    >
      <ClaseCard
        v-for="clase in clasesAgendadas"
        :key="clase.id"
        :clase="clase"
        @reservar="handleReservar"
        @lista-espera="handleListaEspera"
        @cancelar="handleCancelar"
      />
    </div>

    <!-- Modal de Confirmación de Reserva -->
    <BaseModal
      v-model="modalReservaVisible"
      title="Confirmar Reserva"
      :subtitle="
        claseAReservar
          ? `¿Deseas reservar un cupo para ${claseAReservar.nombre}?`
          : ''
      "
    >
      <div
        v-if="claseAReservar"
        class="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2"
      >
        <ul class="space-y-3 text-sm text-slate-700">
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Clase:</span>
            <span>{{ claseAReservar.nombre }}</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Horario:</span>
            <span>{{ claseAReservar.horario }}</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Día:</span>
            <span>{{ fechaSeleccionada }}</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Profesor:</span>
            <span>{{
              claseAReservar.profesor || 'Sin profesor asignado'
            }}</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Sala:</span>
            <span>{{ claseAReservar.sala || 'Sala no especificada' }}</span>
          </li>
        </ul>
      </div>

      <div
        v-if="errorReserva"
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-4 flex gap-2 items-start"
      >
        <PhWarning
          :size="20"
          weight="fill"
          class="shrink-0 text-rose-500 mt-0.5"
        />
        <p class="font-medium">{{ errorReserva }}</p>
      </div>

      <template #actions>
        <BaseButton variant="outline" @click="modalReservaVisible = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="reservando"
          @click="confirmarReserva"
        >
          Confirmar Reserva
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal de Confirmación de Cancelación -->
    <BaseModal
      v-model="modalCancelacionVisible"
      title="Cancelar Reserva"
      :subtitle="
        claseACancelar
          ? `¿Estás seguro que deseas cancelar tu lugar en ${claseACancelar.nombre}?`
          : ''
      "
    >
      <p class="text-slate-600 mb-4">
        Si cancelas, liberarás tu lugar. Tené en cuenta que si querés volver a
        anotarte, estarás sujeto a la disponibilidad de cupos en ese momento.
      </p>

      <div
        v-if="errorCancelacion"
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-2 mb-4 flex gap-2 items-start"
      >
        <PhWarning
          :size="20"
          weight="fill"
          class="shrink-0 text-rose-500 mt-0.5"
        />
        <p class="font-medium">{{ errorCancelacion }}</p>
      </div>

      <template #actions>
        <BaseButton variant="outline" @click="modalCancelacionVisible = false">
          Volver
        </BaseButton>
        <BaseButton
          variant="danger"
          :loading="cancelando"
          @click="confirmarCancelacion"
        >
          Sí, Cancelar Reserva
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal de Confirmación de Lista de Espera -->
    <BaseModal
      v-model="modalEsperaVisible"
      title="Anotarse en Lista de Espera"
      :subtitle="
        claseAEsperar
          ? `La clase ${claseAEsperar.nombre} está completa. ¿Deseas anotarte en la lista de espera?`
          : ''
      "
    >
      <p class="text-slate-600 mb-4">
        Te avisaremos si se libera un lugar. Si se libera, tendrás un tiempo
        limitado para confirmar tu asistencia antes de que el lugar pase al
        siguiente socio en la lista.
      </p>

      <div
        v-if="errorEspera"
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-2 mb-4 flex gap-2 items-start"
      >
        <PhWarning
          :size="20"
          weight="fill"
          class="shrink-0 text-rose-500 mt-0.5"
        />
        <p class="font-medium">{{ errorEspera }}</p>
      </div>

      <template #actions>
        <BaseButton variant="outline" @click="modalEsperaVisible = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="esperando"
          @click="confirmarListaEspera"
        >
          Anotarme
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Ocultar barra de desplazamiento para el filtro de fechas en móviles */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
