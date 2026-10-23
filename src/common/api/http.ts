import axios from 'axios'
import router from '../../router'
import { supabase } from './supabase'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

http.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message || error.message || 'Error de conexión'

    console.error(`[HTTP ${status ?? 'Network Error'}]:`, message)

    // 1. Detección de falta de Perfil Interno (Google OAuth AuthGuard Trigger)
    if (
      status === 403 &&
      typeof message === 'string' &&
      message.includes('sin cuenta asociada')
    ) {
      if (router.currentRoute.value.path !== '/completar-perfil') {
        router.push('/completar-perfil')
      }
      return Promise.reject(error)
    }

    // 2. Detección de sesión caducada
    if (status === 401) {
      await supabase.auth.signOut()
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default http
