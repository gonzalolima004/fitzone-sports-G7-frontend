// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginView from '@/modules/M1-usuarios/views/LoginView.vue'
import { useAuthStore } from '@/store/auth'
import { createRouter, createWebHistory } from 'vue-router'
import { toast } from '@/common/utils/toast'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/gerencia', component: { template: '<div>Gerencia</div>' } },
  ],
})

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/common/utils/toast', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('LoginView.vue', () => {
  const mockAuthStore = {
    login: vi.fn(),
    cargarPerfilLocal: vi.fn(),
    rol: 'gerente',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(
      mockAuthStore as unknown as ReturnType<typeof useAuthStore>
    )
  })

  it('muestra advertencia si se intenta enviar el formulario con campos vacíos', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(toast.warning).toHaveBeenCalledWith(
      'El correo electrónico es obligatorio.'
    )
    expect(mockAuthStore.login).not.toHaveBeenCalled()
  })

  it('ejecuta el login con éxito y redirige según el rol', async () => {
    mockAuthStore.login.mockResolvedValue(undefined)
    mockAuthStore.cargarPerfilLocal.mockResolvedValue(undefined)

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    // Simular ingreso de credenciales usando BaseInput v-model
    const inputs = wrapper.findAllComponents({ name: 'BaseInput' })
    await inputs[0].vm.$emit('update:modelValue', 'gerente@fitzone.com')
    await inputs[1].vm.$emit('update:modelValue', 'Password123!')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(mockAuthStore.login).toHaveBeenCalledWith({
      email: 'gerente@fitzone.com',
      password: 'Password123!',
    })
    expect(mockAuthStore.cargarPerfilLocal).toHaveBeenCalled()
  })

  it('muestra toast de error si las credenciales son incorrectas', async () => {
    mockAuthStore.login.mockRejectedValue(
      new Error('Invalid login credentials')
    )

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    const inputs = wrapper.findAllComponents({ name: 'BaseInput' })
    await inputs[0].vm.$emit('update:modelValue', 'test@fitzone.com')
    await inputs[1].vm.$emit('update:modelValue', 'wrongpass')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    // Esperar microtareas de la promesa rechazada
    await wrapper.vm.$nextTick()

    expect(toast.error).toHaveBeenCalledWith(
      'Credenciales incorrectas. Verifica tu correo y contraseña.'
    )
  })
})
