import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/common/api/supabase'
import {
  authService,
  type LoginPayload,
} from '@/modules/M1-usuarios/services/auth.service'
import type { Session } from '@supabase/supabase-js'
import { accesosService } from '@/modules/M2-accesos/services/accesos.service'
import http from '@/common/api/http'

export type RolUsuario = 'socio' | 'externo' | 'recepcionista' | 'gerente'

export interface Usuario {
  id: number
  nombre?: string
  apellido?: string
  email?: string
  rol?: RolUsuario
  estadoMembresia?: string
  enMora?: boolean
  dni?: string
  id_ciudad?: number | string
}

export async function sincronizarColaOffline() {
  const colaRaw = localStorage.getItem('fitzone_offline_queue')
  if (!colaRaw) return

  const cola = JSON.parse(colaRaw) as unknown[]
  if (!Array.isArray(cola) || cola.length === 0) return

  const pendientes: unknown[] = []
  for (const item of cola) {
    try {
      const registro = item as {
        tipo?: string
        data?: { id_usuario?: number; id_sede?: number }
        timestamp?: string
      }

      if (!registro.tipo || !registro.data || !registro.timestamp) continue

      await http.post('/accesos/sincronizar-offline', {
        id_usuario: registro.data.id_usuario,
        id_sede: registro.data.id_sede,
        tipo: registro.tipo,
        timestamp: registro.timestamp,
      })
    } catch {
      pendientes.push(item)
    }
  }

  localStorage.setItem('fitzone_offline_queue', JSON.stringify(pendientes))
}

// Escuchar cuando el navegador recupera la red
window.addEventListener('online', () => {
  sincronizarColaOffline()
})

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

  async function sincronizarPerfilSocio() {
    try {
      const userIdLocal = usuario.value?.id
      if (userIdLocal) {
        const perfilData = await accesosService.obtenerPerfilSocio(userIdLocal)

        const listaMembresias = Array.isArray(perfilData.membresia)
          ? perfilData.membresia
          : perfilData.membresia
            ? [perfilData.membresia]
            : []

        const membresiaActiva =
          listaMembresias.find(
            (m: unknown) =>
              (m as { membresia_estado?: { descripcion?: string } })
                ?.membresia_estado?.descripcion === 'Activa'
          ) || listaMembresias[0]
        const descripcionEstado = membresiaActiva ? 'Activa' : 'Inactiva'

        setPerfilInterno({
          id: Number(perfilData.socioId),
          nombre: perfilData.nombre,
          email: perfilData.email,
          estadoMembresia: descripcionEstado,
          dni: perfilData.dni,
          id_ciudad: Number(perfilData.id_ciudad),
        })
      }
    } catch (error) {
      console.warn(
        'No se pudo sincronizar el perfil del socio automáticamente:',
        error
      )
    }
  }

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    isInitialized.value = true

    if (session.value) {
      sincronizarPerfilSocio()
    }

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
    localStorage.setItem('fitzone_user_perfil', JSON.stringify(perfil))
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
