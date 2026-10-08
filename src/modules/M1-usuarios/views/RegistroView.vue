<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { PhBarbell, PhSoccerBall } from '@phosphor-icons/vue'
import { usuariosService } from '../services/usuarios.service'
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
    toast.warning('Por favor, ingresa tanto tu nombre como tu apellido.')
    return
  }

  if (!fotoFile.value) {
    toast.warning('La foto de perfil es obligatoria para el control de acceso.')
    return
  }

  isLoading.value = true

  try {
    const nuevoUsuario = await usuariosService.registrarUsuario({
      dni: form.dni,
      email: form.email,
      contrasenia: form.contrasenia,
      nombre,
      apellido,
      telefono: form.telefono,
      id_sede: String(form.id_sede),
      foto_url: 'pendiente',
      roles: form.tipoPerfil === 'socio' ? [1] : [],
    })

    if (nuevoUsuario.id_usuario && fotoFile.value) {
      await usuariosService.subirFotoPerfil(
        nuevoUsuario.id_usuario,
        fotoFile.value
      )
    }

    toast.success('¡Cuenta creada con éxito!')
    router.push('/login')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    const apiMessage = err.response?.data?.message
    const finalMessage = Array.isArray(apiMessage)
      ? apiMessage.join(', ')
      : apiMessage || 'Error al procesar el registro.'

    toast.error(finalMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Panel Izquierdo -->
    <div
      class="hidden lg:flex lg:w-5/12 bg-[#202759] text-white p-12 flex-col justify-center relative"
    >
      <div class="max-w-md mx-auto">
        <h1 class="text-4xl font-bold mb-4">
          FitZone <span class="text-[#F96167]">Sports</span>
        </h1>
        <p class="text-lg text-gray-300">
          Plataforma integral para 25+ sucursales provinciales.
        </p>
      </div>
    </div>

    <!-- Panel Derecho -->
    <div class="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-xl">
        <h2 class="text-3xl font-bold text-[#202759] mb-2">Crea tu Cuenta</h2>
        <p class="text-gray-500 mb-8">
          Completa tus datos para ingresar al ecosistema FitZone.
        </p>

        <form class="space-y-6" @submit.prevent="handleRegistro">
          <!-- Tipo de Perfil -->
          <div>
            <label
              class="block text-sm font-bold text-[#202759] tracking-wide mb-2"
              >Tipo de Perfil</label
            >
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
                <div class="mb-2 flex justify-center text-[#202759]">
                  <PhBarbell :size="28" weight="duotone" />
                </div>
                <div class="font-bold text-sm text-[#202759]">
                  Socio FitZone
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Acceso multi-sede, clases y 15% off en canchas
                </div>
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
                <div class="mb-2 flex justify-center text-[#202759]">
                  <PhSoccerBall :size="28" weight="duotone" />
                </div>
                <div class="font-bold text-sm text-[#202759]">
                  Cliente Externo
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Solo alquiler de canchas de Paddle y Fútbol 5
                </div>
              </button>
            </div>
          </div>

          <!-- Foto de Perfil -->
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
              <svg
                v-else
                class="h-6 w-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <label
                class="block text-sm font-bold text-[#202759] tracking-wide"
                >Foto de Perfil</label
              >
              <p class="text-xs text-gray-500 mb-2">
                Obligatoria para Control de Acceso en sedes.
              </p>
              <BaseButton variant="outline" size="sm" @click="triggerFileInput">
                Subir Fotografía
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

          <!-- Grilla de Inputs -->
          <div class="grid grid-cols-2 gap-4">
            <BaseInput
              v-model="form.nombreCompleto"
              label="Nombre y Apellido"
              placeholder="Gonzalo Morales"
              required
            />
            <BaseInput
              v-model="form.dni"
              label="DNI / Documento"
              placeholder="38.945.120"
              required
            />
            <BaseInput
              v-model="form.email"
              type="email"
              label="Correo Electrónico"
              placeholder="gonzalo.morales@email.com"
              required
            />
            <BaseInput
              v-model="form.telefono"
              label="Teléfono de Contacto"
              placeholder="+54 343 5123456"
              required
            />
            <BaseInput
              v-model="form.contrasenia"
              type="password"
              label="Contraseña"
              placeholder="********"
              required
            />
            <BaseInput
              v-model="form.confirmarContrasenia"
              type="password"
              label="Confirmar Contraseña"
              placeholder="********"
              required
            />
          </div>

          <!-- Sede (Manteniendo estilo para coincidir con BaseInput) -->
          <div class="flex flex-col gap-1.5 w-full text-left">
            <label
              class="text-xs font-bold text-[#202759] tracking-wide flex items-center justify-between"
            >
              <span
                >Sede de Preferencia / Registro
                <span class="text-[#F96167] ml-0.5">*</span></span
              >
            </label>
            <select
              v-model="form.id_sede"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 transition-all duration-200 focus:outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15"
              required
            >
              <option value="1">Sede Central - Paraná Centro</option>
              <option value="2">Sede Norte - Concordia</option>
            </select>
            <p class="text-xs text-slate-400 font-normal mt-0.5">
              Podrás acceder a cualquiera de las 25+ sedes sin restricciones.
            </p>
          </div>

          <BaseButton
            type="submit"
            variant="secondary"
            size="lg"
            class="w-full"
            :loading="isLoading"
          >
            Completar Registro y Continuar
          </BaseButton>

          <p class="text-center text-sm text-gray-600 mt-4">
            ¿Ya tienes cuenta?
            <router-link
              to="/login"
              class="font-bold text-[#202759] hover:underline"
            >
              Iniciar Sesión
            </router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
