<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { z } from 'zod'
import {
  PhUser,
  PhCamera,
  PhFloppyDisk,
  PhLockKey,
  PhShieldCheck,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/auth'
import { usuariosService } from '../services/usuarios.service'
import { authService } from '../services/auth.service'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import SelectorDeSede from '../components/SelectorDeSede.vue'
import { toast } from '@/common/utils/toast'

const authStore = useAuthStore()

// Estados generales
const isCargandoInicial = ref(true)
const isSubiendoFoto = ref(false)
const isGuardandoPerfil = ref(false)
const isCambiandoPassword = ref(false)
const avatarError = ref(false)
const avatarLoadError = ref(false)

const avatarMostrado = computed(() => {
  if (avatarLoadError.value || avatarError.value) return null
  return fotoPreview.value || authStore.usuario?.foto_url || null
})

// Input de archivo
const fileInput = ref<HTMLInputElement | null>(null)
const fotoPreview = ref<string | null>(null)

// Formulario de datos personales
const datosForm = reactive({
  nombre: '',
  apellido: '',
  email: '',
  dni: '',
  telefono: '',
})

const erroresDatos = reactive<Record<string, string>>({})

// Formulario de seguridad
const passForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const erroresPass = reactive<Record<string, string>>({})

// Esquemas Zod
const perfilSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(50, 'El nombre no puede tener más de 50 caracteres.')
    .regex(
      /^[a-zA-ZÀ-ÿ\s]+$/,
      'El nombre solo puede contener letras y espacios.'
    ),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .max(50, 'El apellido no puede tener más de 50 caracteres.')
    .regex(
      /^[a-zA-ZÀ-ÿ\s]+$/,
      'El apellido solo puede contener letras y espacios.'
    ),
  telefono: z
    .string()
    .regex(
      /^\+?\d{10,15}$/,
      'El teléfono debe contener entre 10 y 15 dígitos (opcionalmente comenzando con +).'
    ),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Debes ingresar tu contraseña actual.'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula.')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula.')
      .regex(/[0-9]/, 'Debe contener al menos un número.'),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña.'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'La nueva contraseña debe ser distinta a la contraseña actual.',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

