<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/auth.service'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const router = useRouter()

const handleUpdate = async () => {
  if (password.value !== confirmPassword.value) {
    toast.warning('Las contraseñas no coinciden.')
    return
  }

  isLoading.value = true
  try {
    await authService.updatePassword(password.value)
    toast.success('Contraseña actualizada con éxito.')
    router.push('/login')
  } catch (error: unknown) {
    const err = error as { message?: string }
    toast.error(
      err.message ||
        'Error al actualizar contraseña. Verifica tener una sesión activa o un enlace válido.'
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
      <h2 class="text-2xl font-bold text-[#202759] mb-6 text-center">
        Cambiar Contraseña
      </h2>

      <form class="space-y-6" @submit.prevent="handleUpdate">
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
</template>
