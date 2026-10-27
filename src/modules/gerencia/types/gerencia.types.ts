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

/** Cancha tal como la devuelve GET /canchas (solo los campos que se usan). */
export interface CanchaResumen {
  id_cancha: number
  id_sede: number
  cancha_tipo?: { descripcion: string } | null
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

/** Estado de la tabla membresia_estado (GET /membresias/estados). */
export interface EstadoMembresia {
  id_membresia_estado: number
  descripcion: string
}

/** Socio titular de una membresía (datos básicos). */
export interface SocioResumen {
  id_usuario: number
  nombre: string
  apellido: string
  dni: string
  email: string
}

/** Membresía de un socio tal como la devuelve GET /membresias. */
export interface MembresiaSocio {
  id_membresia: number
  fecha_inicio: string
  fecha_fin: string
  renovacion_automatica: boolean
  id_usuario: number
  id_membresia_plan: number
  id_membresia_estado: number
  membresia_plan: {
    id_membresia_plan: number
    nombre: string
    duracion_dias: number
    precio: number
  }
  membresia_estado: EstadoMembresia
  usuario: SocioResumen
}

/**
 * Datos que acepta POST /membresias para el alta desde el panel.
 * La fecha de fin la calcula el backend según la duración del plan.
 */
export interface MembresiaAltaPayload {
  id_usuario: number
  id_membresia_plan: number
  fecha_inicio: string
  renovacion_automatica: boolean
}

/** Cambios que el gerente puede hacer sobre una membresía existente. */
export interface MembresiaEdicionPayload {
  id_membresia_estado: number
  fecha_fin: string
  renovacion_automatica: boolean
}

/** Usuario tal como lo devuelve GET /usuarios (solo los campos que se usan). */
export interface UsuarioListado extends SocioResumen {
  id_sede?: number | null
  sede?: { id_sede: number; nombre: string } | null
  roles?: Array<{ id_rol: number; nombre: string }>
  usuario_rol?: Array<{ rol: { id_rol: number; nombre: string } }>
}

/** Usuario preparado para el panel: datos básicos, sede y si es socio. */
export interface UsuarioGestion extends SocioResumen {
  id_sede: number | null
  sede_nombre: string | null
  es_socio: boolean
}

/** Fila del listado de membresías: un socio con su membresía actual (o ninguna). */
export interface FilaMembresiaSocio {
  socio: UsuarioGestion
  membresia: MembresiaSocio | null
}
