<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { PhSoccerBall } from '@phosphor-icons/vue'
import { usuariosService } from '../services/usuarios.service'
import { supabase } from '@/common/api/supabase'
import { useSedeStore } from '@/store/sede'
import { useAuthStore } from '@/store/auth'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import SelectorSede from '@/common/components/SelectorSede.vue'
import { toast } from '@/common/utils/toast'

const router = useRouter()
const sedeStore = useSedeStore()
const authStore = useAuthStore()
const isLoading = ref(true)
const isSubmitting = ref(false)

// Variables reactivas para la imagen
const fileInput = ref<HTMLInputElement | null>(null)
const fotoPreview = ref<string | null>(null)
const fotoFile = ref<File | null>(null)

const form = reactive({
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  telefono: '',
  id_sede: '',
})

onMounted(async () => {
  await sedeStore.cargarSedes()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    toast.error('No se encontró sesión activa.')
    router.push('/login')
    return
  }

  form.email = user.email || ''

  // Separación automática del nombre proveniente de Google
  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || ''
  const partesNombre = fullName.trim().split(' ')
  if (partesNombre.length > 0) {
    form.nombre = partesNombre[0]
    form.apellido = partesNombre.slice(1).join(' ')
  }

  // Si Google provee una foto por defecto, podríamos previsualizarla aquí (opcional)
  if (user.user_metadata?.avatar_url) {
    fotoPreview.value = user.user_metadata.avatar_url
  }

  isLoading.value = false
})

const perfilSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .regex(
      /^[a-zA-ZÀ-ÿ\s]+$/,
      'El nombre solo puede contener letras y espacios.'
    ),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .regex(
      /^[a-zA-ZÀ-ÿ\s]+$/,
      'El apellido solo puede contener letras y espacios.'
    ),
  dni: z
    .string()
    .regex(/^\d{7,8}$/, 'El DNI debe contener entre 7 y 8 números sin puntos.'),
  telefono: z
    .string()
    .regex(
      /^\+?\d{10,15}$/,
      'El teléfono debe contener entre 10 y 15 números.'
    ),
  id_sede: z.string().min(1, 'Debes seleccionar una sede válida.'),
})

// Funciones para manejar la foto
const triggerFileInput = () => fileInput.value?.click()

const handleFotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    fotoFile.value = target.files[0]
    fotoPreview.value = URL.createObjectURL(fotoFile.value)
  }
}

