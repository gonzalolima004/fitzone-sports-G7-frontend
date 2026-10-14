<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PhQrCode,
  PhClock,
  PhWarningCircle,
  PhArrowClockwise,
} from '@phosphor-icons/vue'
import { useQr } from '../composables/useQr'
import { accesosService } from '../services/accesos.service'
import type { SocioPerfilDto } from '../types/accesos.types'
import { useAuthStore } from '@/store/auth'
import BaseButton from '@/common/components/BaseButton.vue'

const authStore = useAuthStore()

const socio = ref<SocioPerfilDto | null>(null)
const isPerfilLoading = ref<boolean>(true)
const perfilError = ref<string | null>(null)

const {
  qrData,
  timeRemaining,
  isLoading: isQrLoading,
  errorMessage: qrErrorMessage,
  isExpired,
  cargarQr,
} = useQr()

const isLoadingGlobal = computed<boolean>(
  () => isPerfilLoading.value || isQrLoading.value
)

const tiempoFormateado = computed<string>(() => {
  const mins = Math.floor(timeRemaining.value / 60)
  const secs = timeRemaining.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const qrImageUrl = computed<string>(() => {
  if (!qrData.value?.token) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData.value.token)}`
})

// Mapeo seguro de iniciales para evitar runtime errors si el backend envía solo 'nombre' o 'nombreCompleto'
const inicialesSocio = computed<string>(() => {
  if (!socio.value) return 'S'
  if (socio.value.iniciales) return socio.value.iniciales
  const partes = (socio.value.nombre || 'Socio').trim().split(' ')
  return partes.length > 1
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : partes[0][0]?.toUpperCase() || 'S'
})

const cargarPerfil = async (): Promise<void> => {
  try {
    isPerfilLoading.value = true
    perfilError.value = null

    // Obtenemos el ID del usuario del authStore, fallback a 1 si no está definido para pruebas
    const userId = authStore.usuario?.id ? Number(authStore.usuario.id) : 1
    const data = await accesosService.obtenerPerfilSocio(userId)

    socio.value = {
      ...data,
      nombre: data.nombre || authStore.usuario?.nombre || 'Socio FitZone',
      socioId: data.socioId || userId,
      dni: data.dni || 'Sin especificar',
      estado: data.estado || 'ACTIVO',
    }
  } catch (error: unknown) {
    // Si falla el endpoint de perfil, cargamos un perfil fallback con los datos del authStore para no bloquear la pantalla del QR
    if (authStore.usuario) {
      socio.value = {
        socioId: authStore.usuario.id || 1,
        nombre: authStore.usuario.nombre || 'Fernando',
        dni: 'N/A',
        iniciales: 'F',
        estado: 'ACTIVO',
      }
    } else {
      perfilError.value =
        error instanceof Error
          ? error.message
          : 'Error al cargar datos del socio.'
    }
  } finally {
    isPerfilLoading.value = false
  }
}

const reintentarTodo = async (): Promise<void> => {
  await cargarPerfil()
  await cargarQr()
}

onMounted(async () => {
  await cargarPerfil()
  await cargarQr()
})
</script>

<template>
  <div
    class="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 bg-slate-100"
  >
    <div
      class="w-full max-w-md bg-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-sans"
    >
      <!-- Header -->
      <header
        class="bg-[#171e38] text-white text-center p-6 border-b-4 border-[#f43f5e]"
      >
        <h1
          class="text-2xl font-extrabold tracking-tight m-0 flex items-center justify-center gap-2"
        >
          <PhQrCode :size="28" class="text-[#f43f5e]" />
          <span>FitZone <span class="text-[#f43f5e]">Sports</span></span>
        </h1>
        <p
          class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mt-1 m-0"
        >
          Pase Digital de Socio
        </p>
      </header>

      <!-- Skeleton / Datos de Socio -->
      <section
        v-if="isPerfilLoading"
        class="p-5 border-b border-slate-200 flex items-center gap-3.5 animate-pulse"
      >
        <div class="w-11 h-11 rounded-full bg-slate-200 shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-slate-200 rounded w-3/4"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </section>

      <section
        v-else-if="socio"
        class="p-5 border-b border-slate-200 flex items-center gap-3.5"
      >
        <div
          class="w-11 h-11 rounded-full border-2 border-[#f43f5e] flex items-center justify-center font-bold text-slate-800 bg-slate-50 shrink-0"
        >
          <span>{{ inicialesSocio }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-bold text-slate-900 truncate m-0">
            {{ socio.nombre }}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5 m-0">
            Socio ID:
            <span class="font-medium text-slate-700">{{ socio.socioId }}</span>
            · DNI:
            <span class="font-medium text-slate-700">{{ socio.dni }}</span>
          </p>
        </div>
        <span
          class="text-[11px] font-bold px-2.5 py-1 rounded-full border"
          :class="
            socio.estado === 'ACTIVO'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          "
        >
          {{ socio.estado }}
        </span>
      </section>

      <!-- QR / Estados -->
      <main
        class="p-6 flex flex-col items-center justify-center bg-white min-h-[320px]"
      >
        <!-- Loading -->
        <div
          v-if="isLoadingGlobal"
          class="py-8 text-center flex flex-col items-center gap-3"
        >
          <div
            class="w-8 h-8 border-3 border-slate-200 border-t-[#171e38] rounded-full animate-spin"
          ></div>
          <p class="text-xs text-slate-500 font-medium">
            Cargando credencial dinámica...
          </p>
        </div>

        <!-- Error -->
        <div
          v-else-if="perfilError || qrErrorMessage"
          class="py-6 text-center max-w-xs flex flex-col items-center"
        >
          <PhWarningCircle :size="36" class="text-rose-500 mb-2" />
          <p class="text-sm font-semibold text-rose-800 m-0">
            No se pudo obtener la credencial
          </p>
          <p class="text-xs text-rose-600 mt-1 mb-4">
            {{ perfilError || qrErrorMessage }}
          </p>
          <BaseButton size="sm" variant="outline" @click="reintentarTodo">
            <template #icon>
              <PhArrowClockwise :size="16" />
            </template>
            Reintentar
          </BaseButton>
        </div>

        <!-- QR Válido -->
        <template v-else-if="qrData && !isExpired">
          <div
            class="bg-rose-50 text-rose-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 flex items-center gap-1.5"
          >
            <PhClock :size="16" />
            <span
              >Expira en: <strong>{{ tiempoFormateado }}</strong> min</span
            >
          </div>

          <div
            class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-center items-center"
          >
            <img
              :src="qrImageUrl"
              :alt="`Código QR de acceso`"
              class="w-48 h-48 object-contain block"
            />
          </div>

          <div
            class="bg-slate-50 text-slate-500 font-mono text-xs px-3 py-1.5 rounded-md mt-5 border border-slate-200"
          >
            <span>TOKEN: {{ qrData.token }}</span>
          </div>
        </template>

        <!-- Expirado -->
        <div v-else class="py-6 text-center flex flex-col items-center">
          <PhWarningCircle :size="32" class="text-amber-500 mb-2" />
          <p class="text-sm text-slate-500 mb-4">
            La credencial de acceso ha expirado.
          </p>
          <BaseButton size="sm" :loading="isQrLoading" @click="cargarQr">
            Solicitar nuevo QR
          </BaseButton>
        </div>
      </main>

      <footer
        class="bg-slate-50 border-t border-slate-200 text-center p-3.5 text-xs text-slate-500"
      >
        Presente este código en el lector al ingresar o salir de la sede.
      </footer>
    </div>
  </div>
</template>
