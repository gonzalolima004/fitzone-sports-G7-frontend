import { z } from 'zod'

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/

type HorasDeApertura = { hora_apertura: string; hora_cierre: string }

/**
 * Valida las horas de un día en que la sede abre: las dos en formato HH:mm y
 * la apertura antes del cierre, como exige el backend. La usan el horario
 * semanal y las excepciones del calendario con horario especial.
 */
export function validarHorasDeApertura(
  datos: HorasDeApertura,
  ctx: z.RefinementCtx
): void {
  const aperturaValida = FORMATO_HORA.test(datos.hora_apertura)
  const cierreValido = FORMATO_HORA.test(datos.hora_cierre)
  if (!aperturaValida) {
    ctx.addIssue({
      code: 'custom',
      path: ['hora_apertura'],
      message: 'Indicá la hora de apertura.',
    })
  }
  if (!cierreValido) {
    ctx.addIssue({
      code: 'custom',
      path: ['hora_cierre'],
      message: 'Indicá la hora de cierre.',
    })
  }
  if (
    aperturaValida &&
    cierreValido &&
    datos.hora_apertura >= datos.hora_cierre
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['hora_cierre'],
      message: 'El cierre tiene que ser posterior a la apertura.',
    })
  }
}

/** Horas de un día abierto del horario semanal (CreateSedeHorarioDto). */
export const horarioDeAperturaSchema = z
  .object({ hora_apertura: z.string(), hora_cierre: z.string() })
  .superRefine(validarHorasDeApertura)
