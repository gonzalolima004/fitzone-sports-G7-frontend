import type { RolUsuario } from '@/store/auth'

export const RUTA_POR_ROL: Record<RolUsuario, string> = {
  socio: '/inicio',
  externo: '/canchas',
  recepcionista: '/aforo',
  gerente: '/gerencia/reportes',
}

export function rutaPorRol(rol?: RolUsuario | null): string {
  return (rol && RUTA_POR_ROL[rol]) || '/inicio'
}
