export type TipoOperacion = 'ingreso' | 'egreso'

export interface ValidarAccesoRequestDto {
  readonly qrToken: string
  readonly id_sede: number
}

export interface ValidarAccesoResponseDto {
  readonly exito: boolean
  readonly mensaje: string
  readonly socio?: {
    readonly id: number
    readonly nombre: string
    readonly apellido: string
    readonly dni: string
    readonly email?: string
  }
  readonly motivoRechazo?:
    | 'QR_VENCIDO'
    | 'MEMBRESIA_INVALIDA'
    | 'SEDE_LLENA'
    | 'DOBLE_INGRESO'
    | 'OTRO'
}

export interface BackendQrResponseDto {
  readonly token: string
  readonly expiraEnSegundos: number
  readonly fechaGeneracion?: string
}

export interface QrResponseDto {
  readonly expiresAt: string
  readonly validSeconds: number
  readonly token: string
}

export interface ApiErrorDto {
  readonly type: string
  readonly title: string
  readonly status: number
  readonly detail: string
  readonly instance?: string
}

export interface SocioPerfilDto {
  readonly socioId: string | number
  readonly nombre: string
  readonly dni: string
  readonly iniciales: string
  readonly estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | string
}
export interface AforoResponseDto {
  readonly idSede: number
  readonly aforoActual: number
  readonly aforoMaximo: number
  readonly [key: string]: unknown
}
