import { z } from 'zod'

/** Precio máximo que admite la columna `precio` (DECIMAL(10, 2)). */
export const PRECIO_MAXIMO = 99_999_999.99

const tieneHastaDosDecimales = (valor: number) =>
  Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6

/**
 * Validación del formulario de planes de membresía, alineada con CrearPlanDto
 * (nombre obligatorio, duración de al menos 1 día y precio no negativo).
 * Además exige duración entera y precio con hasta 2 decimales, porque así se
 * guardan en la base.
 */
export const planSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Ingresá el nombre del plan.')
    .max(50, 'El nombre admite hasta 50 caracteres.'),
  duracion_dias: z.coerce
    .number({ error: 'Ingresá un número válido.' })
    .int('La duración debe ser un número entero de días.')
    .min(1, 'La duración debe ser de al menos 1 día.')
    .max(3650, 'La duración no puede superar los 10 años.'),
  precio: z.coerce
    .number({ error: 'Ingresá un número válido.' })
    .min(0, 'El precio no puede ser negativo.')
    .max(PRECIO_MAXIMO, 'El precio supera el máximo permitido.')
    .refine(tieneHastaDosDecimales, 'El precio admite hasta 2 decimales.'),
})

export type PlanValidado = z.infer<typeof planSchema>
