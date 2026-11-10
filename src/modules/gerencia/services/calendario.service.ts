import http from '@/common/api/http'
import type {
  ExcepcionSede,
  ExcepcionSedePayload,
  FechaCalendario,
  FechaCalendarioPayload,
} from '../types/gerencia.types'

/**
 * Calendario general de la cadena (feriados) y excepciones de cada sede
 * (cierres u horarios especiales), de M0-sedes. Todo el CRUD es solo para el
 * gerente: el interceptor de Axios agrega el token.
 */
export const calendarioService = {
  /** Fechas del calendario general entre `desde` y `hasta` (YYYY-MM-DD). */
  async listarFechas(desde: string, hasta: string): Promise<FechaCalendario[]> {
    const { data } = await http.get<FechaCalendario[]>('/calendario', {
      params: { desde, hasta },
    })
    return data
  },

  async crearFecha(datos: FechaCalendarioPayload): Promise<FechaCalendario> {
    const { data } = await http.post<FechaCalendario>('/calendario', datos)
    return data
  },

  async actualizarFecha(
    idCalendario: number,
    datos: Partial<FechaCalendarioPayload>
  ): Promise<FechaCalendario> {
    const { data } = await http.patch<FechaCalendario>(
      `/calendario/${idCalendario}`,
      datos
    )
    return data
  },

  /** El backend responde 409 si alguna sede tiene una excepción ese día. */
  async eliminarFecha(idCalendario: number): Promise<FechaCalendario> {
    const { data } = await http.delete<FechaCalendario>(
      `/calendario/${idCalendario}`
    )
    return data
  },

  /** Excepciones de la sede entre `desde` y `hasta`, en orden cronológico. */
  async listarExcepciones(
    idSede: number,
    desde: string,
    hasta: string
  ): Promise<ExcepcionSede[]> {
    const { data } = await http.get<ExcepcionSede[]>(
      `/sedes/${idSede}/calendario`,
      { params: { desde, hasta } }
    )
    return data
  },

  async crearExcepcion(
    idSede: number,
    datos: ExcepcionSedePayload
  ): Promise<ExcepcionSede> {
    const { data } = await http.post<ExcepcionSede>(
      `/sedes/${idSede}/calendario`,
      datos
    )
    return data
  },

  async actualizarExcepcion(
    idSede: number,
    idExcepcion: number,
    datos: Partial<ExcepcionSedePayload>
  ): Promise<ExcepcionSede> {
    const { data } = await http.patch<ExcepcionSede>(
      `/sedes/${idSede}/calendario/${idExcepcion}`,
      datos
    )
    return data
  },

  async eliminarExcepcion(
    idSede: number,
    idExcepcion: number
  ): Promise<ExcepcionSede> {
    const { data } = await http.delete<ExcepcionSede>(
      `/sedes/${idSede}/calendario/${idExcepcion}`
    )
    return data
  },
}
