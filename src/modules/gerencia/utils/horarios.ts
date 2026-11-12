import type {
  HorarioSemanal,
  HorarioSemanalPayload,
} from '../types/gerencia.types'

/** Días de lunes a domingo con el número que usa el backend (0 domingo … 6 sábado). */
export const DIAS_DE_LA_SEMANA = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 0, nombre: 'Domingo' },
] as const

/** Qué pasa con la sede ese día: abre, no abre o todavía no tiene horario. */
export type AtencionDelDia = 'abre' | 'cerrada' | 'sin-horario'

/** Un día del editor: lo guardado en el backend y lo que se está editando. */
export interface DiaEditable {
  dia: number
  nombre: string
  guardado: HorarioSemanal | null
  atencion: AtencionDelDia
  hora_apertura: string
  hora_cierre: string
}

/** Pedido al backend para guardar un día. */
export type OperacionHorario =
  | { tipo: 'crear'; datos: HorarioSemanalPayload }
  | {
      tipo: 'actualizar'
      idHorario: number
      datos: Omit<HorarioSemanalPayload, 'dia_semana'>
    }
  | { tipo: 'quitar'; idHorario: number }

/** Día del editor tal como está guardado (sin cambios). */
export function diaDesdeGuardado(
  dia: number,
  nombre: string,
  guardado: HorarioSemanal | null
): DiaEditable {
  if (guardado === null) {
    return {
      dia,
      nombre,
      guardado,
      atencion: 'sin-horario',
      hora_apertura: '',
      hora_cierre: '',
    }
  }
  return guardado.abierto
    ? {
        dia,
        nombre,
        guardado,
        atencion: 'abre',
        hora_apertura: guardado.hora_apertura,
        hora_cierre: guardado.hora_cierre,
      }
    : {
        dia,
        nombre,
        guardado,
        atencion: 'cerrada',
        hora_apertura: '',
        hora_cierre: '',
      }
}

/** Semana completa de lunes a domingo a partir de los días guardados. */
export function armarSemana(horarios: HorarioSemanal[]): DiaEditable[] {
  const porDia = new Map(
    horarios.map((horario) => [horario.dia_semana, horario] as const)
  )
  return DIAS_DE_LA_SEMANA.map(({ numero, nombre }) =>
    diaDesdeGuardado(numero, nombre, porDia.get(numero) ?? null)
  )
}

function datosDe(dia: DiaEditable): Omit<HorarioSemanalPayload, 'dia_semana'> {
  return dia.atencion === 'abre'
    ? {
        abierto: true,
        hora_apertura: dia.hora_apertura,
        hora_cierre: dia.hora_cierre,
      }
    : { abierto: false }
}

/**
 * Pedido que guarda los cambios del día: crear si no tenía horario, quitar si
 * se lo sacaron y actualizar si cambió. Null si no hay cambios.
 */
export function operacionDe(dia: DiaEditable): OperacionHorario | null {
  const { guardado } = dia
  if (guardado === null) {
    return dia.atencion === 'sin-horario'
      ? null
      : { tipo: 'crear', datos: { dia_semana: dia.dia, ...datosDe(dia) } }
  }
  if (dia.atencion === 'sin-horario') {
    return { tipo: 'quitar', idHorario: guardado.id_sede_horario }
  }

  const igualQueGuardado =
    dia.atencion === 'cerrada'
      ? !guardado.abierto
      : guardado.abierto &&
        guardado.hora_apertura === dia.hora_apertura &&
        guardado.hora_cierre === dia.hora_cierre
  return igualQueGuardado
    ? null
    : {
        tipo: 'actualizar',
        idHorario: guardado.id_sede_horario,
        datos: datosDe(dia),
      }
}