// Indicador visual de fortaleza de contraseña
const pwdStrength = computed(() => {
  const pwd = passForm.newPassword
  if (!pwd) {
    return {
      score: 0,
      label: '',
      colorClass: 'bg-slate-200',
      textClass: 'text-slate-400',
      width: '0%',
    }
  }

  let score = 0
  if (pwd.length >= 8) score += 1
  if (/[a-z]/.test(pwd)) score += 1
  if (/[A-Z]/.test(pwd)) score += 1
  if (/[0-9]/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1

  if (score <= 2) {
    return {
      score,
      label: 'Débil',
      colorClass: 'bg-red-500',
      textClass: 'text-red-600',
      width: '33%',
    }
  }
  if (score <= 4) {
    return {
      score,
      label: 'Buena',
      colorClass: 'bg-amber-500',
      textClass: 'text-amber-600',
      width: '66%',
    }
  }
  return {
    score,
    label: 'Fuerte',
    colorClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
    width: '100%',
  }
})

// Inicialización de datos
onMounted(async () => {
  try {
    if (!authStore.usuario?.dni || !authStore.usuario?.telefono) {
      await authStore.cargarPerfilLocal()
    }
  } catch (error) {
    console.warn('No se pudo recargar el perfil local:', error)
  } finally {
    if (authStore.usuario) {
      datosForm.nombre = authStore.usuario.nombre || ''
      datosForm.apellido = authStore.usuario.apellido || ''
      datosForm.email = authStore.usuario.email || ''
      datosForm.dni = authStore.usuario.dni || ''
      datosForm.telefono = authStore.usuario.telefono || ''
    }
    isCargandoInicial.value = false
  }
})

// Manejo de foto de perfil
function triggerFileInput() {
  fileInput.value?.click()
}

async function onFotoSeleccionada(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
  if (!tiposPermitidos.includes(file.type)) {
    toast.error('Formato no permitido. Usa imágenes JPG, PNG o WEBP.')
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  const maxBytes = 2 * 1024 * 1024 // 2 MB
  if (file.size > maxBytes) {
    toast.error('El tamaño de la imagen no puede superar los 2 MB.')
    if (fileInput.value) fileInput.value.value = ''
    return
  }

  const userId = authStore.usuario?.id
  if (!userId) {
    toast.error('No se encontró el ID de usuario activo.')
    return
  }

  fotoPreview.value = URL.createObjectURL(file)
  avatarError.value = false
  isSubiendoFoto.value = true

  try {
    const res = await usuariosService.subirFotoPerfil(userId, file)
    const nuevaFotoUrl = res?.foto_url || res?.url || fotoPreview.value
    authStore.actualizarDatosUsuario({ foto_url: nuevaFotoUrl })
    toast.success('Foto de perfil actualizada correctamente.')
  } catch (error: unknown) {
    fotoPreview.value = null
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(
      err.response?.data?.message || 'Error al subir la foto de perfil.'
    )
  } finally {
    isSubiendoFoto.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

// Guardado de datos personales
async function handleGuardarDatos() {
  Object.keys(erroresDatos).forEach((k) => delete erroresDatos[k])

  const validacion = perfilSchema.safeParse({
    nombre: datosForm.nombre.trim(),
    apellido: datosForm.apellido.trim(),
    telefono: datosForm.telefono.trim(),
  })

  if (!validacion.success) {
    validacion.error.issues.forEach((issue) => {
      const campo = issue.path[0] as string
      if (!erroresDatos[campo]) {
        erroresDatos[campo] = issue.message
      }
    })
    toast.warning(validacion.error.issues[0].message)
    return
  }

  const userId = authStore.usuario?.id
  if (!userId) {
    toast.error('No se pudo identificar tu usuario.')
    return
  }

  isGuardandoPerfil.value = true

  try {
    const payload = {
      nombre: datosForm.nombre.trim(),
      apellido: datosForm.apellido.trim(),
      telefono: datosForm.telefono.trim(),
    }

    await usuariosService.actualizarPerfil(userId, payload)
    authStore.actualizarDatosUsuario(payload)
    toast.success('Datos personales actualizados correctamente.')
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { message?: string | string[] } }
    }
    const msg = err.response?.data?.message
    const finalMsg = Array.isArray(msg)
      ? msg.join(', ')
      : msg || 'Error al actualizar tus datos.'
    toast.error(finalMsg)
  } finally {
    isGuardandoPerfil.value = false
  }
}

// Traducción de errores Supabase para contraseñas
function traducirErrorSupabase(errorMsg: string): string {
  if (
    errorMsg.includes('Invalid login credentials') ||
    errorMsg.includes('invalid_grant')
  ) {
    return 'La contraseña actual no es correcta.'
  }
  if (errorMsg.includes('same_password')) {
    return 'La nueva contraseña debe ser diferente de la anterior.'
  }
  if (errorMsg.includes('Password should be at least')) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }
  return errorMsg
}

// Cambio de contraseña
async function handleCambiarPassword() {
  Object.keys(erroresPass).forEach((k) => delete erroresPass[k])

  const validacion = passwordSchema.safeParse(passForm)
  if (!validacion.success) {
    validacion.error.issues.forEach((issue) => {
      const campo = issue.path[0] as string
      if (!erroresPass[campo]) {
        erroresPass[campo] = issue.message
      }
    })
    toast.warning(validacion.error.issues[0].message)
    return
  }

  const emailUsuario = authStore.usuario?.email
  if (!emailUsuario) {
    toast.error('No se encontró el correo del usuario.')
    return
  }

  isCambiandoPassword.value = true

  try {
    // 1. Reautenticar con la contraseña actual
    await authService.reauthenticateWithPassword(
      emailUsuario,
      passForm.currentPassword
    )

    // 2. Actualizar a la nueva contraseña
    await authService.updatePassword(passForm.newPassword)

    toast.success('¡Contraseña actualizada con éxito!')
    passForm.currentPassword = ''
    passForm.newPassword = ''
    passForm.confirmPassword = ''
  } catch (error: unknown) {
    const err = error as { message?: string }
    const mensaje = err.message
      ? traducirErrorSupabase(err.message)
      : 'Error al actualizar la contraseña.'
    toast.error(mensaje)
  } finally {
    isCambiandoPassword.value = false
  }
}

const iniciales = computed(() => {
  const nombre = datosForm.nombre || authStore.usuario?.nombre || ''
  const apellido = datosForm.apellido || authStore.usuario?.apellido || ''
  if (nombre && apellido) {
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase()
  }
  if (nombre) return nombre.charAt(0).toUpperCase()
  return 'U'
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-4"
    >
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#202759]">
          Mi Perfil
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Gestiona tu información personal, tu avatar y la seguridad de tu
          cuenta.
        </p>
      </div>
      <div
        v-if="authStore.rol"
        class="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-[#202759] uppercase tracking-wider self-start sm:self-auto"
      >
        Rol: {{ authStore.rol }}
      </div>
    </div>

    <!-- SKELETON LOADER INICIAL -->
    <div v-if="isCargandoInicial" class="space-y-6 animate-pulse">
      <div
        class="bg-white p-6 rounded-2xl border border-slate-200/80 flex items-center gap-6"
      >
        <div class="w-24 h-24 rounded-full bg-slate-200"></div>
        <div class="space-y-2 flex-1">
          <div class="h-5 w-40 bg-slate-200 rounded"></div>
          <div class="h-4 w-60 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div
        class="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4"
      >
        <div class="h-5 w-32 bg-slate-200 rounded"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="h-10 bg-slate-200 rounded"></div>
          <div class="h-10 bg-slate-200 rounded"></div>
          <div class="h-10 bg-slate-200 rounded"></div>
          <div class="h-10 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <div v-else class="space-y-6">
      <!-- 1. SECCIÓN: FOTOGRAFÍA DE PERFIL -->
      <section
        class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs"
      >
        <h2
          class="text-lg font-bold text-[#202759] mb-4 flex items-center gap-2"
        >
          <PhCamera :size="20" weight="bold" class="text-[#F96167]" />
          <span>Fotografía de Perfil</span>
        </h2>

        <div
          class="flex flex-col sm:flex-row items-center sm:items-start gap-6"
        >
          <!-- Avatar Preview -->
          <div class="relative group">
            <div
              class="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-[#202759] font-extrabold text-2xl shadow-inner select-none"
            >
              <img
                v-if="avatarMostrado"
                :src="avatarMostrado"
                alt="Foto de perfil"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
                data-testid="perfil-avatar-img"
                @error="avatarLoadError = true"
              />
              <span v-else>{{ iniciales }}</span>
            </div>

            <!-- Botón flotante para cambiar imagen -->
            <button
              type="button"
              class="absolute bottom-0 right-0 p-2 rounded-full bg-[#202759] text-white hover:bg-[#F96167] transition-colors shadow-md cursor-pointer disabled:opacity-50"
              :disabled="isSubiendoFoto"
              title="Cambiar fotografía"
              @click="triggerFileInput"
            >
              <PhCamera :size="16" weight="bold" />
            </button>
          </div>

          <!-- Información y botón de subida -->
          <div class="flex-1 text-center sm:text-left space-y-2">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onFotoSeleccionada"
            />
            <h3 class="font-bold text-[#202759] text-base">
              {{ datosForm.nombre }} {{ datosForm.apellido }}
            </h3>
            <p class="text-xs text-slate-500 max-w-md">
              Sube una foto clara en formato JPG, PNG o WEBP. El tamaño máximo
              permitido es de 2 MB.
            </p>
            <div class="pt-2">
              <BaseButton
                type="button"
                variant="outline"
                size="sm"
                :loading="isSubiendoFoto"
                @click="triggerFileInput"
              >
                Subir nueva foto
              </BaseButton>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. SECCIÓN: SELECTOR DE SEDE -->
      <SelectorDeSede />

      <!-- 3. SECCIÓN: DATOS PERSONALES -->
      <section
        class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs"
      >
        <h2
          class="text-lg font-bold text-[#202759] mb-4 flex items-center gap-2"
        >
          <PhUser :size="20" weight="bold" class="text-[#F96167]" />
          <span>Datos Personales</span>
        </h2>

        <form class="space-y-4" @submit.prevent="handleGuardarDatos">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Correo (Read-only) -->
            <BaseInput
              id="perfil-email"
              v-model="datosForm.email"
              label="Correo Electrónico"
              type="email"
              disabled
              hint="El correo electrónico está vinculado a tu cuenta y no puede modificarse."
            />

            <!-- DNI (Read-only) -->
            <BaseInput
              id="perfil-dni"
              v-model="datosForm.dni"
              label="DNI"
              disabled
              hint="El documento de identidad está verificado y no puede modificarse."
            />

            <!-- Nombre -->
            <BaseInput
              id="perfil-nombre"
              v-model="datosForm.nombre"
              label="Nombre"
              required
              :error="erroresDatos.nombre"
              placeholder="Ingresa tu nombre"
            />

            <!-- Apellido -->
            <BaseInput
              id="perfil-apellido"
              v-model="datosForm.apellido"
              label="Apellido"
              required
              :error="erroresDatos.apellido"
              placeholder="Ingresa tu apellido"
            />

            <!-- Teléfono -->
            <div class="sm:col-span-2">
              <BaseInput
                id="perfil-telefono"
                v-model="datosForm.telefono"
                label="Teléfono"
                required
                :error="erroresDatos.telefono"
                placeholder="+5491123456789"
                hint="Ejemplo: +5491123456789 o 1123456789"
              />
            </div>
          </div>

          <div class="pt-4 flex justify-end">
            <BaseButton
              type="submit"
              variant="secondary"
              :loading="isGuardandoPerfil"
            >
              <template #icon>
                <PhFloppyDisk :size="18" weight="bold" class="shrink-0" />
              </template>
              Guardar Cambios
            </BaseButton>
          </div>
        </form>
      </section>

      <!-- 3. SECCIÓN: SEGURIDAD Y CONTRASEÑA -->
      <section
        class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs"
      >
        <h2
          class="text-lg font-bold text-[#202759] mb-4 flex items-center gap-2"
        >
          <PhLockKey :size="20" weight="bold" class="text-[#F96167]" />
          <span>Seguridad y Contraseña</span>
        </h2>

        <form class="space-y-4 w-full" @submit.prevent="handleCambiarPassword">
          <!-- Contraseña actual -->
          <BaseInput
            id="current-password"
            v-model="passForm.currentPassword"
            label="Contraseña Actual"
            type="password"
            required
            :error="erroresPass.currentPassword"
            placeholder="••••••••"
          />

          <!-- Nueva contraseña -->
          <div class="space-y-1.5">
            <BaseInput
              id="new-password"
              v-model="passForm.newPassword"
              label="Nueva Contraseña"
              type="password"
              required
              :error="erroresPass.newPassword"
              placeholder="••••••••"
            />

            <!-- Barra visual de fortaleza -->
            <div v-if="passForm.newPassword" class="pt-1 space-y-1">
              <div
                class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"
              >
                <div
                  class="h-full transition-all duration-300"
                  :class="pwdStrength.colorClass"
                  :style="{ width: pwdStrength.width }"
                ></div>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500">Fortaleza:</span>
                <span class="font-bold" :class="pwdStrength.textClass">
                  {{ pwdStrength.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Confirmar nueva contraseña -->
          <BaseInput
            id="confirm-password"
            v-model="passForm.confirmPassword"
            label="Confirmar Nueva Contraseña"
            type="password"
            required
            :error="erroresPass.confirmPassword"
            placeholder="••••••••"
          />

          <div class="pt-4 flex justify-end">
            <BaseButton
              type="submit"
              variant="primary"
              :loading="isCambiandoPassword"
            >
              <template #icon>
                <PhShieldCheck :size="18" weight="bold" class="shrink-0" />
              </template>
              Actualizar Contraseña
            </BaseButton>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
