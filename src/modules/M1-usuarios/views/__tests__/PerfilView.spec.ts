// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PerfilView from '../PerfilView.vue'
import { usuariosService } from '../../services/usuarios.service'
import { authService } from '../../services/auth.service'
import { toast } from '@/common/utils/toast'

const mockAuthStore = vi.hoisted(() => ({
  usuario: {
    id: 15,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    dni: '38123456',
    telefono: '1145678901',
    rol: 'socio',
    foto_url: '',
  },
  rol: 'socio',
  cargarPerfilLocal: vi.fn(async () => {}),
  actualizarDatosUsuario: vi.fn(),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('../../services/usuarios.service', () => ({
  usuariosService: {
    actualizarPerfil: vi.fn(async () => ({ success: true })),
    subirFotoPerfil: vi.fn(async () => ({ foto_url: 'https://example.com/avatar.jpg' })),
  },
}))

vi.mock('../../services/auth.service', () => ({
  authService: {
    reauthenticateWithPassword: vi.fn(async () => ({})),
    updatePassword: vi.fn(async () => ({})),
  },
}))

vi.mock('@/common/utils/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

describe('PerfilView.vue - Edición de Perfil, Restricciones y Seguridad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.usuario = {
      id: 15,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '38123456',
      telefono: '1145678901',
      rol: 'socio',
      foto_url: '',
    }
  })

  it('renderiza email y dni con el atributo disabled y no los envía en el payload de actualización', async () => {
    const wrapper = mount(PerfilView)
    await flushPromises()

    const emailInput = wrapper.find('#perfil-email')
    const dniInput = wrapper.find('#perfil-dni')

    expect(emailInput.exists()).toBe(true)
    expect(dniInput.exists()).toBe(true)
    expect(emailInput.attributes()).toHaveProperty('disabled')
    expect(dniInput.attributes()).toHaveProperty('disabled')

    // Modificamos datos editables y enviamos el formulario de datos personales
    const nombreInput = wrapper.find('#perfil-nombre')
    await nombreInput.setValue('Juan Carlos')

    const form = wrapper.findAll('form')[0]
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(usuariosService.actualizarPerfil).toHaveBeenCalledTimes(1)
    expect(usuariosService.actualizarPerfil).toHaveBeenCalledWith(
      15,
      expect.objectContaining({
        nombre: 'Juan Carlos',
        apellido: 'Pérez',
        telefono: '1145678901',
      })
    )

    // Garantizar que 'email' y 'dni' no están en el objeto enviado
    const callPayload = vi.mocked(usuariosService.actualizarPerfil).mock.calls[0][1]
    expect(callPayload).not.toHaveProperty('email')
    expect(callPayload).not.toHaveProperty('dni')
  })

  it('sincroniza authStore.actualizarDatosUsuario tras actualizar exitosamente nombre, apellido y teléfono', async () => {
    const wrapper = mount(PerfilView)
    await flushPromises()

    const nombreInput = wrapper.find('#perfil-nombre')
    const apellidoInput = wrapper.find('#perfil-apellido')
    const telefonoInput = wrapper.find('#perfil-telefono')

    await nombreInput.setValue('Mariana')
    await apellidoInput.setValue('Gómez')
    await telefonoInput.setValue('+5491198765432')

    const form = wrapper.findAll('form')[0]
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(usuariosService.actualizarPerfil).toHaveBeenCalledWith(15, {
      nombre: 'Mariana',
      apellido: 'Gómez',
      telefono: '+5491198765432',
    })

    expect(mockAuthStore.actualizarDatosUsuario).toHaveBeenCalledWith({
      nombre: 'Mariana',
      apellido: 'Gómez',
      telefono: '+5491198765432',
    })

    expect(toast.success).toHaveBeenCalledWith('Datos personales actualizados correctamente.')
  })

  it('ejecuta reauthenticateWithPassword seguido de updatePassword al cambiar la contraseña con éxito', async () => {
    const wrapper = mount(PerfilView)
    await flushPromises()

    const currentPass = wrapper.find('#current-password')
    const newPass = wrapper.find('#new-password')
    const confirmPass = wrapper.find('#confirm-password')

    await currentPass.setValue('PasswordActual123')
    await newPass.setValue('PasswordNuevo456!')
    await confirmPass.setValue('PasswordNuevo456!')

    // El formulario de contraseña es el segundo formulario en la vista
    const formPass = wrapper.findAll('form')[1]
    await formPass.trigger('submit.prevent')
    await flushPromises()

    expect(authService.reauthenticateWithPassword).toHaveBeenCalledTimes(1)
    expect(authService.reauthenticateWithPassword).toHaveBeenCalledWith(
      'juan.perez@example.com',
      'PasswordActual123'
    )

    expect(authService.updatePassword).toHaveBeenCalledTimes(1)
    expect(authService.updatePassword).toHaveBeenCalledWith('PasswordNuevo456!')

    expect(toast.success).toHaveBeenCalledWith('¡Contraseña actualizada con éxito!')
  })
})
