<script setup lang="ts">
import { RouterView } from 'vue-router'
import EncabezadoGerencia from '@/modules/gerencia/components/EncabezadoGerencia.vue'
import PestanasGerencia from '@/modules/gerencia/components/PestanasGerencia.vue'
import { PESTANAS_REPORTES } from '@/modules/gerencia/utils/navegacion'
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Reportes de gerencia"
      descripcion="Revisá los ingresos y la actividad de las sedes."
      etiqueta="Reportes"
    />
    <PestanasGerencia
      etiqueta="Reportes de gerencia"
      :pestanas="PESTANAS_REPORTES"
    />
    <RouterView />
  </div>
</template>
