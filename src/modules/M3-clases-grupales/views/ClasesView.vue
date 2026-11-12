<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import {
  PhBicycle,
  PhPlug,
  PhTray,
  PhWarning,
  PhCaretLeft,
  PhCaretRight,
  PhClock,
  PhDoor,
  PhPlus,
  PhTrash,
  PhMedal,
  PhWarningCircle,
  PhArrowRight,
  PhMapPin,
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
import ClaseCard, {
  type ClaseCardProps,
  type MotivoInhabilitacion,
} from '../components/ClaseCard.vue'
import ModalClaseForm from '../components/ModalClaseForm.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/common/utils/supabase'
import {
  membresiasService,
  type EstadoMembresia,
} from '@/modules/M1-usuarios/services/membresias.service'

const router = useRouter()
const sedeStore = useSedeStore()
const authStore = useAuthStore()

// Rol y estado de membresía del usuario para reglas de inscripción
const rolUsuario = computed<string>(
  () => authStore.rol || authStore.usuario?.rol || 'socio'
)
const esExterno = computed(() => rolUsuario.value === 'externo')
const esSocio = computed(() => rolUsuario.value === 'socio')

const estadoMembresia = ref<EstadoMembresia | null>(null)
const verificandoMembresia = ref(false)

const estaEnMora = computed(
  () =>
    esSocio.value &&
    (estadoMembresia.value?.enMora === true ||
      estadoMembresia.value?.estado === 'VENCIDA')
)

const esMembresiaSuspendida = computed(
  () => esSocio.value && estadoMembresia.value?.estado === 'SUSPENDIDA'
)

const sinMembresia = computed(
  () =>
    esSocio.value &&
    Boolean(
      estadoMembresia.value &&
      !estadoMembresia.value.esSocioActivo &&
      !estaEnMora.value &&
      !esMembresiaSuspendida.value
    )
)

// Validación de concordancia de ciudad entre la sede del socio y la sede de la clase
const idSedeSocio = computed<number | undefined>(() => {
  return (
    authStore.usuario?.id_sede || authStore.usuario?.sede?.id_sede || undefined
  )
})

const sedeSocio = computed(() => {
  if (!idSedeSocio.value) return authStore.usuario?.sede
  return (
    sedeStore.sedes?.find((s) => s.id_sede === idSedeSocio.value) ||
    authStore.usuario?.sede
  )
})

const idCiudadSocio = computed<number | undefined>(() => {
  return (
    authStore.usuario?.sede?.id_ciudad ??
    sedeSocio.value?.id_ciudad ??
    undefined
  )
})

const idCiudadSedeSeleccionada = computed<number | undefined>(() => {
  return sedeStore.sedeSeleccionada?.id_ciudad
})

const esCiudadDiferente = computed<boolean>(() => {
  if (!esSocio.value) return false
  if (!idCiudadSocio.value || !idCiudadSedeSeleccionada.value) return false
  return idCiudadSocio.value !== idCiudadSedeSeleccionada.value
})

const usuarioInhabilitado = computed(
  () =>
    esExterno.value ||
    estaEnMora.value ||
    esMembresiaSuspendida.value ||
    sinMembresia.value ||
    esCiudadDiferente.value
)

const motivoInhabilitacion = computed<MotivoInhabilitacion>(() => {
  if (esExterno.value) return 'EXTERNO'
  if (estaEnMora.value) return 'MORA'
  if (esMembresiaSuspendida.value) return 'SUSPENDIDA'
  if (sinMembresia.value) return 'SIN_MEMBRESIA'
  if (esCiudadDiferente.value) return 'CIUDAD_DIFERENTE'
  return null
})

async function cargarEstadoMembresia() {
  if (
    !authStore.isAuthenticated ||
    !authStore.usuario?.id ||
    rolUsuario.value !== 'socio'
  ) {
    return
  }
  verificandoMembresia.value = true
  try {
    const res = (await membresiasService.verificarEstado(
      authStore.usuario.id
    )) as EstadoMembresia
    estadoMembresia.value = res
  } catch (e) {
    if (import.meta.env.MODE !== 'test') {
      console.warn('No se pudo verificar el estado de membresía:', e)
    }
  } finally {
    verificandoMembresia.value = false
  }
}

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
    const miReserva = misReservas.value.find((r) => {
      if (r.id_clase !== clase.id_clase) return false

      // Validar que la reserva esté activa/confirmada (id_clase_reserva_estado: 1) y no cancelada
      const esConfirmada =
        r.id_clase_reserva_estado === 1 ||
        (r.estado && r.estado.toUpperCase() === 'CONFIRMADA')
      const esCancelada =
        r.id_clase_reserva_estado === 4 ||
        r.id_clase_reserva_estado === 2 ||
        (r.estado && r.estado.toUpperCase() === 'CANCELADA')

      if (!esConfirmada || esCancelada) return false

      // Si la reserva especifica fecha_inicio, validar que coincida con el día seleccionado
      if (r.fecha_inicio) {
        const fechaReserva = obtenerFechaLocalISO(r.fecha_inicio)
        if (fechaReserva !== fechaSeleccionada.value) return false
      }

      return true
    })

    const miInscripcion = misInscripciones.value.find((i) => {
      if (i.id_clase !== clase.id_clase) return false

      const esActiva =
        i.id_clase_lista_espera_estado === 1 ||
        (i.estado && i.estado.toUpperCase() !== 'CANCELADA')
      if (!esActiva) return false

      if (i.fecha_inicio) {
        const fechaInscripcion = obtenerFechaLocalISO(i.fecha_inicio)
        if (fechaInscripcion !== fechaSeleccionada.value) return false
      }

      return true
    })

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
      descripcion: clase.descripcion || null,
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
// Suscripción para actualizar cupos en la agenda en vivo
let cuposSubscription: ReturnType<typeof supabase.channel> | null = null
let timerCupos: ReturnType<typeof setTimeout> | null = null

function setupRealtimeNotifications() {
  // 1. Notificación personal para socios en lista de espera
  if (authStore.usuario?.id && !vacantesSubscription) {
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
              `¡Se liberó un lugar en tu clase! La vacante fue confirmada a tu favor. Tenés 4 horas para asistir — verificá tu reserva en la agenda.`,
              { autoClose: false }
            )
            cargarClases(true)
          }
        }
      )
      .subscribe()
  }

  // 2. Suscripción Realtime a reservas para actualizar cupos disponibles en vivo (para cualquier usuario)
  if (!cuposSubscription) {
    cuposSubscription = supabase
      .channel('cupos-agenda-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clase_reserva',
        },
        () => {
          // Debounce para mitigar ráfagas de eventos concurrentes sin saturar la red
          if (timerCupos) clearTimeout(timerCupos)
          timerCupos = setTimeout(() => {
            cargarClases(true)
          }, 150)
        }
      )
      .subscribe()
  }
}

