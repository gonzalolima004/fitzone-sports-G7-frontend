import http from '@/common/api/http'

export interface ConsultaIngresos {
  fecha_desde: string
  fecha_hasta: string
  id_sede?: number
  concepto?: 'cancha' | 'membresia'
}

export interface IngresoPorSede {
  id_sede: number
  nombre_sede: string
  total_ingresos: number
}

export interface ReporteIngresos {
  fecha_desde: string
  fecha_hasta: string
  total_ingresos: number
  sedes: IngresoPorSede[]
}

export async function obtenerIngresos(
  filtros: ConsultaIngresos
): Promise<ReporteIngresos> {
  const respuesta = await http.get<ReporteIngresos>('/reportes/ingresos', {
    params: filtros,
  })

  return respuesta.data
}

export interface ConsultaOcupacion {
  fecha_desde: string
  fecha_hasta: string
  id_sede?: number
}

export interface OcupacionPorSede {
  id_sede: number
  nombre_sede: string
  total_asistencias: number
  total_reservas_canchas: number
  total_reservas_clases: number
}

export interface ReporteOcupacion {
  fecha_desde: string
  fecha_hasta: string
  sedes: OcupacionPorSede[]
}

export async function obtenerOcupacion(
  filtros: ConsultaOcupacion
): Promise<ReporteOcupacion> {
  const respuesta = await http.get<ReporteOcupacion>('/reportes/ocupacion', {
    params: filtros,
  })
  return respuesta.data
}

export interface ConsultaSociosActivos {
  /** YYYY-MM-DD. Si no se envía, el backend usa la fecha de hoy en Argentina. */
  fecha?: string
}

export interface SociosActivosPorSede {
  id_sede: number
  nombre_sede: string
  socios_activos: number
}

export interface ReporteSociosActivos {
  fecha: string
  total_socios_activos: number
  /** Solo las sedes con socios activos. */
  sedes: SociosActivosPorSede[]
}

/** Socios con membresía activa y vigente, contados por el backend en una consulta. */
export async function obtenerSociosActivos(
  filtros: ConsultaSociosActivos = {}
): Promise<ReporteSociosActivos> {
  const respuesta = await http.get<ReporteSociosActivos>(
    '/reportes/socios-activos',
    { params: filtros }
  )
  return respuesta.data
}

export interface AforoPorSede {
  id_sede: number
  nombre_sede: string
  aforo_actual: number
  aforo_maximo: number
}

export interface ReporteAforo {
  total_aforo_actual: number
  total_aforo_maximo: number
  /** Todas las sedes activas. */
  sedes: AforoPorSede[]
}

/** Aforo actual y máximo de todas las sedes activas en una sola respuesta. */
export async function obtenerAforo(): Promise<ReporteAforo> {
  const respuesta = await http.get<ReporteAforo>('/reportes/aforo')
  return respuesta.data
}
