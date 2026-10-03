import axios from 'axios'
import router from '../../router'

export const http = axios.create({
  // Asegurate de tener VITE_API_URL="http://localhost:3000" en tu .env
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Interceptor de solicitud: adjunta el token de sesión si existe en localStorage
http.interceptors.request.use(
  (config) => {
    // CORRECCIÓN: Usar la misma clave que definimos en el useAuthStore
    const token = localStorage.getItem('fitzone_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de respuesta: centraliza errores y redirige si la sesión expiró (401)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message || error.message || 'Error de conexión'

    console.error(`[HTTP ${status ?? 'Network Error'}]:`, message)

    // Si la sesión no es válida o expiró, limpiamos y mandamos a login
    if (status === 401) {
      localStorage.removeItem('fitzone_token')
      localStorage.removeItem('fitzone_user')

      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }

    return Promise.reject(error)
  }
)

export default http