// Re-vincular notificaciones de vacantes si el usuario se autentica después del montaje inicial
watch(
  () => authStore.usuario?.id,
  (nuevoId) => {
    if (nuevoId) {
      setupRealtimeNotifications()
    }
  }
)

onMounted(() => {
  if (!fechaSeleccionada.value) {
    fechaSeleccionada.value = obtenerFechaLocalISO()
  }
  if (sedeStore.idSedeSeleccionada) {
    cargarClases()
  }
  sedeStore.cargarSedes?.()
  cargarEstadoMembresia()
  setupRealtimeNotifications()
})

onUnmounted(() => {
  if (timerCupos) {
    clearTimeout(timerCupos)
  }
  if (vacantesSubscription) {
    supabase.removeChannel(vacantesSubscription)
  }
  if (cuposSubscription) {
    supabase.removeChannel(cuposSubscription)
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

// Control de peticiones concurrentes para descartar respuestas desfasadas
let idCargaActual = 0

async function cargarClases(silencioso = false) {
  if (!sedeStore.idSedeSeleccionada) return
  const idCarga = ++idCargaActual

  // Solo activar skeleton si no hay datos o no es una actualización silenciosa de fondo
  if (!silencioso || clases.value.length === 0) {
    cargando.value = true
  }
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
      authStore.isAuthenticated && esSocio.value
        ? clasesService
            .obtenerMisReservas(fechaSeleccionada.value)
            .catch(() => [])
        : Promise.resolve([]),
      authStore.isAuthenticated && esSocio.value
        ? clasesService
            .obtenerMisInscripciones(fechaSeleccionada.value)
            .catch(() => [])
        : Promise.resolve([]),
      sedeStore.obtenerHorarioOperativo
        ? (
            sedeStore.obtenerHorarioOperativo(
              sedeStore.idSedeSeleccionada,
              fechaSeleccionada.value
            ) as Promise<HorarioOperativoSedeResponse>
          ).catch(() => null)
        : clasesService
            .obtenerHorarioOperativoSede(
              sedeStore.idSedeSeleccionada,
              fechaSeleccionada.value
            )
            .catch(() => null),
    ]

    const [agendaData, reservasData, inscripcionesData, horarioData] =
      await Promise.all(promises)

    // Si otra petición se completó después o cambió la fecha/sede, descartar
    if (idCarga !== idCargaActual) return

    clases.value = agendaData
    misReservas.value = reservasData
    misInscripciones.value = inscripcionesData
    horarioSede.value = horarioData
  } catch (err: unknown) {
    if (idCarga !== idCargaActual) return
    if (axios.isAxiosError(err)) {
      error.value = err.response?.data?.message || 'Error al cargar las clases.'
    } else {
      error.value = 'Error al cargar las clases.'
    }
  } finally {
    if (idCarga === idCargaActual) {
      cargando.value = false
    }
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
  if (esExterno.value) {
    toast.warning(
      'La reserva de clases grupales es exclusiva para socios. Adquiere una membresía para comenzar.'
    )
    router.push('/membresia')
    return
  }
  if (estaEnMora.value) {
    toast.warning(
      'Tu membresía se encuentra vencida. Regulariza tus cuotas para poder reservar clases grupales.'
    )
    router.push('/membresia')
    return
  }
  if (esMembresiaSuspendida.value) {
    toast.warning(
      'Tu membresía está suspendida. No puedes realizar reservas de clases grupales.'
    )
    router.push('/membresia')
    return
  }
  if (sinMembresia.value) {
    toast.warning(
      'No dispones de una membresía activa vigente. Adquiere un plan para reservar.'
    )
    router.push('/membresia')
    return
  }
  if (esCiudadDiferente.value) {
    toast.warning(
      'Solo puedes reservar clases grupales en sedes pertenecientes a tu misma ciudad.'
    )
    return
  }

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
    const res = await clasesService.reservarClase({
      id_clase: claseAReservar.value.id,
      fecha_inicio: claseAReservar.value.fecha_inicio,
      fecha_fin: claseAReservar.value.fecha_fin,
    })

    // Actualización optimista inmediata en memoria para respuesta instantánea
    const targetId = claseAReservar.value.id
    const cIdx = clases.value.findIndex((c) => c.id_clase === targetId)
    if (cIdx !== -1) {
      clases.value[cIdx] = {
        ...clases.value[cIdx],
        cupos_disponibles: Math.max(
          0,
          clases.value[cIdx].cupos_disponibles - 1
        ),
        cupos_ocupados: clases.value[cIdx].cupos_ocupados + 1,
      }
    }
    const idRes = res?.id_clase_reserva || res?.id_reserva
    if (idRes) {
      misReservas.value.push({
        id_clase_reserva: idRes,
        id_clase: targetId,
        id_usuario: authStore.usuario?.id || 0,
        fecha_inicio: claseAReservar.value.fecha_inicio || '',
        fecha_fin: claseAReservar.value.fecha_fin || '',
        id_clase_reserva_estado: 1,
        estado: 'CONFIRMADA',
        nombre_clase: claseAReservar.value.nombre,
      })
    }

    toast.success(`Reserva confirmada para ${claseAReservar.value.nombre}`)
    modalReservaVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 403) {
        errorReserva.value =
          err.response?.data?.message ||
          'Acceso restringido: tu membresía no está activa o registras cuotas vencidas.'
      } else {
        errorReserva.value =
          err.response?.data?.message ||
          'Ocurrió un error al intentar reservar la clase.'
      }
    } else {
      errorReserva.value = 'Ocurrió un error inesperado.'
    }
  } finally {
    reservando.value = false
    await cargarClases(true)
  }
}

