import apiClient from '@/common/api/http'
import type {
  UsuarioResponse,
  RegistroPayload,
  ActualizarUsuarioPayload,
} from '../types/usuario.types'

export type TipoActividadHistorial = 'todas' | 'canchas' | 'clases'

export interface HistorialQueryParams {
  page?: number
  limit?: number
  tipo?: TipoActividadHistorial
  id_sede?: number
}

export interface SedeHistorial {
  id_sede: number
  nombre: string
  direccion?: string
}

export interface ItemHistorial {
  id: string
  tipo: 'cancha' | 'clase'
  titulo: string
  subtitulo?: string
  fecha_inicio: string
  fecha_fin: string
  fecha_creacion?: string | null
  estado: string
  sede: SedeHistorial
  precio?: number
}

export interface HistorialResponse {
  items: ItemHistorial[]
  meta: {
    total: number
    page: number
    limit: number
    total_paginas: number
  }
}

export interface MembresiaResumen {
  id_membresia: number
  plan: string
  estado: string
  fecha_inicio: string
  fecha_fin: string
  dias_restantes: number
  renovacion_automatica: boolean
}

export interface SocioDashboardResponse {
  membresia: MembresiaResumen | null
  totales: {
    total_canchas: number
    total_clases: number
    total_actividades: number
    proximas_confirmadas: number
  }
  proximas_actividades: ItemHistorial[]
}

export const usuariosService = {
  async obtenerDashboard(id_sede?: number): Promise<SocioDashboardResponse> {
    const response = await apiClient.get<SocioDashboardResponse>(
      '/usuarios/me/dashboard',
      { params: id_sede ? { id_sede } : {} }
    )
    return response.data
  },

  async obtenerHistorial(
    params?: HistorialQueryParams
  ): Promise<HistorialResponse> {
    const response = await apiClient.get<HistorialResponse>(
      '/usuarios/me/historial',
      { params }
    )
    return response.data
  },

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
