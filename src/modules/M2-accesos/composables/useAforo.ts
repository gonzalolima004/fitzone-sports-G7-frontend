import { ref, onUnmounted, type Ref } from 'vue'
import { toast } from '@/common/utils/toast'
import { accesosService } from '../services/accesos.service'

interface AforoData {
  actual: number
  maximo: number
  porcentaje: number
}

export function useAforo(idSedeInicial: number | Ref<number>) {
  const aforo = ref<AforoData>({
    actual: 0,
    maximo: 0,
    porcentaje: 0,
  })
  const cargando = ref<boolean>(false)
  const error = ref<string | null>(null)
  const online = ref<boolean>(navigator.onLine)
  const datosDesactualizados = ref<boolean>(false)

  let limpiarSuscripcion: (() => void) | null = null

  const obtenerIdSedeActual = () => {
    return typeof idSedeInicial === 'object' && 'value' in idSedeInicial
      ? idSedeInicial.value
      : idSedeInicial
  }

  async function obtenerAforo(sedeIdOverride?: number): Promise<void> {
    const idSede = sedeIdOverride ?? obtenerIdSedeActual()

    try {
      cargando.value = true
      error.value = null
      const aforoData = await accesosService.obtenerAforo(idSede)
      aforo.value = {
        actual: aforoData.aforoActual,
        maximo: aforoData.aforoMaximo,
        porcentaje: Math.round(
          (aforoData.aforoActual / aforoData.aforoMaximo) * 100
        ),
      }
      datosDesactualizados.value = false
    } catch {
      error.value = 'No se pudo cargar el estado del aforo.'
      datosDesactualizados.value = true
      toast.error('Error al actualizar el aforo de la sede.')
    } finally {
      cargando.value = false
    }
  }

  const handleOnline = () => {
    online.value = true
    datosDesactualizados.value = false
    error.value = null
    toast.success('Conexión recuperada. Actualizando aforo...')

    const idSede = obtenerIdSedeActual()

    setTimeout(() => {
      iniciarEscuchaTiempoReal(idSede)
    }, 1500)
  }

  const handleOffline = () => {
    datosDesactualizados.value = true
    online.value = false
    error.value = 'Se perdió la conexión en tiempo real con el servidor.'
    toast.error(
      'Sin conexión a internet. Los datos pueden estar desactualizados.'
    )
  }

  function iniciarEscuchaTiempoReal(sedeIdOverride?: number): void {
    const idSede = sedeIdOverride ?? obtenerIdSedeActual()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    obtenerAforo(idSede)

    detenerEscuchaTiempoReal()

    limpiarSuscripcion = accesosService.suscribirCambiosAforo(
      idSede,
      () => {
        // Se ejecuta cuando hay cambios en tiempo real, actualizando el aforo
        obtenerAforo(idSede)
      },
      (status) => {
        if (status === 'SUBSCRIBED') {
          datosDesactualizados.value = false
          error.value = null
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          datosDesactualizados.value = true
          error.value = 'Se perdió la conexión en tiempo real con el servidor.'
        }
      }
    )
  }

  function detenerEscuchaTiempoReal(): void {
    if (limpiarSuscripcion) {
      limpiarSuscripcion()
      limpiarSuscripcion = null
    }
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  onUnmounted(() => {
    detenerEscuchaTiempoReal()
  })

  return {
    aforo,
    cargando,
    error,
    online,
    datosDesactualizados,
    obtenerAforo,
    iniciarEscuchaTiempoReal,
    detenerEscuchaTiempoReal,
  }
}
