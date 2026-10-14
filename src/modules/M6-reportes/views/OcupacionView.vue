<script setup lang="ts">
import { computed, ref } from 'vue'
import axios from 'axios'
import { useSedeStore } from '@/store/sede'
import {
  obtenerOcupacion,
  type ReporteOcupacion,
} from '../services/reportes.service'

const sedeStore = useSedeStore()
const fechaDesde = ref('')
const fechaHasta = ref('')
const idSede = ref<number | null>(null)
const cargando = ref(false)
const error = ref('')
const reporte = ref<ReporteOcupacion | null>(null)
const rangoInvalido = computed(() =>
  Boolean(
    fechaDesde.value && fechaHasta.value && fechaDesde.value > fechaHasta.value
  )
)
const totales = computed(() =>
  reporte.value?.sedes.reduce(
    (total, sede) => ({
      asistencias: total.asistencias + sede.total_asistencias,
      canchas: total.canchas + sede.total_reservas_canchas,
      clases: total.clases + sede.total_reservas_clases,
    }),
    { asistencias: 0, canchas: 0, clases: 0 }
  )
)

async function consultar() {
  if (cargando.value) return
  error.value = ''
  reporte.value = null
  if (!fechaDesde.value || !fechaHasta.value) {
    error.value = 'Seleccioná las dos fechas.'
    return
  }
  if (rangoInvalido.value) {
    error.value = 'La fecha desde no puede ser posterior a la fecha hasta.'
    return
  }
  cargando.value = true
  try {
    reporte.value = await obtenerOcupacion({
      fecha_desde: fechaDesde.value,
      fecha_hasta: fechaHasta.value,
      ...(idSede.value !== null ? { id_sede: idSede.value } : {}),
    })
  } catch (causa: unknown) {
    const mensaje: unknown = axios.isAxiosError(causa)
      ? causa.response?.data?.message
      : undefined
    error.value = Array.isArray(mensaje)
      ? mensaje.join(', ')
      : typeof mensaje === 'string'
        ? mensaje
        : 'No se pudo consultar la ocupación. Revisá la conexión e intentá nuevamente.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="space-y-6" :aria-busy="cargando">
    <header>
      <h2 class="text-2xl font-bold text-slate-800">
        Ocupación y reservas por sede
      </h2>
      <p class="mt-2 text-slate-600">
        Consultá las asistencias y reservas registradas durante un período.
      </p>
      <p class="mt-1 text-sm text-slate-500">
        Estos totales corresponden al período consultado; el aforo en tiempo
        real se consulta en recepción.
      </p>
    </header>

    <form
      class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
      @submit.prevent="consultar"
    >
      <fieldset
        :disabled="cargando"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <legend class="sr-only">Filtros de ocupación</legend>
        <div>
          <label for="ocupacion-desde" class="mb-2 block font-medium"
            >Desde</label
          >
          <input
            id="ocupacion-desde"
            v-model="fechaDesde"
            type="date"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label for="ocupacion-hasta" class="mb-2 block font-medium"
            >Hasta</label
          >
          <input
            id="ocupacion-hasta"
            v-model="fechaHasta"
            type="date"
            :min="fechaDesde"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label for="ocupacion-sede" class="mb-2 block font-medium"
            >Sede</label
          >
          <select
            id="ocupacion-sede"
            v-model="idSede"
            :disabled="sedeStore.cargando"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option :value="null">Todas las sedes</option>
            <option
              v-for="sede in sedeStore.sedes"
              :key="sede.id_sede"
              :value="sede.id_sede"
            >
              {{ sede.nombre }}
            </option>
          </select>
        </div>
      </fieldset>
      <p
        v-if="sedeStore.cargando"
        role="status"
        class="mt-3 text-sm text-slate-600"
      >
        Cargando sedes...
      </p>
      <div v-else-if="sedeStore.error" class="mt-3 text-sm text-red-700">
        <p role="alert">
          No se pudieron cargar las sedes: {{ sedeStore.error }}
        </p>
        <button
          type="button"
          class="mt-2 underline"
          @click="sedeStore.cargarSedes()"
        >
          Reintentar carga de sedes
        </button>
      </div>
      <p
        v-else-if="sedeStore.sedes.length === 0"
        class="mt-3 text-sm text-slate-600"
      >
        No hay sedes disponibles para seleccionar.
      </p>
      <p v-if="rangoInvalido" role="alert" class="mt-3 text-sm text-red-700">
        La fecha desde no puede ser posterior a la fecha hasta.
      </p>
      <button
        type="submit"
        :disabled="cargando || rangoInvalido"
        class="mt-5 rounded-lg bg-[#202759] px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {{ cargando ? 'Consultando...' : 'Consultar ocupación' }}
      </button>
    </form>

    <p v-if="cargando" role="status" class="text-slate-600">
      Consultando asistencias y reservas...
    </p>
    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-4 text-red-700">
      {{ error }}
    </p>
    <div v-if="reporte" class="space-y-4" aria-live="polite">
      <h2 class="text-lg font-bold">
        Resultados del {{ reporte.fecha_desde }} al {{ reporte.fecha_hasta }}
      </h2>
      <p
        v-if="reporte.sedes.length === 0"
        class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600"
      >
        No se encontraron asistencias ni reservas para los filtros
        seleccionados.
      </p>
      <template v-else>
        <dl v-if="totales" class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <dt class="text-sm text-slate-600">Asistencias</dt>
            <dd class="mt-2 text-3xl font-bold text-[#202759]">
              {{ totales.asistencias }}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <dt class="text-sm text-slate-600">Reservas de canchas</dt>
            <dd class="mt-2 text-3xl font-bold text-[#202759]">
              {{ totales.canchas }}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <dt class="text-sm text-slate-600">Reservas de clases</dt>
            <dd class="mt-2 text-3xl font-bold text-[#202759]">
              {{ totales.clases }}
            </dd>
          </div>
        </dl>
        <div
          class="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4"
        >
          <table class="w-full text-left">
            <caption class="mb-4 text-left font-semibold">
              Detalle por sede
            </caption>
            <thead>
              <tr class="border-b border-slate-200">
                <th scope="col" class="px-3 py-3">Sede</th>
                <th scope="col" class="px-3 py-3 text-right">Asistencias</th>
                <th scope="col" class="px-3 py-3 text-right">
                  Reservas de canchas
                </th>
                <th scope="col" class="px-3 py-3 text-right">
                  Reservas de clases
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sede in reporte.sedes"
                :key="sede.id_sede"
                class="border-b border-slate-100"
              >
                <th scope="row" class="px-3 py-3 font-medium">
                  {{ sede.nombre_sede }}
                </th>
                <td class="px-3 py-3 text-right">
                  {{ sede.total_asistencias }}
                </td>
                <td class="px-3 py-3 text-right">
                  {{ sede.total_reservas_canchas }}
                </td>
                <td class="px-3 py-3 text-right">
                  {{ sede.total_reservas_clases }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
    <p v-else-if="!cargando && !error" class="text-slate-600">
      Seleccioná un período y consultá para ver los resultados.
    </p>
  </section>
</template>
