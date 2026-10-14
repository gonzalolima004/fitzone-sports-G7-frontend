import http from '@/common/api/http'
import type {
  BackendQrResponseDto,
  QrResponseDto,
  SocioPerfilDto,
} from '../types/accesos.types'

export const accesosService = {
  async obtenerQr(): Promise<QrResponseDto> {
    const response = await http.get<BackendQrResponseDto>('/access/qr/generate')
    const data = response.data

    const tokenValido = String(data.token ?? '')
    const validSeconds = Number(data.expiraEnSegundos) || 60

    const generatedDate = data.fechaGeneracion
      ? new Date(data.fechaGeneracion)
      : new Date()

    const expiresAt = new Date(
      generatedDate.getTime() + validSeconds * 1000
    ).toISOString()

    return {
      token: tokenValido,
      validSeconds,
      expiresAt,
    }
  },

  // Pasamos el ID del usuario como parámetro numérico para cumplir la validación de NestJS
  async obtenerPerfilSocio(usuarioId: number): Promise<SocioPerfilDto> {
    const response = await http.get<SocioPerfilDto>(`/usuarios/${usuarioId}`)
    return response.data
  },
}
