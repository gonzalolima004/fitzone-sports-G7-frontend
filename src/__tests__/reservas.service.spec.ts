import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reservasService } from '@/modules/M4-canchas/services/reservas.service'
import http from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('reservasService (M4-canchas)', () => {
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
  })

  describe('cotizarTurno', () => {
    it('retorna la cotización desde el backend cuando hay conexión exitosa', async () => {
      const mockCotizacion = { precio_final: 7000, es_socio: true }
      vi.mocked(http.get).mockResolvedValue({ data: mockCotizacion })

      const res = await reservasService.cotizarTurno(
        1,
        '2026-11-20',
        '10:00',
        8000,
        true
      )

      expect(http.get).toHaveBeenCalledWith('/canchas/cotizar', {
        params: { canchaId: 1, fecha: '2026-11-20', hora: '10:00' },
      })
      expect(res).toEqual(mockCotizacion)
    })

    it('aplica cálculo de contingencia local si el endpoint falla (horario normal y socio)', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network Error'))

      const res = await reservasService.cotizarTurno(
        1,
        '2026-11-20',
        '10:00',
        10000,
        true
      )

      expect(res.costo_base).toBe(10000)
      expect(res.es_horario_pico).toBe(false)
      expect(res.descuento_porcentaje).toBe(15)
      expect(res.precio_final).toBe(8500) // 10000 - 1500
    })

    it('aplica recargo por horario pico (19:00 a 21:00 hs) para usuario no socio en contingencia', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network Error'))

      const res = await reservasService.cotizarTurno(
        1,
        '2026-11-20',
        '20:00',
        10000,
        false
      )

      expect(res.es_horario_pico).toBe(true)
      expect(res.monto_recargo_pico).toBe(2000) // 20% de 10000
      expect(res.descuento_porcentaje).toBe(0)
      expect(res.precio_final).toBe(12000) // 10000 + 2000
      expect(res.motivo_sin_descuento).toBe('ROL_EXTERNO')
    })
  })

  describe('crearReserva', () => {
    it('envía POST /reservas-canchas con el DTO y retorna la respuesta', async () => {
      const dto = {
        id_cancha: 1,
        fecha: '2026-11-20',
        hora_inicio: '18:00',
      } as never
      const mockRes = { id_cancha_reserva: 50, estado: 'CONFIRMADA' }
      vi.mocked(http.post).mockResolvedValue({ data: mockRes })

      const res = await reservasService.crearReserva(dto)

      expect(http.post).toHaveBeenCalledWith('/reservas-canchas', dto)
      expect(res).toEqual(mockRes)
    })
  })

  describe('obtenerReservaPorId', () => {
    it('consulta GET /reservas-canchas/:id y normaliza propiedades anidadas', async () => {
      const mockRaw = {
        id_cancha_reserva: 12,
        cancha: {
          nombre: 'Cancha 1',
          cancha_tipo: { descripcion: 'Sintético' },
          sede: { nombre: 'Sede Central', direccion: 'Av. Mitre' },
        },
        cancha_reserva_estado: { descripcion: 'Activa' },
      }
      vi.mocked(http.get).mockResolvedValue({ data: mockRaw })

      const res = await reservasService.obtenerReservaPorId(12)

      expect(http.get).toHaveBeenCalledWith('/reservas-canchas/12')
      expect(res.nombre_cancha).toBe('Cancha 1')
      expect(res.tipo_cancha).toBe('Sintético')
      expect(res.nombre_sede).toBe('Sede Central')
      expect(res.estado_nombre).toBe('Activa')
    })

    it('lanza y propaga el error si falla la consulta', async () => {
      const err = new Error('Not found')
      vi.mocked(http.get).mockRejectedValue(err)

      await expect(reservasService.obtenerReservaPorId(999)).rejects.toThrow(
        'Not found'
      )
    })
  })

  describe('guardarReservaEnCache', () => {
    it('almacena correctamente la reserva en localStorage', () => {
      const reserva = { id_cancha_reserva: 5, id_cancha: 1 } as never
      reservasService.guardarReservaEnCache(reserva)

      const cached = JSON.parse(
        localStorage.getItem('fitzone_reserva_5') || '{}'
      )
      expect(cached).toEqual(reserva)
    })
  })

  describe('obtenerMisReservasCanchas', () => {
    it('consulta /reservas-canchas/mis-reservas con éxito', async () => {
      const mockList = [{ id_cancha_reserva: 1 }]
      vi.mocked(http.get).mockResolvedValue({ data: mockList })

      const res = await reservasService.obtenerMisReservasCanchas()
      expect(http.get).toHaveBeenCalledWith('/reservas-canchas/mis-reservas')
      expect(res).toEqual(mockList)
    })

    it('hace fallback a /reservas-canchas si mis-reservas falla', async () => {
      const mockList = [{ id_cancha_reserva: 2 }]
      vi.mocked(http.get)
        .mockRejectedValueOnce(new Error('404'))
        .mockResolvedValueOnce({ data: mockList })

      const res = await reservasService.obtenerMisReservasCanchas()
      expect(http.get).toHaveBeenCalledTimes(2)
      expect(res).toEqual(mockList)
    })

    it('retorna arreglo vacío si ambos endpoints fallan', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Error'))

      const res = await reservasService.obtenerMisReservasCanchas()
      expect(res).toEqual([])
    })
  })
})
