<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import axios from 'axios'
import http from '../api/http'

const resultado = ref<string>('')
const cargando = ref(false)

async function probarConexion() {
  cargando.value = true
  resultado.value = ''
  try {
    const res = await http.get('/sedes')
    resultado.value = 'Conexión exitosa: ' + JSON.stringify(res.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      resultado.value =
        'Error al consultar /sedes: ' +
        (error.response?.data?.message || error.message || 'Error de conexión')
    } else {
      resultado.value = 'Error al consultar /sedes: ' + String(error)
    }
  } finally {
    cargando.value = false
  }
}
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
    <hr />
    <section>
      <h2>Prueba de conexión con la API (/sedes)</h2>
      <button :disabled="cargando" @click="probarConexion">
        {{ cargando ? 'Consultando...' : 'Consultar sedes' }}
      </button>
      <p v-if="resultado">{{ resultado }}</p>
    </section>
  </div>
</template>
