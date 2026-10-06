<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { usuariosService } from '../services/usuarios.service'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const authStore = useAuthStore()
const isLoading = ref(false)

const form = ref({
  nombre: '',
  apellido: '',
  telefono: '',
})

onMounted(() => {
  if (authStore.usuario) {
    form.value.nombre = authStore.usuario?.nombre ?? ''
    form.value.apellido = authStore.usuario?.apellido ?? ''
  }
})

const handleUpdate = async () => {
  isLoading.value = true

  try {
    if (authStore.usuario?.id) {
      await usuariosService.actualizarPerfil(authStore.usuario.id, form.value)

      // Notificación de éxito usando Toastify
      toast.success('Perfil actualizado correctamente.')

      // Actualizar el estado local de Pinia
      authStore.usuario.nombre = form.value.nombre
      authStore.usuario.apellido = form.value.apellido
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    const apiMessage = err.response?.data?.message
    const finalMessage = Array.isArray(apiMessage)
      ? apiMessage.join(', ')
      : apiMessage || 'Error al actualizar el perfil.'

    // Notificación de error usando Toastify
    toast.error(finalMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 mt-8">
    <h2 class="text-2xl font-bold text-[#202759] mb-6">Mi Perfil</h2>

    <form class="space-y-4" @submit.prevent="handleUpdate">
      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.nombre" label="Nombre" required />
        <BaseInput v-model="form.apellido" label="Apellido" required />
      </div>
      <div>
        <BaseInput
          v-model="form.telefono"
          label="Teléfono"
          placeholder="Opcional"
        />
      </div>
      <div class="pt-4">
        <BaseButton type="submit" variant="secondary" :loading="isLoading">
          Guardar Cambios
        </BaseButton>
      </div>
    </form>
  </div>
</template>
