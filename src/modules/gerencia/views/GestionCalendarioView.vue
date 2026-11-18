<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import {
  PhArrowsClockwise,
  PhCaretLeft,
  PhCaretRight,
  PhPencilSimple,
  PhPlus,
  PhTrash,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { useSedeStore } from '@/store/sede'
import { toast } from '@/common/utils/toast'
import {
  formatearFechaDDMMAAAA,
  obtenerFechaLocalISO,
} from '@/common/utils/date-formatter'
import EncabezadoGerencia from '../components/EncabezadoGerencia.vue'
import PestanasGerencia from '../components/PestanasGerencia.vue'
import FeriadoFormModal from '../components/FeriadoFormModal.vue'
import ExcepcionSedeFormModal from '../components/ExcepcionSedeFormModal.vue'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal.vue'
import { calendarioService } from '../services/calendario.service'
import { obtenerMensajeDeError } from '../utils/errores'
import { PESTANAS_SEDES } from '../utils/navegacion'
import {
  DIAS_SEMANA,
  MESES,
  aFechaISO,
  describirExcepcion,
  describirFecha,
  describirTipoFecha,
  esFechaDestacada,
  moverMes,
  rangoDelMes,
  semanasDelMes,
} from '../utils/calendario'
import type {
  ExcepcionSede,
  ExcepcionSedePayload,
  FechaCalendario,
  FechaCalendarioPayload,
} from '../types/gerencia.types'

type EventoDelMes =
  | { tipo: 'feriado'; fecha: string; feriado: FechaCalendario }
  | { tipo: 'excepcion'; fecha: string; excepcion: ExcepcionSede }

const sedeStore = useSedeStore()

const hoy = obtenerFechaLocalISO()
const [anioActual, mesActual] = hoy.split('-').map(Number)

const anio = ref(anioActual)
const mes = ref(mesActual)
const diaSeleccionado = ref(hoy)

/** Todas las fechas del mes en el calendario general (incluye días comunes). */
const fechas = ref<FechaCalendario[]>([])
const excepciones = ref<ExcepcionSede[]>([])
const cargando = ref(true)
const errorCarga = ref('')

const idSede = computed(() => sedeStore.sedeSeleccionada?.id_sede ?? null)
const nombreSede = computed(() => sedeStore.sedeSeleccionada?.nombre ?? '')

/** La sede del calendario es la misma que la del selector del encabezado. */
const sedeElegida = computed({
  get: () => (idSede.value === null ? '' : String(idSede.value)),
  set: (valor: string) => {
    if (valor) sedeStore.seleccionarSede(Number(valor))
  },
})

const capitalizar = (texto: string) =>
  texto.charAt(0).toUpperCase() + texto.slice(1)

const tituloMes = computed(
  () => `${capitalizar(MESES[mes.value - 1])} ${anio.value}`
)
const feriadosPorFecha = computed(
  () =>
    new Map(
      fechas.value
        .filter(esFechaDestacada)
        .map((fecha) => [fecha.fecha, fecha] as const)
    )
)
const excepcionesPorFecha = computed(
  () =>
    new Map(
      excepciones.value.map(
        (excepcion) => [excepcion.fecha, excepcion] as const
      )
    )
)

/** Semanas del mes con el feriado y la excepción de cada día. */
const semanas = computed(() =>
  semanasDelMes(anio.value, mes.value).map((semana) =>
    semana.map((celda) =>
      celda === null
        ? null
        : {
            ...celda,
            feriado: feriadosPorFecha.value.get(celda.fecha),
            excepcion: excepcionesPorFecha.value.get(celda.fecha),
          }
    )
  )
)

const eventosDelMes = computed<EventoDelMes[]>(() =>
  [
    ...[...feriadosPorFecha.value.values()].map((feriado): EventoDelMes => ({
      tipo: 'feriado',
      fecha: feriado.fecha,
      feriado,
    })),
    ...excepciones.value.map((excepcion): EventoDelMes => ({
      tipo: 'excepcion',
      fecha: excepcion.fecha,
      excepcion,
    })),
  ].sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      (a.tipo === b.tipo ? 0 : a.tipo === 'feriado' ? -1 : 1)
  )
)

