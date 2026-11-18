import http from '@/common/api/http'
import type { PlanMembresia, PlanPayload } from '../types/gerencia.types'

/**
 * Consumo de la API de planes de membresía (M1-usuarios) para el panel de
 * gerencia. El catálogo es público; alta, modificación y baja requieren rol
 * gerente.
 */
export const planesService = {
  async listar(): Promise<PlanMembresia[]> {
    const { data } = await http.get<PlanMembresia[]>('/planes')
    return data
  },

  async crear(datos: PlanPayload): Promise<PlanMembresia> {
    const { data } = await http.post<PlanMembresia>('/planes', datos)
    return data
  },

  async actualizar(
    idPlan: number,
    datos: Partial<PlanPayload>
  ): Promise<PlanMembresia> {
    const { data } = await http.patch<PlanMembresia>(`/planes/${idPlan}`, datos)
    return data
  },

  /** Eliminación física: el backend la rechaza si el plan tiene membresías. */
  async eliminar(idPlan: number): Promise<PlanMembresia> {
    const { data } = await http.delete<PlanMembresia>(`/planes/${idPlan}`)
    return data
  },
}
