<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { authService } from '../services/auth.service'
import { supabase } from '@/common/api/supabase'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const router = useRouter()
const hasSession = ref(false)

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  hasSession.value = !!data.session

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) hasSession.value = true
  })
})

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio.')
    .email('Formato de correo inválido.'),
})

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula.')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula.')
      .regex(/[0-9]/, 'Debe contener al menos un número.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

const traducirErrorSupabase = (msg: string) => {
  if (msg.includes('User not found'))
    return 'No existe un usuario con ese correo electrónico.'
  if (msg.includes('rate limit'))
    return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
  if (msg.includes('Auth session missing'))
    return 'Tu sesión o enlace han expirado.'
  return msg
}

const handleRequestReset = async () => {
  const validation = emailSchema.safeParse({ email: email.value })
  if (!validation.success) {
    validation.error.issues.forEach((err) => toast.warning(err.message))
    return
  }

  isLoading.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/cambiar-password`,
    })
    if (error) throw error
    toast.success('Te hemos enviado un correo con el enlace de recuperación.')
  } catch (error: unknown) {
    const err = error as { message?: string }
    toast.error(
      err.message
        ? traducirErrorSupabase(err.message)
        : 'Error al solicitar recuperación.'
    )
  } finally {
    isLoading.value = false
  }
}

const handleUpdatePassword = async () => {
  const validation = passwordSchema.safeParse({
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
  if (!validation.success) {
    validation.error.issues.forEach((err) => toast.warning(err.message))
    return
  }

  isLoading.value = true
  try {
    await authService.updatePassword(password.value)
    toast.success('Contraseña actualizada correctamente.')
    router.push('/login')
  } catch (error: unknown) {
    const err = error as { message?: string }
    toast.error(
      err.message
        ? traducirErrorSupabase(err.message)
        : 'Error al actualizar contraseña.'
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-8 bg-gray-50 font-sans"
  >
    <div
      class="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200"
    >
      <div v-if="!hasSession">
        <h2 class="text-2xl font-bold text-[#202759] mb-2 text-center">
          Recuperar Contraseña
        </h2>
        <p class="text-sm text-gray-500 text-center mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu
          acceso.
        </p>

        <form class="space-y-6" @submit.prevent="handleRequestReset">
          <BaseInput
            id="email"
            v-model="email"
            type="email"
            label="Correo Electrónico"
            placeholder="tu@email.com"
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
            Enviar Enlace
          </BaseButton>
          <div class="text-center">
            <router-link
              to="/login"
              class="text-sm text-[#202759] font-bold hover:underline"
              >Volver a inicio de sesión</router-link
            >
          </div>
        </form>
      </div>

      <div v-else>
        <h2 class="text-2xl font-bold text-[#202759] mb-6 text-center">
          Cambiar Contraseña
        </h2>
        <form class="space-y-6" @submit.prevent="handleUpdatePassword">
          <BaseInput
            id="password"
            v-model="password"
            type="password"
            label="Nueva Contraseña"
            required
            :disabled="isLoading"
          />
          <BaseInput
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            label="Confirmar Contraseña"
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
            Actualizar Contraseña
          </BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>
