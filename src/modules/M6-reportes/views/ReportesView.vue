<script setup lang="ts">
import { computed, ref } from 'vue'

const fechaDesde = ref('')
const fechaHasta = ref('')

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

      <p v-if="rangoInvalido" role="alert" class="mt-3 text-sm text-red-600">
  La fecha desde no puede ser posterior a la fecha hasta.
</p>

      <p class="mt-4 text-sm text-slate-600">
        Desde: {{ fechaDesde || 'Sin seleccionar' }}
      </p>

      <p class="mt-2 text-sm text-slate-600">
        Hasta: {{ fechaHasta || 'Sin seleccionar' }}
      </p>
    </div>
  </section>
</template>
