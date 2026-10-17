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
    const err = error as { message?: string }
    toast.error(err.message || 'Credenciales incorrectas o error de conexión.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex font-sans">
    <div
      class="hidden lg:flex lg:w-5/12 bg-[#202759] text-white p-12 flex-col justify-center"
    >
      <h1 class="text-4xl font-bold mb-4">
        FitZone <span class="text-[#F96167]">Sports</span>
      </h1>
    </div>

    <div class="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-md">
        <h2 class="text-3xl font-bold text-[#202759] mb-8">Inicia Sesión</h2>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <BaseInput
            id="email"
            v-model="email"
            type="email"
            label="Correo Electrónico"
            required
            :disabled="isLoading"
          />
          <BaseInput
            id="password"
            v-model="password"
            type="password"
            label="Contraseña"
            required
            :disabled="isLoading"
          />

          <div class="text-right">
            <router-link
              to="/cambiar-password"
              class="text-sm text-[#202759] font-bold hover:underline"
            >
              Cambiar contraseña
            </router-link>
          </div>

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
      </div>
    </div>
  </div>
</template>
