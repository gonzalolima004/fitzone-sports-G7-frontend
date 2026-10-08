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
