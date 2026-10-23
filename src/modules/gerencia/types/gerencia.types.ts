/** Sede tal como la devuelve GET /sedes (módulo M0-sedes del backend). */
export interface SedeGestion {
  id_sede: number
  nombre: string
  direccion: string
  aforo_maximo: number
  activo: boolean
  id_ciudad: number
}

/** Datos que aceptan POST /sedes y PATCH /sedes/:id (CreateSedeDto). */
export interface SedePayload {
  nombre: string
  direccion: string
  aforo_maximo: number
  id_ciudad: number
}

/** Ciudad tal como la devuelve GET /ciudades. */
export interface Ciudad {
  id_ciudad: number
  nombre: string
  activo: boolean
}

/** Plan tal como lo devuelve GET /planes (PlanResponseDto). */
export interface PlanMembresia {
  id: number
  id_plan: number
  nombre: string
  duracion_dias: number
  precio: number
}

/** Datos que aceptan POST /planes y PATCH /planes/:id (CrearPlanDto). */
export interface PlanPayload {
  nombre: string
  duracion_dias: number
  precio: number
}
