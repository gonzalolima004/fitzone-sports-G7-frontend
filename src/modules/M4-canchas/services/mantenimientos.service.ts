import http from '@/common/api/http'
import type {
  CrearMantenimientoDto,
  MantenimientoResponseDto,
  FiltrosMantenimiento,
  ActualizarMantenimientoDto,
} from '@/modules/M4-canchas/types/canchas.types'

export const mantenimientosService = {
  /**
   * Consulta los mantenimientos de canchas según filtros de sede, cancha o fechas
   */
  async getMantenimientos(
    filtros?: FiltrosMantenimiento
  ): Promise<MantenimientoResponseDto[]> {
    const params = new URLSearchParams()
    if (filtros?.sedeId) params.append('sedeId', String(filtros.sedeId))
    if (filtros?.canchaId) params.append('canchaId', String(filtros.canchaId))
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin)

    const qs = params.toString() ? `?${params.toString()}` : ''
    const response = await http.get<MantenimientoResponseDto[]>(
      `/canchas/mantenimientos${qs}`
    )
    return Array.isArray(response.data) ? response.data : []
  },

  /**
   * Programa un mantenimiento para una cancha inhabilitando turnos futuros
   */
  async programarMantenimiento(
    idCancha: number,
    dto: CrearMantenimientoDto
  ): Promise<MantenimientoResponseDto> {
    const response = await http.post<MantenimientoResponseDto>(
      `/canchas/${idCancha}/mantenimiento`,
      dto
    )
    return response.data
  },

  /**
   * Alias de conveniencia para programarMantenimiento
   */
  async crearMantenimiento(
    idCancha: number,
    dto: CrearMantenimientoDto
  ): Promise<MantenimientoResponseDto> {
    return this.programarMantenimiento(idCancha, dto)
  },

  /**
   * Actualiza las fechas o motivo de un mantenimiento programado
   */
  async actualizarMantenimiento(
    idMantenimiento: number,
    dto: ActualizarMantenimientoDto
  ): Promise<MantenimientoResponseDto> {
    const response = await http.patch<MantenimientoResponseDto>(
      `/canchas/mantenimientos/${idMantenimiento}`,
      dto
    )
    return response.data
  },

  /**
   * Elimina o cancela un mantenimiento programado
   */
  async eliminarMantenimiento(idMantenimiento: number): Promise<void> {
    await http.delete(`/canchas/mantenimientos/${idMantenimiento}`)
  },
}

export default mantenimientosService
