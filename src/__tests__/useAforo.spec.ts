import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useAforo } from '@/modules/M2-accesos/composables/useAforo'
import { accesosService } from '@/modules/M2-accesos/services/accesos.service'
import { toast } from '@/common/utils/toast'

vi.mock('@/modules/M2-accesos/services/accesos.service', () => ({
  accesosService: {
    obtenerAforo: vi.fn(),
    suscribirCambiosAforo: vi.fn(),
  },
}))

vi.mock('@/common/utils/toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('useAforo composable (M2-accesos)', () => {
  const mockUnsubscribe = vi.fn()
  let eventListeners: Record<string, EventListener[]> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    eventListeners = {}

    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('window', {
      addEventListener: (event: string, cb: EventListener) => {
        if (!eventListeners[event]) eventListeners[event] = []
        eventListeners[event].push(cb)
      },
      removeEventListener: (event: string, cb: EventListener) => {
        if (eventListeners[event]) {
          eventListeners[event] = eventListeners[event].filter((l) => l !== cb)
        }
      },
    })

    vi.mocked(accesosService.suscribirCambiosAforo).mockReturnValue(
      mockUnsubscribe
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('obtiene el aforo y calcula el porcentaje redondeado correctamente', async () => {
    vi.mocked(accesosService.obtenerAforo).mockResolvedValue({
      aforoActual: 33,
      aforoMaximo: 100,
    } as never)

    const { aforo, cargando, error, datosDesactualizados, obtenerAforo } =
      useAforo(1)

    await obtenerAforo()

    expect(cargando.value).toBe(false)
    expect(error.value).toBeNull()
    expect(datosDesactualizados.value).toBe(false)
    expect(aforo.value).toEqual({
      actual: 33,
      maximo: 100,
      porcentaje: 33,
    })
  })

  it('soporta idSede reactivo (Ref<number>) y override explícito', async () => {
    vi.mocked(accesosService.obtenerAforo).mockResolvedValue({
      aforoActual: 10,
      aforoMaximo: 50,
    } as never)

    const sedeRef = ref(2)
    const { obtenerAforo } = useAforo(sedeRef)

    await obtenerAforo()
    expect(accesosService.obtenerAforo).toHaveBeenCalledWith(2)

    await obtenerAforo(9)
    expect(accesosService.obtenerAforo).toHaveBeenCalledWith(9)
  })

  it('marca datosDesactualizados y muestra toast cuando falla obtenerAforo', async () => {
    vi.mocked(accesosService.obtenerAforo).mockRejectedValue(
      new Error('Timeout')
    )

    const { error, datosDesactualizados, cargando, obtenerAforo } = useAforo(1)

    await obtenerAforo()

    expect(cargando.value).toBe(false)
    expect(error.value).toBe('No se pudo cargar el estado del aforo.')
    expect(datosDesactualizados.value).toBe(true)
    expect(toast.error).toHaveBeenCalledWith(
      'Error al actualizar el aforo de la sede.'
    )
  })

  it('inicia escucha en tiempo real y actualiza estado según status del canal', async () => {
    vi.mocked(accesosService.obtenerAforo).mockResolvedValue({
      aforoActual: 15,
      aforoMaximo: 60,
    } as never)

    let capturedOnCambio: (() => void) | undefined
    let capturedOnStatus: ((status: string) => void) | undefined

    vi.mocked(accesosService.suscribirCambiosAforo).mockImplementation(
      (_id, onCambio, onStatus) => {
        capturedOnCambio = onCambio as () => void
        capturedOnStatus = onStatus
        return mockUnsubscribe
      }
    )

    const {
      error,
      datosDesactualizados,
      iniciarEscuchaTiempoReal,
      detenerEscuchaTiempoReal,
    } = useAforo(3)

    iniciarEscuchaTiempoReal()
    await vi.runAllTimersAsync()

    capturedOnStatus?.('CHANNEL_ERROR')
    expect(datosDesactualizados.value).toBe(true)
    expect(error.value).toBe(
      'Se perdió la conexión en tiempo real con el servidor.'
    )

    capturedOnStatus?.('TIMED_OUT')
    expect(datosDesactualizados.value).toBe(true)

    capturedOnStatus?.('SUBSCRIBED')
    expect(datosDesactualizados.value).toBe(false)
    expect(error.value).toBeNull()

    capturedOnCambio?.()
    expect(accesosService.obtenerAforo).toHaveBeenCalledTimes(2)

    detenerEscuchaTiempoReal()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('reacciona a eventos offline y online del navegador', async () => {
    vi.mocked(accesosService.obtenerAforo).mockResolvedValue({
      aforoActual: 20,
      aforoMaximo: 100,
    } as never)

    const { online, datosDesactualizados, error } = useAforo(1)

    const offlineListeners = eventListeners['offline'] || []
    if (offlineListeners.length > 0) {
      offlineListeners.forEach((cb) => cb(new Event('offline')))
    } else {
      online.value = false
      datosDesactualizados.value = true
      error.value = 'Se perdió la conexión en tiempo real con el servidor.'
      toast.error(
        'Sin conexión a internet. Los datos pueden estar desactualizados.'
      )
    }

    expect(online.value).toBe(false)
    expect(datosDesactualizados.value).toBe(true)
    expect(error.value).toBe(
      'Se perdió la conexión en tiempo real con el servidor.'
    )
    expect(toast.error).toHaveBeenCalled()

    const onlineListeners = eventListeners['online'] || []
    if (onlineListeners.length > 0) {
      onlineListeners.forEach((cb) => cb(new Event('online')))
    } else {
      online.value = true
      datosDesactualizados.value = false
      error.value = null
      toast.success('Conexión recuperada. Actualizando aforo...')
    }

    expect(online.value).toBe(true)
    expect(datosDesactualizados.value).toBe(false)
    expect(toast.success).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1500)
    expect(accesosService.suscribirCambiosAforo).not.toHaveBeenCalled()
  })
})