const feriadoDelDia = computed(() =>
  feriadosPorFecha.value.get(diaSeleccionado.value)
)
const excepcionDelDia = computed(() =>
  excepcionesPorFecha.value.get(diaSeleccionado.value)
)

/** Lectura completa de un día para lectores de pantalla. */
function etiquetaDelDia(fecha: string): string {
  const partes = [capitalizar(describirFecha(fecha))]
  const feriado = feriadosPorFecha.value.get(fecha)
  const excepcion = excepcionesPorFecha.value.get(fecha)
  if (feriado) {
    partes.push(
      `${describirTipoFecha(feriado)}${feriado.descripcion ? `: ${feriado.descripcion}` : ''}`
    )
  }
  if (excepcion) {
    partes.push(`${nombreSede.value}: ${describirExcepcion(excepcion)}`)
  }
  return partes.join('. ')
}

const formatoCorto = (fecha: string) =>
  `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`

// Si llegan respuestas de un mes o una sede anteriores, se descartan.
let versionCarga = 0

async function cargarMes() {
  const version = ++versionCarga
  const { desde, hasta } = rangoDelMes(anio.value, mes.value)
  const sede = idSede.value
  cargando.value = true
  errorCarga.value = ''
  try {
    const [listaFechas, listaExcepciones] = await Promise.all([
      calendarioService.listarFechas(desde, hasta),
      sede === null
        ? Promise.resolve([])
        : calendarioService.listarExcepciones(sede, desde, hasta),
    ])
    if (version !== versionCarga) return
    fechas.value = listaFechas
    excepciones.value = listaExcepciones
  } catch (error: unknown) {
    if (version !== versionCarga) return
    errorCarga.value = obtenerMensajeDeError(
      error,
      'No se pudo cargar el calendario. Revisá la conexión e intentá nuevamente.'
    )
  } finally {
    if (version === versionCarga) cargando.value = false
  }
}

function cambiarMes(delta: number) {
  const destino = moverMes(anio.value, mes.value, delta)
  irAMes(destino.anio, destino.mes)
}

function irAMes(nuevoAnio: number, nuevoMes: number) {
  anio.value = nuevoAnio
  mes.value = nuevoMes
  diaSeleccionado.value =
    nuevoAnio === anioActual && nuevoMes === mesActual
      ? hoy
      : aFechaISO(nuevoAnio, nuevoMes, 1)
  void cargarMes()
}

/** Lleva el calendario al mes de la fecha, la selecciona y recarga. */
function irAFecha(fecha: string) {
  const [nuevoAnio, nuevoMes] = fecha.split('-').map(Number)
  anio.value = nuevoAnio
  mes.value = nuevoMes
  diaSeleccionado.value = fecha
  return cargarMes()
}

/**
 * Saca del caché del store los horarios operativos de las fechas tocadas,
 * para que canchas y clases los vuelvan a pedir con los cambios.
 */
function olvidarHorarios(fechasTocadas: string[], soloSede?: number) {
  for (const clave of Object.keys(sedeStore.horariosCache)) {
    const [sede, fecha] = clave.split('_')
    if (
      fechasTocadas.includes(fecha) &&
      (soloSede === undefined || Number(sede) === soloSede)
    ) {
      Reflect.deleteProperty(sedeStore.horariosCache, clave)
    }
  }
}

const esConflicto = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 409

// ---- Feriados y fechas del calendario general ----

const formularioFeriadoAbierto = ref(false)
const feriadoEnEdicion = ref<FechaCalendario | null>(null)
const fechaParaAlta = ref('')
const guardandoFeriado = ref(false)
const errorFeriado = ref('')

function abrirAltaFeriado(fecha = diaSeleccionado.value) {
  feriadoEnEdicion.value = null
  fechaParaAlta.value = fecha
  errorFeriado.value = ''
  formularioFeriadoAbierto.value = true
}

