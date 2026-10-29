<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import {
  PhCheckCircle,
  PhSignIn,
  PhSignOut,
  PhCamera,
  PhKeyboard,
  PhQrCode,
  PhX,
  PhIdentificationCard,
} from '@phosphor-icons/vue'
import { accesosService } from '../services/accesos.service'
import type {
  ValidarAccesoResponseDto,
  ApiErrorDto,
} from '../types/accesos.types'
import { useSedeStore } from '@/store/sede'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { Html5Qrcode } from 'html5-qrcode'
import axios from 'axios'

const sedeStore = useSedeStore()

// Pestaña activa: 'ingreso' o 'egreso'
const tipoOperacion = ref<'ingreso' | 'egreso'>('ingreso')

// Modo de lectura general: 'manual' o 'camara'
const modoLectura = ref<'manual' | 'camara'>('manual')

// Sub-modo dentro de manual: 'qr' o 'dni'
const metodoManual = ref<'qr' | 'dni'>('qr')

const tokenIngresado = ref<string>('')
const dniIngresado = ref<string>('')
const isLoading = ref<boolean>(false)
const errorMensaje = ref<string | null>(null)
const resultadoValidacion = ref<ValidarAccesoResponseDto | null>(null)
const mensajeExito = ref<string | null>(null)
const escaneandoActivo = ref<boolean>(false)

let html5QrCode: Html5Qrcode | null = null

const limpiarEstados = () => {
  errorMensaje.value = null
  resultadoValidacion.value = null
  mensajeExito.value = null
}

const cambiarTipoOperacion = async (tipo: 'ingreso' | 'egreso') => {
  await detenerEscaneoCamara()
  tipoOperacion.value = tipo
  tokenIngresado.value = ''
  dniIngresado.value = ''
  limpiarEstados()
}

// Acción de Validar Ingreso (soporta QR o DNI)
const handleIngreso = async (tokenAValidar?: string): Promise<void> => {
  const isDniMode = metodoManual.value === 'dni' && !tokenAValidar
  const valorFinal =
    tokenAValidar || (isDniMode ? dniIngresado.value : tokenIngresado.value)

  if (!valorFinal.trim() || isLoading.value) {
    errorMensaje.value = isDniMode
      ? 'Debe ingresar un DNI válido antes de procesar.'
      : 'Debe ingresar o escanear un token QR válido antes de procesar.'
    return
  }

  await detenerEscaneoCamara()
  isLoading.value = true
  limpiarEstados()

  try {
    const idSede = sedeStore.idSedeSeleccionada

    if (idSede == null) {
      throw new Error('No se ha seleccionado una sede válida.')
    }

    // Enviamos el payload dependiendo si es QR o DNI
    const payload = isDniMode
      ? { dni: valorFinal.trim(), id_sede: idSede }
      : { qrToken: valorFinal.trim(), id_sede: idSede }

    const respuesta = await accesosService.validarAcceso(payload)
    resultadoValidacion.value = respuesta
  } catch (error: unknown) {
    if (axios.isAxiosError<ApiErrorDto>(error) && error.response) {
      const data = error.response.data as {
        message?: string | string[]
        detail?: string
        title?: string
      }

      const rawMessage =
        data?.message ||
        data?.detail ||
        data?.title ||
        'Ocurrió un error en el servidor.'

      // Si el mensaje viene como un array (ej. validaciones de class-validator de NestJS), lo unimos en un texto plano
      if (Array.isArray(rawMessage)) {
        errorMensaje.value = rawMessage.join('. ')
      } else {
        errorMensaje.value = rawMessage
      }
    } else if (error instanceof Error) {
      errorMensaje.value = `Error de conexión: ${error.message}`
    } else {
      errorMensaje.value =
        'Ocurrió un error inesperado al procesar la solicitud.'
    }
  } finally {
    isLoading.value = false
  }
}

// Acción de Registrar Egreso (soporta QR o DNI)
const handleEgreso = async (tokenAValidar?: string): Promise<void> => {
  const isDniMode = metodoManual.value === 'dni' && !tokenAValidar
  const valorFinal =
    tokenAValidar || (isDniMode ? dniIngresado.value : tokenIngresado.value)

  if (!valorFinal.trim() || isLoading.value) {
    errorMensaje.value = isDniMode
      ? 'Debe ingresar un DNI para registrar la salida.'
      : 'Debe ingresar o escanear el token QR para registrar la salida.'
    return
  }

  await detenerEscaneoCamara()
  isLoading.value = true
  limpiarEstados()

  try {
    const payload = isDniMode
      ? { dni: valorFinal.trim(), id_sede: sedeStore.idSedeSeleccionada ?? 1 }
      : {
          qrToken: valorFinal.trim(),
          id_sede: sedeStore.idSedeSeleccionada ?? 1,
        }

    await accesosService.registrarEgreso(payload)

    mensajeExito.value =
      '¡Salida (Egreso) registrada correctamente! Cupo liberado en el aforo.'
    tokenIngresado.value = ''
    dniIngresado.value = ''
    setTimeout(() => {
      mensajeExito.value = null
    }, 4000)
  } catch (error: unknown) {
    if (axios.isAxiosError<ApiErrorDto>(error) && error.response?.data) {
      errorMensaje.value =
        error.response.data.detail || 'Error al registrar el egreso.'
    } else {
      errorMensaje.value = 'No se pudo registrar la salida.'
    }
  } finally {
    isLoading.value = false
  }
}

