/**
 * Utilidades compartidas para manejo de fechas en zona horaria local.
 */

/**
 * Retorna la fecha local en formato YYYY-MM-DD respetando la zona horaria del navegador.
 * Evita el desfasaje de UTC producido por `new Date().toISOString()`.
 */
export function obtenerFechaHoyLocal(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
