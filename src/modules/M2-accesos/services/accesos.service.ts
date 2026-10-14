import http from '@/common/api/http'
import type {
  BackendQrResponseDto,
  QrResponseDto,
  SocioPerfilDto,
  ValidarAccesoRequestDto,
  ValidarAccesoResponseDto,
} from '../types/accesos.types'
import { useAuthStore } from '@/store/auth'

export const accesosService = {
  async obtenerQr(): Promise<QrResponseDto> {
    const authStore = useAuthStore()
    const userId = authStore.usuario?.id ?? 7 // Obtiene el ID real del usuario con fallback a 7

    // Corrección: Los params se pasan como segundo argumento en Axios y se corrige el nombre a id_usuario
    const response = await http.get<BackendQrResponseDto>(
      '/access/qr/generate',
      {
        params: { id_usuario: userId },
      }
    )

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

  async obtenerPerfilSocio(usuarioId: number): Promise<SocioPerfilDto> {
    const response = await http.get<SocioPerfilDto>(`/usuarios/${usuarioId}`)
    return response.data
  },

  async validarAcceso(
    data: ValidarAccesoRequestDto
  ): Promise<ValidarAccesoResponseDto> {
    const response = await http.post<ValidarAccesoResponseDto>(
      '/accesos/validar-ingreso',
      data
    )
    return response.data
  },

  async registrarEgreso(data: {
    qrToken: string
    id_sede: number
  }): Promise<void> {
    await http.post('/accesos/registrar-egreso', data)
  },
}
