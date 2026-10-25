import type { UsuarioResponse } from '../types/usuario.types'

export const obtenerPerfilBadge = (
  usuario: UsuarioResponse
): { texto: string; clases: string } => {
  const roles = usuario.roles || []
  const rolesNombres = roles.map((r: string | { nombre?: string }) =>
    typeof r === 'string' ? r : r.nombre || ''
  )

  if (rolesNombres.some((r) => r.includes('gerente') || r === '3')) {
    return {
      texto: 'Gerente',
      clases: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    }
  }
  if (rolesNombres.some((r) => r.includes('recepcionista') || r === '2')) {
    return {
      texto: 'Recepcionista',
      clases: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    }
  }
  if (rolesNombres.some((r) => r.includes('externo') || r === '4')) {
    return {
      texto: 'Externo',
      clases: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    }
  }
  return {
    texto: 'Socio',
    clases: 'bg-slate-100 text-[#202759] border-slate-200',
  }
}
