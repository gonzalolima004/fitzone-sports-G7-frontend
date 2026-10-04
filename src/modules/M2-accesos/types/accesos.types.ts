export interface QrResponseDto {
  readonly qrCode: string
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
