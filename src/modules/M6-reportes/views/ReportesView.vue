<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSedeStore } from '@/store/sede'

const fechaDesde = ref('')
const fechaHasta = ref('')
const concepto = ref<'' | 'cancha' | 'membresia'>('')
const sedeStore = useSedeStore()
const idSedeReporte = ref<number | null>(null)

const rangoInvalido = computed(() => {
  if (!fechaDesde.value || !fechaHasta.value) {
    return false
  }

  return fechaDesde.value > fechaHasta.value
})
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
  </section>
</template>
