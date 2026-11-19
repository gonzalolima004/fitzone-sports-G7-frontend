import { describe, it, expect, vi, beforeEach } from 'vitest'
import { membresiasService } from '@/modules/M1-usuarios/services/membresias.service'
import apiClient from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('membresiasService (M1-usuarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getPlanes consulta GET /planes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 1, nombre: 'Gold' }],
    })

    const res = await membresiasService.getPlanes()

    expect(apiClient.get).toHaveBeenCalledWith('/planes')
    expect(res).toHaveLength(1)
  })

  it('verificarEstado consulta GET /membresias/usuario/:id/verificar', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { enMora: false } })

    const res = await membresiasService.verificarEstado(10)

    expect(apiClient.get).toHaveBeenCalledWith(
      '/membresias/usuario/10/verificar'
    )
    expect(res).toEqual({ enMora: false })
  })

  it('suspenderMiMembresia invoca PATCH /membresias/mi-membresia/suspender', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { suspendida: true } })

    const res = await membresiasService.suspenderMiMembresia()

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/membresias/mi-membresia/suspender'
    )
    expect(res).toEqual({ suspendida: true })
  })

  it('getMembresiaActiva consulta GET /membresias/usuario/:id/activa', async () => {
    const mockMembresia = { id_membresia: 1, fecha_fin: '2026-12-31' }
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockMembresia })

    const res = await membresiasService.getMembresiaActiva(4)

    expect(apiClient.get).toHaveBeenCalledWith('/membresias/usuario/4/activa')
    expect(res).toEqual(mockMembresia)
  })
})
