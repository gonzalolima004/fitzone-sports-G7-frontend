<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Pestana } from '../utils/navegacion'

/**
 * Pestañas de un área del panel de gerencia (Sedes o Reportes): llevan a las
 * pantallas del área y marcan la actual.
 */
defineProps<{
  etiqueta: string
  pestanas: readonly Pestana[]
}>()
</script>

<template>
  <nav
    :aria-label="etiqueta"
    class="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5"
  >
    <RouterLink
      v-for="pestana in pestanas"
      :key="pestana.nombre"
      :to="pestana.ruta"
      class="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
      exact-active-class="bg-[#202759] !text-white hover:!bg-[#202759]"
    >
      {{ pestana.nombre }}
    </RouterLink>
  </nav>
</template>
