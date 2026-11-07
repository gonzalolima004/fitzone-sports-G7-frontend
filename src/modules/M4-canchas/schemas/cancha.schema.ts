import { z } from 'zod'

/** Máximo valor admitido para costo_base (DECIMAL(10, 2) en base de datos) */
export const COSTO_BASE_MAXIMO = 99_999_999.99

/** Expresión regular para admitir solo letras (con tildes/ñ), números, espacios y guiones */
export const NOMBRE_CANCHA_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s-]+$/

/** Validador de hasta dos decimales para importes monetarios */
const tieneHastaDosDecimales = (valor: number): boolean =>
  Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6

/**
 * Esquema base para creación de canchas.
 * Valida que los datos cumplan estrictamente con las restricciones de la base de datos y backend:
 * - nombre: obligatorio, máx 50 caracteres, solo alfanuméricos, espacios y guiones.
 * - costo_base: positivo > 0, máx 2 decimales, tope $99.999.999,99.
 * - id_cancha_tipo e id_sede: enteros positivos obligatorios.
 * - disponible: booleano opcional con valor predeterminado true.
 */
export const crearCanchaSchema = z.object({
  nombre: z
    .string({ error: 'Ingresá el nombre de la cancha.' })
    .trim()
    .min(1, 'El nombre de la cancha es obligatorio.')
    .max(50, 'El nombre no puede superar los 50 caracteres.')
    .regex(
      NOMBRE_CANCHA_REGEX,
      'El nombre solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
    ),
  costo_base: z.coerce
    .number({ error: 'Ingresá un costo base válido.' })
    .positive('El costo base debe ser mayor a 0.')
    .max(
      COSTO_BASE_MAXIMO,
      'El costo base no puede superar los $99.999.999,99.'
    )
    .refine(tieneHastaDosDecimales, 'El costo base admite hasta 2 decimales.'),
  id_cancha_tipo: z.coerce
    .number({ error: 'Seleccioná una disciplina o tipo de cancha.' })
    .int('El tipo de cancha debe ser un número entero.')
    .positive('Seleccioná una disciplina o tipo de cancha.'),
  id_sede: z.coerce
    .number({ error: 'Seleccioná una sede válida.' })
    .int('La sede debe ser un número entero.')
    .positive('Seleccioná una sede válida.'),
  disponible: z.boolean().default(true),
})

/**
 * Esquema para edición de canchas: todos los campos son opcionales y se admite 'activo'.
 */
export const actualizarCanchaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la cancha no puede quedar vacío.')
    .max(50, 'El nombre no puede superar los 50 caracteres.')
    .regex(
      NOMBRE_CANCHA_REGEX,
      'El nombre solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
    )
    .optional(),
  costo_base: z.coerce
    .number({ error: 'Ingresá un costo base válido.' })
    .positive('El costo base debe ser mayor a 0.')
    .max(
      COSTO_BASE_MAXIMO,
      'El costo base no puede superar los $99.999.999,99.'
    )
    .refine(tieneHastaDosDecimales, 'El costo base admite hasta 2 decimales.')
    .optional(),
  id_cancha_tipo: z.coerce
    .number()
    .int('El tipo de cancha debe ser un número entero.')
    .positive('Seleccioná una disciplina o tipo de cancha válida.')
    .optional(),
  id_sede: z.coerce
    .number()
    .int('La sede debe ser un número entero.')
    .positive('Seleccioná una sede válida.')
    .optional(),
  disponible: z.boolean().optional(),
  activo: z.boolean().optional(),
})

/** Alias por defecto para el formulario de canchas */
export const canchaSchema = crearCanchaSchema

export type CrearCanchaFormValidado = z.infer<typeof crearCanchaSchema>
export type ActualizarCanchaFormValidado = z.infer<
  typeof actualizarCanchaSchema
>
export type CanchaFormValidado = CrearCanchaFormValidado
export type CanchaFormInput = z.input<typeof crearCanchaSchema>
