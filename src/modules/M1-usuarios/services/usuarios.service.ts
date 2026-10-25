import apiClient from '@/common/api/http'
import type {
  UsuarioResponse,
  RegistroPayload,
  ActualizarUsuarioPayload,
} from '../types/usuario.types'

export const usuariosService = {
  async obtenerUsuarios(id_sede?: number): Promise<UsuarioResponse[]> {
    const params = id_sede ? { id_sede } : {}
    const response = await apiClient.get<UsuarioResponse[]>('/usuarios', {
      params,
    })
    return response.data
  },

  async registrarUsuario(datos: RegistroPayload) {
    const response = await apiClient.post('/usuarios', datos)
    return response.data
  },

  async actualizarPerfil(id: number, datos: ActualizarUsuarioPayload) {
    const response = await apiClient.patch(`/usuarios/${id}`, datos)
    return response.data
  },

  async subirFotoPerfil(id_usuario: number, foto: File) {
    const formData = new FormData()

    // Cambiamos 'file' por 'foto' para coincidir con la expectativa del backend
    formData.append('foto', foto)

    const response = await apiClient.post(
      `/usuarios/${id_usuario}/foto`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}
