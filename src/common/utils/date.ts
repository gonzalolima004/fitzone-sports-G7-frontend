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

/**
 * Formatea una fecha YYYY-MM-DD (o ISO) al formato corto dd/mm/aa (ej: "17/11/26").
 */
export function formatearFechaDDMMAA(fechaStr?: string): string {
  if (!fechaStr) return ''
  const limpia = fechaStr.split('T')[0] ?? ''
  const partes = limpia.split('-')
  if (partes.length !== 3) return fechaStr
  const [anio, mes, dia] = partes
  if (!anio || !mes || !dia) return fechaStr
  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio.slice(-2)}`
}

/**
 * Suma o resta días a una fecha en formato YYYY-MM-DD respetando la zona horaria local.
 */
export function sumarDiasFechaLocal(fechaISO: string, dias: number): string {
  const partes = fechaISO.split('-').map(Number)
  const [anio, mes, dia] = partes
  if (!anio || !mes || !dia) return fechaISO
  const fecha = new Date(anio, mes - 1, dia)
  fecha.setDate(fecha.getDate() + dias)
  return obtenerFechaHoyLocal(fecha)
}
