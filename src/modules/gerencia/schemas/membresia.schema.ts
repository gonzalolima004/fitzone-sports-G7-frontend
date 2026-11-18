import { z } from 'zod'

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/

/** Fecha YYYY-MM-DD válida (la que devuelve un input de tipo date). */
const fecha = (mensaje: string) =>
  z
    .string()
    .trim()
    .regex(FECHA_ISO, mensaje)
    .refine(
      (valor) => !Number.isNaN(new Date(`${valor}T00:00:00Z`).getTime()),
      mensaje
    )

/**
 * Alta de una membresía desde el panel, alineada con CreateMembresiaDto:
 * socio, plan y fecha de inicio obligatorios. El vencimiento lo calcula el
 * backend según la duración del plan.
 */
export const membresiaAltaSchema = z.object({
  id_usuario: z.coerce
    .number({ error: 'Elegí un socio.' })
    .int('Elegí un socio.')
    .positive('Elegí un socio.'),
  id_membresia_plan: z.coerce
    .number({ error: 'Elegí un plan.' })
    .int('Elegí un plan.')
    .positive('Elegí un plan.'),
  fecha_inicio: fecha('Ingresá una fecha de inicio válida.'),
  renovacion_automatica: z.boolean(),
})

/**
 * Edición de una membresía: estado (tabla membresia_estado), vencimiento y
 * renovación automática. El vencimiento no puede ser anterior al inicio,
 * igual que valida el backend.
 */
export function crearMembresiaEdicionSchema(fechaInicio: string) {
  return z.object({
    id_membresia_estado: z.coerce
      .number({ error: 'Elegí un estado.' })
      .int('Elegí un estado.')
      .positive('Elegí un estado.'),
    fecha_fin: fecha('Ingresá una fecha de vencimiento válida.').refine(
      (valor) => valor >= fechaInicio,
      'El vencimiento no puede ser anterior al inicio de la membresía.'
    ),
    renovacion_automatica: z.boolean(),
  })
}

export type MembresiaAltaValidada = z.infer<typeof membresiaAltaSchema>
