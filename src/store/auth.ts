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
  telefono?: string
  foto_url?: string
  rol?: RolUsuario
  id_sede?: number
  sede?: {
    id_sede: number
    nombre?: string
    id_ciudad?: number
  }
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

function obtenerAvatarDesdeSesion(
  sesionActual: Session | null
): string | undefined {
  const metadata = sesionActual?.user?.user_metadata as
    | Record<string, unknown>
    | undefined
  if (!metadata) return undefined
  if (typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()) {
    return metadata.avatar_url.trim()
  }
  if (typeof metadata.picture === 'string' && metadata.picture.trim()) {
    return metadata.picture.trim()
  }
  return undefined
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const usuario = ref<Usuario | null>(null)
  const isInitialized = ref(false)
  const cargandoPerfil = ref(false)
  const perfilVerificado = ref(false)

  const isAuthenticated = computed(() => !!session.value)
  const token = computed(() => session.value?.access_token || null)
  const rol = computed<RolUsuario>(() => {
    return (
      usuario.value?.rol ||
      (localStorage.getItem('rol') as RolUsuario) ||
      'socio'
    )
  })

  function marcarPerfilVerificado(valor: boolean) {
    perfilVerificado.value = valor
  }

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

        const datosActuales = usuario.value ?? ({} as Partial<Usuario>)

        setPerfilInterno({
          ...datosActuales,
          id: Number(perfilData.socioId),
          nombre: perfilData.nombre ?? datosActuales.nombre,
          apellido: perfilData.apellido ?? datosActuales.apellido,
          email: perfilData.email ?? datosActuales.email,
          telefono: datosActuales.telefono,
          foto_url: (perfilData.foto_url ?? datosActuales.foto_url) || undefined,
          rol: datosActuales.rol,
          estadoMembresia: descripcionEstado,
          dni: perfilData.dni ?? datosActuales.dni,
          id_ciudad: Number(perfilData.id_ciudad) || datosActuales.id_ciudad,
        })
      }
    } catch (error) {
      console.warn(
        'No se pudo sincronizar el perfil del socio automáticamente:',
        error
      )
    }
  }

  async function cargarPerfilLocal() {
    cargandoPerfil.value = true
    try {
      const respuesta = (await authService.verifyLocalProfile()) as {
        success?: boolean
        user?: {
          id_usuario: number
          dni?: string
          nombre?: string
          apellido?: string
          email?: string
          telefono?: string | null
          foto_url?: string | null
          rol?: string
          roles?: string[]
          id_sede?: number
          sede?: {
            id_sede: number
            nombre?: string
            id_ciudad?: number
          }
        }
      }

      const u = respuesta?.user
      if (u) {
        const rolBackend = String(
          u.rol ?? u.roles?.[0] ?? 'externo'
        ).toLowerCase() as RolUsuario

        setPerfilInterno({
          id: u.id_usuario,
          dni: u.dni,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          telefono: u.telefono ?? undefined,
          foto_url: u.foto_url ?? obtenerAvatarDesdeSesion(session.value),
          rol: rolBackend,
          id_sede: u.id_sede,
          sede: u.sede,
        })
        marcarPerfilVerificado(true)
        return usuario.value
      }
      return null
    } finally {
      cargandoPerfil.value = false
    }
  }

  function actualizarDatosUsuario(datosParciales: Partial<Usuario>) {
    if (!usuario.value) return
    usuario.value = {
      ...usuario.value,
      ...datosParciales,
    }
    localStorage.setItem('fitzone_user_perfil', JSON.stringify(usuario.value))
    if (usuario.value.rol) {
      localStorage.setItem('rol', usuario.value.rol)
    }
  }

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    isInitialized.value = true

    if (session.value) {
      const guardado = localStorage.getItem('fitzone_user_perfil')
      if (guardado) {
        try {
          usuario.value = JSON.parse(guardado) as Usuario
        } catch {
          // ignore error
        }
      }
      sincronizarPerfilSocio()
    }

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      if (!newSession) {
        usuario.value = null
        perfilVerificado.value = false
      }
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
    perfilVerificado.value = false
    localStorage.removeItem('rol')
    localStorage.removeItem('fitzone_user_perfil')

    // 2. Cerramos sesión en Supabase en segundo plano
    try {
      await authService.logout()
    } catch {
      console.warn('Sesión de Supabase ya estaba inactiva.')
    }
  }

  function setPerfilInterno(perfil: Usuario) {
    const perfilNormalizado: Usuario = {
      ...perfil,
      foto_url: perfil.foto_url || obtenerAvatarDesdeSesion(session.value),
    }
    usuario.value = perfilNormalizado
    localStorage.setItem('fitzone_user_perfil', JSON.stringify(perfilNormalizado))
    if (perfilNormalizado.rol) {
      localStorage.setItem('rol', perfilNormalizado.rol)
    }
  }

  return {
    session,
    usuario,
    token,
    rol,
    cargandoPerfil,
    perfilVerificado,
    isAuthenticated,
    isInitialized,
    initialize,
    login,
    logout,
    setPerfilInterno,
    marcarPerfilVerificado,
    cargarPerfilLocal,
    actualizarDatosUsuario,
  }
})
