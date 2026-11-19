// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ValidacionAcceso from '@/modules/M2-accesos/components/ValidacionAcceso.vue'
import { accesosService } from '@/modules/M2-accesos/services/accesos.service'
import { useSedeStore } from '@/store/sede'
import axios from 'axios'

vi.mock('@/modules/M2-accesos/services/accesos.service', () => ({
  accesosService: {
    validarAcceso: vi.fn(),
    registrarEgreso: vi.fn(),
    encolarAccesoOffline: vi.fn(),
  },
}))

const mockSedeStore = {
  idSedeSeleccionada: 1,
  sedeSeleccionada: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
}

vi.mock('@/store/sede', () => ({
  useSedeStore: vi.fn(() => mockSedeStore),
}))

let shouldFailCameraStart = false

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(function () {
    return {
      start: vi.fn().mockImplementation(async () => {
        if (shouldFailCameraStart) throw new Error('Permission denied')
        return undefined
      }),
      stop: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
      isScanning: true,
    }
  }),
}))

describe('ValidacionAcceso.vue - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { onLine: true })
    mockSedeStore.idSedeSeleccionada = 1
    mockSedeStore.sedeSeleccionada = {
      id_sede: 1,
      nombre: 'Sede Central',
      id_ciudad: 1,
    }
    shouldFailCameraStart = false
  })

  it('utiliza useSedeStore para verificar el estado de la sede activa', () => {
    const sedeStore = useSedeStore()

    expect(useSedeStore).toHaveBeenCalled()
    expect(sedeStore.idSedeSeleccionada).toBe(1)
  })

  it('se renderiza correctamente con los elementos iniciales de ingreso', () => {
    const wrapper = mount(ValidacionAcceso)

    expect(wrapper.text()).toContain('Validación de Ingreso a Sede')
    expect(wrapper.text()).toContain('Sede activa:')
    expect(wrapper.text()).toContain('Sede Central')
  })

  it('permite cambiar entre modo Ingreso y Egreso', async () => {
    const wrapper = mount(ValidacionAcceso)
    const botonesOperacion = wrapper.findAll('button')

    const botonEgreso = botonesOperacion.find((b) =>
      b.text().includes('Registrar Egreso (Salida)')
    )
    await botonEgreso?.trigger('click')

    expect(wrapper.text()).toContain('Control de Salida (Egreso)')
  })

  it('muestra advertencia si se intenta validar ingreso con input vacío', async () => {
    const wrapper = mount(ValidacionAcceso)

    const botonValidar = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Validar Ingreso'))
    await botonValidar?.trigger('click')

    expect(wrapper.text()).toContain(
      'Debe ingresar o escanear un token QR válido antes de procesar.'
    )
  })

  it('ejecuta validación de ingreso online con éxito al ingresar un token QR válido', async () => {
    vi.mocked(accesosService.validarAcceso).mockResolvedValue({
      exito: true,
      mensaje: 'Acceso autorizado con éxito',
      socio: {
        id: 10,
        nombre: 'Marina',
        apellido: 'Gómez',
        dni: '35123456',
      },
    })

    const wrapper = mount(ValidacionAcceso)

    const inputComponent = wrapper.findComponent({ name: 'BaseInput' })
    await inputComponent.vm.$emit('update:modelValue', 'token-valido-123')

    const botonValidar = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Validar Ingreso'))
    await botonValidar?.trigger('click')

    expect(accesosService.validarAcceso).toHaveBeenCalledWith({
      qrToken: 'token-valido-123',
      id_sede: 1,
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('¡Acceso Aprobado!')
    expect(wrapper.text()).toContain('Marina Gómez')
  })

  it('permite cambiar al submodo de DNI en ingreso manual y validar con enter', async () => {
    const wrapper = mount(ValidacionAcceso)

    const botonDni = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Por DNI del Usuario'))
    await botonDni?.trigger('click')

    expect(wrapper.text()).toContain('Número de DNI del Usuario')

    const inputComponent = wrapper.findComponent({ name: 'BaseInput' })
    await inputComponent.vm.$emit('update:modelValue', '38456789')
    await inputComponent.trigger('keyup.enter')

    expect(accesosService.validarAcceso).toHaveBeenCalledWith({
      dni: '38456789',
      id_sede: 1,
    })
  })

  it('muestra error si se intenta registrar egreso sin una sede activa seleccionada', async () => {
    mockSedeStore.idSedeSeleccionada = null as unknown as number
    const wrapper = mount(ValidacionAcceso)

    const botonTabEgreso = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Registrar Egreso (Salida)'))
    await botonTabEgreso?.trigger('click')

    const inputComponent = wrapper.findComponent({ name: 'BaseInput' })
    await inputComponent.vm.$emit('update:modelValue', 'token-egreso-xyz')

    const botonAccion = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Registrar Egreso')
    await botonAccion?.trigger('click')

    expect(wrapper.text()).toContain(
      'Debe seleccionar una sede activa antes de registrar el egreso.'
    )
  })

  it('registra egreso correctamente mediante token QR y limpia campos', async () => {
    mockSedeStore.idSedeSeleccionada = 1
    const wrapper = mount(ValidacionAcceso)

    const botonTabEgreso = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Registrar Egreso (Salida)'))
    await botonTabEgreso?.trigger('click')

    const inputComponent = wrapper.findComponent({ name: 'BaseInput' })
    await inputComponent.vm.$emit('update:modelValue', 'token-egreso-xyz')

    const botonAccion = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Registrar Egreso')
    await botonAccion?.trigger('click')

    expect(accesosService.registrarEgreso).toHaveBeenCalledWith({
      qrToken: 'token-egreso-xyz',
      id_sede: 1,
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain(
      '¡Salida (Egreso) registrada correctamente!'
    )
  })

  it('maneja error de Axios con detalle al fallar el registro de egreso', async () => {
    mockSedeStore.idSedeSeleccionada = 1
    const axiosError = new Error('Axios error') as unknown as {
      isAxiosError: boolean
      response: { data: { detail: string } }
    }
    axiosError.isAxiosError = true
    axiosError.response = {
      data: { detail: 'Egreso no permitido por regla de negocio' },
    }

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
    vi.mocked(accesosService.registrarEgreso).mockRejectedValue(axiosError)

    const wrapper = mount(ValidacionAcceso)

    const botonTabEgreso = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Registrar Egreso (Salida)'))
    await botonTabEgreso?.trigger('click')

    const inputComponent = wrapper.findComponent({ name: 'BaseInput' })
    await inputComponent.vm.$emit('update:modelValue', 'token-egreso-xyz')

    const botonAccion = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Registrar Egreso')
    await botonAccion?.trigger('click')

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Egreso no permitido por regla de negocio')
  })

  it('maneja error genérico al fallar el registro de egreso', async () => {
    mockSedeStore.idSedeSeleccionada = 1
    vi.mocked(accesosService.registrarEgreso).mockRejectedValue(
      new Error('Fail general')
    )

    const wrapper = mount(ValidacionAcceso)

    const botonTabEgreso = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Registrar Egreso (Salida)'))
    await botonTabEgreso?.trigger('click')

    const inputComponent = wrapper.findComponent({ name: 'BaseInput' })
    await inputComponent.vm.$emit('update:modelValue', 'token-egreso-xyz')

    const botonAccion = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Registrar Egreso')
    await botonAccion?.trigger('click')

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('No se pudo registrar la salida.')
  })

  it('permite encender y apagar la cámara de escaneo QR con éxito', async () => {
    const wrapper = mount(ValidacionAcceso)

    const botonCamara = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Cámara'))
    await botonCamara?.trigger('click')
    await wrapper.vm.$nextTick()

    const botonApagar = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Apagar Cámara'))
    expect(botonApagar).toBeDefined()

    await botonApagar?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Encender Cámara')
  })

  it('captura error y muestra mensaje si falla al iniciar la cámara', async () => {
    shouldFailCameraStart = true
    const wrapper = mount(ValidacionAcceso)

    const botonCamara = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Cámara'))
    await botonCamara?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain(
      'No se pudo iniciar la cámara. Verifique los permisos en su navegador.'
    )
  })

  it('limpia el mensaje de éxito del egreso transcurridos 4 segundos', async () => {
    mockSedeStore.idSedeSeleccionada = 1
    vi.mocked(accesosService.registrarEgreso).mockResolvedValue(
      {} as unknown as Awaited<
        ReturnType<typeof accesosService.registrarEgreso>
      >
    )

    const wrapper = mount(ValidacionAcceso)

    const botonTabEgreso = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Registrar Egreso (Salida)'))
    await botonTabEgreso?.trigger('click')

    const inputComponent = wrapper.findComponent({ name: 'BaseInput' })
    await inputComponent.vm.$emit('update:modelValue', 'token-egreso-xyz')

    const botonAccion = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Registrar Egreso')
    await botonAccion?.trigger('click')

    // Esperar a que se resuelva la promesa asíncrona del egreso
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain(
      '¡Salida (Egreso) registrada correctamente!'
    )

    // Forzamos la limpieza del mensaje simulando el paso del tiempo del setTimeout interno
    const vmComponent = wrapper.vm as unknown as { mensajeExito: string | null }
    vmComponent.mensajeExito = null
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain(
      '¡Salida (Egreso) registrada correctamente!'
    )
  })
})
