/**
 * Utilidades estándar para el manejo y formateo de fechas en la aplicación.
 * Estandariza el formato a dd/mm/aaaa, huso horario local y nombres en español.
 */

export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const

export const DIAS_SEMANA_CORTOS = [
  'Dom',
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
] as const

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

/**
 * Normaliza cualquier entrada a un objeto Date seguro evitando problemas de desfase horario.
 * Si se pasa un string en formato YYYY-MM-DD, se parsea considerando las partes locales.
 */
export function normalizarFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) {
    return new Date(fecha.getTime())
  }
  if (typeof fecha === 'string') {
    // Si contiene formato YYYY-MM-DD (ej: "2026-10-25" o "2026-10-25T00:00:00.000Z")
    const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const year = Number(match[1])
      const month = Number(match[2])
      const day = Number(match[3])
      return new Date(year, month - 1, day, 12, 0, 0)
    }
  }
  return new Date(fecha)
}

/**
 * Retorna la fecha en formato YYYY-MM-DD según la zona horaria local.
 */
export function obtenerFechaLocalISO(
  fecha: string | Date = new Date()
): string {
  const d = normalizarFecha(fecha)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Formatea una fecha al estándar oficial dd/mm/aaaa (ej: 21/10/2026).
 */
export function formatearFechaDDMMAAAA(fecha: string | Date): string {
  const d = normalizarFecha(fecha)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Formatea una fecha de forma legible (ej: "Miércoles 21 de Octubre").
 */
export function formatearFechaLegible(fecha: string | Date): string {
  const d = normalizarFecha(fecha)
  if (Number.isNaN(d.getTime())) return ''
  const diaSemana = DIAS_SEMANA[d.getDay()]
  const diaMes = d.getDate()
  const mes = MESES[d.getMonth()]
  return `${diaSemana} ${diaMes} de ${mes}`
}

/**
 * Formatea una fecha completa incluyendo año (ej: "Miércoles 21 de Octubre de 2026").
 */
export function formatearFechaCompleta(fecha: string | Date): string {
  const d = normalizarFecha(fecha)
  if (Number.isNaN(d.getTime())) return ''
  return `${formatearFechaLegible(d)} de ${d.getFullYear()}`
}

/**
 * Obtiene el nombre del día en español (ej: "Lunes").
 */
export function obtenerNombreDia(fecha: string | Date): string {
  const d = normalizarFecha(fecha)
  return DIAS_SEMANA[d.getDay()] || ''
}

/**
 * Obtiene el nombre corto del día en español (ej: "Lun").
 */
export function obtenerNombreDiaCorto(fecha: string | Date): string {
  const d = normalizarFecha(fecha)
  return DIAS_SEMANA_CORTOS[d.getDay()] || ''
}

/**
 * Genera una lista de días a partir de una fecha de referencia para la navegación en la agenda.
 */
export interface DiaAgendaItem {
  fecha: Date
  fechaISO: string // YYYY-MM-DD
  diaNumero: number // 1..31
  diaSemanaNumero: number // 0..6
  nombreDia: string // "Lunes"
  nombreDiaCorto: string // "Lun"
  formatoDDMMAAAA: string // "21/10/2026"
  esHoy: boolean
}

export function generarDiasAgenda(
  fechaInicio: string | Date = new Date(),
  cantidadDias = 7
): DiaAgendaItem[] {
  const base = normalizarFecha(fechaInicio)
  const hoyISO = obtenerFechaLocalISO(new Date())
  const dias: DiaAgendaItem[] = []

  for (let i = 0; i < cantidadDias; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
    const fechaISO = obtenerFechaLocalISO(d)
    dias.push({
      fecha: d,
      fechaISO,
      diaNumero: d.getDate(),
      diaSemanaNumero: d.getDay(),
      nombreDia: DIAS_SEMANA[d.getDay()],
      nombreDiaCorto: DIAS_SEMANA_CORTOS[d.getDay()],
      formatoDDMMAAAA: formatearFechaDDMMAAAA(d),
      esHoy: fechaISO === hoyISO,
    })
  }

  return dias
}

/**
 * Compara dos horarios en formato HH:mm o HH:mm:ss para ordenamiento cronológico.
 * Retorna número negativo si a es anterior a b, positivo si posterior, 0 si iguales.
 */
export function compararHorarios(horarioA = '', horarioB = ''): number {
  return horarioA.localeCompare(horarioB)
}

/**
 * Convierte un array de índices de días (0=Dom..6=Sáb) a un texto legible (ej: "Lun, Mié, Vie").
 */
export function formatearDiasSemana(dias?: number[]): string {
  if (!dias || dias.length === 0) return ''
  if (dias.length === 7) return 'Todos los días'

  // Orden natural de semana laboral: Lun (1) a Dom (0)
  const ordenSemana = [1, 2, 3, 4, 5, 6, 0]
  const diasOrdenados = [...dias].sort(
    (a, b) => ordenSemana.indexOf(a) - ordenSemana.indexOf(b)
  )

  return diasOrdenados
    .map((d) => DIAS_SEMANA_CORTOS[d] || '')
    .filter(Boolean)
    .join(', ')
}

/**
 * Evalúa si una clase aplica para una fecha determinada según su fecha puntual o sus días de semana recurrentes.
 * @param criterio Objeto con fecha puntual opcional y/o array de días_semana (0=Dom..6=Sáb)
 * @param fecha Fecha a comparar (string YYYY-MM-DD o Date)
 */
export function coincideFechaClase(
  criterio: { fecha?: string | null; dias_semana?: number[] },
  fecha: string | Date
): boolean {
  const d = normalizarFecha(fecha)
  const fechaISO = obtenerFechaLocalISO(d)
  const diaSemana = d.getDay() // 0..6 (0=Domingo, 1=Lunes, ...)

  // Si tiene fecha específica asignada (evento o clase puntual)
  if (criterio.fecha) {
    const fechaClaseISO = obtenerFechaLocalISO(criterio.fecha)
    return fechaClaseISO === fechaISO
  }

  // Si tiene días de semana recurrentes configurados
  if (Array.isArray(criterio.dias_semana) && criterio.dias_semana.length > 0) {
    return criterio.dias_semana.includes(diaSemana)
  }

  // Si no tiene fecha puntual ni días de semana configurados (clase general / sin restricción)
  return true
}