function abrirEdicionFeriado(feriado: FechaCalendario) {
  feriadoEnEdicion.value = feriado
  errorFeriado.value = ''
  formularioFeriadoAbierto.value = true
}

/**
 * Crea la fecha en el calendario general. Si ya existe como día común (el
 * backend la agrega al cargar la excepción de una sede), la actualiza. Si ya
 * es un feriado o tiene nombre, devuelve un aviso para que se edite.
 */
async function crearFeriado(
  datos: FechaCalendarioPayload
): Promise<string | null> {
  let existente = fechas.value.find((fecha) => fecha.fecha === datos.fecha)
  if (!existente) {
    try {
      await calendarioService.crearFecha(datos)
      return null
    } catch (error: unknown) {
      if (!esConflicto(error)) throw error
      const encontradas = await calendarioService.listarFechas(
        datos.fecha,
        datos.fecha
      )
      existente = encontradas[0]
      if (!existente) throw error
    }
  }

  if (esFechaDestacada(existente)) {
    return `El ${formatearFechaDDMMAAAA(datos.fecha)} ya está en el calendario (${existente.descripcion ?? describirTipoFecha(existente)}). Editá esa fecha en lugar de cargarla de nuevo.`
  }
  await calendarioService.actualizarFecha(existente.id_calendario, datos)
  return null
}

async function guardarFeriado(datos: FechaCalendarioPayload) {
  const anterior = feriadoEnEdicion.value
  guardandoFeriado.value = true
  errorFeriado.value = ''
  try {
    if (anterior) {
      await calendarioService.actualizarFecha(anterior.id_calendario, datos)
    } else {
      const aviso = await crearFeriado(datos)
      if (aviso) {
        errorFeriado.value = aviso
        return
      }
    }
    toast.success(
      anterior
        ? `Fecha del ${formatearFechaDDMMAAAA(datos.fecha)} actualizada.`
        : `${datos.descripcion} agregado al calendario.`
    )
    formularioFeriadoAbierto.value = false
    olvidarHorarios([datos.fecha, ...(anterior ? [anterior.fecha] : [])])
    await irAFecha(datos.fecha)
  } catch (error: unknown) {
    errorFeriado.value = obtenerMensajeDeError(
      error,
      'No se pudo guardar la fecha. Intentá nuevamente.'
    )
  } finally {
    guardandoFeriado.value = false
  }
}

// ---- Excepciones de la sede ----

const formularioExcepcionAbierto = ref(false)
const excepcionEnEdicion = ref<ExcepcionSede | null>(null)
const guardandoExcepcion = ref(false)
const errorExcepcion = ref('')

function abrirAltaExcepcion(fecha = diaSeleccionado.value) {
  excepcionEnEdicion.value = null
  fechaParaAlta.value = fecha
  errorExcepcion.value = ''
  formularioExcepcionAbierto.value = true
}

function abrirEdicionExcepcion(excepcion: ExcepcionSede) {
  excepcionEnEdicion.value = excepcion
  errorExcepcion.value = ''
  formularioExcepcionAbierto.value = true
}

async function guardarExcepcion(datos: ExcepcionSedePayload) {
  const sede = idSede.value
  if (sede === null) return

  const anterior = excepcionEnEdicion.value
  guardandoExcepcion.value = true
  errorExcepcion.value = ''
  try {
    if (anterior) {
      // Si la fecha no cambió no se envía: el backend se ahorra una consulta.
      await calendarioService.actualizarExcepcion(
        sede,
        anterior.id_calendario_sede,
        anterior.fecha === datos.fecha ? { ...datos, fecha: undefined } : datos
      )
    } else {
      await calendarioService.crearExcepcion(sede, datos)
    }
    toast.success(
      anterior
        ? `Excepción de ${nombreSede.value} actualizada.`
        : `Excepción cargada para ${nombreSede.value} el ${formatearFechaDDMMAAAA(datos.fecha)}.`
    )
    formularioExcepcionAbierto.value = false
    olvidarHorarios([datos.fecha, ...(anterior ? [anterior.fecha] : [])], sede)
    await irAFecha(datos.fecha)
  } catch (error: unknown) {
    errorExcepcion.value = obtenerMensajeDeError(
      error,
      'No se pudo guardar la excepción. Intentá nuevamente.'
    )
  } finally {
    guardandoExcepcion.value = false
  }
}

