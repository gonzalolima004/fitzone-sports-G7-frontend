import http from '@/common/api/http'
import { supabase } from '@/common/utils/supabase'
import { useSedeStore, type HorarioOperativo } from '@/store/sede'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type {
  Cancha,
  CanchaTipo,
  DisponibilidadCanchaResponse,
  TurnoSlot,
  CrearCanchaDto,
  ActualizarCanchaDto,
  CrearMantenimientoDto,
  MantenimientoResponseDto,
  ActualizarCanchaTipoDto,
  FiltrosMantenimiento,
  ActualizarMantenimientoDto,
  DisponibilidadSedeMap,
  CanchaDisponibilidadBackendDto,
  GrillaDisponibilidadBackendResponse,
} from '@/modules/M4-canchas/types/canchas.types'

///NOTA: Capaz es mejor que el estado lo traiga como string directamente
export interface CanchaReservaRealtimePayload {
  id_cancha_reserva?: number
  id_cancha?: number
  id_usuario?: number
  id_cancha_reserva_estado?: number
  fecha_inicio?: string
  fecha_fin?: string
  precio_congelado?: number
  descuento_porcentaje?: number
  es_horario_pico?: boolean
  [key: string]: unknown // Para ignorar columnas extras que traiga Supabase
}

/**
 * Calcula la cotización dinámica estimada de un turno en memoria:
 * - Tarifa base según la cancha
 * - Recargo horario pico (+20% entre las 19:00 y 21:00 hs)
 * - Descuento de socio activo (-15% si aplica)
 */
export function calcularPrecioSlot(
  costoBase: number,
  horaInicioStr: string,
  esSocio: boolean = true
): { esPico: boolean; precio: number } {
  const horaNum = parseInt(horaInicioStr.split(':')[0], 10)
  const esPico = horaNum >= 19 && horaNum < 21
  const base =
    costoBase && !isNaN(costoBase) && costoBase > 0 ? costoBase : 8000
  const montoRecargoPico = esPico ? Math.round(base * 0.2) : 0
  const montoDescuento = esSocio ? Math.round(base * 0.15) : 0
  const precioFinal = base - montoDescuento + montoRecargoPico
  return { esPico, precio: precioFinal }
}

