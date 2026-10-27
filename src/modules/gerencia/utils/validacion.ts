import type { ZodError } from 'zod'

/**
 * Convierte los errores de Zod en un mapa campo → primer mensaje, para
 * mostrarlos debajo de cada input (prop `error` de BaseInput).
 */
export function erroresPorCampo(error: ZodError): Record<string, string> {
  const errores: Record<string, string> = {}

  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? '')
    if (campo && !errores[campo]) {
      errores[campo] = issue.message
    }
  }

  return errores
}
