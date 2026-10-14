import http from '@/common/api/http'
import { supabase } from '@/common/utils/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type {
  Cancha,
  CanchaTipo,
  DisponibilidadCanchaResponse,
  TurnoSlot,
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

// Mock de fallback para pruebas y desarrollo universitario desconectado
const MOCK_TIPOS_CANCHA: CanchaTipo[] = [
  {
    id_cancha_tipo: 1,
    nombre: 'Pádel',
    descripcion: 'Pistas de césped sintético y cristal templado',
  },
  {
    id_cancha_tipo: 2,
    nombre: 'Fútbol 5',
    descripcion: 'Canchas techadas de césped sintético pro',
  },
]

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

/**
 * Genera slots horarios estándar (08:00 a 23:00 hs) para una cancha y fecha
 * aplicando la regla de negocio de horario pico (19:00 a 21:00 hs)
 */
function generarSlotsFallback(cancha: Cancha, fecha: string): TurnoSlot[] {
  const slots: TurnoSlot[] = []
  const costo = cancha.costo_base

  // Semilla pseudo-determinística según fecha y cancha para simular reservas preexistentes
  const seed =
    (fecha.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0) +
      cancha.id_cancha) %
    7

  for (let hora = 8; hora <= 22; hora++) {
    const horaInicioStr = `${hora.toString().padStart(2, '0')}:00`
    const horaFinStr = `${(hora + 1).toString().padStart(2, '0')}:00`

    // Regla de Negocio: Horario Pico entre las 19:00 y las 21:00 hs
    const esPico = hora >= 19 && hora < 21
    // Si es horario pico, recargo del 20%
    const precio = esPico ? Math.round(costo * 1.2) : costo

    let estado: TurnoSlot['estado'] = 'DISPONIBLE'

    // Generar algunas ocupaciones realistas para visualización
    if ((hora + seed) % 5 === 0) {
      estado = 'RESERVADO'
    } else if (cancha.id_cancha === 3 && hora === 14) {
      // Simular un mantenimiento
      estado = 'MANTENIMIENTO'
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
   * Obtiene la lista de tipos de disciplinas deportivas
   */
  async getTiposCancha(): Promise<CanchaTipo[]> {
    try {
      const response = await http.get('/canchas/tipos')
      return response.data
    } catch {
      return MOCK_TIPOS_CANCHA
    }
  },

  /**
   * Obtiene las canchas asociadas a una sede específica
   */
  async getCanchasPorSede(idSede: number): Promise<Cancha[]> {
    try {
      const response = await http.get(`/canchas?sedeId=${idSede}`)
      return response.data
    } catch {
      return MOCK_CANCHAS.filter((c) => c.id_sede === idSede && c.activa)
    }
  },

  /**
   * Consulta la grilla horaria de disponibilidad para una cancha y fecha
   * según el endpoint GET /canchas/:id/disponibilidad?fecha=YYYY-MM-DD
   */
  async getDisponibilidad(
    idCancha: number,
    fecha: string
  ): Promise<DisponibilidadCanchaResponse> {
    try {
      const response = await http.get(`/canchas/${idCancha}/disponibilidad`, {
        params: { fecha },
      })
      return response.data
    } catch {
      const cancha =
        MOCK_CANCHAS.find((c) => c.id_cancha === idCancha) || MOCK_CANCHAS[0]
      return {
        id_cancha: idCancha,
        nombre_cancha: cancha.nombre,
        fecha,
        slots: generarSlotsFallback(cancha, fecha),
      }
    }
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
