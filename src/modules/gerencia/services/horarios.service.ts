import http from '@/common/api/http'
import type {
  HorarioSemanal,
  HorarioSemanalPayload,
} from '../types/gerencia.types'

/**
 * Horario semanal de cada sede (SedeHorario de M0-sedes): apertura y cierre
 * de cada día. Todo el CRUD es solo para el gerente.
 */
export const horariosService = {
  /** Días con horario cargado, del domingo (0) al sábado (6). */
  async listar(idSede: number): Promise<HorarioSemanal[]> {
    const { data } = await http.get<HorarioSemanal[]>(
      `/sedes/${idSede}/horarios`
    )
    return data
  },

  async crear(
    idSede: number,
    datos: HorarioSemanalPayload
  ): Promise<HorarioSemanal> {
    const { data } = await http.post<HorarioSemanal>(
      `/sedes/${idSede}/horarios`,
      datos
    )
    return data
  },

  async actualizar(
    idSede: number,
    idHorario: number,
    datos: Omit<HorarioSemanalPayload, 'dia_semana'>
  ): Promise<HorarioSemanal> {
    const { data } = await http.patch<HorarioSemanal>(
      `/sedes/${idSede}/horarios/${idHorario}`,
      datos
    )
    return data
  },

  async eliminar(idSede: number, idHorario: number): Promise<HorarioSemanal> {
    const { data } = await http.delete<HorarioSemanal>(
      `/sedes/${idSede}/horarios/${idHorario}`
    )
    return data
  },
}
