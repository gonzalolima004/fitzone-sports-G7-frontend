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
