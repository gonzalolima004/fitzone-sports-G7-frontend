import { beforeEach, describe, expect, it, vi } from 'vitest'
import http from '@/common/api/http'
import { pagosService } from '@/modules/M5-pagos/services/pagos.service'

vi.mock('@/common/api/http', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}))

describe('Contrato compartido de pagos tras integrar membresías', () => {
  beforeEach(() => vi.resetAllMocks())
  it('conserva el inicio de pagos de membresía y cancha y devuelve la preferencia', async () => {
    const preferencia = {
      preferenceId: 'prueba',
      initPoint: 'https://example.test/pago',
      sandboxInitPoint: 'https://example.test/sandbox',
    }
    vi.mocked(http.post).mockResolvedValue({ data: preferencia })
    const membresia = { id_membresia: 4, monto: 1500, titulo: 'Membresía' }
    const cancha = { id_cancha_reserva: 8, monto: 2000, titulo: 'Cancha' }
    expect(await pagosService.iniciarPago(membresia)).toEqual(preferencia)
    expect(await pagosService.iniciarPago(cancha)).toEqual(preferencia)
    expect(http.post).toHaveBeenNthCalledWith(
      1,
      '/pagos/iniciar-pago',
      membresia
    )
    expect(http.post).toHaveBeenNthCalledWith(2, '/pagos/iniciar-pago', cancha)
  })
  it('conserva pendientes, historial, detalle y enlace de comprobante', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [] })
    await pagosService.obtenerPendientes()
    await pagosService.obtenerMisPagos()
    await pagosService.obtenerPagoPorId(25)
    expect(http.get).toHaveBeenNthCalledWith(1, '/pagos/pendientes')
    expect(http.get).toHaveBeenNthCalledWith(2, '/pagos/mis-pagos')
    expect(http.get).toHaveBeenNthCalledWith(3, '/pagos/25')
    expect(pagosService.getComprobanteUrl(25)).toMatch(
      /\/pagos\/25\/comprobante$/
    )
  })
})
