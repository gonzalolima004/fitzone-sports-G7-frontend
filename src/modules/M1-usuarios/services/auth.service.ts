import { supabase } from '@/common/api/supabase'
import http from '@/common/api/http'

export interface LoginPayload {
  email: string
  password: string
}

export const authService = {
  async login(credenciales: LoginPayload) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credenciales.email,
      password: credenciales.password,
    })
    if (error) throw error
    return data
  },

  async register(credenciales: LoginPayload) {
    const { data, error } = await supabase.auth.signUp({
      email: credenciales.email,
      password: credenciales.password,
    })
    if (error) throw error
    return data
  },

  async loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        // Este parámetro fuerza a Google a mostrar el panel de cuentas siempre
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    if (error) throw error
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
    return data
  },

  async verifyLocalProfile() {
    const response = await http.get('/auth/me')
    return response.data
  },
}
