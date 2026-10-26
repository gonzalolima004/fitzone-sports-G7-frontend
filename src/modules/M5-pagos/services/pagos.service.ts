import apiClient from '@/common/api/http'

/**
 * Tipos de concepto admitidos por el backend de FitZone
 */
export type TipoConceptoPago = 'cancha' | 'membresia' | 'general'

/**
 * Estados posibles de una transacción de pago
 */
export type EstadoPago = 'Pendiente' | 'Aprobado' | 'Rechazado'

/**
 * Payload requerido por POST /pagos/iniciar-pago (IniciarPagoDto)
 * Regla de negocio: exactamente uno entre id_cancha_reserva o id_membresia_plan / id_membresia debe estar presente.
 */
export interface IniciarPagoRequest {
  monto?: number
  titulo: string
  id_cancha_reserva?: number
  id_membresia_plan?: number
  id_membresia?: number
  renovacion_automatica?: boolean
  email_pagador?: string
}

/**
 * Respuesta de POST /pagos/iniciar-pago (PreferenciaPagoResponseDto)
 */
export interface PreferenciaPagoResponse {
  preferenceId: string
  initPoint: string
  sandboxInitPoint: string
  id_pago?: number
}

/**
 * Desglose del concepto o servicio abonado (PagoConceptoDto)
 */
export interface PagoConceptoDto {
  tipo: TipoConceptoPago
  id_referencia: number | null
  titulo: string
  detalle: string
  duracion_dias?: number
}

/**
 * Concepto pendiente de abonar para el usuario autenticado (PagoPendienteResponseDto)
 */
export interface PagoPendiente {
  tipo: Exclude<TipoConceptoPago, 'general'>
  id_referencia: number
  titulo: string
  detalle: string
  monto: number
  duracion_dias?: number
}

/**
 * Detalle y trazabilidad de un pago registrado (PagoDetalleResponseDto)
 */
export interface PagoDetalleResponse {
  id_pago: number
  monto: number
  fecha_pago: string
  estado: EstadoPago | string
  token_transaccion?: string | null
  comprobante_url?: string | null
  concepto: PagoConceptoDto
}

/**
 * Estructura de datos para emisión de comprobante oficial
 */
export interface ComprobanteEmisor {
  nombre: string
  subtitulo: string
  descripcion: string
  email?: string
}

export interface ComprobanteCliente {
  nombre: string
  email: string
  documento?: string
}

export interface ComprobanteResponse {
  id_pago: number
  fecha_emision: string
  emisor: ComprobanteEmisor
  cliente: ComprobanteCliente
  concepto: PagoConceptoDto
  pago: {
    monto: number
    moneda: string
    metodo: string
    transaccion_id: string
    estado: string
  }
}

/**
 * Servicio de Pagos para interactuar con los endpoints de NestJS M5-pagos
 */
export const pagosService = {
  /**
   * Genera la preferencia en Mercado Pago Checkout Pro y registra la intención en FitZone
   * POST /pagos/iniciar-pago
   */
  async iniciarPago(
    datos: IniciarPagoRequest
  ): Promise<PreferenciaPagoResponse> {
    const response = await apiClient.post<PreferenciaPagoResponse>(
      '/pagos/iniciar-pago',
      datos
    )
    return response.data
  },

  /**
   * Lista la membresía vencida y las reservas de cancha pendientes de pago
   * GET /pagos/pendientes
   */
  async obtenerPendientes(): Promise<PagoPendiente[]> {
    const response = await apiClient.get<PagoPendiente[]>('/pagos/pendientes')
    return response.data
  },

  /**
   * Consulta el historial de pagos asociados al usuario autenticado
   * GET /pagos/mis-pagos
   */
  async obtenerMisPagos(): Promise<PagoDetalleResponse[]> {
    const response =
      await apiClient.get<PagoDetalleResponse[]>('/pagos/mis-pagos')
    return response.data
  },

  /**
   * Obtiene los datos detallados de un pago por su ID
   * GET /pagos/:id
   */
  async obtenerPagoPorId(id: number): Promise<PagoDetalleResponse> {
    const response = await apiClient.get<PagoDetalleResponse>(`/pagos/${id}`)
    return response.data
  },

  /**
   * Retorna la URL oficial para descargar o visualizar el comprobante en PDF
   * GET /pagos/:id/comprobante
   */
  getComprobanteUrl(id: number): string {
    const baseURL = (import.meta.env.VITE_API_URL as string) || ''
    return `${baseURL}/pagos/${id}/comprobante`
  },
}

export default pagosService
