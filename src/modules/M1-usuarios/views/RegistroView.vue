<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { PhSoccerBall } from '@phosphor-icons/vue'
import { usuariosService } from '../services/usuarios.service'
import { authService } from '../services/auth.service'
import { useSedeStore } from '@/store/sede'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const router = useRouter()
const sedeStore = useSedeStore()
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
  id_sede: '',
})

onMounted(async () => {
  await sedeStore.cargarSedes()
})

// VALIDACIÓN ESTRICTA
const registroSchema = z
  .object({
    nombreCompleto: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres.')
      .regex(
        /^[a-zA-ZÀ-ÿ\s]+$/,
        'El nombre solo puede contener letras y espacios.'
      ),
    dni: z
      .string()
      .regex(
        /^\d{7,8}$/,
        'El DNI debe contener entre 7 y 8 números sin puntos.'
      ),
    email: z.string().email('El formato del correo es inválido.'),
    telefono: z
      .string()
      .regex(
        /^\+?\d{10,15}$/,
        'El teléfono debe contener entre 10 y 15 números (se permite "+" al inicio).'
      ),
    contrasenia: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmarContrasenia: z.string(),
    id_sede: z.string().min(1, 'Debes seleccionar una sede válida.'),
  })
  .refine((data) => data.contrasenia === data.confirmarContrasenia, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmarContrasenia'],
  })
  .refine((data) => data.nombreCompleto.trim().split(' ').length > 1, {
    message: 'Por favor, ingresa tanto tu nombre como tu apellido.',
    path: ['nombreCompleto'],
  })

const triggerFileInput = () => fileInput.value?.click()

const handleFotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    fotoFile.value = target.files[0]
    fotoPreview.value = URL.createObjectURL(fotoFile.value)
  }
}

// Función para traducir errores de Supabase
const traducirErrorSupabase = (msg: string) => {
  if (msg.includes('User already registered'))
    return 'Este correo electrónico ya está registrado.'
  if (msg.includes('Password should be'))
    return 'La contraseña es demasiado débil.'
  if (msg.includes('Invalid email'))
    return 'El formato del correo electrónico es inválido.'
  return msg
}

const handleRegistro = async () => {
  const validation = registroSchema.safeParse(form)
  if (!validation.success) {
    validation.error.issues.forEach((err) => toast.warning(err.message))
    return
  }

  const partesNombre = form.nombreCompleto.trim().split(' ')
  const nombre = partesNombre[0]
  const apellido = partesNombre.slice(1).join(' ')

  isLoading.value = true

  try {
    // 1. Supabase
    await authService.register({
      email: form.email,
      password: form.contrasenia,
    })

    // 2. Backend local
    const nuevoUsuario = await usuariosService.registrarUsuario({
      dni: form.dni,
      email: form.email,
      nombre,
      apellido,
      telefono: form.telefono,
      id_sede: form.id_sede,
      roles: form.tipoPerfil === 'socio' ? [1] : [4],
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
    const err = error as {
      message?: string
      response?: { data?: { message?: string } }
    }

    // Si el error viene de la API local
    if (err.response?.data?.message) {
      toast.error(
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Error en el servidor local.'
      )
    }
    // Si el error viene de Supabase (ej. User already registered)
    else if (err.message) {
      toast.error(traducirErrorSupabase(err.message))
    } else {
      toast.error('Error desconocido al procesar el registro.')
    }
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
  <div class="min-h-screen flex">
    <div
      class="hidden lg:flex lg:w-5/12 bg-[#202759] text-white p-12 flex-col justify-center relative"
    >
      <div class="max-w-md mx-auto">
        <h1 class="text-4xl font-bold mb-4">
          FitZone <span class="text-[#F96167]">Sports</span>
        </h1>
      </div>
    </div>

    <div
      class="w-full lg:w-7/12 flex items-center justify-center p-8 bg-white overflow-y-auto"
    >
      <div class="w-full max-w-xl">
        <h2 class="text-3xl font-bold text-[#202759] mb-2">Crea tu Cuenta</h2>

        <form class="space-y-6" @submit.prevent="handleRegistro">
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
              placeholder="Ej: Juan Perez"
              required
            />
            <BaseInput
              v-model="form.dni"
              label="DNI (Sin puntos)"
              placeholder="Ej: 38945120"
              required
            />
            <BaseInput
              v-model="form.email"
              type="email"
              label="Correo Electrónico"
              required
            />
            <BaseInput
              v-model="form.telefono"
              label="Teléfono"
              placeholder="Ej: +5493454859676"
              required
            />
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
            Completar Registro
          </BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>
