import http from '@/common/api/http'

export interface ClaseResponse {
  id_clase: number
  id_sede: number
  nombre: string
  descripcion: string | null
  capacidad_maxima: number
  activo: boolean
}

export interface ClaseAgendaResponse {
  id_clase: number
  id_sede: number
  nombre: string
  descripcion: string | null
  profesor?: string | null
  sala?: string | null
  horario_inicio: string
  horario_fin: string
  fecha_inicio: string
  fecha_fin: string
  capacidad_maxima: number
  cupos_ocupados: number
  cupos_disponibles: number
  en_espera: number
  estado: 'DISPONIBLE' | 'COMPLETO'
  activo: boolean
}

export interface CreateReservaRequest {
  id_clase: number
  fecha_inicio?: string
  fecha_fin?: string
  fecha?: string
}

export interface InscribirListaEsperaRequest {
  id_clase: number
  fecha_inicio?: string
  fecha_fin?: string
  fecha?: string
}

export interface ReservaResponse {
  id_clase_reserva?: number
  id_reserva: number
  id_usuario?: number
  id_clase?: number
  fecha_inicio?: string
  fecha_fin?: string
  id_clase_reserva_estado?: number
  estado?: string
}

export interface MiReservaClaseResponse {
  id_clase_reserva: number
  id_clase: number
  id_usuario: number
  fecha_inicio: string
  fecha_fin: string
  id_clase_reserva_estado: number
  estado: string
  nombre_clase?: string
}

export interface ListaEsperaResponse {
  id_lista: number
  message?: string
  orden_en_cola?: number
  inscripcion?: {
    id_clase_lista_espera: number
    id_usuario: number
    id_clase: number
    fecha_inicio: string
    fecha_fin: string
    id_clase_lista_espera_estado: number
  }
}

export interface MiInscripcionListaEsperaResponse {
  id_clase_lista_espera: number
  id_clase: number
  id_usuario: number
  fecha_inicio: string
  fecha_fin: string
  orden_en_cola: number
  id_clase_lista_espera_estado: number
  estado: string
  nombre_clase?: string
}

export interface HorarioOperativoSedeResponse {
  abierto: boolean
  hora_apertura: string
  hora_cierre: string
  motivo_cierre?: string
  es_horario_especial?: boolean
}

export const clasesService = {
  /**
   * Obtiene la agenda de clases para una sede específica (y fecha opcional).
   * @param id_sede ID de la sede para filtrar
   * @param fecha Fecha opcional en formato YYYY-MM-DD
   * @returns Lista de clases con aforo y horarios reales
   */
  async obtenerClasesPorSede(
    id_sede: number,
    fecha?: string
  ): Promise<ClaseAgendaResponse[]> {
    const response = await http.get<ClaseAgendaResponse[]>('/clases', {
      params: { id_sede, fecha },
    })
    return response.data
  },

  /**
   * Obtiene el horario operativo de una sede para una fecha específica (apertura, cierre y excepciones).
   * @param id_sede ID de la sede
   * @param fecha Fecha en formato YYYY-MM-DD
   */
  async obtenerHorarioOperativoSede(
    id_sede: number,
    fecha: string
  ): Promise<HorarioOperativoSedeResponse> {
    const response = await http.get<HorarioOperativoSedeResponse>(
      `/sedes/${id_sede}/horario-operativo`,
      {
        params: { fecha },
      }
    )
    return response.data
  },

  /**
   * Da de baja o elimina una clase grupal.
   * @param id_clase ID de la clase
   */
  async eliminarClase(
    id_clase: number
  ): Promise<{ mensaje: string; id_clase: number; activo: boolean }> {
    const response = await http.delete<{
      mensaje: string
      id_clase: number
      activo: boolean
    }>(`/clases/${id_clase}`)
    return response.data
  },

  /**
   * Obtiene las reservas activas del usuario autenticado (con filtro opcional de fecha).
   * @param fecha Fecha opcional en formato YYYY-MM-DD
   */
  async obtenerMisReservas(fecha?: string): Promise<MiReservaClaseResponse[]> {
    const response = await http.get<MiReservaClaseResponse[]>(
      '/reservas-clases/mis-reservas',
      {
        params: fecha ? { fecha } : {},
      }
    )
    return response.data
  },

  /**
   * Obtiene las inscripciones activas en lista de espera del usuario autenticado.
   * @param fecha Fecha opcional en formato YYYY-MM-DD
   */
  async obtenerMisInscripciones(
    fecha?: string
  ): Promise<MiInscripcionListaEsperaResponse[]> {
    const response = await http.get<MiInscripcionListaEsperaResponse[]>(
      '/lista-espera/mis-inscripciones',
      {
        params: fecha ? { fecha } : {},
      }
    )
    return response.data
  },

  /**
   * Genera una reserva para una clase grupal.
   * @param data Datos de la reserva (id_clase, fecha_inicio, fecha_fin)
   * @returns La reserva creada
   */
  async reservarClase(data: CreateReservaRequest): Promise<ReservaResponse> {
    const payload =
      data.fecha_inicio && data.fecha_fin
        ? {
            id_clase: data.id_clase,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
          }
        : data
    const response = await http.post<ReservaResponse>(
      '/reservas-clases',
      payload
    )
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
   * @param data Datos de la clase y horarios ISO
   * @returns La inscripción creada
   */
  async inscribirListaEspera(
    data: InscribirListaEsperaRequest
  ): Promise<ListaEsperaResponse> {
    const payload =
      data.fecha_inicio && data.fecha_fin
        ? {
            id_clase: data.id_clase,
            fecha_inicio: data.fecha_inicio,
            fecha_fin: data.fecha_fin,
          }
        : data
    const response = await http.post<ListaEsperaResponse>(
      '/lista-espera/inscribir',
      payload
    )
    return response.data
  },
}
