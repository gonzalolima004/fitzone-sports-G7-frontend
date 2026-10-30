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
  fecha_inicio?: string | null
  fecha_vencimiento?: string | null
  planActualId: number | null
  planNombre: string | null
  nombre_plan: string | null
}

export interface MembresiaActiva {
  id_membresia: number
  fecha_inicio: string
  fecha_fin: string
  id_membresia_plan: number
  membresia_plan?: {
    id_membresia_plan: number
    nombre: string
    duracion_dias: number
    precio: number
  }
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

  async getMembresiaActiva(idUsuario: number): Promise<MembresiaActiva | null> {
    const response = await apiClient.get<MembresiaActiva | null>(
      `/membresias/usuario/${idUsuario}/activa`
    )
    return response.data
  },
}
