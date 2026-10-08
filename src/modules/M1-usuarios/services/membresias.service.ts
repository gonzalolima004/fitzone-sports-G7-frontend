import apiClient from '@/common/api/http'

export interface PlanMembresia {
  id: number
  nombre: string
  duracion_dias: number
  precio: number
  descripcion: string
  activo: boolean
}

export interface EstadoMembresia {
  esSocioActivo: boolean
  enMora: boolean
  estado: 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA' | 'SIN_MEMBRESIA'
  fechaVencimiento: string | null
  planActualId: number | null
  planNombre: string | null
}

export const membresiasService = {
  async getPlanes(): Promise<unknown[]> {
    const response = await apiClient.get('/planes')
    return response.data
  },

  async verificarEstado(idUsuario: number): Promise<unknown> {
    const response = await apiClient.get(
      `/membresias/usuario/${idUsuario}/verificar`
    )
    return response.data
  },
}
