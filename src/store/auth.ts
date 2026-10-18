import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/common/api/supabase'
import {
  authService,
  type LoginPayload,
} from '@/modules/M1-usuarios/services/auth.service'
import type { Session } from '@supabase/supabase-js'

export type RolUsuario = 'socio' | 'recepcion' | 'gerente' | 'admin'

export interface Usuario {
  id?: number
  nombre?: string
  apellido?: string
  email?: string
  rol?: RolUsuario
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const usuario = ref<Usuario | null>(null)
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => !!session.value)
  const token = computed(() => session.value?.access_token || null)
  const rol = computed<RolUsuario>(() => {
    return (
      usuario.value?.rol ||
      (localStorage.getItem('rol') as RolUsuario) ||
      'socio'
    )
  })

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    isInitialized.value = true

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      if (!newSession) usuario.value = null
    })
  }

  async function login(credenciales: LoginPayload) {
    const data = await authService.login(credenciales)
    if (data.session) {
      session.value = data.session
    }
  }

  async function logout() {
    // 1. Limpiamos Pinia de forma síncrona INMEDIATAMENTE para que el router.push('/login') no rebote
    session.value = null
    usuario.value = null
    localStorage.removeItem('rol')

    // 2. Cerramos sesión en Supabase en segundo plano
    try {
      await authService.logout()
    } catch {
      console.warn('Sesión de Supabase ya estaba inactiva.')
    }
  }

  function setPerfilInterno(perfil: Usuario) {
    usuario.value = perfil
    if (perfil.rol) {
      localStorage.setItem('rol', perfil.rol)
    }
  }

  return {
    session,
    usuario,
    token,
    rol,
    isAuthenticated,
    isInitialized,
    initialize,
    login,
    logout,
    setPerfilInterno,
  }
})
