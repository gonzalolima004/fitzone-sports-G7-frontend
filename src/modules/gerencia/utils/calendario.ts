import type { ExcepcionSede, FechaCalendario } from '../types/gerencia.types'

/** Encabezados de la grilla: la semana empieza el lunes. */
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const NOMBRES_DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
]

export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Día de la grilla mensual. `diaSemana` va de 0 (domingo) a 6 (sábado). */
export interface DiaCalendario {
  fecha: string
  dia: number
  diaSemana: number
}

/** "YYYY-MM-DD" a partir de año, mes (1 a 12) y día, sin zonas horarias. */
export function aFechaISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate()
}

/** Primer y último día del mes, en formato YYYY-MM-DD. */
export function rangoDelMes(
  anio: number,
  mes: number
): { desde: string; hasta: string } {
  return {
    desde: aFechaISO(anio, mes, 1),
    hasta: aFechaISO(anio, mes, diasDelMes(anio, mes)),
  }
}

/** Mes anterior (-1) o siguiente (+1). */
export function moverMes(
  anio: number,
  mes: number,
  delta: number
): { anio: number; mes: number } {
  const indice = anio * 12 + (mes - 1) + delta
  return { anio: Math.floor(indice / 12), mes: (indice % 12) + 1 }
}

/**
 * Semanas del mes de lunes a domingo, con null en los huecos antes del día 1
 * y después del último día.
 */
export function semanasDelMes(
  anio: number,
  mes: number
): (DiaCalendario | null)[][] {
  const primerDia = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay()
  const celdas: (DiaCalendario | null)[] = Array.from(
    { length: (primerDia + 6) % 7 },
    () => null
  )

  for (let dia = 1; dia <= diasDelMes(anio, mes); dia++) {
    celdas.push({
      fecha: aFechaISO(anio, mes, dia),
      dia,
      diaSemana: (primerDia + dia - 1) % 7,
    })
  }
  while (celdas.length % 7 !== 0) {
    celdas.push(null)
  }

  const semanas: (DiaCalendario | null)[][] = []
  for (let inicio = 0; inicio < celdas.length; inicio += 7) {
    semanas.push(celdas.slice(inicio, inicio + 7))
  }
  return semanas
}

/** Ej.: "2026-12-25" → "viernes 25 de diciembre". */
export function describirFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return `${NOMBRES_DIAS[diaSemana]} ${dia} de ${MESES[mes - 1]}`
}

/**
 * True si la fecha del calendario general tiene algo que mostrar: es feriado,
 * no es hábil o tiene descripción. Las demás son días comunes que el backend
 * agrega solo para colgar la excepción de alguna sede.
 */
export function esFechaDestacada(fecha: FechaCalendario): boolean {
  return (
    fecha.es_feriado ||
    !fecha.es_dia_habil ||
    Boolean(fecha.descripcion?.trim())
  )
}

/** Ej.: "Feriado", "Día no hábil" o "Fecha especial". */
export function describirTipoFecha(fecha: FechaCalendario): string {
  if (fecha.es_feriado) return 'Feriado'
  if (!fecha.es_dia_habil) return 'Día no hábil'
  return 'Fecha especial'
}

/** Ej.: "Cerrada todo el día" o "Abre de 10:00 a 14:00". */
export function describirExcepcion(excepcion: ExcepcionSede): string {
  return excepcion.cerrado
    ? 'Cerrada todo el día'
    : `Abre de ${excepcion.hora_apertura} a ${excepcion.hora_cierre}`
}
