import http from '@/common/api/http'

export interface ClaseResponse {
  id_clase: number
  id_sede: number
  nombre: string
  descripcion: string | null
  capacidad_maxima: number
  activo: boolean
}

export interface CreateReservaRequest {
  id_clase: number
  fecha: string // Formato YYYY-MM-DD
}

export interface ReservaResponse {
  id_reserva: number
  id_usuario: number
  id_clase: number
  fecha: string
  estado: string
}

export interface ListaEsperaResponse {
  id_lista: number
  id_usuario: number
  id_clase: number
  fecha: string
  estado: string
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

  /**
   * Genera una reserva para una clase grupal.
   * @param data Datos de la reserva (clase y fecha)
   * @returns La reserva creada
   */
  async reservarClase(data: CreateReservaRequest): Promise<ReservaResponse> {
    const response = await http.post<ReservaResponse>('/reservas-clases', data)
    return response.data
  },

  /**
   * Cancela una reserva existente.
   * @param id_reserva ID de la reserva a cancelar
   */
  async cancelarReserva(id_reserva: number): Promise<void> {
    await http.delete(`/reservas-clases/${id_reserva}`)
  },

  /**
   * Inscribe al usuario en la lista de espera para una clase completa.
   * @param data Datos de la clase y fecha
   * @returns La inscripción creada
   */
  async inscribirListaEspera(
    data: CreateReservaRequest
  ): Promise<ListaEsperaResponse> {
    const response = await http.post<ListaEsperaResponse>(
      '/lista-espera/inscribir',
      data
    )
    return response.data
  },
}
