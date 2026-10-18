import http from '@/common/api/http'
import type {
  BackendQrResponseDto,
  QrResponseDto,
  SocioPerfilDto,
  ValidarAccesoRequestDto,
  ValidarAccesoResponseDto,
  AforoResponseDto,
} from '../types/accesos.types'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/common/api/supabase'


export const accesosService = {
  async obtenerQr(): Promise<QrResponseDto> {
    const authStore = useAuthStore()
    const userId = authStore.usuario?.id ?? 7 // Obtiene el ID real del usuario con fallback a 7

    const response = await http.get<BackendQrResponseDto>(
      '/access/qr/generate',
      {
        params: { id_usuario: userId },
      }
    )

    const data = response.data

    const tokenValido = String(data.token ?? '')
    const validSeconds = Number(data.expiraEnSegundos) || 60

    const generatedDate = data.fechaGeneracion
      ? new Date(data.fechaGeneracion)
      : new Date()

    const expiresAt = new Date(
      generatedDate.getTime() + validSeconds * 1000
    ).toISOString()

    return {
      token: tokenValido,
      validSeconds,
      expiresAt,
    }
  },

  async obtenerPerfilSocio(usuarioId: number): Promise<SocioPerfilDto> {
    const response = await http.get<SocioPerfilDto>(`/usuarios/${usuarioId}`)
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

  async registrarEgreso(data: {
    qrToken: string
    id_sede: number
  }): Promise<void> {
    await http.post('/accesos/registrar-egreso', data)
  },

  async obtenerAforo(idSede: number): Promise<AforoResponseDto> {
    const response = await http.get<AforoResponseDto>(
      `/accesos/aforo/${idSede}`
    )
    return response.data
  },

  /**
   * Suscribe en tiempo real a Supabase Broadcast para cambios en el aforo de una sede
   */
  suscribirCambiosAforo(
    idSede: number,
    onCambio: (payload: AforoResponseDto) => void,
    onStatusChange?: (status: string) => void
  ): () => void {
    const channelName = `aforo:sede:${idSede}`
    console.log('[Supabase entrando a suscribirse al canal]: ', channelName)
    const channel = supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'aforo_actualizado' }, // Asegurate que coincida con el nombre del evento que emite el backend (o ajustalo si usan otro)
        (payload: { payload: AforoResponseDto }) => {
          console.log('[Supabase Realtime Broadcast] Datos recibidos:', payload)
          // El backend suele enviar los datos dentro de la propiedad payload o directamente
          const newData = (payload.payload || payload) as AforoResponseDto
          onCambio(newData)
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Broadcast Status]:', status)
        if (onStatusChange) {
          onStatusChange(status)
        }
      })

    // Retorna la función de limpieza (cleanup)
    return () => {
      supabase.removeChannel(channel)
    }
  },
}
