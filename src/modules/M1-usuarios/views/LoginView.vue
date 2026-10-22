<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { authService } from '../services/auth.service'
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

const handleGoogleLogin = async () => {
  try {
    isLoading.value = true
    await authService.loginWithGoogle()
  } catch {
    toast.error('Error al conectar con Google.')
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

          <div class="relative flex items-center py-2">
            <div class="flex-grow border-t border-gray-200"></div>
            <span
              class="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider"
              >o</span
            >
            <div class="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl text-sm font-bold text-[#202759] transition-all disabled:opacity-50"
            @click="handleGoogleLogin"
          >
            <!-- SVG Oficial de Google -->
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>

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
