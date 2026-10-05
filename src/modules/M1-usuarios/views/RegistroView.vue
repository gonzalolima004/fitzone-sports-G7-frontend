<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { usuariosService } from '../services/usuarios.service'

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')
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
  errorMessage.value = ''

  if (form.contrasenia !== form.confirmarContrasenia) {
    errorMessage.value = 'Las contraseñas no coinciden.'
    return
  }

  // Separar el nombre completo en nombre y apellido para el backend
  const partesNombre = form.nombreCompleto.trim().split(' ')
  const nombre = partesNombre[0] || ''
  const apellido = partesNombre.slice(1).join(' ') || ''

  if (!nombre || !apellido) {
    errorMessage.value = 'Por favor, ingresa tanto tu nombre como tu apellido.'
    return
  }

  if (!fotoFile.value) {
    errorMessage.value =
      'La foto de perfil es obligatoria para el control de acceso.'
    return
  }

  isLoading.value = true

  try {
    // 1. Crear usuario (Se envía id_rol = 1 solo si selecciona Socio)
    const nuevoUsuario = await usuariosService.registrarUsuario({
      dni: form.dni,
      email: form.email,
      contrasenia: form.contrasenia,
      nombre,
      apellido,
      telefono: form.telefono,
      id_sede: Number(form.id_sede),
      roles: form.tipoPerfil === 'socio' ? [1] : [],
    })

    // 2. Subir fotografía utilizando el ID retornado
    if (nuevoUsuario.id_usuario && fotoFile.value) {
      await usuariosService.subirFotoPerfil(
        nuevoUsuario.id_usuario,
        fotoFile.value
      )
    }

    router.push('/login')
  } catch (error: unknown) {
    // Safe handling of unknown error objects
    const err = error as { response?: { data?: { message?: string } } }
    const apiMessage = err.response?.data?.message
    errorMessage.value = Array.isArray(apiMessage)
      ? apiMessage.join(', ')
      : apiMessage || 'Error al procesar el registro.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Panel Izquierdo (Colores oficiales aplicados) -->
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
          <div
            v-if="errorMessage"
            class="p-3 bg-red-100 text-red-700 rounded-md text-sm"
          >
            {{ errorMessage }}
          </div>

          <!-- Tipo de Perfil -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
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
                <div class="text-2xl mb-2">🏋️</div>
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
                <div class="text-2xl mb-2">⚽</div>
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
              <label class="block text-sm font-bold text-gray-900"
                >Foto de Perfil (Obligatoria para Control de Acceso)</label
              >
              <p class="text-xs text-gray-500 mb-2">
                Se utilizará para validar tu identidad en el ingreso a sedes.
              </p>
              <button
                type="button"
                class="text-xs border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:bg-gray-100 font-medium text-[#202759]"
                @click="triggerFileInput"
              >
                Subir Fotografía
              </button>
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
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Nombre y Apellido</label
              >
              <input
                v-model="form.nombreCompleto"
                type="text"
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F96167] focus:border-[#F96167] outline-none"
                placeholder="Gonzalo Morales"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >DNI / Documento</label
              >
              <input
                v-model="form.dni"
                type="text"
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F96167] focus:border-[#F96167] outline-none"
                placeholder="38.945.120"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Correo Electrónico</label
              >
              <input
                v-model="form.email"
                type="email"
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F96167] focus:border-[#F96167] outline-none"
                placeholder="gonzalo.morales@email.com"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Teléfono de Contacto</label
              >
              <input
                v-model="form.telefono"
                type="text"
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F96167] focus:border-[#F96167] outline-none"
                placeholder="+54 343 5123456"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Contraseña</label
              >
              <input
                v-model="form.contrasenia"
                type="password"
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F96167] focus:border-[#F96167] outline-none"
                placeholder="********"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Confirmar Contraseña</label
              >
              <input
                v-model="form.confirmarContrasenia"
                type="password"
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F96167] focus:border-[#F96167] outline-none"
                placeholder="********"
                required
              />
            </div>
          </div>

          <!-- Sede -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Sede de Preferencia / Registro</label
            >
            <select
              v-model="form.id_sede"
              class="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F96167] focus:border-[#F96167] outline-none bg-white"
              required
            >
              <option value="1">Sede Central - Paraná Centro</option>
              <option value="2">Sede Norte - Concordia</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              * Podrás acceder a cualquiera de las 25+ sedes sin restricciones
              (RF-03).
            </p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-[#F96167] text-white font-bold py-3 px-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {{ isLoading ? 'Procesando...' : 'Completar Registro y Continuar' }}
          </button>

          <p class="text-center text-sm text-gray-600 mt-4">
            ¿Ya tienes cuenta?
            <router-link
              to="/login"
              class="font-bold text-[#202759] hover:underline"
              >Iniciar Sesión</router-link
            >
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
