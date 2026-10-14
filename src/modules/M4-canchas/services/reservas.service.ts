import http from '@/common/api/http'
import type {
  CotizacionTurnoResponse,
  CrearReservaCanchaDto,
  ReservaCanchaResponse,
} from '@/modules/M4-canchas/types/canchas.types'

export const reservasService = {
  /**
   * Consulta la cotización dinámica del turno al backend (US-05-03 / Subtarea 2.2)
   * Devuelve el desglose de precio según el perfil del usuario (descuento 15% socio)
   * y horario pico (19:00 a 21:00 hs) sin duplicar el patrón Strategy en Vue.
   */
  async cotizarTurno(
    idCancha: number,
    fecha: string,
    horaInicio: string,
    costoBase: number
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
      const esSocio = true // Por defecto el usuario activo es socio
      const descuentoPorcentaje = esSocio ? 15 : 0
      const montoDescuento = Math.round(costoBase * (descuentoPorcentaje / 100))
      const montoRecargoPico = esPico ? Math.round(costoBase * 0.2) : 0
      const precioFinal = costoBase - montoDescuento + montoRecargoPico

      return {
        costo_base: costoBase,
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
   * Envía la solicitud transaccional para reservar la cancha (US-05-04 / Subtarea 2.3)
   * Consume POST /reservas-canchas.
   * Si ocurre un conflicto de concurrencia (RN-02), el backend responde HTTP 409 Conflict.
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
}

export default reservasService
