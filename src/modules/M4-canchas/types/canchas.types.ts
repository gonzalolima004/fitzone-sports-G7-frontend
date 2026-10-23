import type { Sede } from "@/store/sede"

export interface CanchaTipo {
  id_cancha_tipo: number
  descripcion?: string
  activo?: boolean
}

export interface CrearCanchaTipoDto {
  descripcion: string
}

export interface ActualizarCanchaTipoDto {
  descripcion?: string
  activo?: boolean
}

export interface Cancha {
  id_cancha: number
  id_sede: number
  id_cancha_tipo: number
  nombre: string
  costo_base: number
  activo: boolean
  disponible?: boolean
  cancha_tipo?: CanchaTipo
  sede?: Sede
}

export interface CrearCanchaDto {
  id_sede: number
  id_cancha_tipo: number
  nombre: string
  costo_base: number
  disponible?: boolean
}

export interface ActualizarCanchaDto {
  id_sede?: number
  id_cancha_tipo?: number
  nombre?: string
  costo_base?: number
  activo?: boolean
  disponible?: boolean
}

export interface CrearMantenimientoDto {
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}

export interface MantenimientoResponseDto {
  id_cancha_mantenimiento: number
  id_cancha: number
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}

export type SlotEstado = 'DISPONIBLE' | 'RESERVADO' | 'MANTENIMIENTO'

export interface TurnoSlot {
  hora_inicio: string // ej: "18:00"
  hora_fin: string // ej: "19:00"
  estado: SlotEstado
  es_horario_pico: boolean // Franja 19:00 a 21:00 hs
  precio_estimado: number
  id_reserva?: number
}

export interface DisponibilidadCanchaResponse {
  id_cancha: number
  nombre_cancha: string
  fecha: string
  slots: TurnoSlot[]
}

export interface TurnoSeleccionado {
  cancha: Cancha
  slot: TurnoSlot
  fecha: string
}

export interface CotizacionTurnoResponse {
  costo_base: number
  descuento_porcentaje: number
  monto_descuento: number
  es_horario_pico: boolean
  monto_recargo_pico: number
  precio_final: number
  es_socio: boolean
}

export interface CrearReservaCanchaDto {
  id_cancha: number
  fecha_inicio: string
  fecha_fin: string
}

export interface ReservaCanchaResponse {
  id_cancha_reserva: number
  id_cancha: number
  id_usuario: number
  fecha_inicio: string
  fecha_fin: string
  precio_congelado: number
  id_cancha_reserva_estado: number
  estado_nombre: string
  created_at: string
}

export interface DetalleReservaCancha {
  id_cancha_reserva: number
  id_cancha: number
  id_usuario: number
  fecha_inicio: string
  fecha_fin: string
  precio_congelado: number
  id_cancha_reserva_estado: number
  estado_nombre: string
  created_at: string
  cancha?: Cancha
  nombre_cancha?: string
  tipo_cancha?: string
  nombre_sede?: string
  direccion_sede?: string
  costo_base?: number
  descuento_porcentaje?: number
  monto_descuento?: number
  es_horario_pico?: boolean
  monto_recargo_pico?: number
  cancha_en_mantenimiento?: boolean
  motivo_mantenimiento?: string
}

export interface SedeHorario {
  id_sede_horario: number
  id_sede: number
  dia_semana: number // 0: Domingo, 1: Lunes, ..., 6: Sábado
  hora_apertura: string // "07:00"
  hora_cierre: string // "23:00"
  abierto: boolean
}

export interface Calendario {
  id_calendario: number
  fecha: string
  descripcion?: string
  es_feriado: boolean
  es_dia_habil: boolean
}

export interface CalendarioSede {
  id_calendario_sede: number
  id_sede: number
  id_calendario: number
  cerrado: boolean
  hora_apertura?: string
  hora_cierre?: string
  motivo?: string
}

export interface HorarioOperativoDia {
  abierto: boolean
  hora_apertura: string
  hora_cierre: string
  motivo_cierre?: string
  es_horario_especial?: boolean
  no_programado?: boolean
  es_pasado?: boolean
}
