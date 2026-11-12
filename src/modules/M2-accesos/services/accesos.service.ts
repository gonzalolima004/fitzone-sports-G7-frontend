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

const OFFLINE_SECRET = import.meta.env.VITE_QR_TOKEN_SECRET

async function generarFirmaLocal(
  idUsuario: string,
  idCiudad: number,
  timestamp: number
): Promise<string> {
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

export const accesosService = {
  async obtenerQr(): Promise<QrResponseDto> {
    const authStore = useAuthStore()
    const userId = authStore.usuario?.id

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
        const usuarioLocal = authStore.usuario as {
          correo?: string
          id?: number
          estadoMembresia?: string
          enMora?: boolean
          ciudad?: number | string
        } | null
        const estado = (usuarioLocal?.estadoMembresia || '').toUpperCase()
        const idCiudadSocio = usuarioLocal?.ciudad

        if (!idCiudadSocio) {
          throw new Error(
            'No se puede generar el QR offline: El usuario no tiene asignada una ciudad válida.',
            { cause: error }
          )
        }

        const estaActiva = estado === 'ACTIVO' || estado === 'ACTIVA'
        const enMoraReal = estaActiva ? false : usuarioLocal?.enMora === true

        // Si no está activa o está realmente en mora, bloqueamos con su respectivo cause
        if (!estaActiva || enMoraReal) {
          throw new Error(
            'No se puede generar el código QR: El usuario no cuenta con una membresía activa o se encuentra en mora.',
            { cause: error }
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

  async registrarEgreso(data: RegistrarEgresoRequestDto): Promise<void> {
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
        let idUsuario: number | undefined = undefined
        if (data.qrToken) {
          const partes = data.qrToken.split('.')
          if (partes.length >= 1) {
            idUsuario = Number(partes[0])
          }
        }

        const colaOffline = JSON.parse(
          localStorage.getItem('fitzone_offline_queue') || '[]'
        ) as unknown[]

        colaOffline.push({
          tipo: 'EGRESO',
          data: {
            id_usuario: idUsuario,
            id_sede: data.id_sede,
          },
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(
          'fitzone_offline_queue',
          JSON.stringify(colaOffline)
        )
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
