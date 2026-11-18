import http from '@/common/api/http'
import type {
  BackendQrResponseDto,
  QrResponseDto,
  SocioPerfilDto,
  ValidarAccesoRequestDto,
  RegistrarEgresoRequestDto,
  ValidarAccesoResponseDto,
  AforoResponseDto,
} from '../types/accesos.types'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/common/utils/supabase'

const OFFLINE_SECRET =
  (import.meta.env.VITE_QR_TOKEN_SECRET as string | undefined) ||
  (import.meta.env.VITE_QR_OFFLINE_SECRET as string | undefined) ||
  ''

async function generarFirmaLocal(
  idUsuario: string,
  idCiudad: number,
  timestamp: number
): Promise<string> {
  if (!OFFLINE_SECRET) {
    throw new Error(
      'No se puede generar el QR offline: Falta configurar VITE_QR_TOKEN_SECRET en el entorno.'
    )
  }

  const enc = new TextEncoder()
  const keyData = enc.encode(OFFLINE_SECRET)
  const messageData = enc.encode(`${idUsuario}:${idCiudad}:${timestamp}`)

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
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16)
}

async function generarQrOffline(cause?: unknown): Promise<QrResponseDto> {
  const authStore = useAuthStore()
  const usuarioLocal = authStore.usuario as {
    id?: number
    estadoMembresia?: string
    enMora?: boolean
    id_ciudad?: number | string
    ciudad?: number | string
    sede?: { id_ciudad?: number }
  } | null

  const userId = usuarioLocal?.id
  if (!userId) {
    throw new Error(
      'No se puede generar el QR offline: No hay un usuario autenticado en caché local.',
      cause ? { cause } : undefined
    )
  }

  const estado = (usuarioLocal?.estadoMembresia || '').toUpperCase()
  const idCiudadSocio =
    usuarioLocal?.id_ciudad ??
    usuarioLocal?.sede?.id_ciudad ??
    usuarioLocal?.ciudad

  if (!idCiudadSocio) {
    throw new Error(
      'No se puede generar el QR offline: El usuario no tiene asignada una ciudad válida.',
      cause ? { cause } : undefined
    )
  }

  const estaActiva = estado === 'ACTIVO' || estado === 'ACTIVA'
  const enMoraReal = estaActiva ? false : usuarioLocal?.enMora === true

  if (!estaActiva || enMoraReal) {
    throw new Error(
      'No se puede generar el código QR: El usuario no cuenta con una membresía activa o se encuentra en mora.',
      cause ? { cause } : undefined
    )
  }

  const validSeconds = 60
  const generatedDate = new Date()
  const timestamp = Math.floor(generatedDate.getTime() / 1000)

  const signature = await generarFirmaLocal(
    String(userId),
    Number(idCiudadSocio),
    timestamp
  )
  const tokenValido = `${userId}.${idCiudadSocio}.${timestamp}.${signature}`
  const expiresAt = new Date(
    generatedDate.getTime() + validSeconds * 1000
  ).toISOString()

  return {
    token: tokenValido,
    validSeconds,
    expiresAt,
  }
}

export const accesosService = {
  async obtenerQr(): Promise<QrResponseDto> {
    const authStore = useAuthStore()
    const userId = authStore.usuario?.id

    // Si el navegador reporta estar offline, generamos el QR local sin lanzar request fallido
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return await generarQrOffline()
    }

    try {
      // 1. Intento principal contra el backend online
      const response = await http.get<BackendQrResponseDto>(
        '/access/qr/generate',
        {
          params: { id_usuario: userId },
        }
      )

      const data = response.data
      const validSeconds = Number(data.expiraEnSegundos) || 60
      const generatedDate = data.fechaGeneracion
        ? new Date(data.fechaGeneracion)
        : new Date()
      const expiresAt = new Date(
        generatedDate.getTime() + validSeconds * 1000
      ).toISOString()

      return {
        token: String(data.token),
        validSeconds,
        expiresAt,
      }
    } catch (error: unknown) {
      const err = error as {
        response?: unknown
        code?: string
        message?: string
      }
      // 2. Si no hay red, evaluamos el estado del socio de forma estricta
      if (
        !err.response ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error')
      ) {
        return await generarQrOffline(error)
      }

      throw error
    }
  },

  async obtenerPerfilSocio(usuarioId: number): Promise<SocioPerfilDto> {
    const response = await http.get<SocioPerfilDto>(
      `/accesos/perfil/${usuarioId}`
    )
    return response.data
  },

  async validarAcceso(
    data: ValidarAccesoRequestDto
  ): Promise<ValidarAccesoResponseDto> {
    const response = await http.post<ValidarAccesoResponseDto>(
      '/accesos/validar-ingreso',
      data
    )
    return response.data
  },

  encolarAccesoOffline(
    tipo: 'INGRESO' | 'EGRESO',
    idUsuario: number | undefined,
    idSede: number | undefined
  ): void {
    if (idSede == null) return
    const colaOffline = JSON.parse(
      localStorage.getItem('fitzone_offline_queue') || '[]'
    ) as unknown[]

    colaOffline.push({
      tipo,
      data: {
        id_usuario: idUsuario,
        id_sede: idSede,
      },
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem('fitzone_offline_queue', JSON.stringify(colaOffline))
  },

  async registrarEgreso(data: RegistrarEgresoRequestDto): Promise<void> {
    const extraerIdUsuario = (): number | undefined => {
      if (!data.qrToken) return undefined
      const partes = data.qrToken.split('.')
      return partes.length >= 1 ? Number(partes[0]) : undefined
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine && data.qrToken) {
      this.encolarAccesoOffline('EGRESO', extraerIdUsuario(), data.id_sede)
      return
    }

    try {
      await http.post('/accesos/registrar-egreso', data)
    } catch (error: unknown) {
      const err = error as {
        response?: unknown
        code?: string
        message?: string
      }
      if (
        !err.response ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error')
      ) {
        this.encolarAccesoOffline('EGRESO', extraerIdUsuario(), data.id_sede)
        return
      }
      throw error
    }
  },

  async obtenerAforo(idSede: number): Promise<AforoResponseDto> {
    const response = await http.get<AforoResponseDto>(
      `/accesos/aforo/${idSede}`
    )
    return response.data
  },

  suscribirCambiosAforo(
    idSede: number,
    onCambio: (payload: AforoResponseDto) => void,
    onStatusChange?: (status: string) => void
  ): () => void {
    const channelName = `aforo:sede:${idSede}`
    const channel = supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'aforo_actualizado' },
        (payload: { payload: AforoResponseDto }) => {
          const newData = (payload.payload || payload) as AforoResponseDto
          onCambio(newData)
        }
      )
      .subscribe((status) => {
        if (onStatusChange) {
          onStatusChange(status)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
