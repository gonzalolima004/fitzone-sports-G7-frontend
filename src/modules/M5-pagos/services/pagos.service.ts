import apiClient from '@/common/api/http'

export const pagosService = {
  async iniciarPago(payload: unknown): Promise<unknown> {
    const response = await apiClient.post('/pagos/iniciar-pago', payload)
    return response.data
  },
}
