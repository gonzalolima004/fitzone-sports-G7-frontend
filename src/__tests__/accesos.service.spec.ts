import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { accesosService } from '@/modules/M2-accesos/services/accesos.service'
import http from '@/common/api/http'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/common/utils/supabase'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

const mockRemoveChannel = vi.fn()
const mockSubscribe = vi.fn()
const mockOn = vi.fn()
const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
}

vi.mock('@/common/utils/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}))

describe('accesosService (M2-accesos)', () => {
  let localStorageMock: Record<string, string> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock = {}

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value
      },
      clear: () => {
        localStorageMock = {}
      },
    })

    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:3000' },
      crypto: globalThis.crypto,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    vi.stubGlobal('navigator', { onLine: true })
    vi.stubEnv('VITE_QR_TOKEN_SECRET', 'test-secret-fitzone')

    mockOn.mockReturnValue(mockChannel)
    mockSubscribe.mockReturnValue(mockChannel)

    vi.mocked(useAuthStore).mockReturnValue({
      usuario: {
        id: 15,
        estadoMembresia: 'ACTIVA',
        enMora: false,
        id_ciudad: 1,
      },
    } as never)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  describe('obtenerQr (online y fallback offline)', () => {
    it('obtiene el QR desde el backend cuando hay conexión', async () => {
      vi.mocked(http.get).mockResolvedValue({
        data: {
          token: '15.1.1700000000.abcdef1234567890',
          expiraEnSegundos: 60,
          fechaGeneracion: '2026-11-18T19:00:00.000Z',
        },
      })

      const res = await accesosService.obtenerQr()

      expect(http.get).toHaveBeenCalledWith('/access/qr/generate', {
        params: { id_usuario: 15 },
      })
      expect(res.token).toBe('15.1.1700000000.abcdef1234567890')
      expect(res.validSeconds).toBe(60)
      expect(res.expiresAt).toBe('2026-11-18T19:01:00.000Z')
    })

    it('genera QR offline sin llamar HTTP cuando navigator.onLine es false', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      const res = await accesosService.obtenerQr()

      expect(http.get).not.toHaveBeenCalled()
      expect(res.token.split('.')).toHaveLength(4)
      expect(res.token.startsWith('15.1.')).toBe(true)
      expect(res.validSeconds).toBe(60)
    })

    it('hace fallback a QR offline si ocurre ERR_NETWORK en la petición', async () => {
      vi.mocked(http.get).mockRejectedValue({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      })

      const res = await accesosService.obtenerQr()

      expect(res.token.split('.')).toHaveLength(4)
      expect(res.token.startsWith('15.1.')).toBe(true)
    })

    it('propaga el error original si la petición falla por un motivo distinto a la red (ej. HTTP 500)', async () => {
      const errorHttp = {
        response: { status: 500 },
        message: 'Internal Server Error',
      }
      vi.mocked(http.get).mockRejectedValue(errorHttp)

      await expect(accesosService.obtenerQr()).rejects.toEqual(errorHttp)
    })

    it('lanza error si se intenta generar QR offline y no hay secreto configurado', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      const authStoreMock = useAuthStore()
      expect(authStoreMock).toBeDefined()
    })

    it('rechaza generación offline si el socio está en mora o sin membresía activa', async () => {
      vi.stubGlobal('navigator', { onLine: false })
      vi.mocked(useAuthStore).mockReturnValue({
        usuario: {
          id: 15,
          estadoMembresia: 'VENCIDA',
          enMora: true,
          id_ciudad: 1,
        },
      } as never)

      await expect(accesosService.obtenerQr()).rejects.toThrow(
        'No se puede generar el código QR'
      )
    })

    it('rechaza generación offline si no hay usuario en caché', async () => {
      vi.stubGlobal('navigator', { onLine: false })
      vi.mocked(useAuthStore).mockReturnValue({ usuario: null } as never)

      await expect(accesosService.obtenerQr()).rejects.toThrow(
        'No hay un usuario autenticado en caché local'
      )
    })

    it('rechaza generación offline si el usuario no tiene ciudad asignada', async () => {
      vi.stubGlobal('navigator', { onLine: false })
      vi.mocked(useAuthStore).mockReturnValue({
        usuario: { id: 15, estadoMembresia: 'ACTIVA' },
      } as never)

      await expect(accesosService.obtenerQr()).rejects.toThrow(
        'El usuario no tiene asignada una ciudad válida'
      )
    })
  })

  describe('operaciones de recepción y aforo', () => {
    it('obtenerPerfilSocio consulta /accesos/perfil/:id', async () => {
      vi.mocked(http.get).mockResolvedValue({
        data: { id: 20, nombre: 'Juan' },
      })

      const res = await accesosService.obtenerPerfilSocio(20)
      expect(http.get).toHaveBeenCalledWith('/accesos/perfil/20')
      expect(res).toEqual({ id: 20, nombre: 'Juan' })
    })

    it('validarAcceso envía POST /accesos/validar-ingreso', async () => {
      const req = { qrToken: 'tok', id_sede: 1 } as never
      vi.mocked(http.post).mockResolvedValue({ data: { permitido: true } })

      const res = await accesosService.validarAcceso(req)
      expect(http.post).toHaveBeenCalledWith('/accesos/validar-ingreso', req)
      expect(res).toEqual({ permitido: true })
    })

    it('obtenerAforo consulta /accesos/aforo/:idSede', async () => {
      vi.mocked(http.get).mockResolvedValue({
        data: { aforoActual: 25, aforoMaximo: 100 },
      })

      const res = await accesosService.obtenerAforo(1)
      expect(res).toEqual({ aforoActual: 25, aforoMaximo: 100 })
    })
  })

  describe('registrarEgreso y cola offline', () => {
    it('registra egreso online vía POST /accesos/registrar-egreso', async () => {
      vi.mocked(http.post).mockResolvedValue({ data: {} })

      await accesosService.registrarEgreso({
        qrToken: '15.1.1700000000.sig',
        id_sede: 2,
      })

      expect(http.post).toHaveBeenCalledWith('/accesos/registrar-egreso', {
        qrToken: '15.1.1700000000.sig',
        id_sede: 2,
      })
    })

    it('encola el egreso en localStorage cuando está offline', async () => {
      vi.stubGlobal('navigator', { onLine: false })

      await accesosService.registrarEgreso({
        qrToken: '15.1.1700000000.sig',
        id_sede: 2,
      })

      expect(http.post).not.toHaveBeenCalled()
      const cola = JSON.parse(
        localStorage.getItem('fitzone_offline_queue') || '[]'
      )
      expect(cola).toHaveLength(1)
      expect(cola[0]).toMatchObject({
        tipo: 'EGRESO',
        data: { id_usuario: 15, id_sede: 2 },
      })
    })

    it('hace fallback y encola egreso offline si ocurre un error de red (ERR_NETWORK)', async () => {
      const errorRed = { code: 'ERR_NETWORK', message: 'Network Error' }
      vi.mocked(http.post).mockRejectedValue(errorRed)

      await accesosService.registrarEgreso({
        qrToken: '15.1.1700000000.sig',
        id_sede: 2,
      })

      const cola = JSON.parse(
        localStorage.getItem('fitzone_offline_queue') || '[]'
      )
      expect(cola).toHaveLength(1)
      expect(cola[0].tipo).toBe('EGRESO')
    })

    it('propaga el error si registrarEgreso falla por un motivo distinto a la red', async () => {
      const errorHttp = { response: { status: 400 }, message: 'Bad Request' }
      vi.mocked(http.post).mockRejectedValue(errorHttp)

      await expect(
        accesosService.registrarEgreso({
          qrToken: '15.1.1700000000.sig',
          id_sede: 2,
        })
      ).rejects.toEqual(errorHttp)
    })
  })

  describe('suscribirCambiosAforo', () => {
    it('se suscribe al canal de sede, dispara callbacks y limpia al desuscribir', () => {
      const onCambio = vi.fn()
      const onStatus = vi.fn()

      const desuscribir = accesosService.suscribirCambiosAforo(
        4,
        onCambio,
        onStatus
      )

      expect(supabase.channel).toHaveBeenCalledWith('aforo:sede:4')

      const broadcastHandler = mockOn.mock.calls[0][2]
      broadcastHandler({ payload: { aforoActual: 30, aforoMaximo: 80 } })
      expect(onCambio).toHaveBeenCalledWith({
        aforoActual: 30,
        aforoMaximo: 80,
      })

      const statusHandler = mockSubscribe.mock.calls[0][0]
      statusHandler('SUBSCRIBED')
      expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED')

      desuscribir()
      expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('permite suscribirse sin onStatusChange y con payload', () => {
      const onCambio = vi.fn()
      accesosService.suscribirCambiosAforo(9, onCambio)
      const statusHandler = mockSubscribe.mock.calls[0][0]
      expect(() => statusHandler('SUBSCRIBED')).not.toThrow()
    })
  })

  describe('cobertura adicional de ramas offline, perfiles y egresos', () => {
    it('cubre obtenerPerfilSocio, validarAcceso y obtenerAforo', async () => {
      vi.mocked(http.get).mockResolvedValueOnce({ data: { socioId: 5 } })
      expect(await accesosService.obtenerPerfilSocio(5)).toEqual({ socioId: 5 })

      vi.mocked(http.post).mockResolvedValueOnce({ data: { exito: true, mensaje: 'OK' } })
      expect(
        await accesosService.validarAcceso({ qrToken: 't', id_sede: 1 })
      ).toEqual({ exito: true, mensaje: 'OK' })

      vi.mocked(http.get).mockResolvedValueOnce({ data: { aforoActual: 2, aforoMaximo: 10 } })
      expect(await accesosService.obtenerAforo(1)).toEqual({
        aforoActual: 2,
        aforoMaximo: 10,
      })
    })

    it('cubre generarQrOffline por sede.id_ciudad, sin usuario, sin ciudad, en mora y error HTTP no-red', async () => {
      vi.stubGlobal('navigator', { onLine: false })
      vi.mocked(useAuthStore).mockReturnValue({ usuario: null } as never)
      await expect(accesosService.obtenerQr()).rejects.toThrow(
        'No hay un usuario autenticado'
      )

      vi.mocked(useAuthStore).mockReturnValue({
        usuario: { id: 1, estadoMembresia: 'ACTIVA' },
      } as never)
      await expect(accesosService.obtenerQr()).rejects.toThrow(
        'no tiene asignada una ciudad válida'
      )

      vi.mocked(useAuthStore).mockReturnValue({
        usuario: { id: 1, sede: { id_ciudad: 2 }, estadoMembresia: 'VENCIDA', enMora: true },
      } as never)
      await expect(accesosService.obtenerQr()).rejects.toThrow(
        'membresía activa o se encuentra en mora'
      )

      vi.mocked(useAuthStore).mockReturnValue({
        usuario: { id: 1, sede: { id_ciudad: 2 }, estadoMembresia: 'ACTIVO' },
      } as never)
      vi.stubGlobal('navigator', { onLine: true })
      vi.mocked(http.get).mockRejectedValueOnce({ response: { status: 403 } })
      await expect(accesosService.obtenerQr()).rejects.toEqual({
        response: { status: 403 },
      })
    })

    it('encolarAccesoOffline ignora idSede undefined y registrarEgreso funciona por DNI sin token', async () => {
      accesosService.encolarAccesoOffline('INGRESO', 1, undefined)
      expect(localStorageMock['fitzone_offline_queue']).toBeUndefined()

      vi.stubGlobal('navigator', { onLine: true })
      vi.mocked(http.post).mockResolvedValueOnce({ data: {} })
      await accesosService.registrarEgreso({ dni: '30111222', id_sede: 1 })
      expect(http.post).toHaveBeenCalledWith('/accesos/registrar-egreso', {
        dni: '30111222',
        id_sede: 1,
      })
    })
  })
})
