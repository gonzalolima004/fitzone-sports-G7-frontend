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
  const token = ref<string | null>(
    localStorage.getItem('token') || localStorage.getItem('fitzone_token')
  )

  const isAuthenticated = computed(() => !!token.value)

  function setRol(nuevoRol: RolUsuario) {
    rol.value = nuevoRol
    localStorage.setItem('rol', nuevoRol)
  }

  function setUsuario(nuevoUsuario: Usuario | null, nuevoToken?: string) {
    usuario.value = nuevoUsuario
    if (nuevoUsuario) {
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario))
      localStorage.setItem('fitzone_user', JSON.stringify(nuevoUsuario))
      if (nuevoUsuario.rol) {
        rol.value = nuevoUsuario.rol
        localStorage.setItem('rol', nuevoUsuario.rol)
      }
    } else {
      localStorage.removeItem('usuario')
      localStorage.removeItem('fitzone_user')
    }

    if (nuevoToken) {
      token.value = nuevoToken
      localStorage.setItem('token', nuevoToken)
      localStorage.setItem('fitzone_token', nuevoToken)
    }
  }

  // Función para realizar el inicio de sesión con Supabase
  async function login(credenciales: LoginPayload) {
    // 1. Llama al servicio de autenticación
    const data = await authService.login(credenciales)

    // 2. Extrae usuario y sesión de Supabase
    const user = data.user
    const session = data.session

    const userMetadata = user?.user_metadata || {}
    const rolUsuario = (userMetadata.rol || 'socio') as RolUsuario

    const nuevoUsuario: Usuario = {
      id: user
        ? Number(user.id) || (userMetadata.id_usuario as number | undefined)
        : undefined,
      nombre:
        (userMetadata.nombre as string | undefined) ||
        user?.email?.split('@')[0],
      apellido: userMetadata.apellido as string | undefined,
      email: user?.email,
      rol: rolUsuario,
    }

    // 3. Utiliza la función existente para guardar el usuario y token de sesión
    setUsuario(nuevoUsuario, session?.access_token)
  }

  async function logout() {
    try {
      await authService.logout()
    } catch (e) {
      console.warn('Error cerrando sesión en Supabase:', e)
    }
    usuario.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('fitzone_token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('fitzone_user')
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
