<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio.')
    .email('El formato del correo es inválido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
})

const traducirErrorSupabase = (msg: string) => {
  if (msg.includes('Invalid login credentials'))
    return 'Credenciales incorrectas. Verifica tu correo y contraseña.'
  if (msg.includes('Email not confirmed'))
    return 'Debes confirmar tu correo electrónico antes de ingresar.'
  return msg
}

const handleLogin = async () => {
  const validation = loginSchema.safeParse({
    email: email.value,
    password: password.value,
  })
  if (!validation.success) {
    validation.error.issues.forEach((err) => toast.warning(err.message))
    return
  }

  isLoading.value = true

  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push({ name: 'home' }) // Redirige sin mostrar Toast
  } catch (error: unknown) {
    const err = error as { message?: string }
    const mensajeReal = err.message
      ? traducirErrorSupabase(err.message)
      : 'Error de conexión.'
    toast.error(mensajeReal)
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

          <div class="space-y-1">
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
                class="text-xs text-[#202759] hover:underline font-semibold"
              >
                ¿Olvidaste o quieres cambiar tu contraseña?
              </router-link>
            </div>
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

        <div class="mt-8 text-center text-sm text-gray-600">
          <p>
            ¿No tienes cuenta?
            <router-link
              to="/registro"
              class="font-bold text-[#202759] hover:underline"
              >Regístrate</router-link
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
