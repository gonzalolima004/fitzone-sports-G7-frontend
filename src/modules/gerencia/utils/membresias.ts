import type {
  FilaMembresiaSocio,
  MembresiaSocio,
  SocioResumen,
  UsuarioGestion,
  UsuarioListado,
} from '../types/gerencia.types'
import { normalizarTexto } from './formato'

/** Planes que vencen en meses calendario (misma regla que calcularFechaFin del backend). */
const MESES_POR_DURACION: Record<number, number> = { 30: 1, 90: 3, 365: 12 }

/**
 * Fecha de vencimiento (YYYY-MM-DD) para una membresía que empieza en
 * `fechaInicio`. Los planes de 30, 90 y 365 días suman meses calendario (si el
 * día no existe en el mes de destino, queda el último día del mes); el resto
 * suma días. Se usa solo para mostrar una vista previa: el backend la calcula.
 */
export function calcularVencimiento(
  fechaInicio: string,
  duracionDias: number
): string {
  const [anio, mes, dia] = fechaInicio.split('-').map(Number)
  const meses = MESES_POR_DURACION[duracionDias]

  if (meses) {
    const ultimoDia = new Date(Date.UTC(anio, mes - 1 + meses + 1, 0))
    const diaDestino = Math.min(dia, ultimoDia.getUTCDate())
    return new Date(Date.UTC(anio, mes - 1 + meses, diaDestino))
      .toISOString()
      .slice(0, 10)
  }

  return new Date(Date.UTC(anio, mes - 1, dia + duracionDias))
    .toISOString()
    .slice(0, 10)
}

/** Clases del badge según el estado (tabla membresia_estado). */
export function claseEstadoMembresia(descripcion: string): string {
  switch (descripcion.trim().toLowerCase()) {
    case 'activa':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'vencida':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'suspendida':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

/** True si el usuario tiene el rol socio (GET /usuarios trae roles o usuario_rol). */
export function esSocio(usuario: UsuarioListado): boolean {
  const roles =
    usuario.roles?.map((rol) => rol.nombre) ??
    usuario.usuario_rol?.map((relacion) => relacion.rol.nombre) ??
    []
  return roles.some((rol) => rol.trim().toLowerCase() === 'socio')
}

export function nombreCompleto(socio: SocioResumen): string {
  return `${socio.nombre} ${socio.apellido}`.trim()
}

/** Búsqueda sin distinguir mayúsculas ni tildes por nombre, apellido, DNI o email. */
export function coincideConBusqueda(
  socio: SocioResumen,
  busqueda: string
): boolean {
  const termino = normalizarTexto(busqueda.trim())
  if (!termino) return true
  return [
    socio.nombre,
    socio.apellido,
    socio.dni,
    socio.email,
    nombreCompleto(socio),
  ]
    .map((campo) => normalizarTexto(campo ?? ''))
    .some((campo) => campo.includes(termino))
}

/** Ej.: Sofía Gómez → "SG". */
export function iniciales(socio: SocioResumen): string {
  return `${socio.nombre.trim().charAt(0)}${socio.apellido.trim().charAt(0)}`.toUpperCase()
}

/** True si la membresía está en el estado indicado (sin distinguir mayúsculas). */
export function tieneEstado(
  membresia: MembresiaSocio,
  descripcion: string
): boolean {
  return (
    membresia.membresia_estado.descripcion.trim().toLowerCase() ===
    descripcion.toLowerCase()
  )
}

/**
 * Membresía que se muestra para un socio: la activa más reciente o, si no
 * tiene ninguna activa, la última que tuvo (por vencimiento).
 */
export function membresiaActual(
  membresias: MembresiaSocio[]
): MembresiaSocio | null {
  const masReciente = (a: MembresiaSocio, b: MembresiaSocio) =>
    b.fecha_fin.localeCompare(a.fecha_fin) || b.id_membresia - a.id_membresia
  const activas = membresias
    .filter((membresia) => tieneEstado(membresia, 'activa'))
    .sort(masReciente)
  return activas[0] ?? [...membresias].sort(masReciente)[0] ?? null
}

/** Datos de GET /usuarios preparados para el panel. */
export function aUsuarioGestion(usuario: UsuarioListado): UsuarioGestion {
  return {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    dni: usuario.dni,
    email: usuario.email,
    id_sede: usuario.sede?.id_sede ?? usuario.id_sede ?? null,
    sede_nombre: usuario.sede?.nombre ?? null,
    es_socio: esSocio(usuario),
  }
}

/**
 * Una fila por socio con su membresía actual. Incluye a los socios sin
 * membresía y a cualquier usuario que tenga membresías aunque hoy no figure
 * como socio, para que ninguna membresía quede fuera del panel.
 */
export function armarFilasPorSocio(
  usuarios: UsuarioGestion[],
  membresias: MembresiaSocio[]
): FilaMembresiaSocio[] {
  const membresiasPorUsuario = new Map<number, MembresiaSocio[]>()
  for (const membresia of membresias) {
    const lista = membresiasPorUsuario.get(membresia.id_usuario) ?? []
    lista.push(membresia)
    membresiasPorUsuario.set(membresia.id_usuario, lista)
  }

  const usuariosPorId = new Map(
    usuarios.map((usuario) => [usuario.id_usuario, usuario])
  )
  const ids = new Set([
    ...usuarios
      .filter((usuario) => usuario.es_socio)
      .map((usuario) => usuario.id_usuario),
    ...membresiasPorUsuario.keys(),
  ])

  return [...ids]
    .map((idUsuario) => {
      const delSocio = membresiasPorUsuario.get(idUsuario) ?? []
      const socio: UsuarioGestion = usuariosPorId.get(idUsuario) ?? {
        ...delSocio[0].usuario,
        id_sede: null,
        sede_nombre: null,
        es_socio: false,
      }
      return { socio, membresia: membresiaActual(delSocio) }
    })
    .sort((a, b) =>
      `${a.socio.apellido} ${a.socio.nombre}`.localeCompare(
        `${b.socio.apellido} ${b.socio.nombre}`
      )
    )
}
