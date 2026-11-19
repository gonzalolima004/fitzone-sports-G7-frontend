// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import SelectorDeSede from '@/modules/M1-usuarios/components/SelectorDeSede.vue'
import { useSedeStore } from '@/store/sede'

vi.mock('@/store/sede', () => ({
  useSedeStore: vi.fn(),
}))

describe('SelectorDeSede.vue', () => {
  const cargarSedesMock = vi.fn()
  const cargarCiudadesMock = vi.fn()
  const seleccionarSedeMock = vi.fn()

  let sedeStoreMock: {
    sedes: Array<{
      id_sede: number
      nombre: string
      direccion?: string
      id_ciudad?: number
    }>
    ciudades: Array<{ id_ciudad: number; nombre: string }>
    idSedeSeleccionada: number | null
    sedeSeleccionada: {
      id_sede: number
      nombre: string
      direccion?: string
      id_ciudad?: number
    } | null
    cargando: boolean
    error: string | null
    cargarSedes: typeof cargarSedesMock
    cargarCiudades: typeof cargarCiudadesMock
    seleccionarSede: typeof seleccionarSedeMock
  }

  beforeEach(() => {
    vi.clearAllMocks()
    sedeStoreMock = reactive({
      sedes: [
        {
          id_sede: 1,
          nombre: 'Sede Paraná Centro',
          direccion: 'San Martín 100',
          id_ciudad: 1,
        },
        {
          id_sede: 2,
          nombre: 'Sede Concordia',
          direccion: 'Entre Ríos 200',
          id_ciudad: 2,
        },
        {
          id_sede: 3,
          nombre: 'Sede Sin Ciudad',
        },
      ],
      ciudades: [
        { id_ciudad: 1, nombre: 'Paraná' },
        { id_ciudad: 2, nombre: 'Concordia' },
      ],
      idSedeSeleccionada: 1,
      sedeSeleccionada: {
        id_sede: 1,
        nombre: 'Sede Paraná Centro',
        direccion: 'San Martín 100',
        id_ciudad: 1,
      },
      cargando: false,
      error: null,
      cargarSedes: cargarSedesMock,
      cargarCiudades: cargarCiudadesMock,
      seleccionarSede: seleccionarSedeMock,
    })

    vi.mocked(useSedeStore).mockReturnValue(
      sedeStoreMock as unknown as ReturnType<typeof useSedeStore>
    )
  })

  it('carga sedes y ciudades al montar y muestra la sede activa con su ciudad', () => {
    const wrapper = mount(SelectorDeSede)

    expect(cargarSedesMock).toHaveBeenCalledTimes(1)
    expect(cargarCiudadesMock).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Activa: Sede Paraná Centro')
    expect(wrapper.text()).toContain('(Paraná)')
    expect(wrapper.find('select').element.value).toBe('1')
  })

  it('filtra por ciudad, nombre o dirección ignorando tildes y permite limpiar búsqueda', async () => {
    const wrapper = mount(SelectorDeSede)
    const input = wrapper.find('#perfil-buscar-ciudad')

    await input.setValue('parana')
    const opcionesParana = wrapper.findAll('select option')
    expect(opcionesParana).toHaveLength(1)
    expect(opcionesParana[0].text()).toContain('Sede Paraná Centro — Paraná')

    await input.setValue('Entre Rios')
    expect(wrapper.find('select').text()).toContain('Sede Concordia')
    expect(wrapper.find('select').text()).toContain(
      'Selecciona una sede (1 encontradas)'
    )

    await wrapper.find('button[title="Limpiar búsqueda"]').trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('select option')).toHaveLength(3)
  })

  it('muestra mensaje sin resultados y botón "Mostrar todas" cuando el filtro no coincide', async () => {
    const wrapper = mount(SelectorDeSede)
    await wrapper.find('#perfil-buscar-ciudad').setValue('inexistente')

    expect(wrapper.text()).toContain('Sin resultados para "inexistente"')
    expect(wrapper.text()).toContain('No se encontraron sedes para esa ciudad.')
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()

    await wrapper
      .find('button:not([title="Limpiar búsqueda"])')
      .trigger('click')
    expect(wrapper.findAll('select option')).toHaveLength(3)
  })

  it('cambia sede con seleccionarSede y no llama si el valor está vacío', async () => {
    const wrapper = mount(SelectorDeSede)
    const select = wrapper.find('select')

    await select.setValue('2')
    expect(seleccionarSedeMock).toHaveBeenCalledWith(2)

    const selectEl = select.element as HTMLSelectElement
    selectEl.value = ''
    await select.trigger('change')
    expect(seleccionarSedeMock).toHaveBeenCalledTimes(1)
  })

  it('muestra estado cargando y fallbacks sin sedes o con error', () => {
    sedeStoreMock.cargando = true
    const wrapperCargando = mount(SelectorDeSede)
    expect(wrapperCargando.text()).toContain('Cargando sedes...')

    sedeStoreMock.cargando = false
    sedeStoreMock.sedes = []
    sedeStoreMock.sedeSeleccionada = null
    const wrapperSinSedes = mount(SelectorDeSede)
    expect(wrapperSinSedes.text()).toContain('Sin sedes')

    sedeStoreMock.error = 'Error red'
    const wrapperError = mount(SelectorDeSede)
    expect(wrapperError.text()).toContain('Error de sedes')
  })
})
