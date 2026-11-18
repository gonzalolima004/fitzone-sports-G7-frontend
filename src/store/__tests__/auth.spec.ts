// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

vi.mock('@/common/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: {
            user: {
              id: 'sup-1',
              user_metadata: {
                avatar_url:
                  'https://lh3.googleusercontent.com/a-/google-avatar.jpg',
              },
            },
            access_token: 'fake-token',
          },
        },
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

describe('auth.ts - Store & Google Avatar Fallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('resuelve user_metadata.avatar_url de la sesión de Supabase cuando foto_url no viene del backend', async () => {
    const store = useAuthStore()
    await store.initialize()

    store.setPerfilInterno({
      id: 1,
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      foto_url: undefined,
    })

    expect(store.usuario?.foto_url).toBe(
      'https://lh3.googleusercontent.com/a-/google-avatar.jpg'
    )
  })
})
