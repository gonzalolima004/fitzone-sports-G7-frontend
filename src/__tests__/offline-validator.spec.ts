import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OfflineValidator } from '@/modules/M2-accesos/services/offline-validator'

async function generarFirmaRealParaTest(
  mensaje: string,
  secret: string
): Promise<string> {
  const enc = new TextEncoder()
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  )
  const sig = await window.crypto.subtle.sign('HMAC', key, enc.encode(mensaje))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16)
}

describe('OfflineValidator (M2-accesos)', () => {
  const SECRET_TEST = 'fitzone-secret-key-2026'
  const NOW_MS = new Date('2026-11-18T19:00:00Z').getTime()
  const NOW_SEC = Math.floor(NOW_MS / 1000)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW_MS)

    vi.stubGlobal('window', {
      crypto: globalThis.crypto,
    })

    Object.defineProperty(OfflineValidator, 'OFFLINE_SECRET', {
      value: SECRET_TEST,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('rechaza tokens que no tienen exactamente 4 segmentos separados por punto', async () => {
    const res = await OfflineValidator.validarTokenLocal('123.1.1700000000', 1)

    expect(res).toEqual({
      valido: false,
      mensaje: 'Formato de token QR inválido',
    })
  })

  it('deniega acceso si la ciudad del socio no coincide con la ciudad de la sede', async () => {
    const token = `42.2.${NOW_SEC}.abcdef1234567890`
    const res = await OfflineValidator.validarTokenLocal(token, 1)

    expect(res.valido).toBe(false)
    expect(res.mensaje).toContain('solo es válida para sedes de la ciudad de 2')
  })

  it.each([
    ['expirado hace más de 65s', NOW_SEC - 66],
    ['timestamp futuro (negativo)', NOW_SEC + 5],
    ['timestamp no numérico', NaN],
  ])('rechaza token por ventana de tiempo inválida (%s)', async (_, ts) => {
    const token = `42.1.${ts}.abcdef1234567890`
    const res = await OfflineValidator.validarTokenLocal(token, 1)

    expect(res).toEqual({
      valido: false,
      mensaje: 'El código QR ha expirado',
    })
  })

  it('informa error de configuración si falta OFFLINE_SECRET', async () => {
    Object.defineProperty(OfflineValidator, 'OFFLINE_SECRET', {
      value: '',
      configurable: true,
    })
    const token = `42.1.${NOW_SEC}.abcdef1234567890`

    const res = await OfflineValidator.validarTokenLocal(token, 1)

    expect(res.valido).toBe(false)
    expect(res.mensaje).toContain('Falta configurar VITE_QR_OFFLINE_SECRET')
  })

  it('rechaza un token cuya firma HMAC fue alterada', async () => {
    // Si la firma es inválida de formato/longitud o alterada, la clase captura el error en el try/catch general
    const token = `42.1.${NOW_SEC}.0000000000000000`
    const res = await OfflineValidator.validarTokenLocal(token, 1)

    expect(res.valido).toBe(false)
    expect([
      'Código QR inválido o alterado',
      'Error al procesar la validación offline',
    ]).toContain(res.mensaje)
  })

  it('valida correctamente un token auténtico dentro de la ventana de 65s', async () => {
    const tsValido = NOW_SEC - 64
    const firma = await generarFirmaRealParaTest(
      `42:1:${tsValido}`,
      SECRET_TEST
    )
    const token = `42.1.${tsValido}.${firma}`

    const res = await OfflineValidator.validarTokenLocal(token, 1)

    expect(res).toEqual({
      valido: true,
      userId: '42',
    })
  })
})
