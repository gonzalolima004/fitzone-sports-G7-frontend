import http from '@/common/api/http'
import type {
  EstadoMembresia,
  MembresiaAltaPayload,
  MembresiaSocio,
  UsuarioGestion,
  UsuarioListado,
} from '../types/gerencia.types'
import { aUsuarioGestion } from '../utils/membresias'

/**
 * Consumo de la API de membresías de los socios (M1-usuarios) para el panel
 * de gerencia. El listado, el alta, la modificación, el cambio de estado y la
 * baja requieren rol gerente (el interceptor de Axios agrega el token). El
 * catálogo de estados es público.
 */
export const membresiasService = {
  async listar(): Promise<MembresiaSocio[]> {
    const { data } = await http.get<MembresiaSocio[]>('/membresias')
    return data
  },

  /** Estados de la tabla membresia_estado (Activa, Vencida, Suspendida). */
  async listarEstados(): Promise<EstadoMembresia[]> {
    const { data } = await http.get<EstadoMembresia[]>('/membresias/estados')
    return data
  },

  /** Usuarios con su sede y si tienen rol socio (GET /usuarios de M1). */
  async listarUsuarios(): Promise<UsuarioGestion[]> {
    const { data } = await http.get<UsuarioListado[]>('/usuarios')
    return data.map(aUsuarioGestion)
  },

  /** Alta: el backend calcula el vencimiento y pasa a Suspendida la activa anterior. */
  async crear(datos: MembresiaAltaPayload): Promise<MembresiaSocio> {
    const { data } = await http.post<MembresiaSocio>('/membresias', datos)
    return data
  },

  async actualizar(
    idMembresia: number,
    datos: { fecha_fin?: string; renovacion_automatica?: boolean }
  ): Promise<MembresiaSocio> {
    const { data } = await http.patch<MembresiaSocio>(
      `/membresias/${idMembresia}`,
      datos
    )
    return data
  },

  async cambiarEstado(
    idMembresia: number,
    idEstado: number
  ): Promise<MembresiaSocio> {
    const { data } = await http.patch<MembresiaSocio>(
      `/membresias/${idMembresia}/estado`,
      { id_membresia_estado: idEstado }
    )
    return data
  },

  /** El backend responde 409 si la membresía ya tiene pagos registrados. */
  async eliminar(idMembresia: number): Promise<MembresiaSocio> {
    const { data } = await http.delete<MembresiaSocio>(
      `/membresias/${idMembresia}`
    )
    return data
  },
}
