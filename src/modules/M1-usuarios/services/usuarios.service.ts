import apiClient from '@/common/api/http'

export interface RegistroPayload {
  dni: string
  email: string
  contrasenia: string
  nombre: string
  apellido: string
  telefono: string
  id_sede: string
  foto_url: string
  roles?: number[]
}

export const usuariosService = {
  async registrarUsuario(datos: RegistroPayload) {
    const response = await apiClient.post('/usuarios', datos)
    return response.data
  },

  async actualizarPerfil(id: number, datos: Partial<RegistroPayload>) {
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
