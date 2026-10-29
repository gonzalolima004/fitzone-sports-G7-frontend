import http from '@/common/api/http'
import type {
  BackendQrResponseDto,
  QrResponseDto,
  SocioPerfilDto,
  ValidarAccesoRequestDto,
  RegistrarEgresoRequestDto, // <-- Importar el tipo de egreso
  ValidarAccesoResponseDto,
  AforoResponseDto,
} from '../types/accesos.types'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/common/utils/supabase'

export const accesosService = {
  async obtenerQr(): Promise<QrResponseDto> {
    const authStore = useAuthStore()
    const userId = authStore.usuario?.id

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

  // Actualizado para aceptar QR o DNI mediante la unión de tipos
  async registrarEgreso(data: RegistrarEgresoRequestDto): Promise<void> {
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
    const channel = supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'aforo_actualizado' },
        (payload: { payload: AforoResponseDto }) => {
          console.log('[Supabase Realtime Broadcast] Datos recibidos:', payload)
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

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
