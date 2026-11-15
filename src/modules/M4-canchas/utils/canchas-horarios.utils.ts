import { obtenerFechaHoyLocal } from '@/common/utils/date'

/**
 * Determina de manera pura si un slot o turno ya transcurrió en el tiempo
 * respecto a la fecha y hora actual en zona horaria local.
 *
 * @param fecha Fecha del turno en formato YYYY-MM-DD
 * @param horaFin Hora límite o de fin del slot en formato HH:mm (también admite horaInicio si se evalúa comienzo)
 * @param fechaHoy Fecha de referencia opcional para testing o SSR (formato YYYY-MM-DD)
 */
export function calcularEsSlotPasado(
  fecha: string,
  horaFin: string,
  fechaHoy?: string
): boolean {
  const hoyRef = fechaHoy || obtenerFechaHoyLocal()
  if (fecha < hoyRef) return true
  if (fecha === hoyRef) {
    const ahora = new Date()
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`
    return horaFin <= horaActual
  }
  return false
}

/**
 * Genera la lista de franjas horarias (HH:00) entre la hora de apertura y cierre de la sede.
 *
 * @param horaApertura Hora de apertura en formato HH:mm (ej: '08:00')
 * @param horaCierre Hora de cierre en formato HH:mm (ej: '22:00')
 */
export function generarFranjasHorarias(
  horaApertura: string,
  horaCierre: string
): string[] {
  const inicio = parseInt(horaApertura.split(':')[0], 10)
  const fin = parseInt(horaCierre.split(':')[0], 10)

  if (isNaN(inicio) || isNaN(fin) || inicio >= fin) {
    return []
  }

  const res: string[] = []
  for (let h = inicio; h < fin; h++) {
    res.push(`${h.toString().padStart(2, '0')}:00`)
  }
  return res
}

/**
 * Formatea un importe numérico como moneda en pesos argentinos (ARS) sin decimales.
 *
 * @param valor Monto numérico a formatear
 */
export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}
