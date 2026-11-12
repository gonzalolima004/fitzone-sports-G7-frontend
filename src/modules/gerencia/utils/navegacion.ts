import type { RouteLocationRaw } from 'vue-router'

export interface Pestana {
  nombre: string
  ruta: RouteLocationRaw
}

/** Pantallas del área Sedes del panel de gerencia. */
export const PESTANAS_SEDES: readonly Pestana[] = [
  { nombre: 'Sedes', ruta: { name: 'gerencia-sedes' } },
  { nombre: 'Horarios', ruta: { name: 'gerencia-horarios' } },
  { nombre: 'Calendario', ruta: { name: 'gerencia-calendario' } },
]

/** Pantallas del área Reportes del panel de gerencia. */
export const PESTANAS_REPORTES: readonly Pestana[] = [
  { nombre: 'Ingresos', ruta: { name: 'reportes' } },
  { nombre: 'Ocupación y reservas', ruta: { name: 'reportes-ocupacion' } },
]
