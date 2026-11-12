import type { ZodSchema, ZodError } from 'zod'

/**
 * Resultado estructurado y tipado de una validación con Zod
 */
export interface ValidacionResultado<T> {
  valido: boolean
  datos?: T
  errores: Record<string, string>
  primerError?: string
}

/**
 * Extrae los errores de un ZodError y genera un mapa campo -> mensaje de error para inputs de UI.
 * Conserva el primer mensaje de error para cada campo.
 */
export function extraerErroresZod(error: ZodError): Record<string, string> {
  const errores: Record<string, string> = {}

  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? '_global')
    if (campo && !errores[campo]) {
      errores[campo] = issue.message
    }
  }

  return errores
}

/**
 * Alias de compatibilidad para extraerErroresZod
 */
export const erroresPorCampo = extraerErroresZod

/**
 * Ejecuta la validación de datos arbitrarios contra un esquema Zod de forma segura y tipada.
 * Evita boilerplate de try/catch o safeParse repetitivo en los componentes.
 */
export function validarConEsquema<T>(
  schema: ZodSchema<T>,
  datos: unknown
): ValidacionResultado<T> {
  const resultado = schema.safeParse(datos)

  if (resultado.success) {
    return {
      valido: true,
      datos: resultado.data,
      errores: {},
    }
  }

  const errores = extraerErroresZod(resultado.error)
  const primerError = resultado.error.issues[0]?.message

  return {
    valido: false,
    errores,
    primerError,
  }
}
