import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canchasTiposService } from '@/modules/M4-canchas/services/canchas-tipos.service'
import http from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('canchasTiposService (M4-canchas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTiposCancha / getCanchasTipos', () => {
    it('obtiene los tipos de cancha correctamente', async () => {
      const mockTipos = [{ id: 1, descripcion: 'Fútbol 5' }]
      vi.mocked(http.get).mockResolvedValue({ data: mockTipos })

      const res = await canchasTiposService.getTiposCancha()

      expect(http.get).toHaveBeenCalledWith('/canchas/tipos', undefined)
      expect(res).toEqual(mockTipos)
    })

    it('pasa el parámetro inactivos: true cuando se solicita', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: [] })

      await canchasTiposService.getTiposCancha(true)

      expect(http.get).toHaveBeenCalledWith('/canchas/tipos', {
        params: { inactivos: true },
      })
    })

    it('retorna arreglo vacío y captura error si falla la petición', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Fail'))

      const res = await canchasTiposService.getCanchasTipos()
      expect(res).toEqual([])
    })
  })

  describe('crearTipoCancha / crearCanchaTipo', () => {
    it('crea un tipo de cancha haciendo trim al texto', async () => {
      const mockCreado = { id: 3, descripcion: 'Pádel' }
      vi.mocked(http.post).mockResolvedValue({ data: mockCreado })

      const res = await canchasTiposService.crearTipoCancha('  Pádel  ')

      expect(http.post).toHaveBeenCalledWith('/canchas/tipos', {
        descripcion: 'Pádel',
      })
      expect(res).toEqual(mockCreado)
    })
  })

  describe('actualizarTipoCancha y operaciones relacionadas', () => {
    it('actualiza el tipo de cancha vía PATCH', async () => {
      vi.mocked(http.patch).mockResolvedValue({
        data: { id: 1, activo: false },
      })

      const res = await canchasTiposService.actualizarTipoCancha(1, {
        activo: false,
      })
      expect(http.patch).toHaveBeenCalledWith('/canchas/tipos/1', {
        activo: false,
      })
      expect(res.activo).toBe(false)
    })

    it('reactiva un tipo de cancha estableciendo activo: true', async () => {
      vi.mocked(http.patch).mockResolvedValue({ data: { id: 1, activo: true } })

      await canchasTiposService.reactivarTipoCancha(1)
      expect(http.patch).toHaveBeenCalledWith('/canchas/tipos/1', {
        activo: true,
      })
    })

    it('elimina (baja lógica) un tipo de cancha vía DELETE', async () => {
      vi.mocked(http.delete).mockResolvedValue({})

      await canchasTiposService.eliminarTipoCancha(2)
      expect(http.delete).toHaveBeenCalledWith('/canchas/tipos/2')
    })
  })
})
