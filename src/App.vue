<!-- 
  ARCHIVO: App.vue
  PROPÓSITO: Es el "Componente Raíz" (Root Component) de tu aplicación Vue.
  Todo el sitio web se construye y se inserta desde aquí. 
-->

<script setup lang="ts">
// Importamos el componente (el bloque de construcción) que creamos
import UsuariosCrud from './components/UsuariosCrud.vue'
</script>

<template>
  <!-- 
    Aquí estamos "usando" e instanciando nuestro componente. 
    Vue tomará todo el HTML, Lógica y CSS que escribimos en UsuariosCrud.vue 
    y lo inyectará exactamente en esta línea para mostrárselo al usuario final. 
  -->
  <UsuariosCrud />
</template>
