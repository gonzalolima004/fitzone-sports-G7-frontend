import { z } from 'zod'
import { validarHorasDeApertura } from './horarios.schema'

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/

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
    if (datos.tipo === 'horario') validarHorasDeApertura(datos, ctx)
  })

export type FeriadoValidado = z.infer<typeof feriadoSchema>
export type ExcepcionValidada = z.infer<typeof excepcionSchema>
