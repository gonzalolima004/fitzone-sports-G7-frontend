import http from '@/common/api/http'
import type {
  CanchaResumen,
  Ciudad,
  SedeGestion,
  SedePayload,
} from '../types/gerencia.types'

/**
 * Consumo de la API de sedes y ciudades (M0-sedes) para el panel de gerencia.
 * Las consultas son públicas; alta, modificación y baja requieren rol
 * gerente (el interceptor de Axios agrega el token).
 */
export const sedesService = {
  async listar(): Promise<SedeGestion[]> {
    const { data } = await http.get<SedeGestion[]>('/sedes')
    return data
  },

  async crear(datos: SedePayload): Promise<SedeGestion> {
    const { data } = await http.post<SedeGestion>('/sedes', datos)
    return data
  },

  async actualizar(
    idSede: number,
    datos: Partial<SedePayload>
  ): Promise<SedeGestion> {
    const { data } = await http.patch<SedeGestion>(`/sedes/${idSede}`, datos)
    return data
  },

  /** Baja lógica: la sede deja de listarse, pero se conserva su historial. */
  async darDeBaja(idSede: number): Promise<SedeGestion> {
    const { data } = await http.delete<SedeGestion>(`/sedes/${idSede}`)
    return data
  },

  async listarCiudades(): Promise<Ciudad[]> {
    const { data } = await http.get<Ciudad[]>('/ciudades')
    return data
  },

  async crearCiudad(nombre: string): Promise<Ciudad> {
    const { data } = await http.post<Ciudad>('/ciudades', { nombre })
    return data
  },

  /** Canchas activas con su tipo (GET /canchas de M4), para las instalaciones. */
  async listarCanchas(): Promise<CanchaResumen[]> {
    const { data } = await http.get<CanchaResumen[]>('/canchas')
    return data
  },
}
