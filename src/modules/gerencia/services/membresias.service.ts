import http from '@/common/api/http'
import type {
  EstadoMembresia,
  MembresiaAltaPayload,
  MembresiaSocio,
  PaginaUsuarios,
  UsuarioGestion,
} from '../types/gerencia.types'
import { aUsuarioGestion } from '../utils/membresias'

/** Usuarios por pedido al recorrer el listado paginado de GET /usuarios. */
export const USUARIOS_POR_PAGINA = 100

async function pedirPaginaDeUsuarios(page: number): Promise<PaginaUsuarios> {
  const { data } = await http.get<PaginaUsuarios>('/usuarios', {
    params: { page, limit: USUARIOS_POR_PAGINA },
  })
  return data
}

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

  /**
   * Usuarios activos con su sede y si tienen rol socio (GET /usuarios de M1).
   * El listado viene paginado: se pide la primera página y, si hay más, el
   * resto en paralelo.
   */
  async listarUsuarios(): Promise<UsuarioGestion[]> {
    const primera = await pedirPaginaDeUsuarios(1)
    const restantes = await Promise.all(
      Array.from({ length: Math.max(primera.meta.lastPage - 1, 0) }, (_, i) =>
        pedirPaginaDeUsuarios(i + 2)
      )
    )
    return [primera, ...restantes]
      .flatMap((pagina) => pagina.data)
      .map(aUsuarioGestion)
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
