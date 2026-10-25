import http from '@/common/api/http'
import { supabase } from '@/common/utils/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type {
  Cancha,
  CanchaTipo,
  DisponibilidadCanchaResponse,
  TurnoSlot,
  HorarioOperativoDia,
  CrearCanchaDto,
  ActualizarCanchaDto,
  CrearMantenimientoDto,
  MantenimientoResponseDto,
  ActualizarCanchaTipoDto,
  FiltrosMantenimiento,
  ActualizarMantenimientoDto,
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
/*
// Mock de fallback para pruebas y desarrollo universitario desconectado
const MOCK_TIPOS_CANCHA: CanchaTipo[] = [
  {
    id_cancha_tipo: 1,
    descripcion: 'Pádel',
  },
  {
    id_cancha_tipo: 2,
    descripcion: 'Fútbol 5',
  },
]
*/
/*
const MOCK_CANCHAS: Cancha[] = [
  {
    id_cancha: 1,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 1 (Cristal Tech)',
    costo_base: 8000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 2,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 2 (Panorámica)',
    costo_base: 8000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 3,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 3 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 4,
    id_sede: 1,
    id_cancha_tipo: 2,
    nombre: 'Fútbol 1 (Estadio Principal)',
    costo_base: 18000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 5,
    id_sede: 1,
    id_cancha_tipo: 2,
    nombre: 'Fútbol 2 (Techada Norte)',
    costo_base: 16000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  // Sede 2
  {
    id_cancha: 6,
    id_sede: 2,
    id_cancha_tipo: 1,
    nombre: 'Pádel Costanera 1',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 7,
    id_sede: 2,
    id_cancha_tipo: 1,
    nombre: 'Pádel Costanera 2',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 8,
    id_sede: 2,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Costanera Río',
    costo_base: 17000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  // Sede 3
  {
    id_cancha: 9,
    id_sede: 3,
    id_cancha_tipo: 1,
    nombre: 'Pádel Oro Verde',
    costo_base: 7500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 10,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 11,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 4 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 12,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 5 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 13,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 14,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 6 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 15,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 7 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 16,
    id_sede: 1,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 17,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 8 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 18,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 19,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 9 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 20,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 21,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 10 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 22,
    id_sede: 1,
    id_cancha_tipo: 1,
    nombre: 'Pádel 11 (Cubierta Central)',
    costo_base: 8500,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[0],
  },
  {
    id_cancha: 23,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 24,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 25,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 26,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 27,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
  {
    id_cancha: 28,
    id_sede: 3,
    id_cancha_tipo: 2,
    nombre: 'Fútbol Oro Verde',
    costo_base: 15000,
    activa: true,
    tipo: MOCK_TIPOS_CANCHA[1],
  },
]
*/

/**
 * Determina el horario operativo de la sede según el calendario (feriados) y el día de la semana (SedeHorario)
 */
