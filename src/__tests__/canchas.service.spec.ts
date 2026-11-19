import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canchasService } from '@/modules/M4-canchas/services/canchas.service'
import http from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('canchas.service.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCanchas obtiene la lista de canchas correctamente con filtros', async () => {
    const mockCanchas = [{ id_cancha: 1, nombre: 'Cancha 1 de Fútbol' }]
    vi.mocked(http.get).mockResolvedValue({ data: mockCanchas })

    const resultado = await canchasService.getCanchas({ sedeId: 1 })

    expect(http.get).toHaveBeenCalledWith('/canchas?sedeId=1')
    expect(resultado).toEqual(mockCanchas)
  })

  it('getCanchas retorna un arreglo vacío si ocurre un error en la petición', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('Network error'))

    const resultado = await canchasService.getCanchas()

    expect(resultado).toEqual([])
  })

  it('crearCancha envía los datos correctamente al endpoint POST /canchas', async () => {
    const nuevaCanchaDto = {
      id_sede: 1,
      nombre: 'Cancha Nueva',
      id_cancha_tipo: 1,
      costo_base: 5000,
    }
    const respuestaBackend = { id_cancha: 10, ...nuevaCanchaDto }
    vi.mocked(http.post).mockResolvedValue({ data: respuestaBackend })

    const resultado = await canchasService.crearCancha(
      nuevaCanchaDto as Parameters<typeof canchasService.crearCancha>[0]
    )

    expect(http.post).toHaveBeenCalledWith('/canchas', nuevaCanchaDto)
    expect(resultado).toEqual(respuestaBackend)
  })

  it('eliminarCancha ejecuta correctamente la petición DELETE', async () => {
    vi.mocked(http.delete).mockResolvedValue({ data: {} })

    await canchasService.eliminarCancha(5)

    expect(http.delete).toHaveBeenCalledWith('/canchas/5')
  })
})
