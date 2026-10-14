<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="space-y-6">
    <header>
      <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Administración
      </p>
      <h1 class="mt-1 text-3xl font-bold text-[#202759]">Panel de gerencia</h1>
      <p class="mt-2 text-slate-600">
        Revisá los ingresos y la actividad de las sedes.
      </p>
    </header>
    <nav
      aria-label="Reportes de gerencia"
      class="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2"
    >
      <RouterLink
        :to="{ name: 'reportes' }"
        class="rounded-lg px-4 py-3 font-medium text-slate-600 hover:bg-slate-100"
        exact-active-class="bg-[#202759] !text-white"
        >Ingresos</RouterLink
      >
      <RouterLink
        :to="{ name: 'reportes-ocupacion' }"
        class="rounded-lg px-4 py-3 font-medium text-slate-600 hover:bg-slate-100"
        exact-active-class="bg-[#202759] !text-white"
        >Ocupación y reservas</RouterLink
      >
    </nav>
    <RouterView />
  </div>
</template>
