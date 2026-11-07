import { z } from 'zod'

/**
 * Esquema de validación con Zod para la Creación de Mantenimientos.
 * Restricciones del backend y base de datos:
 * - id_cancha: entero positivo obligatorio.
 * - fecha_inicio: string ISO 8601 obligatorio.
 * - fecha_fin: string ISO 8601 obligatorio.
 * - Validación cruzada: fecha_fin debe ser posterior a fecha_inicio.
 * - motivo: string opcional, máximo 255 caracteres.
 */
export const crearMantenimientoSchema = z
  .object({
    id_cancha: z.coerce
      .number({ error: 'Debes seleccionar una cancha válida.' })
      .int('La cancha debe ser un número entero.')
      .positive('Debes seleccionar una cancha válida.'),
    fecha_inicio: z
      .string({ error: 'Ingresá la fecha y hora de inicio.' })
      .trim()
      .min(1, 'Ingresá la fecha y hora de inicio.')
      .refine(
        (f) => !isNaN(new Date(f).getTime()),
        'La fecha de inicio no es válida.'
      ),
    fecha_fin: z
      .string({ error: 'Ingresá la fecha y hora de fin.' })
      .trim()
      .min(1, 'Ingresá la fecha y hora de fin.')
      .refine(
        (f) => !isNaN(new Date(f).getTime()),
        'La fecha de fin no es válida.'
      ),
    motivo: z
      .string()
      .trim()
      .max(255, 'El motivo no puede superar los 255 caracteres.')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (datos) => {
      const inicio = new Date(datos.fecha_inicio).getTime()
      const fin = new Date(datos.fecha_fin).getTime()
      return !isNaN(inicio) && !isNaN(fin) && fin > inicio
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
      path: ['fecha_fin'],
    }
  )

/**
 * Esquema de validación con Zod para la Edición de Mantenimientos.
 * Todos los campos son opcionales y se realiza validación cruzada si ambas fechas están presentes.
 */
export const actualizarMantenimientoSchema = z
  .object({
    id_cancha: z.coerce
      .number()
      .int('La cancha debe ser un número entero.')
      .positive('Debes seleccionar una cancha válida.')
      .optional(),
    fecha_inicio: z
      .string()
      .trim()
      .min(1, 'Ingresá la fecha y hora de inicio.')
      .refine(
        (f) => !isNaN(new Date(f).getTime()),
        'La fecha de inicio no es válida.'
      )
      .optional(),
    fecha_fin: z
      .string()
      .trim()
      .min(1, 'Ingresá la fecha y hora de fin.')
      .refine(
        (f) => !isNaN(new Date(f).getTime()),
        'La fecha de fin no es válida.'
      )
      .optional(),
    motivo: z
      .string()
      .trim()
      .max(255, 'El motivo no puede superar los 255 caracteres.')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (datos) => {
      if (datos.fecha_inicio && datos.fecha_fin) {
        const inicio = new Date(datos.fecha_inicio).getTime()
        const fin = new Date(datos.fecha_fin).getTime()
        return !isNaN(inicio) && !isNaN(fin) && fin > inicio
      }
      return true
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
      path: ['fecha_fin'],
    }
  )

/** Alias principal para compatibilidad */
export const mantenimientoSchema = crearMantenimientoSchema

export type CrearMantenimientoFormValidado = z.infer<
  typeof crearMantenimientoSchema
>
export type ActualizarMantenimientoFormValidado = z.infer<
  typeof actualizarMantenimientoSchema
>
export type MantenimientoFormValidado = CrearMantenimientoFormValidado
export type MantenimientoFormInput = z.input<typeof crearMantenimientoSchema>
