// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/common/api/http'
import GestionSedesView from '@/modules/gerencia/views/GestionSedesView.vue'
import type {
  CanchaResumen,
  Ciudad,
  SedeGestion,
} from '@/modules/gerencia/types/gerencia.types'
import { boton, errorHttp } from './utils/gerencia-test-utils'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/common/utils/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const CIUDADES: Ciudad[] = [
  { id_ciudad: 1, nombre: 'Concordia', activo: true },
  { id_ciudad: 2, nombre: 'Paraná', activo: true },
]

const CANCHAS: CanchaResumen[] = [
  { id_cancha: 1, id_sede: 1, cancha_tipo: { descripcion: 'Pádel' } },
  { id_cancha: 2, id_sede: 1, cancha_tipo: { descripcion: 'Fútbol 5' } },
  { id_cancha: 3, id_sede: 1, cancha_tipo: { descripcion: 'Pádel' } },
]

let sedes: SedeGestion[] = []
let canchas: CanchaResumen[] | Error = CANCHAS

function servidorConSedes(lista: SedeGestion[]) {
  sedes = lista
  vi.mocked(http.get).mockImplementation(async (url: string) => {
    if (url === '/sedes') return { data: sedes }
    if (url === '/ciudades') return { data: CIUDADES }
    if (url === '/canchas') {
      if (canchas instanceof Error) throw canchas
      return { data: canchas }
    }
    throw new Error(`URL no esperada: ${url}`)
  })
}