function calcularHorarioOperativo(
  idSede: number,
  fechaStr: string
): HorarioOperativoDia {
  const [y, m, d] = fechaStr.split('-').map((v) => parseInt(v, 10))
  const fechaObj = new Date(y, m - 1, d)
  const diaSemana = fechaObj.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // Verificación de feriados y cierres en Calendario / CalendarioSede
  const mesDia = `${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
  if (mesDia === '12-25') {
    return {
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
      motivo_cierre: 'Feriado Nacional: Navidad (Sede Cerrada)',
    }
  }
  if (mesDia === '01-01') {
    return {
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
      motivo_cierre: 'Feriado Nacional: Año Nuevo (Sede Cerrada)',
    }
  }
  if (mesDia === '05-01') {
    return {
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
      motivo_cierre: 'Feriado Nacional: Día del Trabajador (Sede Cerrada)',
    }
  }

  // Horario semanal por sede (SedeHorario)
  if (idSede === 3) {
    // Sede Oro Verde cierra los domingos
    if (diaSemana === 0) {
      return {
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
        motivo_cierre: 'Sede cerrada los días domingos',
      }
    }
    if (diaSemana === 6) {
      return {
        abierto: true,
        hora_apertura: '09:00',
        hora_cierre: '19:00',
      }
    }
    return {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '21:00',
    }
  }

  if (idSede === 2) {
    // Sede Costanera
    if (diaSemana === 0 || diaSemana === 6) {
      return {
        abierto: true,
        hora_apertura: '08:00',
        hora_cierre: '20:00',
      }
    }
    return {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    }
  }

  // Sede Central (id_sede 1)
  if (diaSemana === 0) {
    return {
      abierto: true,
      hora_apertura: '09:00',
      hora_cierre: '20:00',
    }
  }
  if (diaSemana === 6) {
    return {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    }
  }
  return {
    abierto: true,
    hora_apertura: '07:00',
    hora_cierre: '23:00',
  }
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

/**
 * Genera slots dinámicamente según el horario de apertura y cierre de la sede
 * aplicando la regla de negocio de horario pico (19:00 a 21:00 hs) y descuento de socio
 */
function generarSlotsParaCancha(
  idCancha: number,
  idSede: number,
  costo: number,
  fecha: string,
  esSocio: boolean = true
): TurnoSlot[] {
  const horario = calcularHorarioOperativo(idSede, fecha)
  if (!horario.abierto) {
    return []
  }

  const slots: TurnoSlot[] = []
  const horaInicioInt = parseInt(horario.hora_apertura.split(':')[0], 10)
  const horaCierreInt = parseInt(horario.hora_cierre.split(':')[0], 10)

  // Semilla pseudo-determinística según fecha y cancha para simular reservas preexistentes solo si el backend falla
  const seed =
    (fecha.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0) +
      idCancha) %
    7

  for (let hora = horaInicioInt; hora <= horaCierreInt; hora++) {
    const horaInicioStr = `${hora.toString().padStart(2, '0')}:00`
    const horaFinStr = `${(hora + 1).toString().padStart(2, '0')}:00`

    // Regla de Negocio: Horario Pico entre las 19:00 y las 21:00 hs y descuento socio
    const { esPico, precio } = calcularPrecioSlot(costo, horaInicioStr, esSocio)

    let estado: TurnoSlot['estado'] = 'DISPONIBLE'
    if ((hora + seed) % 5 === 0) {
      estado = 'RESERVADO'
    }

    slots.push({
      hora_inicio: horaInicioStr,
      hora_fin: horaFinStr,
      estado,
      es_horario_pico: esPico,
      precio_estimado: precio,
    })
  }

  return slots
}

export const canchasService = {
  /**
   * Consulta el horario operativo de una sede para una fecha específica
   */
  async getHorarioOperativo(
    idSede: number,
    fecha: string
  ): Promise<HorarioOperativoDia> {
    try {
      const response = await http.get<HorarioOperativoDia>(
        `/sedes/${idSede}/horario-operativo`,
        {
          params: { fecha },
        }
      )
      return response.data
    } catch {
      return calcularHorarioOperativo(idSede, fecha)
    }
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
    nombreCancha?: string,
    idSede?: number
  ): Promise<DisponibilidadCanchaResponse> {
    const costo =
      costoBase && !isNaN(costoBase) && costoBase > 0 ? costoBase : 8000
    const nombre = nombreCancha || `Cancha #${idCancha}`
    const sedeId = idSede || 1

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
    } catch {
      // Si el endpoint de Nest falla o no responde, generamos los slots basados en el horario operativo y costo real
      return {
        id_cancha: idCancha,
        nombre_cancha: nombre,
        fecha,
        slots: generarSlotsParaCancha(idCancha, sedeId, costo, fecha, esSocio),
      }
    }
  },

  /**
   * Consulta la disponibilidad en lote para todas las canchas de una sede (Opción A).
   * Intenta consumir el endpoint optimizado GET /canchas/disponibilidad?sedeId=...&fecha=...
   * Si el backend aún no cuenta con este endpoint (404), conmuta automáticamente
   * y sin errores a la Opción B (consultar cada cancha con /canchas/:id/disponibilidad).
   */
  async getDisponibilidadPorSede(
    idSede: number,
    fecha: string,
    canchas: Cancha[],
    esSocio: boolean = true
  ): Promise<Record<number, TurnoSlot[]>> {
    try {
      const response = await http.get('/canchas/disponibilidad', {
        params: { sedeId: idSede, fecha },
      })
      if (Array.isArray(response.data) && response.data.length > 0) {
        const mapa: Record<number, TurnoSlot[]> = {}
        for (const item of response.data) {
          const id = item.id_cancha
          const costo = Number(item.costo_base) || 8000
          const rawSlots = Array.isArray(item.slots) ? item.slots : []
          mapa[id] = rawSlots.map(
            (s: {
              hora_inicio?: string
              horaInicio?: string
              hora_fin?: string
              horaFin?: string
              estado: TurnoSlot['estado']
              es_horario_pico?: boolean
              precio_estimado?: number
            }) => {
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
                precio_estimado: s.precio_estimado ?? precio,
              }
            }
          )
        }
        return mapa
      }
    } catch {
      // Si la Opción A no está implementada en backend (404), conmutamos a la Opción B
    }

    // Fallback elegante a Opción B (unitaria por cancha)
    const mapa: Record<number, TurnoSlot[]> = {}
    await Promise.all(
      canchas.map(async (cancha) => {
        const res = await canchasService.getDisponibilidad(
          cancha.id_cancha,
          fecha,
          Number(cancha.costo_base),
          esSocio,
          cancha.nombre,
          cancha.id_sede
        )
        mapa[cancha.id_cancha] = res.slots
      })
    )
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
