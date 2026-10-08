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
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Reporte de ingresos</h1>

      <p class="mt-2 text-slate-600">
        Consulta los ingresos por periodo, sede y concepto.
      </p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-6">
      <label for="fecha-desde" class="mb-2 block font-medium text-slate-700">
        Desde
      </label>

      <input
        id="fecha-desde"
        v-model="fechaDesde"
        type="date"
        class="rounded-lg border border-slate-300 px-3 py-2"
      />

      <label
        for="fecha-hasta"
        class="mb-2 mt-4 block font-medium text-slate-700"
      >
        Hasta
      </label>

      <input
        id="fecha-hasta"
        v-model="fechaHasta"
        type="date"
        :min="fechaDesde"
        class="rounded-lg border border-slate-300 px-3 py-2"
      />

      <label
        for="sede-reporte"
        class="mb-2 mt-4 block font-medium text-slate-700"
      >
        Sede
      </label>

      <select
        id="sede-reporte"
        v-model="idSedeReporte"
        :disabled="sedeStore.cargando"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2"
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

      <p v-if="sedeStore.cargando" class="mt-2 text-sm text-slate-600">
        Cargando sedes...
      </p>

      <p
        v-else-if="sedeStore.error"
        role="alert"
        class="mt-2 text-sm text-red-600"
      >
        No se pudieron cargar las sedes: {{ sedeStore.error }}
      </p>

      <p
        v-else-if="sedeStore.sedes.length === 0"
        class="mt-2 text-sm text-slate-600"
      >
        No hay sedes cargadas.
      </p>

      <label for="concepto" class="mb-2 mt-4 block font-medium text-slate-700">
        Concepto
      </label>

      <select
        id="concepto"
        v-model="concepto"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2"
      >
        <option value="">Todos los conceptos</option>
        <option value="cancha">Canchas</option>
        <option value="membresia">Membresías</option>
      </select>

      <p v-if="rangoInvalido" role="alert" class="mt-3 text-sm text-red-600">
        La fecha desde no puede ser posterior a la fecha hasta.
      </p>

      <p class="mt-4 text-sm text-slate-600">
        Desde: {{ fechaDesde || 'Sin seleccionar' }}
      </p>

      <p class="mt-2 text-sm text-slate-600">
        Hasta: {{ fechaHasta || 'Sin seleccionar' }}
      </p>

      <p class="mt-2 text-sm text-slate-600">
        ID de sede del reporte: {{ idSedeReporte ?? 'Todas las sedes' }}
      </p>

      <p class="mt-2 text-sm text-slate-600">
        Concepto: {{ concepto || 'Todos los conceptos' }}
      </p>
    </div>

    <button
      type="button"
      :disabled="cargandoReporte"
      class="mt-6 rounded-lg bg-[#202759] px-4 py-2 text-white disabled:opacity-50"
      @click="consultarReporte"
    >
      {{ cargandoReporte ? 'Consultando...' : 'Consultar' }}
    </button>

    <p v-if="errorReporte" role="alert" class="mt-3 text-sm text-red-600">
      {{ errorReporte }}
    </p>

    <div v-if="reporte" class="rounded-xl border border-slate-200 bg-white p-6">
      <h2 class="text-lg font-bold text-slate-800">Resultado del reporte</h2>

      <p class="mt-2 text-sm text-slate-600">
        Período consultado: {{ reporte.fecha_desde }} al
        {{ reporte.fecha_hasta }}
      </p>

      <p class="mt-4 text-2xl font-bold text-slate-800">
        Total: {{ formatearMoneda(reporte.total_ingresos) }}
      </p>

      <p v-if="reporte.sedes.length === 0" class="mt-4 text-slate-600">
        No se encontraron ingresos para los filtros seleccionados.
      </p>

      <div v-else class="mt-6 overflow-x-auto">
        <table class="w-full text-left">
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
              <td class="px-3 py-3">{{ sede.nombre_sede }}</td>
              <td class="px-3 py-3 text-right">
                {{ formatearMoneda(sede.total_ingresos) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
