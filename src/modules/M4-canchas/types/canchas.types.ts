export interface CanchaTipo {
  id_cancha_tipo: number
  nombre: string
  descripcion?: string
  icono?: string
}

export interface Cancha {
  id_cancha: number
  id_sede: number
  id_cancha_tipo: number
  nombre: string
  costo_base: number
  activa: boolean
  tipo?: CanchaTipo
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