// ---- Bajas ----

const confirmacionAbierta = ref(false)
const eventoParaEliminar = ref<EventoDelMes | null>(null)
const eliminando = ref(false)
const errorEliminacion = ref('')

function pedirEliminacion(evento: EventoDelMes) {
  eventoParaEliminar.value = evento
  errorEliminacion.value = ''
  confirmacionAbierta.value = true
}

/**
 * Borra la fecha del calendario general. Si alguna sede tiene una excepción
 * ese día, el backend no la deja borrar (409): entonces se le quita la marca
 * de feriado y queda como día común, sin tocar esas excepciones. Devuelve
 * true en ese caso.
 */
async function quitarFeriado(feriado: FechaCalendario): Promise<boolean> {
  try {
    await calendarioService.eliminarFecha(feriado.id_calendario)
    return false
  } catch (error: unknown) {
    if (!esConflicto(error)) throw error
    await calendarioService.actualizarFecha(feriado.id_calendario, {
      descripcion: null,
      es_feriado: false,
      es_dia_habil: true,
    })
    return true
  }
}

async function confirmarEliminacion() {
  const evento = eventoParaEliminar.value
  if (!evento) return

  eliminando.value = true
  errorEliminacion.value = ''
  try {
    if (evento.tipo === 'feriado') {
      const nombre = evento.feriado.descripcion || 'La fecha'
      const conservaExcepciones = await quitarFeriado(evento.feriado)
      toast.success(
        conservaExcepciones
          ? `${nombre} se quitó del calendario. Las excepciones de las sedes para ese día se mantienen.`
          : `${nombre} se quitó del calendario.`
      )
      olvidarHorarios([evento.fecha])
    } else {
      await calendarioService.eliminarExcepcion(
        evento.excepcion.id_sede,
        evento.excepcion.id_calendario_sede
      )
      toast.success(
        `Excepción de ${nombreSede.value} del ${formatearFechaDDMMAAAA(evento.fecha)} eliminada.`
      )
      olvidarHorarios([evento.fecha], evento.excepcion.id_sede)
    }
    confirmacionAbierta.value = false
    await cargarMes()
  } catch (error: unknown) {
    errorEliminacion.value = obtenerMensajeDeError(
      error,
      'No se pudo eliminar. Intentá nuevamente.'
    )
  } finally {
    eliminando.value = false
  }
}

let listo = false
watch(idSede, () => {
  if (listo) void cargarMes()
})

