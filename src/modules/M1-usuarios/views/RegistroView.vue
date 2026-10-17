<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { PhSoccerBall } from '@phosphor-icons/vue'
import { usuariosService } from '../services/usuarios.service'
import { authService } from '../services/auth.service'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const router = useRouter()
const isLoading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const fotoPreview = ref<string | null>(null)
const fotoFile = ref<File | null>(null)

const form = reactive({
  tipoPerfil: 'socio',
  nombreCompleto: '',
  dni: '',
  email: '',
  telefono: '',
  contrasenia: '',
  confirmarContrasenia: '',
  id_sede: 1,
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    fotoFile.value = target.files[0]
    fotoPreview.value = URL.createObjectURL(fotoFile.value)
  }
}

const handleRegistro = async () => {
  if (form.contrasenia !== form.confirmarContrasenia) {
    toast.warning('Las contraseñas no coinciden.')
    return
  }

  const partesNombre = form.nombreCompleto.trim().split(' ')
  const nombre = partesNombre[0] || ''
  const apellido = partesNombre.slice(1).join(' ') || ''

  if (!nombre || !apellido) {
    toast.warning('Por favor, ingresa tu nombre y apellido.')
    return
  }

  isLoading.value = true

  try {
    // 1. Registro en Supabase Auth
    await authService.register({
      email: form.email,
      password: form.contrasenia,
    })

    // 2. Registro del perfil interno en backend FitZone (ya sin contraseña obligatoria)
    const nuevoUsuario = await usuariosService.registrarUsuario({
      dni: form.dni,
      email: form.email,
      nombre,
      apellido,
      telefono: form.telefono,
      id_sede: String(form.id_sede),
      roles: form.tipoPerfil === 'socio' ? [1] : [],
    })

    // 3. Subida opcional de foto
    if (nuevoUsuario.id_usuario && fotoFile.value) {
      await usuariosService.subirFotoPerfil(
        nuevoUsuario.id_usuario,
        fotoFile.value
      )
    }

    toast.success('¡Cuenta creada con éxito!')
    router.push('/login')
  } catch (error: unknown) {
    const err = error as {
      message?: string
      response?: { data?: { message?: string } }
    }
    const apiMessage = err.response?.data?.message || err.message
    toast.error(
      typeof apiMessage === 'string'
        ? apiMessage
        : 'Error al procesar el registro.'
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Panel Izquierdo omitido por brevedad, asume idéntico al original -->
    <div
      class="hidden lg:flex lg:w-5/12 bg-[#202759] text-white p-12 flex-col justify-center relative"
    >
      <div class="max-w-md mx-auto">
        <h1 class="text-4xl font-bold mb-4">
          FitZone <span class="text-[#F96167]">Sports</span>
        </h1>
      </div>
    </div>

    <!-- Panel Derecho -->
    <div
      class="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white overflow-y-auto"
    >
      <div class="w-full max-w-xl">
        <h2 class="text-3xl font-bold text-[#202759] mb-2">Crea tu Cuenta</h2>

        <form class="space-y-6" @submit.prevent="handleRegistro">
          <!-- Opciones Tipo Perfil -->
          <div class="grid grid-cols-2 gap-4">
            <button
              type="button"
              class="border rounded-xl p-4 text-center transition-all"
              :class="
                form.tipoPerfil === 'socio'
                  ? 'border-[#F96167] ring-1 ring-[#F96167] bg-[#F96167]/10'
                  : 'border-gray-200 hover:bg-gray-50'
              "
              @click="form.tipoPerfil = 'socio'"
            >
              <div class="font-bold text-sm text-[#202759]">Socio FitZone</div>
            </button>
            <button
              type="button"
              class="border rounded-xl p-4 text-center transition-all"
              :class="
                form.tipoPerfil === 'cliente'
                  ? 'border-[#F96167] ring-1 ring-[#F96167] bg-[#F96167]/10'
                  : 'border-gray-200 hover:bg-gray-50'
              "
              @click="form.tipoPerfil = 'cliente'"
            >
              <div class="font-bold text-sm text-[#202759]">
                Cliente Externo
              </div>
            </button>
          </div>

          <!-- Foto de perfil OPCIONAL -->
          <div
            class="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-gray-50"
          >
            <div
              class="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300"
            >
              <img
                v-if="fotoPreview"
                :src="fotoPreview"
                class="h-full w-full object-cover"
              />
              <PhSoccerBall v-else class="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <label class="block text-sm font-bold text-[#202759]"
                >Foto de Perfil (Opcional)</label
              >
              <BaseButton variant="outline" size="sm" @click="triggerFileInput"
                >Seleccionar Imagen</BaseButton
              >
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleFotoUpload"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <BaseInput
              v-model="form.nombreCompleto"
              label="Nombre y Apellido"
              required
            />
            <BaseInput v-model="form.dni" label="DNI" required />
            <BaseInput
              v-model="form.email"
              type="email"
              label="Correo Electrónico"
              required
            />
            <BaseInput v-model="form.telefono" label="Teléfono" required />
            <BaseInput
              v-model="form.contrasenia"
              type="password"
              label="Contraseña"
              required
            />
            <BaseInput
              v-model="form.confirmarContrasenia"
              type="password"
              label="Confirmar Contraseña"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5 w-full text-left">
            <label class="text-xs font-bold text-[#202759] tracking-wide"
              >Sede</label
            >
            <select
              v-model="form.id_sede"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
              required
            >
              <option value="1">Sede Central - Paraná Centro</option>
              <option value="2">Sede Norte - Concordia</option>
            </select>
          </div>

          <BaseButton
            type="submit"
            variant="secondary"
            size="lg"
            class="w-full"
            :loading="isLoading"
          >
            Completar Registro
          </BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>
