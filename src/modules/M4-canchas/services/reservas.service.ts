import http from '@/common/api/http'
import type {
  CotizacionTurnoResponse,
  CrearReservaCanchaDto,
  ReservaCanchaResponse,
  DetalleReservaCancha,
} from '@/modules/M4-canchas/types/canchas.types'

export const reservasService = {
  /**
   * Consulta la cotización dinámica del turno al backend
   * Devuelve el desglose de precio según el perfil del usuario (descuento 15% socio)
   * y horario pico (19:00 a 21:00 hs) sin duplicar el patrón Strategy en Vue.
   */
  async cotizarTurno(
    idCancha: number,
    fecha: string,
    horaInicio: string,
    costoBase: number,
    esSocio: boolean = true
  ): Promise<CotizacionTurnoResponse> {
    try {
      const response = await http.get<CotizacionTurnoResponse>(
        '/canchas/cotizar',
        {
          params: {
            canchaId: idCancha,
            fecha,
            hora: horaInicio,
          },
        }
      )
      return response.data
    } catch {
      // Simulación de contingencia local que refleja la respuesta del Strategy del backend
      const horaNum = parseInt(horaInicio.split(':')[0], 10)
      const esPico = horaNum >= 19 && horaNum < 21
      const base =
        costoBase && !isNaN(costoBase) && costoBase > 0 ? costoBase : 8000
      const descuentoPorcentaje = esSocio ? 15 : 0
      const montoDescuento = Math.round(base * (descuentoPorcentaje / 100))
      const montoRecargoPico = esPico ? Math.round(base * 0.2) : 0
      const precioFinal = base - montoDescuento + montoRecargoPico

      return {
        costo_base: base,
        descuento_porcentaje: descuentoPorcentaje,
        monto_descuento: montoDescuento,
        es_horario_pico: esPico,
        monto_recargo_pico: montoRecargoPico,
        precio_final: precioFinal,
        es_socio: esSocio,
      }
    }
  },

  /**
   * Envía la solicitud transaccional para reservar la cancha
   * Consume POST /reservas-canchas.
   * Si ocurre un conflicto de concurrencia, el backend responde HTTP 409 Conflict.
   */
  async crearReserva(
    dto: CrearReservaCanchaDto
  ): Promise<ReservaCanchaResponse> {
    const response = await http.post<ReservaCanchaResponse>(
      '/reservas-canchas',
      dto
    )
    return response.data
  },

  /**
   * Obtiene el detalle de una reserva de cancha por ID
   * Consume GET /reservas-canchas/:id con fallback resiliente para testing.
   */
  async obtenerReservaPorId(id: number): Promise<DetalleReservaCancha> {
    try {
      const response = await http.get<DetalleReservaCancha>(
        `/reservas-canchas/${id}`
      )
      return response.data
    } catch (err) {
      // Si el endpoint no responde, verificar si la reserva fue creada en la sesión actual
      try {
        const raw = localStorage.getItem(`fitzone_reserva_${id}`)
        if (raw) {
          return JSON.parse(raw) as DetalleReservaCancha
        }
      } catch (e) {
        console.warn('Error al leer reserva de localStorage:', e)
      }

      console.warn(
        `No se pudo obtener la reserva #${id} desde el backend HTTP:`,
        err
      )
      throw err
    }
  },

  /**
   * Guarda temporalmente el detalle contextual de la reserva creada en cliente
   * para enriquecer la vista de detalle.
   */
  guardarReservaEnCache(reserva: DetalleReservaCancha): void {
    try {
      localStorage.setItem(
        `fitzone_reserva_${reserva.id_cancha_reserva}`,
        JSON.stringify(reserva)
      )
    } catch (e) {
      console.warn('Error guardando reserva en cache:', e)
    }
  },
}

export default reservasService
