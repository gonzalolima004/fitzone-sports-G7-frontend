import { z } from 'zod'

/** Expresión regular para admitir solo letras (con tildes/ñ), números, espacios y guiones */
export const DESCRIPCION_TIPO_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s-]+$/

/**
 * Esquema de validación con Zod para la creación de Tipos de Cancha.
 * Restricciones del backend y base de datos:
 * - descripcion: string obligatorio, máximo 50 caracteres, solo letras, números, espacios y guiones.
 * - activo: booleano opcional (default true).
 */
export const crearCanchaTipoSchema = z.object({
  descripcion: z
    .string({ error: 'Ingresá el nombre o descripción del tipo de cancha.' })
    .trim()
    .min(1, 'La descripción del tipo de cancha es obligatoria.')
    .max(50, 'La descripción no puede superar los 50 caracteres.')
    .regex(
      DESCRIPCION_TIPO_REGEX,
      'La descripción solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
    ),
  activo: z.boolean().default(true),
})

/**
 * Esquema de validación con Zod para la edición de Tipos de Cancha.
 * En edición 'descripcion' y 'activo' son opcionales.
 */
export const actualizarCanchaTipoSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, 'La descripción no puede quedar vacía.')
    .max(50, 'La descripción no puede superar los 50 caracteres.')
    .regex(
      DESCRIPCION_TIPO_REGEX,
      'La descripción solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
    )
    .optional(),
  activo: z.boolean().optional(),
})

/** Alias principal para compatibilidad */
export const canchaTipoSchema = crearCanchaTipoSchema

export type CrearCanchaTipoValidado = z.infer<typeof crearCanchaTipoSchema>
export type ActualizarCanchaTipoValidado = z.infer<
  typeof actualizarCanchaTipoSchema
>
export type CanchaTipoValidado = CrearCanchaTipoValidado
export type CanchaTipoInput = z.input<typeof crearCanchaTipoSchema>
