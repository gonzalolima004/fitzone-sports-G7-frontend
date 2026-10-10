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
