export interface Rol {
  id_rol: number
  nombre: string
}

export interface UsuarioRolRelacion {
  rol: Rol
}

export interface Sede {
  id_sede: number
  nombre: string
}

export interface UsuarioResponse {
  id_usuario: number
  dni: string
  email: string
  nombre: string
  apellido: string
  telefono?: string
  foto_url?: string
  roles?: Rol[]
  usuario_rol?: UsuarioRolRelacion[]
  creacion: string
  modificado: string
  qr_url: string
  id_sede: number
  sede?: Sede
  id_usuario_estado: number
}

export interface RegistroPayload {
  dni: string
  email: string
  contrasenia?: string
  nombre: string
  apellido: string
  telefono: string
  id_sede: string
  foto_url?: string
  roles?: number[]
}
// Nueva interfaz extendida para la edición/gestión desde el panel
export interface ActualizarUsuarioPayload extends Partial<RegistroPayload> {
  id_usuario_estado?: number
  roles?: number[]
}
