import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  authService,
  type LoginPayload,
} from '@/modules/M1-usuarios/services/auth.service'

export type RolUsuario = 'socio' | 'recepcion' | 'gerente' | 'admin'

export interface Usuario {
  id?: number
  nombre?: string
  apellido?: string // Agregado para compatibilidad con la respuesta de la API
  email?: string
  rol?: RolUsuario
}

export const useAuthStore = defineStore('auth', () => {
  // Rol activo (se persiste en localStorage para pruebas y sesión)
  const rol = ref<RolUsuario>(
    (localStorage.getItem('rol') as RolUsuario) || 'socio'
  )

  function obtenerUsuarioInicial(): Usuario | null {
    const raw = localStorage.getItem('usuario')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return { nombre: raw, rol: rol.value }
    }
  }

  // Datos del usuario obtenidos de la sesión
  const usuario = ref<Usuario | null>(obtenerUsuarioInicial())

  // Token JWT
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  function setRol(nuevoRol: RolUsuario) {
    rol.value = nuevoRol
    localStorage.setItem('rol', nuevoRol)
  }

  function setUsuario(nuevoUsuario: Usuario | null, nuevoToken?: string) {
    usuario.value = nuevoUsuario
    if (nuevoUsuario) {
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario))
      if (nuevoUsuario.rol) {
        rol.value = nuevoUsuario.rol
        localStorage.setItem('rol', nuevoUsuario.rol)
      }
    } else {
      localStorage.removeItem('usuario')
    }

    if (nuevoToken) {
      token.value = nuevoToken
      localStorage.setItem('token', nuevoToken)
    }
  }

  // NUEVO: Función para realizar el inicio de sesión contra el backend
  async function login(credenciales: LoginPayload) {
    // 1. Llama al servicio HTTP
    const data = await authService.login(credenciales)

    // 2. Mapea la respuesta a tu interfaz Usuario
    const nuevoUsuario: Usuario = {
      id: data.usuario.id_usuario,
      nombre: data.usuario.nombre,
      apellido: data.usuario.apellido,
      email: data.usuario.email,
      rol: data.usuario.rol as RolUsuario,
    }

    // 3. Utiliza tu función existente para guardar todo
    setUsuario(nuevoUsuario, data.token)
  }

  function logout() {
    usuario.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('rol')
  }

  return {
    rol,
    usuario,
    token,
    isAuthenticated,
    setRol,
    setUsuario,
    login, // Exportamos la nueva función
    logout,
  }
})
