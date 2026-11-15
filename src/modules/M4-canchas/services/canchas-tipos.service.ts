import http from '@/common/api/http'
import type {
  CanchaTipo,
  ActualizarCanchaTipoDto,
} from '@/modules/M4-canchas/types/canchas.types'

export const canchasTiposService = {
  /**
   * Obtiene la lista de tipos de disciplinas deportivas, con opción de filtrar por estado activo
   */
  async getTiposCancha(inactivos?: boolean): Promise<CanchaTipo[]> {
    try {
      const response = await http.get(
        '/canchas/tipos',
        inactivos ? { params: { inactivos: true } } : undefined
      )
      if (response.data && Array.isArray(response.data)) {
        return response.data
      }
    } catch (err) {
      console.warn('Error consultando /canchas/tipos en el backend:', err)
    }
    return []
  },

  /**
   * Alias de conveniencia para getTiposCancha
   */
  async getCanchasTipos(inactivos?: boolean): Promise<CanchaTipo[]> {
    return this.getTiposCancha(inactivos)
  },

  /**
   * Crea un nuevo tipo de cancha
   */
  async crearTipoCancha(descripcion: string): Promise<CanchaTipo> {
    const response = await http.post<CanchaTipo>('/canchas/tipos', {
      descripcion: descripcion.trim(),
    })
    return response.data
  },

  /**
   * Alias de conveniencia para crearTipoCancha
   */
  async crearCanchaTipo(descripcion: string): Promise<CanchaTipo> {
    return this.crearTipoCancha(descripcion)
  },

  /**
   * Actualiza la descripción y/o el estado activo de un tipo de cancha
   */
  async actualizarTipoCancha(
    id: number,
    datos: ActualizarCanchaTipoDto
  ): Promise<CanchaTipo> {
    const response = await http.patch<CanchaTipo>(`/canchas/tipos/${id}`, datos)
    return response.data
  },

  /**
   * Alias de conveniencia para actualizarTipoCancha
   */
  async actualizarCanchaTipo(
    id: number,
    datos: ActualizarCanchaTipoDto
  ): Promise<CanchaTipo> {
    return this.actualizarTipoCancha(id, datos)
  },

  /**
   * Reactiva un tipo de cancha dado de baja lógica
   */
  async reactivarTipoCancha(id: number): Promise<CanchaTipo> {
    return this.actualizarTipoCancha(id, { activo: true })
  },

  /**
   * Da de baja lógica un tipo de cancha
   */
  async eliminarTipoCancha(id: number): Promise<void> {
    await http.delete(`/canchas/tipos/${id}`)
  },
}

export default canchasTiposService
