<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.warning('Por favor, completa todos los campos.')
    return
  }

  isLoading.value = true

  try {
    await authStore.login({ email: email.value, password: password.value })
    toast.success('¡Bienvenido al ecosistema FitZone!')
    router.push({ name: 'home' })
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { message?: string | string[] } }
    }
    const apiMessage = err.response?.data?.message
    const finalMessage = Array.isArray(apiMessage)
      ? apiMessage.join(', ')
      : apiMessage || 'Credenciales incorrectas o error de conexión.'

    toast.error(finalMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex font-sans">
    <!-- Panel Izquierdo: Branding (Paleta oficial aplicada) -->
    <div
      class="hidden lg:flex lg:w-5/12 bg-[#202759] text-white p-12 flex-col justify-between relative"
    >
      <div class="mt-12">
        <h1 class="text-4xl font-bold mb-4">
          FitZone <span class="text-[#F96167]">Sports</span>
        </h1>
        <p class="text-lg text-gray-300">
          Plataforma integral para 25+ sucursales provinciales.
        </p>
      </div>
      <div class="text-sm text-gray-400">
        <p>Programación V · Plan 2026 · UNER</p>
      </div>
    </div>

    <!-- Panel Derecho: Formulario -->
    <div class="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-md">
        <h2 class="text-3xl font-bold text-[#202759] mb-2">Inicia Sesión</h2>
        <p class="text-gray-500 mb-8">
          Ingresa tus credenciales para acceder al ecosistema FitZone.
        </p>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <BaseInput
            id="email"
            v-model="email"
            type="email"
            label="Correo Electrónico"
            placeholder="tu@email.com"
            required
            :disabled="isLoading"
          />

          <BaseInput
            id="password"
            v-model="password"
            type="password"
            label="Contraseña"
            placeholder="********"
            required
            :disabled="isLoading"
          />

          <BaseButton
            type="submit"
            variant="secondary"
            size="lg"
            class="w-full"
            :loading="isLoading"
          >
            Iniciar Sesión
          </BaseButton>
        </form>

        <div class="mt-8 text-center text-sm text-gray-600">
          <p>
            ¿No tienes cuenta?
            <router-link
              to="/registro"
              class="font-bold text-[#202759] hover:underline"
            >
              Regístrate
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