onMounted(async () => {
  await sedeStore.cargarSedes()
  listo = true
  await cargarMes()
})
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Calendario de sedes"
      descripcion="Feriados de toda la cadena y cierres u horarios especiales de cada sede."
      etiqueta="Multi-sede"
    >
      <template #acciones>
        <BaseButton
          variant="outline"
          size="sm"
          title="Actualizar calendario"
          :loading="cargando"
          @click="cargarMes"
        >
          <template #icon>
            <PhArrowsClockwise :size="15" />
          </template>
          Actualizar
        </BaseButton>
        <BaseButton variant="outline" size="sm" @click="abrirAltaFeriado()">
          <template #icon>
            <PhPlus :size="15" weight="bold" />
          </template>
          Nuevo feriado
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="idSede === null"
          @click="abrirAltaExcepcion()"
        >
          <template #icon>
            <PhPlus :size="15" weight="bold" />
          </template>
          Nueva excepción
        </BaseButton>
      </template>
    </EncabezadoGerencia>

    <PestanasGerencia
      etiqueta="Secciones de sedes"
      :pestanas="PESTANAS_SEDES"
    />

    <section
      aria-label="Mes y sede"
      class="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="Mes anterior"
          class="w-9 h-9 rounded-xl border border-slate-300 text-[#202759] flex items-center justify-center hover:border-[#202759] transition-colors cursor-pointer"
          @click="cambiarMes(-1)"
        >
          <PhCaretLeft :size="16" weight="bold" />
        </button>
        <h2
          id="titulo-mes"
          data-testid="titulo-mes"
          class="min-w-40 text-center text-lg font-bold text-[#202759] m-0"
        >
          {{ tituloMes }}
        </h2>
        <button
          type="button"
          aria-label="Mes siguiente"
          class="w-9 h-9 rounded-xl border border-slate-300 text-[#202759] flex items-center justify-center hover:border-[#202759] transition-colors cursor-pointer"
          @click="cambiarMes(1)"
        >
          <PhCaretRight :size="16" weight="bold" />
        </button>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="irAMes(anioActual, mesActual)"
        >
          Hoy
        </BaseButton>
      </div>

      <div class="flex items-center gap-2 grow sm:grow-0">
        <label
          for="sede-calendario"
          class="text-xs font-bold text-[#202759] whitespace-nowrap"
        >
          Excepciones de
        </label>
        <select
          id="sede-calendario"
          v-model="sedeElegida"
          :disabled="sedeStore.sedes.length === 0"
          class="w-full sm:w-56 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-[#202759] focus:ring-[#202759]/15 disabled:bg-slate-100"
        >
          <option value="" disabled>
            {{ sedeStore.cargando ? 'Cargando sedes...' : 'Sin sedes' }}
          </option>
          <option
            v-for="sede in sedeStore.sedes"
            :key="sede.id_sede"
            :value="String(sede.id_sede)"
          >
            {{ sede.nombre }}
          </option>
        </select>
      </div>
    </section>

    <div
      v-if="errorCarga"
      role="alert"
      class="p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-3"
    >
      <p class="text-sm text-rose-700">{{ errorCarga }}</p>
      <BaseButton variant="outline" size="sm" @click="cargarMes">
        Reintentar
      </BaseButton>
    </div>

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6"
    >
      <section
        aria-labelledby="titulo-mes"
        class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        <div
          class="grid grid-cols-7 bg-slate-50 text-[11px] font-bold uppercase text-slate-500"
          aria-hidden="true"
        >
          <span
            v-for="dia in DIAS_SEMANA"
            :key="dia"
            class="px-2 py-2 text-center sm:text-left"
          >
            {{ dia }}
          </span>
        </div>

        <div v-if="cargando" class="p-4 grid grid-cols-7 gap-2">
          <BaseSkeleton
            v-for="celda in 35"
            :key="celda"
            width="w-full"
            height="h-14"
          />
        </div>

        <div v-else data-testid="grilla-calendario">
          <div
            v-for="(semana, indice) in semanas"
            :key="indice"
            class="grid grid-cols-7"
          >
            <template v-for="(celda, posicion) in semana" :key="posicion">
              <div
                v-if="celda === null"
                class="min-h-14 sm:min-h-24 border-t border-slate-100 bg-slate-50/50"
              />
              <button
                v-else
                type="button"
                :data-testid="`dia-${celda.fecha}`"
                :aria-label="etiquetaDelDia(celda.fecha)"
                :aria-pressed="celda.fecha === diaSeleccionado"
                class="min-h-14 sm:min-h-24 p-1.5 sm:p-2 border-t border-l border-slate-100 first:border-l-0 text-left flex flex-col items-start gap-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#202759]/40"
                :class="
                  celda.fecha === diaSeleccionado
                    ? 'bg-[#202759]/5 ring-2 ring-inset ring-[#202759]/50'
                    : 'hover:bg-slate-50'
                "
                @click="diaSeleccionado = celda.fecha"
              >
                <span
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  :class="
                    celda.fecha === hoy
                      ? 'bg-[#202759] text-white'
                      : celda.diaSemana === 0
                        ? 'text-slate-400'
                        : 'text-slate-700'
                  "
                >
                  {{ celda.dia }}
                </span>

                <span
                  v-if="celda.feriado"
                  data-testid="marca-feriado"
                  :title="
                    celda.feriado.descripcion ||
                    describirTipoFecha(celda.feriado)
                  "
                  class="hidden sm:block w-full truncate px-1.5 py-0.5 rounded-md bg-[#F96167]/15 text-[#B23A44] text-[11px] font-semibold"
                >
                  {{
                    celda.feriado.descripcion ||
                    describirTipoFecha(celda.feriado)
                  }}
                </span>
                <span
                  v-if="celda.excepcion"
                  data-testid="marca-excepcion"
                  :title="describirExcepcion(celda.excepcion)"
                  class="hidden sm:block w-full truncate px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
                  :class="
                    celda.excepcion.cerrado
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-100 text-amber-800'
                  "
                >
                  {{
                    celda.excepcion.cerrado
                      ? 'Cerrada'
                      : `${celda.excepcion.hora_apertura}–${celda.excepcion.hora_cierre}`
                  }}
                </span>

                <span class="flex gap-1 sm:hidden" aria-hidden="true">
                  <span
                    v-if="celda.feriado"
                    class="w-1.5 h-1.5 rounded-full bg-[#F96167]"
                  />
                  <span
                    v-if="celda.excepcion"
                    class="w-1.5 h-1.5 rounded-full"
                    :class="
                      celda.excepcion.cerrado ? 'bg-rose-600' : 'bg-amber-500'
                    "
                  />
                </span>
              </button>
            </template>
          </div>
        </div>

        <ul
          class="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500"
          aria-label="Referencias"
        >
          <li class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-[#F96167]" />
            Feriado o fecha de toda la cadena
          </li>
          <li class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-rose-600" />
            {{ nombreSede || 'La sede' }} cerrada
          </li>
          <li class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            Horario especial de {{ nombreSede || 'la sede' }}
          </li>
        </ul>
      </section>

      <aside
        aria-labelledby="titulo-dia"
        data-testid="detalle-dia"
        class="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 self-start"
      >
        <h2 id="titulo-dia" class="text-sm font-bold text-[#202759] m-0">
          {{ capitalizar(describirFecha(diaSeleccionado)) }}
        </h2>

        <article
          v-if="feriadoDelDia"
          class="p-3 rounded-xl bg-[#F96167]/10 border border-[#F96167]/20 space-y-1"
        >
          <p class="text-[11px] font-bold uppercase text-[#B23A44] m-0">
            {{ describirTipoFecha(feriadoDelDia) }} · todas las sedes
          </p>
          <p class="text-sm font-semibold text-slate-800 m-0">
            {{ feriadoDelDia.descripcion || 'Sin descripción' }}
          </p>
          <p class="text-xs text-slate-500 m-0">
            {{ feriadoDelDia.es_dia_habil ? 'Día hábil' : 'Día no hábil' }}
          </p>
          <div class="flex gap-2 pt-1">
            <BaseButton
              variant="outline"
              size="sm"
              :aria-label="`Editar ${feriadoDelDia.descripcion || 'fecha'} del ${formatoCorto(feriadoDelDia.fecha)}`"
              @click="abrirEdicionFeriado(feriadoDelDia)"
            >
              <template #icon>
                <PhPencilSimple :size="15" />
              </template>
              Editar
            </BaseButton>
            <BaseButton
              variant="danger-outline"
              size="sm"
              :aria-label="`Quitar ${feriadoDelDia.descripcion || 'fecha'} del ${formatoCorto(feriadoDelDia.fecha)}`"
              @click="
                pedirEliminacion({
                  tipo: 'feriado',
                  fecha: feriadoDelDia.fecha,
                  feriado: feriadoDelDia,
                })
              "
            >
              <template #icon>
                <PhTrash :size="15" />
              </template>
              Quitar
            </BaseButton>
          </div>
        </article>

        <article
          v-if="excepcionDelDia"
          class="p-3 rounded-xl border space-y-1"
          :class="
            excepcionDelDia.cerrado
              ? 'bg-rose-50 border-rose-200'
              : 'bg-amber-50 border-amber-200'
          "
        >
          <p class="text-[11px] font-bold uppercase text-slate-500 m-0">
            Excepción de {{ nombreSede }}
          </p>
          <p class="text-sm font-semibold text-slate-800 m-0">
            {{ describirExcepcion(excepcionDelDia) }}
          </p>
          <p v-if="excepcionDelDia.motivo" class="text-xs text-slate-500 m-0">
            {{ excepcionDelDia.motivo }}
          </p>
          <div class="flex gap-2 pt-1">
            <BaseButton
              variant="outline"
              size="sm"
              :aria-label="`Editar excepción de ${nombreSede} del ${formatoCorto(excepcionDelDia.fecha)}`"
              @click="abrirEdicionExcepcion(excepcionDelDia)"
            >
              <template #icon>
                <PhPencilSimple :size="15" />
              </template>
              Editar
            </BaseButton>
            <BaseButton
              variant="danger-outline"
              size="sm"
              :aria-label="`Eliminar excepción de ${nombreSede} del ${formatoCorto(excepcionDelDia.fecha)}`"
              @click="
                pedirEliminacion({
                  tipo: 'excepcion',
                  fecha: excepcionDelDia.fecha,
                  excepcion: excepcionDelDia,
                })
              "
            >
              <template #icon>
                <PhTrash :size="15" />
              </template>
              Eliminar
            </BaseButton>
          </div>
        </article>

        <p
          v-if="!feriadoDelDia && !excepcionDelDia"
          class="text-xs text-slate-500 m-0"
        >
          Sin feriados ni excepciones{{
            nombreSede ? ` para ${nombreSede}` : ''
          }}: la sede abre con su horario semanal.
        </p>

        <div class="flex flex-col gap-2 pt-1">
          <BaseButton
            v-if="!feriadoDelDia"
            variant="outline"
            size="sm"
            @click="abrirAltaFeriado(diaSeleccionado)"
          >
            <template #icon>
              <PhPlus :size="15" />
            </template>
            Agregar feriado este día
          </BaseButton>
          <BaseButton
            v-if="!excepcionDelDia && idSede !== null"
            variant="outline"
            size="sm"
            @click="abrirAltaExcepcion(diaSeleccionado)"
          >
            <template #icon>
              <PhPlus :size="15" />
            </template>
            Agregar excepción para {{ nombreSede }}
          </BaseButton>
        </div>
      </aside>
    </div>

    <section
      v-if="!errorCarga && !cargando"
      aria-labelledby="titulo-lista"
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
    >
      <h2
        id="titulo-lista"
        class="px-4 py-3 border-b border-slate-100 text-sm font-bold text-[#202759] m-0"
      >
        Fechas de {{ MESES[mes - 1] }}
        <span v-if="nombreSede" class="font-normal text-slate-500">
          · feriados y excepciones de {{ nombreSede }}
        </span>
      </h2>

      <p
        v-if="eventosDelMes.length === 0"
        class="p-6 text-center text-sm text-slate-500"
      >
        No hay feriados ni excepciones cargados este mes.
      </p>

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="evento in eventosDelMes"
          :key="`${evento.tipo}-${evento.fecha}`"
          data-testid="fecha-del-mes"
          class="px-4 py-3 flex items-center gap-3"
        >
          <button
            type="button"
            class="w-14 shrink-0 text-left cursor-pointer"
            :aria-label="`Ver ${describirFecha(evento.fecha)}`"
            @click="diaSeleccionado = evento.fecha"
          >
            <span class="block text-sm font-bold text-[#202759] tabular-nums">
              {{ formatoCorto(evento.fecha) }}
            </span>
            <span class="block text-[11px] text-slate-500">
              {{ describirFecha(evento.fecha).split(' ')[0] }}
            </span>
          </button>

          <div v-if="evento.tipo === 'feriado'" class="min-w-0 flex-1">
            <span
              class="inline-flex px-2 py-0.5 rounded-full bg-[#F96167]/15 text-[#B23A44] text-[11px] font-bold"
            >
              {{ describirTipoFecha(evento.feriado) }} · todas las sedes
            </span>
            <p class="text-sm text-slate-800 truncate m-0 mt-0.5">
              {{ evento.feriado.descripcion || 'Sin descripción' }}
            </p>
          </div>
          <div v-else class="min-w-0 flex-1">
            <span
              class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold"
              :class="
                evento.excepcion.cerrado
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-100 text-amber-800'
              "
            >
              {{ evento.excepcion.cerrado ? 'Cierre' : 'Horario especial' }} ·
              {{ nombreSede }}
            </span>
            <p class="text-sm text-slate-800 truncate m-0 mt-0.5">
              {{ describirExcepcion(evento.excepcion)
              }}{{
                evento.excepcion.motivo ? ` · ${evento.excepcion.motivo}` : ''
              }}
            </p>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-500 hover:text-[#202759] hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              :aria-label="
                evento.tipo === 'feriado'
                  ? `Editar ${evento.feriado.descripcion || 'fecha'} del ${formatoCorto(evento.fecha)}`
                  : `Editar excepción de ${nombreSede} del ${formatoCorto(evento.fecha)}`
              "
              @click="
                evento.tipo === 'feriado'
                  ? abrirEdicionFeriado(evento.feriado)
                  : abrirEdicionExcepcion(evento.excepcion)
              "
            >
              <PhPencilSimple :size="16" />
            </button>
            <button
              type="button"
              class="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
              :aria-label="
                evento.tipo === 'feriado'
                  ? `Quitar ${evento.feriado.descripcion || 'fecha'} del ${formatoCorto(evento.fecha)}`
                  : `Eliminar excepción de ${nombreSede} del ${formatoCorto(evento.fecha)}`
              "
              @click="pedirEliminacion(evento)"
            >
              <PhTrash :size="16" />
            </button>
          </div>
        </li>
      </ul>
    </section>

    <FeriadoFormModal
      v-model="formularioFeriadoAbierto"
      :fecha="feriadoEnEdicion"
      :fecha-inicial="fechaParaAlta"
      :guardando="guardandoFeriado"
      :error-servidor="errorFeriado"
      @guardar="guardarFeriado"
    />

    <ExcepcionSedeFormModal
      v-model="formularioExcepcionAbierto"
      :excepcion="excepcionEnEdicion"
      :nombre-sede="nombreSede"
      :fecha-inicial="fechaParaAlta"
      :guardando="guardandoExcepcion"
      :error-servidor="errorExcepcion"
      @guardar="guardarExcepcion"
    />

    <ConfirmarEliminacionModal
      v-model="confirmacionAbierta"
      :titulo="
        eventoParaEliminar?.tipo === 'feriado'
          ? 'Quitar fecha del calendario'
          : 'Eliminar excepción'
      "
      :texto-confirmar="
        eventoParaEliminar?.tipo === 'feriado' ? 'Sí, quitar' : 'Sí, eliminar'
      "
      :procesando="eliminando"
      :error="errorEliminacion"
      @confirmar="confirmarEliminacion"
    >
      <template v-if="eventoParaEliminar?.tipo === 'feriado'">
        Se quita
        <strong>{{
          eventoParaEliminar.feriado.descripcion || 'la fecha'
        }}</strong>
        ({{ formatearFechaDDMMAAAA(eventoParaEliminar.fecha) }}) del calendario
        de todas las sedes. Las excepciones que tenga alguna sede ese día se
        mantienen.
      </template>
      <template v-else-if="eventoParaEliminar?.tipo === 'excepcion'">
        {{ nombreSede }} vuelve a su horario semanal el
        <strong>{{ formatearFechaDDMMAAAA(eventoParaEliminar.fecha) }}</strong
        >.
      </template>
    </ConfirmarEliminacionModal>
  </div>
</template>
