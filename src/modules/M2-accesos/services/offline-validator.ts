export class OfflineValidator {
  private static readonly OFFLINE_SECRET = import.meta.env
    .VITE_QR_OFFLINE_SECRET
  private static readonly EXPIRATION_SECONDS = 60

  /**
   * Calcula el HMAC-SHA256 usando la API nativa del navegador (Web Crypto API)
   */
  private static async calcularHmac(
    message: string,
    secret: string
  ): Promise<string> {
    const enc = new TextEncoder()
    const keyData = enc.encode(secret)
    const messageData = enc.encode(message)

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    )

    const signatureBuffer = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    )

    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return hashHex.substring(0, 16)
  }

  public static async validarTokenLocal(
    token: string,
    idCiudadSedeActual: number
  ): Promise<{ valido: boolean; userId?: string; mensaje?: string }> {
    try {
      const partes = token.split('.')
      if (partes.length !== 4) {
        return { valido: false, mensaje: 'Formato de token QR inválido' }
      }

      const [userIdToken, idCiudadTokenStr, timestampStr, signatureToken] =
        partes
      const idCiudadToken = Number(idCiudadTokenStr)

      // RESTRICCIÓN GEOGRÁFICA OFFLINE: Validar que la ciudad del QR coincida con la ciudad de la sede actual
      if (idCiudadToken !== idCiudadSedeActual) {
        return {
          valido: false,
          mensaje: `Acceso denegado: Su membresía solo es válida para sedes de la ciudad de ${idCiudadToken}.`,
        }
      }
      const tokenTimestamp = parseInt(timestampStr, 10)
      const currentTimestamp = Math.floor(Date.now() / 1000)

      const segundosTranscurridos = currentTimestamp - tokenTimestamp

      // Validar ventana de tiempo (60 segundos + 5s de tolerancia)
      if (
        isNaN(tokenTimestamp) ||
        segundosTranscurridos < 0 ||
        segundosTranscurridos > this.EXPIRATION_SECONDS + 5
      ) {
        return { valido: false, mensaje: 'El código QR ha expirado' }
      }

      // Reconstruir la firma HMAC SHA-256 idéntica al backend
      const mensajeAFirmar = `${userIdToken}:${idCiudadTokenStr}:${tokenTimestamp}`
      const signatureEsperada = await this.calcularHmac(
        mensajeAFirmar,
        this.OFFLINE_SECRET
      )

      if (signatureToken !== signatureEsperada) {
        return { valido: false, mensaje: 'Código QR inválido o alterado' }
      }

      return { valido: true, userId: userIdToken }
    } catch {
      return {
        valido: false,
        mensaje: 'Error al procesar la validación offline',
      }
    }
  }
}
