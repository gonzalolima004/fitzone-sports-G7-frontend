<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div>
    <h1>Inicio</h1>
    <nav>
      <RouterLink to="/login">Login</RouterLink> |
      <RouterLink to="/accesos">Accesos</RouterLink> |
      <RouterLink to="/clases">Clases</RouterLink> |
      <RouterLink to="/canchas">Canchas</RouterLink> |
      <RouterLink to="/pagos">Pagos</RouterLink> |
      <RouterLink to="/reportes">Reportes</RouterLink>
    </nav>
  </div>
</template>
