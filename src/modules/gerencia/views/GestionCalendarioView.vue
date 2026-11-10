<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  PhArrowsClockwise,
  PhCaretLeft,
  PhCaretRight,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { useSedeStore } from '@/store/sede'
import { obtenerFechaLocalISO } from '@/common/utils/date-formatter'
import EncabezadoGerencia from '../components/EncabezadoGerencia.vue'
import { calendarioService } from '../services/calendario.service'
import { obtenerMensajeDeError } from '../utils/errores'
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
import type { ExcepcionSede, FechaCalendario } from '../types/gerencia.types'

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
          :disabled="cargando"
          @click="cargarMes"
        >
          <PhArrowsClockwise :size="16" />
          Actualizar
        </BaseButton>
      </template>
    </EncabezadoGerencia>

    <section
      aria-label="Mes y sede"
      class="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
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

      <div class="flex items-center gap-2">
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
          class="w-full md:w-56 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-[#202759] focus:ring-[#202759]/15 disabled:bg-slate-100"
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
        </article>

        <p
          v-if="!feriadoDelDia && !excepcionDelDia"
          class="text-xs text-slate-500 m-0"
        >
          Sin feriados ni excepciones{{
            nombreSede ? ` para ${nombreSede}` : ''
          }}: la sede abre con su horario semanal.
        </p>
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
        </li>
      </ul>
    </section>
  </div>
</template>