const iniciarEscaneoCamara = async (): Promise<void> => {
  errorMensaje.value = null
  escaneandoActivo.value = true

  try {
    html5QrCode = new Html5Qrcode('reader-container')
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 15, qrbox: { width: 250, height: 250 } },
      async (decodedText: string) => {
        if (isLoading.value || !escaneandoActivo.value) return
        tokenIngresado.value = decodedText
        if (tipoOperacion.value === 'ingreso') {
          await handleIngreso(decodedText)
        } else {
          await handleEgreso(decodedText)
        }
      },
      () => {}
    )
  } catch {
    escaneandoActivo.value = false
    errorMensaje.value =
      'No se pudo iniciar la cámara. Verifique los permisos en su navegador.'
  }
}

const detenerEscaneoCamara = async (): Promise<void> => {
  if (html5QrCode && html5QrCode.isScanning) {
    try {
      await html5QrCode.stop()
      html5QrCode.clear()
    } catch (err) {
      console.warn('Advertencia al detener la cámara:', err)
    }
  }
  escaneandoActivo.value = false
}

const cambiarModo = async (nuevoModo: 'manual' | 'camara'): Promise<void> => {
  if (modoLectura.value === 'camara' && nuevoModo === 'manual') {
    await detenerEscaneoCamara()
  }
  modoLectura.value = nuevoModo
  if (nuevoModo === 'camara') {
    await iniciarEscaneoCamara()
  }
}

onUnmounted(() => {
  detenerEscaneoCamara()
})
</script>

