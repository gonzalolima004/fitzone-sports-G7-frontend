// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import RecepcionView from '@/modules/M2-accesos/views/RecepcionView.vue'
import { useSedeStore } from '@/store/sede'
import { useAforo } from '@/modules/M2-accesos/composables/useAforo'

vi.mock('@/store/sede', () => ({
  useSedeStore: vi.fn(),
}))

vi.mock('@/modules/M2-accesos/composables/useAforo', () => ({
  useAforo: vi.fn(),
}))

describe('RecepcionView.vue', () => {
  const obtenerAforoMock = vi.fn()
  const iniciarEscuchaMock = vi.fn()
  const detenerEscuchaMock = vi.fn()
  const cargarSedesMock = vi.fn()

  let idSedeRef = ref<number | null>(1)
  let versionContextoRef = ref(0)
  let aforoRef = ref({ actual: 12, maximo: 50, porcentaje: 24 })
  let cargandoRef = ref(false)
  let errorRef = ref<string | null>(null)
  let onlineRef = ref(true)
  let datosDesactualizadosRef = ref(false)
  let sedeStoreMock: {
    sedes: Array<{ id_sede: number; nombre: string }>
    sedeSeleccionada: { id_sede: number; nombre: string } | null
    idSedeSeleccionada: number | null
    versionContexto: number
    cargarSedes: typeof cargarSedesMock
  }

  beforeEach(() => {
    vi.clearAllMocks()
    idSedeRef = ref<number | null>(1)
    versionContextoRef = ref(0)
    aforoRef = ref({ actual: 12, maximo: 50, porcentaje: 24 })
    cargandoRef = ref(false)
    errorRef = ref<string | null>(null)
    onlineRef = ref(true)
    datosDesactualizadosRef = ref(false)

    sedeStoreMock = reactive({
      sedes: [],
      sedeSeleccionada: { id_sede: 1, nombre: 'Sede Centro' },
      idSedeSeleccionada: idSedeRef,
      versionContexto: versionContextoRef,
      cargarSedes: cargarSedesMock.mockResolvedValue(undefined),
    })

    vi.mocked(useSedeStore).mockReturnValue(
      sedeStoreMock as unknown as ReturnType<typeof useSedeStore>
    )

    vi.mocked(useAforo).mockReturnValue({
      aforo: aforoRef,
      cargando: cargandoRef,
      error: errorRef,
      online: onlineRef,
      datosDesactualizados: datosDesactualizadosRef,
      obtenerAforo: obtenerAforoMock,
      iniciarEscuchaTiempoReal: iniciarEscuchaMock,
      detenerEscuchaTiempoReal: detenerEscuchaMock,
    } as unknown as ReturnType<typeof useAforo>)
  })

  const mountView = () =>
    mount(RecepcionView, {
      global: {
        stubs: {
          ValidacionAcceso: { template: '<div data-testid="validacion-stub" />' },
          IndicadorAforo: {
            props: ['actual', 'maximo'],
            template: '<div data-testid="aforo-stub">{{ actual }}/{{ maximo }}</div>',
          },
          BaseSkeleton: { template: '<div data-testid="skeleton-stub" />' },
        },
      },
    })

  it('carga sedes al montar si sedes está vacío e inicia escucha en tiempo real', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(cargarSedesMock).toHaveBeenCalledTimes(1)
    expect(iniciarEscuchaMock).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('Sede Centro')
    expect(wrapper.find('[data-testid="aforo-stub"]').text()).toBe('12/50')
  })

  it('no recarga sedes al montar si ya hay sedes y muestra fallback si no hay sede seleccionada', async () => {
    sedeStoreMock.sedes = [{ id_sede: 2, nombre: 'Sede Norte' }]
    sedeStoreMock.sedeSeleccionada = null

    const wrapper = mountView()
    await flushPromises()

    expect(cargarSedesMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Seleccione una sede')
  })

  it('muestra skeleton mientras carga y no hay maximo previo', async () => {
    cargandoRef.value = true
    aforoRef.value = { actual: 0, maximo: 0, porcentaje: 0 }

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="skeleton-stub"]').exists()).toBe(true)
  })

  it('muestra aviso offline/desactualizado y estado de error cuando corresponde', async () => {
    onlineRef.value = false
    datosDesactualizadosRef.value = true
    errorRef.value = 'Error de conexión con aforo'

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Estás sin conexión o los datos de aforo')
    expect(wrapper.text()).toContain('Error de conexión con aforo')
  })

  it('permite actualizar aforo manualmente y reinicia escucha al cambiar de sede', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('button').trigger('click')
    expect(obtenerAforoMock).toHaveBeenCalledWith(1)

    idSedeRef.value = 2
    await flushPromises()

    expect(detenerEscuchaMock).toHaveBeenCalled()
    expect(iniciarEscuchaMock).toHaveBeenCalledWith(2)

    idSedeRef.value = null
    versionContextoRef.value += 1
    await flushPromises()
    await wrapper.find('button').trigger('click')
    expect(obtenerAforoMock).toHaveBeenCalledTimes(1)
  })
})
