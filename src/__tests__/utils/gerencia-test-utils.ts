import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

/** Error HTTP con la misma forma que devuelve Axios ante una respuesta 4xx/5xx. */
export function errorHttp(status: number, message: string): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response: AxiosResponse = {
    status,
    statusText: '',
    headers: {},
    config,
    data: { message, statusCode: status },
  }
  return new AxiosError(message, 'ERR_BAD_REQUEST', config, null, response)
}

/** Busca un botón por su texto visible (o su aria-label). */
export function boton(
  wrapper: VueWrapper,
  texto: string
): DOMWrapper<HTMLButtonElement> {
  const encontrado = wrapper
    .findAll('button')
    .find(
      (candidato) =>
        candidato.text().includes(texto) ||
        candidato.attributes('aria-label') === texto
    )
  if (!encontrado) {
    throw new Error(`No se encontró el botón "${texto}"`)
  }
  return encontrado
}
