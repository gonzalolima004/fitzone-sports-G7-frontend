import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Interceptor para centralizar el manejo de respuestas y errores
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || 'Error de conexión'

    console.error(`[HTTP ${status ?? 'Network Error'}]:`, message)

    return Promise.reject(error)
  }
)

export default http
