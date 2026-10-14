<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSedeStore } from '@/store/sede'
import axios from 'axios'
import {
  obtenerIngresos,
  type ConsultaIngresos,
  type ReporteIngresos,
} from '../services/reportes.service'

const fechaDesde = ref('')
const fechaHasta = ref('')
const concepto = ref<'' | 'cancha' | 'membresia'>('')
const sedeStore = useSedeStore()
const idSedeReporte = ref<number | null>(null)
const cargandoReporte = ref(false)
const errorReporte = ref('')
const reporte = ref<ReporteIngresos | null>(null)

const rangoInvalido = computed(() => {
  if (!fechaDesde.value || !fechaHasta.value) {
    return false
  }

  return fechaDesde.value > fechaHasta.value
})

async function consultarReporte() {
  if (cargandoReporte.value) return
  errorReporte.value = ''
  reporte.value = null

  if (!fechaDesde.value || !fechaHasta.value) {
    errorReporte.value = 'Seleccioná las dos fechas.'
    return
  }

  if (rangoInvalido.value) {
    errorReporte.value = 'Revisá el rango de fechas.'
    return
  }

  const filtros: ConsultaIngresos = {
    fecha_desde: fechaDesde.value,
    fecha_hasta: fechaHasta.value,
  }

  if (idSedeReporte.value !== null) {
    filtros.id_sede = idSedeReporte.value
  }

  if (concepto.value !== '') {
    filtros.concepto = concepto.value
  }

  cargandoReporte.value = true

  try {
    reporte.value = await obtenerIngresos(filtros)
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const mensaje = error.response?.data?.message

      errorReporte.value = Array.isArray(mensaje)
        ? mensaje.join(', ')
        : typeof mensaje === 'string'
          ? mensaje
          : 'No se pudo consultar el reporte. Revisá la conexión.'
    } else {
      errorReporte.value = 'Ocurrió un error al consultar el reporte.'
    }
  } finally {
    cargandoReporte.value = false
  }
}

function formatearMoneda(importe: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(importe)
}
</script>

<template>
  <section class="space-y-6" :aria-busy="cargandoReporte">
    <header>
      <h2 class="text-2xl font-bold text-slate-800">Reporte de ingresos</h2>
      <p class="mt-2 text-slate-600">
        Consultá los ingresos por período, sede y concepto.
      </p>
    </header>
    <form
      class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
      @submit.prevent="consultarReporte"
    >
      <fieldset
        :disabled="cargandoReporte"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <legend class="sr-only">Filtros de ingresos</legend>
        <div>
          <label for="fecha-desde" class="mb-2 block font-medium">Desde</label
          ><input
            id="fecha-desde"
            v-model="fechaDesde"
            type="date"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label for="fecha-hasta" class="mb-2 block font-medium">Hasta</label
          ><input
            id="fecha-hasta"
            v-model="fechaHasta"
            type="date"
            :min="fechaDesde"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label for="sede-reporte" class="mb-2 block font-medium">Sede</label>
          <select
            id="sede-reporte"
            v-model="idSedeReporte"
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
        <div>
          <label for="concepto" class="mb-2 block font-medium">Concepto</label
          ><select
            id="concepto"
            v-model="concepto"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Todos los conceptos</option>
            <option value="cancha">Canchas</option>
            <option value="membresia">Membresías</option>
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
        :disabled="cargandoReporte || rangoInvalido"
        class="mt-5 rounded-lg bg-[#202759] px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {{ cargandoReporte ? 'Consultando...' : 'Consultar ingresos' }}
      </button>
    </form>
    <p v-if="cargandoReporte" role="status" class="text-slate-600">
      Consultando ingresos...
    </p>
    <p
      v-if="errorReporte"
      role="alert"
      class="rounded-lg bg-red-50 p-4 text-red-700"
    >
      {{ errorReporte }}
    </p>
    <div
      v-if="reporte"
      class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
      aria-live="polite"
    >
      <h3 class="text-lg font-bold">
        Resultados del {{ reporte.fecha_desde }} al {{ reporte.fecha_hasta }}
      </h3>
      <p class="mt-4 text-2xl font-bold text-[#202759]">
        Total: {{ formatearMoneda(reporte.total_ingresos) }}
      </p>
      <p v-if="reporte.sedes.length === 0" class="mt-4 text-slate-600">
        No se encontraron ingresos para los filtros seleccionados.
      </p>
      <div v-else class="mt-6 overflow-x-auto">
        <table class="w-full text-left">
          <caption class="sr-only">
            Ingresos por sede
          </caption>
          <thead>
            <tr class="border-b border-slate-200">
              <th scope="col" class="px-3 py-3">Sede</th>
              <th scope="col" class="px-3 py-3 text-right">Ingresos</th>
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
                {{ formatearMoneda(sede.total_ingresos) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p v-else-if="!cargandoReporte && !errorReporte" class="text-slate-600">
      Seleccioná un período y consultá para ver los resultados.
    </p>
  </section>
</template>
