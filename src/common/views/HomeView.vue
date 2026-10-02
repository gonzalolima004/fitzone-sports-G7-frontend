<script setup lang="ts">
import { useSedeStore } from '../../store/sede'

const sedeStore = useSedeStore()
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p v-if="sedeStore.sedeSeleccionada">
      Sede activa: <strong>{{ sedeStore.sedeSeleccionada.nombre }}</strong>
    </p>
  </div>
</template>
