// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import http from '@/common/api/http'
import router from '@/router'

interface AxiosConfigMock {
  url?: string
  headers: Record<string, string>
  [key: string]: unknown
}

interface AxiosInterceptorManagerMock {
  handlers: Array<{
    fulfilled?: (
      config: AxiosConfigMock
    ) => Promise<AxiosConfigMock> | AxiosConfigMock
    rejected?: (error: unknown) => Promise<unknown>
  }>
}

vi.mock('@/common/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@/router', () => ({
  default: {
    currentRoute: {
      value: { path: '/dashboard' },
    },
    push: vi.fn(),
  },
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    token: 'mock-token-store',
    logout: vi.fn(),
  })),
}))

describe('http.ts - Axios Interceptors Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_API_URL', 'https://api.fitzone.com')
  })

  it('adjunta el token de autorización si la URL es propia de la API', async () => {
    const config: AxiosConfigMock = {
      url: 'https://api.fitzone.com/sedes',
      headers: {},
    }

    const requestInterceptor = http.interceptors
      .request as unknown as AxiosInterceptorManagerMock
    const requestHandler = requestInterceptor.handlers[0].fulfilled!
    const resultConfig = await requestHandler(config)

    expect(resultConfig.headers.Authorization).toBe('Bearer mock-token-store')
  })

  it('no adjunta el token si la URL pertenece a un dominio externo no confiable', async () => {
    const config: AxiosConfigMock = {
      url: 'https://api.externa.com/data',
      headers: {},
    }

    const requestInterceptor = http.interceptors
      .request as unknown as AxiosInterceptorManagerMock
    const requestHandler = requestInterceptor.handlers[0].fulfilled!
    const resultConfig = await requestHandler(config)

    expect(resultConfig.headers.Authorization).toBeUndefined()
  })

  it('maneja error 403 redirigiendo a completar-perfil si el mensaje lo requiere', async () => {
    const errorResponse = {
      response: {
        status: 403,
        data: { message: 'Usuario sin cuenta asociada' },
      },
    }

    const responseInterceptor = http.interceptors
      .response as unknown as AxiosInterceptorManagerMock
    const errorHandler = responseInterceptor.handlers[0].rejected!
    await expect(errorHandler(errorResponse)).rejects.toEqual(errorResponse)
    expect(router.push).toHaveBeenCalledWith('/completar-perfil')
  })

  it('maneja error 401 ejecutando logout y redirigiendo al login', async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: { message: 'Token expirado' },
      },
    }

    const responseInterceptor = http.interceptors
      .response as unknown as AxiosInterceptorManagerMock
    const errorHandler = responseInterceptor.handlers[0].rejected!
    await expect(errorHandler(errorResponse)).rejects.toEqual(errorResponse)
    expect(router.push).toHaveBeenCalledWith('/login')
  })

  it('rechaza directamente si la respuesta no contiene objeto error.response', async () => {
    const netError = new Error('Network Error')
    const responseInterceptor = http.interceptors
      .response as unknown as AxiosInterceptorManagerMock
    const errorHandler = responseInterceptor.handlers[0].rejected!
    await expect(errorHandler(netError)).rejects.toThrow('Network Error')
  })
})
