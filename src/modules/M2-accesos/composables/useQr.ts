import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'
import { accesosService } from '../services/accesos.service'
import type { QrResponseDto, ApiErrorDto } from '../types/accesos.types'
import axios from 'axios'

export function useQr() {
  const qrData = ref<QrResponseDto | null>(null)
  const timeRemaining = ref<number>(0)
  const isLoading = ref<boolean>(false)
  const errorMessage = ref<string | null>(null)
  let timerId: ReturnType<typeof setInterval> | null = null

  const isExpired = computed<boolean>(() => timeRemaining.value <= 0)

  const stopTimer = (): void => {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  const startTimer = (seconds: number): void => {
    // 1. Detenemos cualquier temporizador previo inmediatamente
    stopTimer()

    // 2. Asignamos el nuevo tiempo de validez
    timeRemaining.value = seconds

    // 3. Iniciamos el nuevo intervalo
    timerId = setInterval(() => {
      if (timeRemaining.value > 1) {
        timeRemaining.value -= 1
      } else {
        timeRemaining.value = 0
        stopTimer()
        // Renovación automática al expirar
        cargarQr()
      }
    }, 1000)
  }

  const cargarQr = async (): Promise<void> => {
    // Detenemos el reloj mientras se hace la petición
    stopTimer()
    isLoading.value = true
    errorMessage.value = null

    try {
      const data = await accesosService.obtenerQr()
      qrData.value = data

      // Inicia el reloj con los segundos devueltos (60s)
      startTimer(data.validSeconds)
    } catch (error: unknown) {
      stopTimer()
      qrData.value = null

      if (axios.isAxiosError<ApiErrorDto>(error) && error.response?.data) {
        const apiError = error.response.data
        errorMessage.value =
          apiError.detail || apiError.title || 'Error al obtener la credencial.'
      } else if (error instanceof Error) {
        errorMessage.value = error.message
      } else {
        errorMessage.value = 'Ocurrió un error inesperado de conexión o sesión.'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Solo registra el hook de ciclo de vida si hay un componente montado
  if (getCurrentInstance()) {
    onUnmounted(() => {
      stopTimer()
    })
  }

  return {
    qrData,
    timeRemaining,
    isLoading,
    errorMessage,
    isExpired,
    cargarQr,
    stopTimer,
  }
}