<template>
  <div
    class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
  >
    <!-- Selector principal de operación: Ingreso vs Egreso -->
    <div class="flex border-b border-slate-200 pb-4 gap-4">
      <button
        type="button"
        class="flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all"
        :class="
          tipoOperacion === 'ingreso'
            ? 'border-[#202759] text-[#202759]'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        "
        @click="cambiarTipoOperacion('ingreso')"
      >
        <PhSignIn :size="18" />
        <span>Registrar Ingreso</span>
      </button>
      <button
        type="button"
        class="flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all"
        :class="
          tipoOperacion === 'egreso'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        "
        @click="cambiarTipoOperacion('egreso')"
      >
        <PhSignOut :size="18" />
        <span>Registrar Egreso (Salida)</span>
      </button>
    </div>

    <div class="space-y-4">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h3 class="text-lg font-bold text-[#202759]">
            {{
              tipoOperacion === 'ingreso'
                ? 'Validación de Ingreso a Sede'
                : 'Control de Salida (Egreso)'
            }}
          </h3>
          <p class="text-xs text-slate-500">
            Sede activa:
            <span class="font-semibold text-[#202759]">{{
              sedeStore.sedeSeleccionada?.nombre ?? 'General'
            }}</span
            >.
          </p>
        </div>

        <!-- Selector de modo (Manual o Cámara) -->
        <div
          class="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit"
        >
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="
              modoLectura === 'manual'
                ? 'bg-white text-[#202759] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            "
            @click="cambiarModo('manual')"
          >
            <PhKeyboard :size="16" />
            <span>Manual</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="
              modoLectura === 'camara'
                ? 'bg-white text-[#202759] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            "
            @click="cambiarModo('camara')"
          >
            <PhCamera :size="16" />
            <span>Cámara</span>
          </button>
        </div>
      </div>

      <!-- Modo Manual -->
      <div v-if="modoLectura === 'manual'" class="space-y-3 pt-2">
        <!-- Sub-selector: QR vs DNI -->
        <div class="flex gap-2 pb-1">
          <button
            type="button"
            class="px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5"
            :class="
              metodoManual === 'qr'
                ? 'bg-[#202759] text-white border-[#202759]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            "
            @click="((metodoManual = 'qr'), limpiarEstados())"
          >
            <PhQrCode :size="14" />
            <span>Por Token QR</span>
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5"
            :class="
              metodoManual === 'dni'
                ? 'bg-[#202759] text-white border-[#202759]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            "
            @click="((metodoManual = 'dni'), limpiarEstados())"
          >
            <PhIdentificationCard :size="14" />
            <span>Por DNI del Usuario</span>
          </button>
        </div>

        <div class="flex flex-col sm:flex-row items-end gap-3">
          <div class="w-full">
            <!-- Input para QR -->
            <BaseInput
              v-if="metodoManual === 'qr'"
              v-model="tokenIngresado"
              :label="
                tipoOperacion === 'ingreso'
                  ? 'Token QR de Ingreso'
                  : 'Token QR para Egreso'
              "
              placeholder="Pegue aquí el token dinámico..."
              :error="errorMensaje ?? undefined"
              @keyup.enter="
                () =>
                  tipoOperacion === 'ingreso' ? handleIngreso() : handleEgreso()
              "
            />
            <!-- Input para DNI -->
            <BaseInput
              v-else
              v-model="dniIngresado"
              label="Número de DNI del Usuario"
              placeholder="Ej: 38456789"
              :error="errorMensaje ?? undefined"
              @keyup.enter="
                () =>
                  tipoOperacion === 'ingreso' ? handleIngreso() : handleEgreso()
              "
            />
          </div>
          <BaseButton
            :variant="tipoOperacion === 'ingreso' ? 'primary' : 'outline'"
            size="md"
            :loading="isLoading"
            class="w-full sm:w-auto shrink-0 mb-0.5"
            @click="
              () =>
                tipoOperacion === 'ingreso' ? handleIngreso() : handleEgreso()
            "
          >
            <template #icon>
              <component
                :is="tipoOperacion === 'ingreso' ? PhSignIn : PhSignOut"
                :size="18"
              />
            </template>
            {{
              tipoOperacion === 'ingreso'
                ? 'Validar Ingreso'
                : 'Registrar Egreso'
            }}
          </BaseButton>
        </div>
      </div>

      <!-- Modo Lector por Cámara -->
      <div
        v-else
        class="p-4 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-center space-y-4"
      >
        <div
          class="w-full max-w-sm overflow-hidden rounded-lg bg-black relative flex items-center justify-center border border-slate-700 min-h-[260px]"
        >
          <div id="reader-container" class="w-full"></div>
          <div
            v-if="!escaneandoActivo"
            class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-4 space-y-3 z-10"
          >
            <PhQrCode :size="40" class="text-[#f43f5e] animate-pulse" />
            <p class="text-xs text-slate-300">Cámara detenida</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <BaseButton
            v-if="!escaneandoActivo"
            variant="primary"
            size="sm"
            @click="iniciarEscaneoCamara"
          >
            <template #icon><PhCamera :size="16" /></template>
            Encender Cámara
          </BaseButton>
          <BaseButton
            v-else
            variant="outline"
            size="sm"
            class="text-white border-slate-700 hover:bg-slate-800"
            @click="detenerEscaneoCamara"
          >
            <template #icon><PhX :size="16" class="text-rose-400" /></template>
            Apagar Cámara
          </BaseButton>
        </div>
      </div>

      <!-- Mensaje de Error -->
      <div
        v-if="errorMensaje && modoLectura === 'camara'"
        class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700"
      >
        {{ errorMensaje }}
      </div>
    </div>

    <!-- Resultado de Validación de Ingreso -->
    <div
      v-if="resultadoValidacion && tipoOperacion === 'ingreso'"
      class="mt-6 p-4 rounded-xl border bg-emerald-50 border-emerald-200 space-y-4"
    >
      <div class="flex items-start gap-3">
        <PhCheckCircle :size="24" class="text-emerald-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-sm font-bold text-emerald-900 m-0">
            ¡Acceso Aprobado!
          </h4>
          <p class="text-xs text-emerald-700 mt-0.5 m-0">
            {{ resultadoValidacion.mensaje }}
          </p>

          <div
            v-if="resultadoValidacion.socio"
            class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-emerald-100"
          >
            <div>
              <strong>Socio:</strong> {{ resultadoValidacion.socio.nombre }}
              {{ resultadoValidacion.socio.apellido }}
            </div>
            <div>
              <strong>ID Socio:</strong> {{ resultadoValidacion.socio.id }}
            </div>
            <div><strong>DNI:</strong> {{ resultadoValidacion.socio.dni }}</div>
            <div>
              <strong>Membresía:</strong>
              <span class="text-emerald-600 font-bold">Activa</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje de Éxito de Egreso -->
    <div
      v-if="mensajeExito"
      class="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-2"
    >
      <PhCheckCircle :size="20" class="text-blue-600 shrink-0" />
      <span>{{ mensajeExito }}</span>
    </div>
  </div>
</template>