const removerFoto = () => {
  fotoFile.value = null
  fotoPreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleCompletarRegistro = async () => {
  const validation = perfilSchema.safeParse(form)
  if (!validation.success) {
    toast.warning(validation.error.issues[0].message)
    return
  }

  isSubmitting.value = true

  try {
    const nuevoUsuario = await usuariosService.registrarUsuario({
      dni: form.dni,
      email: form.email,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono,
      id_sede: form.id_sede,
      roles: [4],
    })

    // Subir la foto si el usuario seleccionó un archivo local
    if (nuevoUsuario.id_usuario && fotoFile.value) {
      await usuariosService.subirFotoPerfil(
        nuevoUsuario.id_usuario,
        fotoFile.value
      )
    }

    toast.success('¡Perfil completado con éxito!')
    router.push('/')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(
      typeof err.response?.data?.message === 'string'
        ? err.response.data.message
        : 'Error al vincular el perfil.'
    )
  } finally {
    isSubmitting.value = false
  }
}

const handleCancelar = async () => {
  await authStore.logout()
  toast.info('Registro cancelado.')
  router.push('/login')
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gray-50 font-sans"
  >
    <div
      class="w-full max-w-2xl bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200"
    >
      <div v-if="isLoading" class="flex justify-center py-10">
        <div
          class="w-8 h-8 border-4 border-[#202759]/20 border-t-[#F96167] rounded-full animate-spin"
        ></div>
      </div>

      <div v-else>
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-[#202759] mb-2">
            Ya casi terminamos
          </h2>
          <p class="text-sm text-gray-500">
            Ingresaste con Google de forma exitosa. Para poder darte acceso a
            las instalaciones físicas de FitZone, necesitamos unos datos extra.
          </p>
        </div>

        <form class="space-y-6" @submit.prevent="handleCompletarRegistro">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput
              v-model="form.nombre"
              label="Nombre"
              placeholder="Ej: Juan"
              required
            />
            <BaseInput
              v-model="form.apellido"
              label="Apellido"
              placeholder="Ej: Perez"
              required
            />

            <div class="sm:col-span-2">
              <BaseInput
                v-model="form.email"
                type="email"
                label="Correo Electrónico (Google)"
                disabled
                required
              />
            </div>

            <BaseInput
              v-model="form.dni"
              label="DNI (Sin puntos)"
              placeholder="Ej: 38945120"
              required
            />
            <BaseInput
              v-model="form.telefono"
              label="Teléfono"
              placeholder="Ej: +5493454859676"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5 w-full text-left">
            <label class="text-xs font-bold text-[#202759] tracking-wide"
              >Sede Principal</label
            >
            <select
              v-model="form.id_sede"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15 transition-all"
              required
            >
              <option value="" disabled>Selecciona una sede</option>
              <option
                v-for="sede in sedeStore.sedes"
                :key="sede.id_sede"
                :value="String(sede.id_sede)"
              >
                {{ sede.nombre }} - {{ sede.direccion }}
              </option>
            </select>
          </div>

          <!-- COMPONENTE: Manejo de Foto -->
          <div
            class="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-gray-50"
          >
            <div
              class="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 shrink-0"
            >
              <img
                v-if="fotoPreview"
                :src="fotoPreview"
                class="h-full w-full object-cover"
              />
              <PhSoccerBall v-else class="h-6 w-6 text-gray-400" />
            </div>
            <div class="flex-grow">
              <label class="block text-sm font-bold text-[#202759] mb-1"
                >Foto de Perfil (Opcional)</label
              >

              <!-- Botones si YA HAY foto -->
              <div v-if="fotoPreview" class="flex items-center gap-2 mt-1">
                <BaseButton
                  variant="outline"
                  size="sm"
                  type="button"
                  class="cursor-pointer"
                  @click="triggerFileInput"
                >
                  Cambiar
                </BaseButton>
                <button
                  type="button"
                  class="text-xs font-bold text-[#F96167] hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 focus:outline-none"
                  @click="removerFoto"
                >
                  Eliminar
                </button>
              </div>

              <!-- Botón si NO HAY foto -->
              <BaseButton
                v-else
                variant="outline"
                size="sm"
                type="button"
                class="cursor-pointer mt-1"
                @click="triggerFileInput"
              >
                Seleccionar Imagen
              </BaseButton>

              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleFotoUpload"
              />
            </div>
          </div>

          <!-- COMPONENTE: Manejo de Foto -->
          <div
            class="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-gray-50"
          >
            <div
              class="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 shrink-0"
            >
              <img
                v-if="fotoPreview"
                :src="fotoPreview"
                class="h-full w-full object-cover"
              />
              <PhSoccerBall v-else class="h-6 w-6 text-gray-400" />
            </div>
            <div class="flex-grow">
              <label class="block text-sm font-bold text-[#202759] mb-1"
                >Foto de Perfil (Opcional)</label
              >

              <!-- Botones si YA HAY foto -->
              <div v-if="fotoPreview" class="flex items-center gap-2 mt-1">
                <BaseButton
                  variant="outline"
                  size="sm"
                  type="button"
                  class="cursor-pointer"
                  @click="triggerFileInput"
                >
                  Cambiar
                </BaseButton>
                <button
                  type="button"
                  class="text-xs font-bold text-[#F96167] hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 focus:outline-none"
                  @click="removerFoto"
                >
                  Eliminar
                </button>
              </div>

              <!-- Botón si NO HAY foto -->
              <BaseButton
                v-else
                variant="outline"
                size="sm"
                type="button"
                class="cursor-pointer mt-1"
                @click="triggerFileInput"
              >
                Seleccionar Imagen
              </BaseButton>

              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleFotoUpload"
              />
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 pt-2">
            <BaseButton
              type="button"
              variant="outline"
              size="lg"
              class="w-full cursor-pointer"
              :disabled="isSubmitting"
              @click="handleCancelar"
            >
              Cancelar
            </BaseButton>
            <BaseButton
              type="submit"
              variant="secondary"
              size="lg"
              class="w-full cursor-pointer"
              :loading="isSubmitting"
              :disabled="sedeStore.sedes.length === 0"
            >
              Finalizar Registro
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