async function montar() {
  const wrapper = mount(GestionSedesView, {
    global: { stubs: { teleport: true, RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

describe('Gestión de sedes (panel de gerencia)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
    canchas = CANCHAS
    servidorConSedes([
      {
        id_sede: 1,
        nombre: 'Centro',
        direccion: 'San Martín 100',
        aforo_maximo: 120,
        activo: true,
        id_ciudad: 1,
      },
      {
        id_sede: 2,
        nombre: 'Norte',
        direccion: 'Belgrano 50',
        aforo_maximo: 80,
        activo: true,
        id_ciudad: 2,
      },
    ])
  })

  it('lista las sedes activas con su ciudad, su aforo y el resumen', async () => {
    const wrapper = await montar()
    const filas = wrapper.findAll('[data-testid="fila-sede"]')

    expect(http.get).toHaveBeenCalledWith('/sedes')
    expect(http.get).toHaveBeenCalledWith('/ciudades')
    expect(filas).toHaveLength(2)
    expect(filas[0].text()).toContain('Centro')
    expect(filas[0].text()).toContain('Concordia')
    expect(filas[0].text()).toContain('120')
    expect(filas[1].text()).toContain('Paraná')
    expect(wrapper.get('[data-testid="total-sedes"]').text()).toBe('2')
  })

  it('valida el formulario antes de enviar y crea la sede con números', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: { id_sede: 3, activo: true },
    })
    const wrapper = await montar()

    await boton(wrapper, 'Nueva sede').trigger('click')
    await boton(wrapper, 'Crear sede').trigger('click')

    expect(wrapper.text()).toContain('Ingresá el nombre de la sede.')
    expect(wrapper.text()).toContain('El aforo debe ser mayor a 0.')
    expect(wrapper.text()).toContain('Seleccioná una ciudad.')
    expect(http.post).not.toHaveBeenCalled()

    await wrapper.get('#sede-nombre').setValue('Sur')
    await wrapper.get('#sede-direccion').setValue('Urquiza 900')
    await wrapper.get('#sede-aforo').setValue('60')
    await wrapper.get('#sede-ciudad').setValue('2')
    await boton(wrapper, 'Crear sede').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/sedes', {
      nombre: 'Sur',
      direccion: 'Urquiza 900',
      aforo_maximo: 60,
      id_ciudad: 2,
    })
    // Recarga el listado y el store global (registro y selector del encabezado)
    expect(
      vi.mocked(http.get).mock.calls.filter(([url]) => url === '/sedes').length
    ).toBeGreaterThanOrEqual(3)
  })

  it('muestra el mensaje del servidor si el alta es rechazada', async () => {
    vi.mocked(http.post).mockRejectedValue(
      errorHttp(
        403,
        'Acceso denegado: se requiere uno de los siguientes roles: [gerente].'
      )
    )
    const wrapper = await montar()

    await boton(wrapper, 'Nueva sede').trigger('click')
    await wrapper.get('#sede-nombre').setValue('Sur')
    await wrapper.get('#sede-direccion').setValue('Urquiza 900')
    await wrapper.get('#sede-aforo').setValue('60')
    await wrapper.get('#sede-ciudad').setValue('1')
    await boton(wrapper, 'Crear sede').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Acceso denegado')
    expect(wrapper.find('#sede-nombre').exists()).toBe(true)
  })

  it('edita una sede con el formulario precargado', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Editar sede Centro').trigger('click')
    expect(
      (wrapper.get('#sede-nombre').element as HTMLInputElement).value
    ).toBe('Centro')

    await wrapper.get('#sede-aforo').setValue('150')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    expect(http.patch).toHaveBeenCalledWith('/sedes/1', {
      nombre: 'Centro',
      direccion: 'San Martín 100',
      aforo_maximo: 150,
      id_ciudad: 1,
    })
  })

  it('agrega una ciudad desde el formulario y la deja seleccionada', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: { id_ciudad: 7, nombre: 'Gualeguaychú', activo: true },
    })
    const wrapper = await montar()

    await boton(wrapper, 'Nueva sede').trigger('click')
    await boton(wrapper, '¿No está la ciudad? Agregala').trigger('click')
    await wrapper.get('#ciudad-nueva').setValue('Gualeguaychú')
    await boton(wrapper, 'Agregar ciudad').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/ciudades', {
      nombre: 'Gualeguaychú',
    })
    expect(
      (wrapper.get('#sede-ciudad').element as HTMLSelectElement).value
    ).toBe('7')
  })

  it('da de baja una sede solo después de confirmar', async () => {
    vi.mocked(http.delete).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Dar de baja sede Norte').trigger('click')
    expect(http.delete).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Es una baja lógica')

    await boton(wrapper, 'Sí, dar de baja').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/sedes/2')
  })

  it('muestra las instalaciones de cada sede según sus canchas', async () => {
    const wrapper = await montar()
    const instalaciones = wrapper
      .findAll('[data-testid="instalaciones-sede"]')
      .map((celda) => celda.text())

    expect(http.get).toHaveBeenCalledWith('/canchas')
    expect(instalaciones).toEqual(['1 Fútbol 5 · 2 Pádel', 'Sin canchas'])
  })

  it('si las canchas no cargan, la pantalla sigue funcionando', async () => {
    canchas = new Error('Network Error')
    const wrapper = await montar()

    expect(wrapper.findAll('[data-testid="fila-sede"]')).toHaveLength(2)
    expect(wrapper.get('[data-testid="instalaciones-sede"]').text()).toBe('—')
  })

  it('busca sedes por nombre o ciudad sin distinguir tildes', async () => {
    const wrapper = await montar()

    await wrapper.get('#buscar-sede').setValue('parana')
    const filas = wrapper.findAll('[data-testid="fila-sede"]')
    expect(filas).toHaveLength(1)
    expect(filas[0].text()).toContain('Norte')

    await wrapper.get('#buscar-sede').setValue('ninguna')
    expect(wrapper.text()).toContain('Ninguna sede coincide')
    await boton(wrapper, 'Limpiar búsqueda').trigger('click')
    expect(wrapper.findAll('[data-testid="fila-sede"]')).toHaveLength(2)
  })

  it('si falla la carga muestra el error y permite reintentar', async () => {
    vi.mocked(http.get).mockRejectedValueOnce(new Error('Network Error'))
    const wrapper = await montar()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudieron cargar las sedes'
    )

    await boton(wrapper, 'Reintentar').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="fila-sede"]')).toHaveLength(2)
  })
})
