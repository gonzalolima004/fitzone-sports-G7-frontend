import { z } from 'zod'

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/

const esFechaReal = (valor: string) => {
  const fecha = new Date(`${valor}T00:00:00.000Z`)
  return (
    !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
  )
}

const campoFecha = z
  .string()
  .trim()
  .min(1, 'Elegí una fecha.')
  .regex(FORMATO_FECHA, 'La fecha debe tener formato AAAA-MM-DD.')
  .refine(esFechaReal, 'La fecha no existe.')

/**
 * Fecha del calendario general (feriado o fecha de toda la cadena), alineada
 * con CreateCalendarioDto. La descripción es obligatoria: una fecha sin
 * nombre, hábil y no feriado no se muestra en el calendario.
 */
export const feriadoSchema = z.object({
  fecha: campoFecha,
  descripcion: z
    .string()
    .trim()
    .min(1, 'Ingresá el nombre del feriado o de la fecha.')
    .max(100, 'La descripción admite hasta 100 caracteres.'),
  es_feriado: z.boolean(),
  es_dia_habil: z.boolean(),
})

/**
 * Excepción de una sede para una fecha, alineada con CreateCalendarioSedeDto:
 * cierre de todo el día u horario especial, que exige las dos horas y que la
 * apertura sea anterior al cierre.
 */
export const excepcionSchema = z
  .object({
    fecha: campoFecha,
    tipo: z.enum(['cierre', 'horario']),
    hora_apertura: z.string(),
    hora_cierre: z.string(),
    motivo: z
      .string()
      .trim()
      .max(255, 'El motivo admite hasta 255 caracteres.'),
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo !== 'horario') return

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
  })

export type FeriadoValidado = z.infer<typeof feriadoSchema>
export type ExcepcionValidada = z.infer<typeof excepcionSchema>
