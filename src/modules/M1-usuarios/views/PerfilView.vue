<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { usuariosService } from '../services/usuarios.service'

const authStore = useAuthStore()
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

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
  successMessage.value = ''
  errorMessage.value = ''

  try {
    if (authStore.usuario?.id) {
      await usuariosService.actualizarPerfil(authStore.usuario.id, form.value)
      successMessage.value = 'Perfil actualizado correctamente.'

      // Actualizar el estado local de Pinia
      authStore.usuario.nombre = form.value.nombre
      authStore.usuario.apellido = form.value.apellido
    }
  } catch (error: unknown) {
    // Safe handling of unknown error objects
    const err = error as { response?: { data?: { message?: string } } }
    const apiMessage = err.response?.data?.message
    errorMessage.value = Array.isArray(apiMessage)
      ? apiMessage.join(', ')
      : apiMessage || 'Error al actualizar el perfil.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 mt-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h2>

    <div
      v-if="successMessage"
      class="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm"
    >
      {{ successMessage }}
    </div>
    <div
      v-if="errorMessage"
      class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm"
    >
      {{ errorMessage }}
    </div>

    <form class="space-y-4" @submit.prevent="handleUpdate">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Nombre</label
          >
          <input
            v-model="form.nombre"
            type="text"
            class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#ff5a5f] focus:border-[#ff5a5f]"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Apellido</label
          >
          <input
            v-model="form.apellido"
            type="text"
            class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#ff5a5f] focus:border-[#ff5a5f]"
            required
          />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Teléfono</label
        >
        <input
          v-model="form.telefono"
          type="text"
          class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#ff5a5f] focus:border-[#ff5a5f]"
          placeholder="Opcional"
        />
      </div>
      <div class="pt-4">
        <button
          type="submit"
          :disabled="isLoading"
          class="bg-[#ff5a5f] text-white font-bold py-2 px-6 rounded-md hover:bg-red-500 transition-colors disabled:opacity-50"
        >
          {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>
