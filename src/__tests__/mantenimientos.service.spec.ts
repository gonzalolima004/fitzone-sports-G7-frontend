import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mantenimientosService } from '@/modules/M4-canchas/services/mantenimientos.service'
import http from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('mantenimientosService (M4-canchas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMantenimientos', () => {
    it('consulta sin query params si no se pasan filtros', async () => {
      vi.mocked(http.get).mockResolvedValue({
        data: [{ id_cancha_mantenimiento: 1 }],
      })

      const res = await mantenimientosService.getMantenimientos()

      expect(http.get).toHaveBeenCalledWith('/canchas/mantenimientos')
      expect(res).toHaveLength(1)
    })

    it('construye correctamente los query params con sedeId, canchaId y fechas', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: [] })

      await mantenimientosService.getMantenimientos({
        sedeId: 1,
        canchaId: 3,
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-30',
      })

      expect(http.get).toHaveBeenCalledWith(
        '/canchas/mantenimientos?sedeId=1&canchaId=3&fechaInicio=2026-11-01&fechaFin=2026-11-30'
      )
    })

    it('retorna arreglo vacío si la respuesta no es un arreglo', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: null })

      const res = await mantenimientosService.getMantenimientos()
      expect(res).toEqual([])
    })
  })

  describe('programarMantenimiento / crearMantenimiento', () => {
    it('programa un mantenimiento vía POST /canchas/:id/mantenimiento', async () => {
      const dto = { motivo: 'Pintura', fecha_inicio: '2026-12-01' }
      const mockRes = { id_cancha_mantenimiento: 10, ...dto }
      vi.mocked(http.post).mockResolvedValue({ data: mockRes })

      const res = await mantenimientosService.programarMantenimiento(
        2,
        dto as never
      )

      expect(http.post).toHaveBeenCalledWith('/canchas/2/mantenimiento', dto)
      expect(res).toEqual(mockRes)
    })

    it('crearMantenimiento actúa como alias correcto', async () => {
      const dto = { motivo: 'Reparación de red' }
      vi.mocked(http.post).mockResolvedValue({
        data: { id_cancha_mantenimiento: 11, ...dto },
      })

      const res = await mantenimientosService.crearMantenimiento(
        2,
        dto as never
      )
      expect(res.id_cancha_mantenimiento).toBe(11)
    })
  })

  describe('actualizarMantenimiento', () => {
    it('actualiza un mantenimiento vía PATCH /canchas/mantenimientos/:id', async () => {
      const dto = { motivo: 'Cambio de red' }
      vi.mocked(http.patch).mockResolvedValue({
        data: { id_cancha_mantenimiento: 5, ...dto },
      })

      const res = await mantenimientosService.actualizarMantenimiento(
        5,
        dto as never
      )

      expect(http.patch).toHaveBeenCalledWith('/canchas/mantenimientos/5', dto)
      expect(res.motivo).toBe('Cambio de red')
    })
  })

  describe('eliminarMantenimiento', () => {
    it('elimina un mantenimiento vía DELETE /canchas/mantenimientos/:id', async () => {
      vi.mocked(http.delete).mockResolvedValue({})

      await mantenimientosService.eliminarMantenimiento(8)

      expect(http.delete).toHaveBeenCalledWith('/canchas/mantenimientos/8')
    })
  })
})