function irAListaEsperaDesdeError() {
  const clase = claseAReservar.value
  modalReservaVisible.value = false
  if (clase) {
    handleListaEspera(clase.id)
  }
}

// ESTADO MODAL LISTA DE ESPERA
const modalEsperaVisible = ref(false)
const claseAEsperar = ref<ClaseCardProps | null>(null)
const esperando = ref(false)
const errorEspera = ref<string | null>(null)

function handleListaEspera(idClase: number) {
  if (esExterno.value) {
    toast.warning(
      'La lista de espera es exclusiva para socios. Adquiere una membresía para anotarte.'
    )
    router.push('/membresia')
    return
  }
  if (estaEnMora.value) {
    toast.warning(
      'Tu membresía se encuentra vencida. Regulariza tus pagos para anotarte en lista de espera.'
    )
    router.push('/membresia')
    return
  }
  if (esMembresiaSuspendida.value) {
    toast.warning(
      'Tu membresía está suspendida. No puedes anotarte en listas de espera.'
    )
    router.push('/membresia')
    return
  }
  if (sinMembresia.value) {
    toast.warning(
      'No dispones de una membresía activa vigente para anotarte en lista de espera.'
    )
    router.push('/membresia')
    return
  }
  if (esCiudadDiferente.value) {
    toast.warning(
      'Solo puedes anotarte en lista de espera en sedes pertenecientes a tu misma ciudad.'
    )
    return
  }

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

    // Actualización optimista inmediata
    const targetId = claseAEsperar.value.id
    const cIdx = clases.value.findIndex((c) => c.id_clase === targetId)
    if (cIdx !== -1) {
      clases.value[cIdx] = {
        ...clases.value[cIdx],
        en_espera: (clases.value[cIdx].en_espera || 0) + 1,
      }
    }
    const idLista = res?.inscripcion?.id_clase_lista_espera || res?.id_lista
    if (idLista) {
      misInscripciones.value.push({
        id_clase_lista_espera: idLista,
        id_clase: targetId,
        id_usuario: authStore.usuario?.id || 0,
        fecha_inicio: claseAEsperar.value.fecha_inicio || '',
        fecha_fin: claseAEsperar.value.fecha_fin || '',
        orden_en_cola: res.orden_en_cola || 1,
        id_clase_lista_espera_estado: 1,
        estado: 'ACTIVA',
        nombre_clase: claseAEsperar.value.nombre,
      })
    }

    const orden = res.orden_en_cola ? ` (Posición #${res.orden_en_cola})` : ''
    toast.success(
      `Estás en lista de espera para ${claseAEsperar.value.nombre}${orden}`
    )
    modalEsperaVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 403) {
        errorEspera.value =
          err.response?.data?.message ||
          'Acceso restringido: no puedes inscribirte en lista de espera sin membresía activa o con cuotas impagas.'
      } else {
        errorEspera.value =
          err.response?.data?.message || 'Error al anotarse en lista de espera.'
      }
    } else {
      errorEspera.value = 'Ocurrió un error inesperado al anotarse.'
    }
  } finally {
    esperando.value = false
    await cargarClases(true)
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
    misReservas.value.find(
      (r) =>
        r.id_clase === claseACancelar.value?.id &&
        (r.id_clase_reserva_estado === 1 ||
          r.estado?.toUpperCase() === 'CONFIRMADA')
    )?.id_clase_reserva

  if (!idReserva) {
    errorCancelacion.value = 'No se encontró la reserva activa para cancelar.'
    return
  }

  cancelando.value = true
  try {
    await clasesService.cancelarReserva(idReserva)

    // Actualización optimista de cupos y reservas
    const targetId = claseACancelar.value.id
    const cIdx = clases.value.findIndex((c) => c.id_clase === targetId)
    if (cIdx !== -1) {
      clases.value[cIdx] = {
        ...clases.value[cIdx],
        cupos_disponibles: Math.min(
          clases.value[cIdx].capacidad_maxima,
          clases.value[cIdx].cupos_disponibles + 1
        ),
        cupos_ocupados: Math.max(0, clases.value[cIdx].cupos_ocupados - 1),
      }
    }
    misReservas.value = misReservas.value.filter(
      (r) => r.id_clase_reserva !== idReserva
    )

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
    await cargarClases(true)
  }
}

