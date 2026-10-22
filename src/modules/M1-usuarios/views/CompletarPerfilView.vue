<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { usuariosService } from '../services/usuarios.service'
import { supabase } from '@/common/api/supabase'
import { useSedeStore } from '@/store/sede'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

const router = useRouter()
const sedeStore = useSedeStore()
const isLoading = ref(true)
const isSubmitting = ref(false)

const form = reactive({
  tipoPerfil: 'socio',
  nombreCompleto: '',
  dni: '',
  email: '',
  telefono: '',
  id_sede: '',
})

onMounted(async () => {
  await sedeStore.cargarSedes()

  // Extraer datos de Google desde la sesión de Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    toast.error('No se encontró sesión activa.')
    router.push('/login')
    return
  }

  form.email = user.email || ''
  form.nombreCompleto =
    user.user_metadata?.full_name || user.user_metadata?.name || ''
  isLoading.value = false
})

const perfilSchema = z
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
    telefono: z
      .string()
      .regex(
        /^\+?\d{10,15}$/,
        'El teléfono debe contener entre 10 y 15 números.'
      ),
    id_sede: z.string().min(1, 'Debes seleccionar una sede válida.'),
  })
  .refine((data) => data.nombreCompleto.trim().split(' ').length > 1, {
    message: 'Por favor, asegúrate de tener nombre y apellido.',
    path: ['nombreCompleto'],
  })

const handleCompletarRegistro = async () => {
  const validation = perfilSchema.safeParse(form)
  if (!validation.success) {
    validation.error.issues.forEach((err) => toast.warning(err.message))
    return
  }

  isSubmitting.value = true
  const partesNombre = form.nombreCompleto.trim().split(' ')
  const nombre = partesNombre[0]
  const apellido = partesNombre.slice(1).join(' ')

  try {
    await usuariosService.registrarUsuario({
      dni: form.dni,
      email: form.email,
      nombre,
      apellido,
      telefono: form.telefono,
      id_sede: form.id_sede,
      roles: form.tipoPerfil === 'socio' ? [1] : [],
    })

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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput
              v-model="form.nombreCompleto"
              label="Nombre y Apellido"
              required
            />
            <BaseInput
              v-model="form.email"
              type="email"
              label="Correo Electrónico (Google)"
              disabled
              required
            />
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

          <BaseButton
            type="submit"
            variant="secondary"
            size="lg"
            class="w-full"
            :loading="isSubmitting"
          >
            Finalizar Registro
          </BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>
