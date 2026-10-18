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

    // CORRECCIÓN CRÍTICA: Forzar actualización síncrona para que Vue Router
    // no rebote la solicitud antes de que onAuthStateChange se dispare.
    if (data.session) {
      session.value = data.session
    }

    // TODO: En el futuro, aquí deberías llamar a tu API de FitZone (e.g., /usuarios/perfil)
    // para traerte el rol y los datos del perfil interno y setearlos en `usuario.value`.
  }

  async function logout() {
    await authService.logout()
    usuario.value = null
    localStorage.removeItem('rol')
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