// GESTIÓN CRUD DE CLASES ( GERENTE)
const esAdminOGerente = computed(() => authStore.rol === 'gerente')

const modalFormVisible = ref(false)
const claseAEditar = ref<ClaseCardProps | null>(null)
const modalEliminarVisible = ref(false)
const claseAEliminar = ref<ClaseCardProps | null>(null)
const eliminando = ref(false)

function abrirModalCrearClase() {
  claseAEditar.value = null
  modalFormVisible.value = true
}

function handleEditarClase(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    claseAEditar.value = clase
    modalFormVisible.value = true
  }
}

function handleAbrirEliminarClase(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    claseAEliminar.value = clase
    modalEliminarVisible.value = true
  }
}

async function confirmarEliminacion() {
  if (!claseAEliminar.value) return
  eliminando.value = true
  try {
    await clasesService.eliminarClase(claseAEliminar.value.id)
    toast.success(`Clase "${claseAEliminar.value.nombre}" eliminada con éxito`)
    modalEliminarVisible.value = false
    claseAEliminar.value = null
    await cargarClases()
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      toast.error(
        err.response?.data?.message || 'Error al dar de baja la clase.'
      )
    } else {
      toast.error('Ocurrió un error inesperado al eliminar la clase.')
    }
  } finally {
    eliminando.value = false
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

        <!-- Botón Nueva Clase (Admin / Gerente) -->
        <button
          v-if="esAdminOGerente"
          class="flex items-center gap-2 bg-[#202759] hover:bg-[#161b3d] text-white px-4 py-2 rounded-full font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-xs md:text-sm"
          @click="abrirModalCrearClase"
        >
          <PhPlus :size="16" weight="bold" class="text-rose-400" />
          <span>Nueva Clase</span>
        </button>
      </div>
    </div>

    <!-- Banner Informativo de Membresía / Clientes Externos -->
    <div
      v-if="usuarioInhabilitado"
      class="mb-8 rounded-3xl p-5 border transition-all animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
      :class="[
        esExterno
          ? 'bg-blue-50/90 border-blue-200 text-blue-950'
          : estaEnMora
            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
            : esMembresiaSuspendida
              ? 'bg-rose-50/90 border-rose-200 text-rose-950'
              : esCiudadDiferente
                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-800',
      ]"
    >
      <div class="flex items-start gap-3.5">
        <div
          class="p-2.5 rounded-2xl shrink-0 mt-0.5"
          :class="[
            esExterno
              ? 'bg-blue-100 text-blue-600'
              : estaEnMora
                ? 'bg-amber-100 text-amber-600'
                : esMembresiaSuspendida
                  ? 'bg-rose-100 text-rose-600'
                  : esCiudadDiferente
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-200 text-slate-700',
          ]"
        >
          <PhMapPin v-if="esCiudadDiferente" :size="26" weight="duotone" />
          <PhMedal
            v-else-if="esExterno || sinMembresia"
            :size="26"
            weight="duotone"
          />
          <PhWarningCircle v-else :size="26" weight="duotone" />
        </div>
        <div>
          <h3 class="font-extrabold text-base sm:text-lg leading-tight">
            {{
              esExterno
                ? 'Acceso de solo lectura para Clientes Externos'
                : estaEnMora
                  ? 'Membresía Vencida / Cuota Pendiente'
                  : esMembresiaSuspendida
                    ? 'Membresía Suspendida'
                    : esCiudadDiferente
                      ? 'Sede en otra ciudad'
                      : 'Sin Membresía Activa'
            }}
          </h3>
          <p class="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed">
            {{
              esExterno
                ? 'Podés consultar la agenda de clases grupales y sus cupos en tiempo real. Para inscribirte y reservar tu lugar, necesitás ser socio con una membresía activa.'
                : estaEnMora
                  ? 'Presentas pagos o cuotas pendientes en tu suscripción. Regulariza tu situación para volver a reservar clases grupales o inscribirte en listas de espera.'
                  : esMembresiaSuspendida
                    ? 'Tu membresía se encuentra suspendida temporalmente. No podrás reservar clases grupales hasta regularizarla.'
                    : esCiudadDiferente
                      ? 'Tu membresía te permite reservar clases únicamente en sedes de tu misma ciudad. Puedes explorar la agenda de esta sede pero no reservar ni ingresar a lista de espera.'
                      : 'No tienes una membresía activa vigente asignada a tu cuenta. Adquiere un plan para poder reservar tus clases grupales favoritas.'
            }}
          </p>
        </div>
      </div>

      <button
        v-if="esCiudadDiferente && idSedeSocio"
        type="button"
        class="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
        @click="sedeStore.seleccionarSede(idSedeSocio)"
      >
        <span>Volver a mi Sede</span>
        <PhArrowRight :size="16" weight="bold" />
      </button>

      <RouterLink
        v-else
        to="/membresia"
        class="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
        :class="[
          esExterno
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            : estaEnMora
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
              : esMembresiaSuspendida
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                : 'bg-[#202759] hover:bg-[#161b3d] text-white',
        ]"
      >
        <span>
          {{
            esExterno
              ? 'Ver Planes de Membresía'
              : estaEnMora
                ? 'Regularizar Membresía'
                : esMembresiaSuspendida
                  ? 'Gestionar Membresía'
                  : 'Adquirir Membresía'
          }}
        </span>
        <PhArrowRight :size="16" weight="bold" />
      </RouterLink>
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
            class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-slate-50 cursor-pointer"
            @click="irAHoy"
          >
            Hoy
          </button>

          <!-- Flecha Día Anterior -->
          <button
            class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-white cursor-pointer"
            title="Día anterior"
            @click="cambiarDia(-1)"
          >
            <PhCaretLeft :size="18" weight="bold" />
          </button>

          <!-- Flecha Día Siguiente -->
          <button
            class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-white cursor-pointer"
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
          class="p-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-slate-50 hidden sm:flex items-center justify-center shrink-0 cursor-pointer"
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
              'flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-200 border relative select-none cursor-pointer',
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
          class="p-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 bg-slate-50 hidden sm:flex items-center justify-center shrink-0 cursor-pointer"
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
        class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        @click="() => cargarClases()"
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
        class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95 text-sm cursor-pointer"
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
        :es-admin-o-gerente="esAdminOGerente"
        :motivo-inhabilitacion="motivoInhabilitacion"
        @reservar="handleReservar"
        @lista-espera="handleListaEspera"
        @cancelar="handleCancelar"
        @editar="handleEditarClase"
        @eliminar="handleAbrirEliminarClase"
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
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-4 flex flex-col gap-2"
      >
        <div class="flex gap-2 items-start">
          <PhWarning
            :size="20"
            weight="fill"
            class="shrink-0 text-rose-500 mt-0.5"
          />
          <p class="font-medium">{{ errorReserva }}</p>
        </div>
        <button
          v-if="
            errorReserva.toLowerCase().includes('cupo') ||
            errorReserva.toLowerCase().includes('lleno')
          "
          type="button"
          class="self-start text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer pt-1"
          @click="irAListaEsperaDesdeError"
        >
          Anotarme en lista de espera para esta clase →
        </button>
        <RouterLink
          v-if="
            errorReserva.toLowerCase().includes('membresía') ||
            errorReserva.toLowerCase().includes('mora') ||
            errorReserva.toLowerCase().includes('cuota') ||
            errorReserva.toLowerCase().includes('socio') ||
            errorReserva.toLowerCase().includes('restringido')
          "
          to="/membresia"
          class="self-start text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer pt-1"
        >
          Ir a Membresías para regularizar situación →
        </RouterLink>
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
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-2 mb-4 flex flex-col gap-2"
      >
        <div class="flex gap-2 items-start">
          <PhWarning
            :size="20"
            weight="fill"
            class="shrink-0 text-rose-500 mt-0.5"
          />
          <p class="font-medium">{{ errorEspera }}</p>
        </div>
        <RouterLink
          v-if="
            errorEspera.toLowerCase().includes('membresía') ||
            errorEspera.toLowerCase().includes('mora') ||
            errorEspera.toLowerCase().includes('cuota') ||
            errorEspera.toLowerCase().includes('socio') ||
            errorEspera.toLowerCase().includes('restringido')
          "
          to="/membresia"
          class="self-start text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer pt-1"
        >
          Ir a Membresías para regularizar situación →
        </RouterLink>
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

    <!-- Modal Crear / Editar Clase Grupal (Admin / Gerente) -->
    <ModalClaseForm
      v-model="modalFormVisible"
      :id-sede="sedeStore.idSedeSeleccionada || 1"
      :clase-a-editar="claseAEditar"
      :fecha-por-defecto="fechaSeleccionada"
      @guardado="cargarClases"
    />

    <!-- Modal Confirmar Eliminación de Clase -->
    <BaseModal
      v-model="modalEliminarVisible"
      title="Eliminar Clase Grupal"
      subtitle="Confirmación de baja en el cronograma"
      max-width="sm"
    >
      <div class="text-center py-2">
        <div
          class="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <PhTrash :size="32" weight="bold" />
        </div>
        <p class="text-slate-700 font-semibold mb-2 text-base">
          ¿Estás seguro de eliminar "{{ claseAEliminar?.nombre }}"?
        </p>
        <p class="text-xs text-slate-500">
          Esta acción dará de baja la clase del cronograma activo de la sede.
        </p>
      </div>

      <template #actions>
        <BaseButton
          variant="outline"
          :disabled="eliminando"
          @click="modalEliminarVisible = false"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="danger"
          :loading="eliminando"
          @click="confirmarEliminacion"
        >
          Eliminar Clase
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
