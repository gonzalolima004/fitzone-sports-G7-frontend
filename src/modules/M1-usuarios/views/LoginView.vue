<template>
  <div class="login-container">
    <!-- Panel Izquierdo: Branding (Adaptado del diseño base) -->
    <div class="branding-panel">
      <div class="branding-content">
        <h1 class="logo">FitZone <span class="highlight">Sports</span></h1>
        <p class="subtitle">
          Plataforma integral para 25+ sucursales provinciales.
        </p>
        <!--[cite: 32] -->
      </div>
      <div class="footer-text">
        <p>Programación V · Plan 2026 · UNER</p>
        <!--[cite: 32] -->
      </div>
    </div>

    <!-- Panel Derecho: Formulario -->
    <div class="form-panel">
      <div class="form-wrapper">
        <h2 class="title">Inicia Sesión</h2>
        <p class="instructions">
          Ingresa tus credenciales para acceder al ecosistema FitZone.
        </p>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="********"
              required
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-alert">
            {{ errorMessage }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <div class="redirect-link">
          <p>
            ¿No tienes cuenta?
            <router-link to="/registro">Regístrate</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Por favor, completa todos los campos.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push({ name: 'home' }); // Redirige al layout principal tras el éxito
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message ||
      'Credenciales incorrectas o error de conexión.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}
.branding-panel {
  flex: 1;
  background: linear-gradient(135deg, #161c2d 0%, #0f131f 100%);
  color: white;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.logo {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.highlight {
  color: #ff5a5f;
}
.subtitle {
  color: #94a3b8;
  font-size: 1.1rem;
}
.footer-text {
  color: #64748b;
  font-size: 0.9rem;
}
.form-panel {
  flex: 1;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.form-wrapper {
  width: 100%;
  max-width: 400px;
}
.title {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}
.instructions {
  color: #64748b;
  margin-bottom: 2rem;
}
.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
}
.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus {
  border-color: #ff5a5f;
}
.error-alert {
  background-color: #fef2f2;
  color: #ef4444;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.submit-btn {
  width: 100%;
  padding: 1rem;
  background-color: #ff5a5f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.submit-btn:hover:not(:disabled) {
  background-color: #e0484d;
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.redirect-link {
  margin-top: 1.5rem;
  text-align: center;
  color: #64748b;
}
.redirect-link a {
  color: #1e293b;
  font-weight: 600;
  text-decoration: none;
}
</style>
