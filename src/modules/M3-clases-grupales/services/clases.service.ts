import http from '@/common/api/http'

export interface ClaseResponse {
  id_clase: number
  id_sede: number
  nombre: string
  descripcion: string | null
  capacidad_maxima: number
  activo: boolean
}

export const clasesService = {
  /**
   * Obtiene el catálogo de clases activas para una sede específica.
   * @param id_sede ID de la sede para filtrar
   * @returns Lista de clases
   */
  async obtenerClasesPorSede(id_sede: number): Promise<ClaseResponse[]> {
    const response = await http.get<ClaseResponse[]>('/clases', {
      params: { id_sede },
    })
    return response.data
  },
}
