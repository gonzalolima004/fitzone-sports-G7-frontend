<script setup lang="ts">
import ValidacionAcceso from '../components/ValidacionAcceso.vue'
import { useSedeStore } from '@/store/sede'

const sedeStore = useSedeStore()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-xl font-bold text-[#202759]">Módulo de Recepción</h3>
      <p class="text-xs text-slate-500">
        Sede activa:
        <span class="font-semibold text-[#202759]">{{
          sedeStore.sedeSeleccionada?.nombre ?? 'General'
        }}</span>
      </p>
    </div>

    <!-- Aquí se invoca el componente que concentra toda la lógica -->
    <ValidacionAcceso />
  </div>
</template>
