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
  TurnoReservadoPayload,
} from '@/modules/M4-canchas/types/canchas.types'
import { normalizarSlotBackend } from '@/modules/M4-canchas/adapters/canchas.adapter'
import { canchasTiposService } from '@/modules/M4-canchas/services/canchas-tipos.service'
import { mantenimientosService } from '@/modules/M4-canchas/services/mantenimientos.service'

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
  [key: string]: unknown
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

  // -------------------------------------------------------------
  // Delegación a canchasTiposService (Fachada Retrocompatible)
  // -------------------------------------------------------------
  async getTiposCancha(inactivos?: boolean): Promise<CanchaTipo[]> {
    return canchasTiposService.getTiposCancha(inactivos)
  },

  async getCanchasTipos(inactivos?: boolean): Promise<CanchaTipo[]> {
    return canchasTiposService.getCanchasTipos(inactivos)
  },

  async crearTipoCancha(descripcion: string): Promise<CanchaTipo> {
    return canchasTiposService.crearTipoCancha(descripcion)
  },

  async crearCanchaTipo(descripcion: string): Promise<CanchaTipo> {
    return canchasTiposService.crearCanchaTipo(descripcion)
  },

  async actualizarTipoCancha(
    id: number,
    datos: ActualizarCanchaTipoDto
  ): Promise<CanchaTipo> {
    return canchasTiposService.actualizarTipoCancha(id, datos)
  },

  async actualizarCanchaTipo(
    id: number,
    datos: ActualizarCanchaTipoDto
  ): Promise<CanchaTipo> {
    return canchasTiposService.actualizarCanchaTipo(id, datos)
  },

  async reactivarTipoCancha(id: number): Promise<CanchaTipo> {
    return canchasTiposService.reactivarTipoCancha(id)
  },

  async eliminarTipoCancha(id: number): Promise<void> {
    return canchasTiposService.eliminarTipoCancha(id)
  },

  // -------------------------------------------------------------
  // CRUD de Canchas
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Delegación a mantenimientosService (Fachada Retrocompatible)
  // -------------------------------------------------------------
  async getMantenimientos(
    filtros?: FiltrosMantenimiento
  ): Promise<MantenimientoResponseDto[]> {
    return mantenimientosService.getMantenimientos(filtros)
  },

  async programarMantenimiento(
    idCancha: number,
    dto: CrearMantenimientoDto
  ): Promise<MantenimientoResponseDto> {
    return mantenimientosService.programarMantenimiento(idCancha, dto)
  },

  async crearMantenimiento(
    idCancha: number,
    dto: CrearMantenimientoDto
  ): Promise<MantenimientoResponseDto> {
    return mantenimientosService.crearMantenimiento(idCancha, dto)
  },

  async actualizarMantenimiento(
    idMantenimiento: number,
    dto: ActualizarMantenimientoDto
  ): Promise<MantenimientoResponseDto> {
    return mantenimientosService.actualizarMantenimiento(idMantenimiento, dto)
  },

  async eliminarMantenimiento(idMantenimiento: number): Promise<void> {
    return mantenimientosService.eliminarMantenimiento(idMantenimiento)
  },

  // -------------------------------------------------------------
  // Disponibilidad y Slots (con Adapter)
  // -------------------------------------------------------------
  /**
   * Consulta la grilla horaria de disponibilidad para una cancha y fecha
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

      const rawSlots = Array.isArray(data)
        ? data
        : Array.isArray(data?.slots)
          ? data.slots
          : []

      const slots: TurnoSlot[] = []
      for (const s of rawSlots) {
        const slot = normalizarSlotBackend(s, idCancha, fecha, costo, esSocio)
        if (slot) {
          slots.push(slot)
        }
      }

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
        sedeStore.guardarHorarioEnCache(idSede, fecha, dataObj.horario)
      }
      if (Array.isArray(dataObj.canchas)) {
        itemsCanchas = dataObj.canchas
      }
    }

    // Si la sede está cerrada según el backend (Calendario / SedeHorario) y no tiene horario especial, no se generan turnos
    const horarioActual = sedeStore.horariosCache[key]
    if (
      horarioActual &&
      !horarioActual.abierto &&
      !horarioActual.es_horario_especial
    ) {
      return {}
    }

    const mapa: DisponibilidadSedeMap = {}

    for (const item of itemsCanchas) {
      if (!item || typeof item.id_cancha !== 'number') {
        continue
      }

      const id = item.id_cancha
      const canchaReferencia = canchas?.find((c) => c.id_cancha === id)
      const costo = Number(item.costo_base ?? canchaReferencia?.costo_base ?? 0)

      const rawSlots = Array.isArray(item.slots) ? item.slots : []
      const slotsProcesados: TurnoSlot[] = []

      for (const s of rawSlots) {
        const slot = normalizarSlotBackend(s, id, fecha, costo, esSocio)
        if (slot) {
          slotsProcesados.push(slot)
        }
      }

      mapa[id] = slotsProcesados
    }

    return mapa
  },

  // -------------------------------------------------------------
  // Supabase Realtime
  // -------------------------------------------------------------
  /**
   * Suscribe en tiempo real al canal Supabase Broadcast de la sede actual (`canchas:sede:${idSede}`)
   */
  suscribirTurnoReservado(
    idSede: number,
    onTurnoReservado: (payload: TurnoReservadoPayload) => void
  ): () => void {
    const channelName = `canchas:sede:${idSede}`
    const channel = supabase
      .channel(channelName)
      .on<TurnoReservadoPayload>(
        'broadcast',
        { event: 'turno_reservado' },
        (res) => {
          if (res?.payload) {
            onTurnoReservado(res.payload)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Suscribe en tiempo real a Supabase Realtime para cambios en la tabla cancha_reserva
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