export const canchasService = {
  /**
   * Consulta el horario operativo de una sede para una fecha específica,
   * delegando en el sedeStore para unificar la fuente de datos y el uso de su caché central.
   */
  async getHorarioOperativo(
    idSede: number,
    fecha: string
  ): Promise<HorarioOperativo> {
    const sedeStore = useSedeStore()
    return await sedeStore.obtenerHorarioOperativo(idSede, fecha)
  },

  /**
   * Obtiene la lista de tipos de disciplinas deportivas, con opción de filtrar por estado activo
   */
  async getTiposCancha(inactivos?: boolean): Promise<CanchaTipo[]> {
    try {
      const response = await http.get(
        '/canchas/tipos',
        inactivos ? { params: { inactivos: true } } : undefined
      )
      if (response.data && response.data.length > 0) {
        return response.data
      }
    } catch (err) {
      console.warn('Error consultando /canchas/tipos en el backend:', err)
    }
    return []
  },

  /**
   * Crea un nuevo tipo de cancha
   */
  async crearTipoCancha(descripcion: string): Promise<CanchaTipo> {
    const response = await http.post('/canchas/tipos', {
      descripcion: descripcion.trim(),
    })
    return response.data
  },

  /**
   * Actualiza la descripción y/o el estado activo de un tipo de cancha
   */
  async actualizarTipoCancha(
    id: number,
    datos: ActualizarCanchaTipoDto
  ): Promise<CanchaTipo> {
    const response = await http.patch(`/canchas/tipos/${id}`, datos)
    return response.data
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

  /**
   * Obtiene la lista completa de canchas con filtros opcionales (sede, tipo, disponible)
   */
  async getCanchas(filtros?: {
    id_sede?: number
    sedeId?: number
    id_cancha_tipo?: number
    activo?: boolean
    disponible?: boolean
  }): Promise<Cancha[]> {
    try {
      const params = new URLSearchParams()
      const sede = filtros?.sedeId ?? filtros?.id_sede
      if (sede) params.append('sedeId', String(sede))

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const response = await http.get(`/canchas${queryString}`)
      if (Array.isArray(response.data)) {
        return response.data
      }
    } catch (err) {
      console.warn('Error al consultar /canchas en el backend:', err)
    }
    return []
  },
  /* NOTA: VIEJO
  **
   * Obtiene las canchas asociadas a una sede específica
   *
  async getCanchasPorSede(idSede: number): Promise<Cancha[]> {
    try {
      const response = await http.get(`/canchas?sedeId=${idSede}`)
      if (Array.isArray(response.data)) {
        return response.data
      }
    } catch (err) {
      console.warn(
        `Error al consultar canchas de sede #${idSede} en el backend:`,
        err
      )
    }
    return []
  },
*/

  /**
   * Obtiene las canchas asociadas a una sede específica desde el backend.
   */
  async getCanchasPorSede(idSede: number): Promise<Cancha[]> {
    return this.getCanchas({ sedeId: idSede })
  },

  /**
   * Da de alta una nueva cancha en el backend
   */
  async crearCancha(dto: CrearCanchaDto): Promise<Cancha> {
    const response = await http.post<Cancha>('/canchas', dto)
    return response.data
  },

  /**
   * Actualiza los atributos de una cancha existente
   */
  async actualizarCancha(
    id: number,
    dto: ActualizarCanchaDto
  ): Promise<Cancha> {
    const response = await http.patch<Cancha>(`/canchas/${id}`, dto)
    return response.data
  },

  /**
   * Elimina una cancha (baja lógica) en el backend
   */
  async eliminarCancha(id: number): Promise<void> {
    await http.delete(`/canchas/${id}`)
  },

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

  /**
   * Consulta la grilla horaria de disponibilidad para una cancha y fecha
   * desde el endpoint REST del backend (/canchas/:id/disponibilidad).
   * Si el endpoint aún no está implementado en backend, calcula los slots
   * en memoria con el costo base y horario operativo sin consultar tablas directamente.
   */
  async getDisponibilidad(
    idCancha: number,
    fecha: string,
    costoBase?: number,
    esSocio: boolean = true,
    nombreCancha?: string
  ): Promise<DisponibilidadCanchaResponse> {
    const costo =
      costoBase && !isNaN(costoBase) && costoBase > 0 ? costoBase : 8000
    const nombre = nombreCancha || `Cancha #${idCancha}`

    try {
      const response = await http.get(`/canchas/${idCancha}/disponibilidad`, {
        params: { fecha },
      })
      const data = response.data

      // NestJS devuelve el arreglo directo: [ { horaInicio, horaFin, estado }, ... ]
      const rawSlots: Array<{
        horaInicio?: string
        hora_inicio?: string
        horaFin?: string
        hora_fin?: string
        estado: TurnoSlot['estado']
        es_horario_pico?: boolean
        precio_estimado?: number
      }> = Array.isArray(data)
        ? data
        : Array.isArray(data?.slots)
          ? data.slots
          : []

      const slots: TurnoSlot[] = rawSlots.map((s) => {
        const horaInicio = s.hora_inicio || s.horaInicio || '08:00'
        const horaFin = s.hora_fin || s.horaFin || '09:00'
        const { esPico, precio } = calcularPrecioSlot(
          costo,
          horaInicio,
          esSocio
        )

        return {
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          estado: s.estado,
          es_horario_pico: s.es_horario_pico ?? esPico,
          precio_estimado:
            s.precio_estimado !== undefined &&
            s.precio_estimado > 0 &&
            s.precio_estimado !== 15000
              ? s.precio_estimado
              : precio,
        }
      })

      return {
        id_cancha: idCancha,
        nombre_cancha: nombre,
        fecha,
        slots,
      }
    } catch (err) {
      console.error(
        `[canchasService] Error al consultar disponibilidad de cancha #${idCancha}:`,
        err
      )
      return {
        id_cancha: idCancha,
        nombre_cancha: nombre,
        fecha,
        slots: [],
      }
    }
  },

  /**
   * Consulta la disponibilidad en lote para las canchas de una sede (Opción A).
   * Consume el endpoint optimizado GET /canchas/disponibilidad sin fallbacks ni datos simulados.
   */
  async getDisponibilidadPorSede(
    idSede: number,
    fecha: string,
    canchas?: Cancha[],
    esSocio: boolean = true,
    tipoId?: number
  ): Promise<DisponibilidadSedeMap> {
    const response = await http.get<
      CanchaDisponibilidadBackendDto[] | GrillaDisponibilidadBackendResponse
    >('/canchas/disponibilidad', {
      params: {
        sedeId: idSede,
        fecha,
        ...(tipoId ? { tipoId } : {}),
      },
    })

    const sedeStore = useSedeStore()
    const key = `${idSede}_${fecha}`
    let itemsCanchas: CanchaDisponibilidadBackendDto[] = []

    // Normalizar la respuesta: la API del backend es la única fuente de verdad
    if (Array.isArray(response.data)) {
      itemsCanchas = response.data
    } else if (response.data && typeof response.data === 'object') {
      const dataObj = response.data as GrillaDisponibilidadBackendResponse
      if (dataObj.horario) {
        sedeStore.horariosCache[key] = dataObj.horario
      }
      if (Array.isArray(dataObj.canchas)) {
        itemsCanchas = dataObj.canchas
      }
    }

    // Si la sede está cerrada según el backend (Calendario / SedeHorario), no se generan turnos
    const horarioActual = sedeStore.horariosCache[key]
    if (horarioActual && !horarioActual.abierto) {
      return {}
    }

    const mapa: DisponibilidadSedeMap = {}

    for (const item of itemsCanchas) {
      if (!item || typeof item.id_cancha !== 'number') {
        continue
      }

      const id = item.id_cancha
      // Si item.costo_base viene del backend lo usamos; si no, buscamos en la lista de canchas provista
      const canchaReferencia = canchas?.find((c) => c.id_cancha === id)
      const costo = Number(item.costo_base ?? canchaReferencia?.costo_base ?? 0)

      const rawSlots = Array.isArray(item.slots) ? item.slots : []
      const slotsProcesados: TurnoSlot[] = []

      for (const s of rawSlots) {
        const horaInicio = s.hora_inicio ?? s.horaInicio
        const horaFin = s.hora_fin ?? s.horaFin

        // Si el slot no contiene horarios reales válidos del backend, se descarta
        if (!horaInicio || !horaFin) {
          continue
        }

        const { esPico, precio } = calcularPrecioSlot(
          costo,
          horaInicio,
          esSocio
        )

        slotsProcesados.push({
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          estado: s.estado,
          es_horario_pico: s.es_horario_pico ?? esPico,
          precio_estimado: s.precio_estimado ?? precio,
          id_reserva: s.id_reserva,
        })
      }

      mapa[id] = slotsProcesados
    }

    return mapa
  },

  /**
   * Suscribe en tiempo real a Supabase Realtime para cambios en la tabla cancha_reserva
   * Se dispara cuando otro usuario reserva o cancela un turno concurrentemente
   */
  suscribirCambiosDisponibilidad(
    idCancha: number,
    onCambio: (
      payload: RealtimePostgresChangesPayload<CanchaReservaRealtimePayload>
    ) => void
  ) {
    const channelName = `realtime-cancha-${idCancha}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cancha_reserva',
          filter: `id_cancha=eq.${idCancha}`,
        },
        (payload) => {
          onCambio(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}

export default canchasService
