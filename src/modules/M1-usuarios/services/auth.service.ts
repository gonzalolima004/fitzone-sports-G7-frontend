import apiClient from '@/common/api/http'
import type { AxiosResponse } from 'axios'

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  usuario: {
    id_usuario: number
    nombre: string
    apellido: string
    email: string
    rol: string
  }
}

export const authService = {
  async login(credenciales: LoginPayload): Promise<AuthResponse> {
    // Al especificar la estructura de la promesa, TypeScript deja de marcar error
    const response = await apiClient.post<
      AuthResponse,
      AxiosResponse<AuthResponse>
    >('/auth/login', credenciales)
    return response.data
  },
}
