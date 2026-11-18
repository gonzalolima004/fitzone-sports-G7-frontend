import axios from 'axios'

type CuerpoDeError = { message?: unknown }

/**
 * Obtiene un mensaje legible a partir de un error de Axios.
 * Prioriza el mensaje del servidor (por ejemplo, el de ValidationPipe o el de
 * una regla de negocio) y usa `mensajePorDefecto` para errores de red o
 * errores internos (5xx), cuyo texto no le sirve al usuario.
 */
export function obtenerMensajeDeError(
  error: unknown,
  mensajePorDefecto: string
): string {
  if (!axios.isAxiosError<CuerpoDeError>(error) || !error.response) {
    return mensajePorDefecto
  }

  const { status, data } = error.response

  if (status >= 500) {
    return mensajePorDefecto
  }

  const mensaje = data?.message
  if (Array.isArray(mensaje)) {
    return mensaje.map(String).join(' ')
  }
  if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    return mensaje
  }

  if (status === 401) {
    return 'Tu sesión expiró. Volvé a iniciar sesión.'
  }
  if (status === 403) {
    return 'No tenés permisos para realizar esta acción.'
  }

  return mensajePorDefecto
}
