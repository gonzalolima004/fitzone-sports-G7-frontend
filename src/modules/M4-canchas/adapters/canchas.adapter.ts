import type {
  TurnoSlot,
  SlotBackendDto,
} from '@/modules/M4-canchas/types/canchas.types'

/**
 * Estructura flexible para slots crudos recibidos desde los endpoints del backend
 * (soporta tanto camelCase de NestJS como snake_case de Postgres/Supabase).
 */
export interface RawSlotBackend {
  horaInicio?: string
  hora_inicio?: string
  horaFin?: string
  hora_fin?: string
  estado?: TurnoSlot['estado'] | string
  es_horario_pico?: boolean
  precio_estimado?: number
  id_reserva?: number
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
 * Normaliza un slot crudo devuelto por el backend a la estructura estándar TurnoSlot de la UI.
 * Resuelve en una sola frontera el doble mapeo snake_case / camelCase (hora_inicio vs horaInicio),
 * garantiza formatos de hora HH:mm, estados canónicos y asignación de precios estimados.
 */
export function normalizarSlotBackend(
  raw: RawSlotBackend | SlotBackendDto,
  _idCancha: number,
  _fecha: string,
  costoBase: number = 0,
  esSocio: boolean = true
): TurnoSlot | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const r = raw as RawSlotBackend
  const horaInicioRaw = r.hora_inicio ?? r.horaInicio
  const horaFinRaw = r.hora_fin ?? r.horaFin

  if (!horaInicioRaw || !horaFinRaw) {
    return null
  }

  const horaInicio = String(horaInicioRaw).slice(0, 5)
  const horaFin = String(horaFinRaw).slice(0, 5)

  let estado: TurnoSlot['estado'] = 'DISPONIBLE'
  if (r.estado === 'RESERVADO') {
    estado = 'RESERVADO'
  } else if (r.estado === 'MANTENIMIENTO') {
    estado = 'MANTENIMIENTO'
  }

  const { esPico, precio } = calcularPrecioSlot(costoBase, horaInicio, esSocio)

  return {
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    estado,
    es_horario_pico:
      typeof r.es_horario_pico === 'boolean' ? r.es_horario_pico : esPico,
    precio_estimado:
      typeof r.precio_estimado === 'number' &&
      r.precio_estimado > 0 &&
      r.precio_estimado !== 15000
        ? r.precio_estimado
        : precio,
    id_reserva: typeof r.id_reserva === 'number' ? r.id_reserva : undefined,
  }
}
