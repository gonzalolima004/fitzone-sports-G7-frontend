import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pagosService } from '@/modules/M5-pagos/services/pagos.service'
import apiClient from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('pagosService (M5-pagos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_API_URL', 'http://api.fitzone.com')
    vi.stubGlobal('window', {
      open: vi.fn(() => ({
        location: { href: '' },
        close: vi.fn(),
      })),
      URL: {
        createObjectURL: vi.fn(() => 'blob:url'),
        revokeObjectURL: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('inicia pago vía POST /pagos/iniciar-pago', async () => {
    const dto = { titulo: 'Cancha', monto: 5000 } as never
    const mockRes = {
      preferenceId: 'pref-123',
      initPoint: 'http://mp',
    } as never
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockRes })

    const res = await pagosService.iniciarPago(dto)

    expect(apiClient.post).toHaveBeenCalledWith('/pagos/iniciar-pago', dto)
    expect(res).toEqual(mockRes)
  })

  it('obtiene pendientes vía GET /pagos/pendientes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id_referencia: 1 }] })

    const res = await pagosService.obtenerPendientes()
    expect(apiClient.get).toHaveBeenCalledWith('/pagos/pendientes')
    expect(res).toHaveLength(1)
  })

  it('obtiene historial de pagos vía GET /pagos/mis-pagos', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

    await pagosService.obtenerMisPagos()
    expect(apiClient.get).toHaveBeenCalledWith('/pagos/mis-pagos')
  })

  it('obtiene pago por ID vía GET /pagos/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id_pago: 9 } })

    const res = await pagosService.obtenerPagoPorId(9)
    expect(apiClient.get).toHaveBeenCalledWith('/pagos/9')
    expect(res.id_pago).toBe(9)
  })

  it('retorna la URL correcta del comprobante', () => {
    const url = pagosService.getComprobanteUrl(15)
    expect(url).toBe('http://api.fitzone.com/pagos/15/comprobante')
  })

  it('abre el comprobante en PDF con éxito descargando el blob', async () => {
    const mockBlob = new ArrayBuffer(8)
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob })

    const resultado = await pagosService.abrirComprobante(10)

    expect(apiClient.get).toHaveBeenCalledWith('/pagos/10/comprobante', {
      responseType: 'blob',
    })
    expect(resultado).toBe(true)
  })

  it('cierra la ventana y relanza el error si falla al abrir el comprobante', async () => {
    const mockWin = { close: vi.fn(), location: { href: '' } }
    vi.mocked(window.open).mockReturnValue(mockWin as never)
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Error blob'))

    await expect(pagosService.abrirComprobante(10)).rejects.toThrow(
      'Error blob'
    )
    expect(mockWin.close).toHaveBeenCalled()
  })
})
