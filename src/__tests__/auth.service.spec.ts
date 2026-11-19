import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '@/modules/M1-usuarios/services/auth.service'
import { supabase } from '@/common/api/supabase'
import http from '@/common/api/http'

vi.mock('@/common/api/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}))

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('authService (M1-usuarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:3000' },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('login', () => {
    it('retorna la sesión cuando las credenciales son válidas', async () => {
      const mockData = { user: { id: 'u1' }, session: { access_token: 'tok' } }
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: mockData,
        error: null,
      } as never)

      const result = await authService.login({
        email: 'socio@fitzone.com',
        password: 'Password123!',
      })

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'socio@fitzone.com',
        password: 'Password123!',
      })
      expect(result).toEqual(mockData)
    })

    it('propaga el error cuando Supabase rechaza el login', async () => {
      const authError = new Error('Invalid login credentials')
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      } as never)

      await expect(
        authService.login({ email: 'mal@fitzone.com', password: 'wrong' })
      ).rejects.toThrow('Invalid login credentials')
    })
  })

  describe('register', () => {
    it('registra un nuevo usuario y retorna los datos', async () => {
      const mockData = { user: { id: 'u2' }, session: null }
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockData,
        error: null,
      } as never)

      const result = await authService.register({
        email: 'nuevo@fitzone.com',
        password: 'Password123!',
      })

      expect(result).toEqual(mockData)
    })

    it('lanza excepción si falla el registro', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('User already registered'),
      } as never)

      await expect(
        authService.register({ email: 'dup@fitzone.com', password: '123' })
      ).rejects.toThrow('User already registered')
    })
  })

  describe('loginWithGoogle', () => {
    it('inicia flujo OAuth con prompt select_account', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com' },
        error: null,
      } as never)

      await authService.loginWithGoogle()

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/',
          queryParams: { prompt: 'select_account' },
        },
      })
    })

    it('propaga error si falla OAuth', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: new Error('OAuth provider disabled'),
      } as never)

      await expect(authService.loginWithGoogle()).rejects.toThrow(
        'OAuth provider disabled'
      )
    })
  })

  describe('logout', () => {
    it('cierra sesión correctamente', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

      await expect(authService.logout()).resolves.toBeUndefined()
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('propaga error al fallar signOut', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: new Error('Network error') as never,
      })

      await expect(authService.logout()).rejects.toThrow('Network error')
    })
  })

  describe('reauthenticateWithPassword y updatePassword', () => {
    it('reautentica con email y contraseña actual', async () => {
      const mockSession = { user: { id: 'u1' }, session: {} }
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: mockSession,
        error: null,
      } as never)

      const res = await authService.reauthenticateWithPassword(
        'socio@fitzone.com',
        'Actual123'
      )
      expect(res).toEqual(mockSession)
    })

    it('lanza error si la reautenticación falla', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {},
        error: new Error('Wrong password'),
      } as never)

      await expect(
        authService.reauthenticateWithPassword('a@b.com', 'bad')
      ).rejects.toThrow('Wrong password')
    })

    it('actualiza la contraseña del usuario', async () => {
      const updatedUser = { user: { id: 'u1' } }
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: updatedUser,
        error: null,
      } as never)

      const res = await authService.updatePassword('NuevaPass123!')
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NuevaPass123!',
      })
      expect(res).toEqual(updatedUser)
    })

    it('lanza error si falla updatePassword', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Weak password'),
      } as never)

      await expect(authService.updatePassword('123')).rejects.toThrow(
        'Weak password'
      )
    })
  })

  describe('verifyLocalProfile', () => {
    it('consulta /auth/me y retorna el perfil local', async () => {
      const perfil = { id: 10, rol: 'SOCIO' }
      vi.mocked(http.get).mockResolvedValue({ data: perfil })

      const res = await authService.verifyLocalProfile()

      expect(http.get).toHaveBeenCalledWith('/auth/me')
      expect(res).toEqual(perfil)
    })
  })
})
