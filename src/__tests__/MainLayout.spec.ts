// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MainLayout from '@/common/layouts/MainLayout.vue'
import { useAuthStore } from '@/store/auth'
import { useSedeStore } from '@/store/sede'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
})

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/store/sede', () => ({
  useSedeStore: vi.fn(),
}))

describe('MainLayout.vue', () => {
  const mockAuthStore = {
    isAuthenticated: true,
    rol: 'socio',
    usuario: {
      nombre: 'Juan',
      apellido: 'Pérez',
      foto_url: 'https://img.com/avatar.jpg',
    },
    cargandoPerfil: false,
    logout: vi.fn().mockResolvedValue(undefined),
  }

  const mockSedeStore = {
    idSedeSeleccionada: 1,
    sedeSeleccionada: { id_sede: 1, nombre: 'Sede Central' },
    horarioOperativoActual: {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    },
    cargarSedes: vi.fn(),
    horariosCache: {},
    obtenerHorarioOperativo: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(
      mockAuthStore as unknown as ReturnType<typeof useAuthStore>
    )
    vi.mocked(useSedeStore).mockReturnValue(
      mockSedeStore as unknown as ReturnType<typeof useSedeStore>
    )
  })

  it('se renderiza correctamente mostrando el nombre del usuario y la sede activa', () => {
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Juan Pérez')
    expect(wrapper.text()).toContain('Sede Central')
    expect(wrapper.text()).toContain('08:00 a 22:00 hs')
  })

  it('abre y cierra el menú lateral móvil al hacer clic en el botón hamburguesa', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router],
      },
    })

    const botonHamburguesa = wrapper.find('button[title="Abrir menú"]')
    expect(botonHamburguesa.exists()).toBe(true)

    await botonHamburguesa.trigger('click')
    // Verifica que se despliegue el telón oscuro de fondo móvil
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true)
  })

  it('ejecuta el cierre de sesión correctamente', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router],
      },
    })

    // Abrir menú de usuario
    const botonMenuUsuario = wrapper.find(
      'button[title="Abrir menú de usuario"]'
    )
    await botonMenuUsuario.trigger('click')

    // Click en botón de cerrar sesión
    const botonLogout = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Cerrar sesión'))
    await botonLogout?.trigger('click')

    expect(mockAuthStore.logout).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/login')
  })
})
