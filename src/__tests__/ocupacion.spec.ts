// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import OcupacionView from '../modules/M6-reportes/views/OcupacionView.vue'
import { obtenerOcupacion } from '../modules/M6-reportes/services/reportes.service'

vi.mock('../modules/M6-reportes/services/reportes.service', () => ({
  obtenerOcupacion: vi.fn(),
}))
vi.mock('@/store/sede', () => ({
  useSedeStore: () => ({
    sedes: [{ id_sede: 2, nombre: 'Centro' }],
    cargando: false,
    error: null,
  }),
}))

async function completar(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('#ocupacion-desde').setValue('2026-10-01')
  await wrapper.get('#ocupacion-hasta').setValue('2026-10-14')
}

describe('Reporte de ocupación', () => {
  beforeEach(() => vi.resetAllMocks())

  it('rechaza fechas vacías e invertidas sin consultar la API', async () => {
    const wrapper = mount(OcupacionView)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Seleccioná las dos fechas')
    await completar(wrapper)
    await wrapper.get('#ocupacion-hasta').setValue('2026-09-30')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('no puede ser posterior')
    expect(obtenerOcupacion).not.toHaveBeenCalled()
  })

  it('envía sede y fechas y muestra los totales reales, incluyendo ceros', async () => {
    vi.mocked(obtenerOcupacion).mockResolvedValue({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-14',
      sedes: [
        {
          id_sede: 2,
          nombre_sede: 'Centro',
          total_asistencias: 7,
          total_reservas_canchas: 0,
          total_reservas_clases: 3,
        },
      ],
    })
    const wrapper = mount(OcupacionView)
    await completar(wrapper)
    await wrapper.get('#ocupacion-sede').setValue('2')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(obtenerOcupacion).toHaveBeenCalledWith({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-14',
      id_sede: 2,
    })
    expect(wrapper.findAll('dd').map((n) => n.text())).toEqual(['7', '0', '3'])
    expect(wrapper.get('tbody').text()).toContain('Centro')
  })

  it('omite la sede en la consulta consolidada y muestra el estado vacío', async () => {
    vi.mocked(obtenerOcupacion).mockResolvedValue({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-14',
      sedes: [],
    })
    const wrapper = mount(OcupacionView)
    await completar(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(obtenerOcupacion).toHaveBeenCalledWith({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-14',
    })
    expect(wrapper.text()).toContain(
      'No se encontraron asistencias ni reservas'
    )
  })

  it('bloquea consultas simultáneas y permite reintentar tras un error', async () => {
    let rechazar!: (error: Error) => void
    vi.mocked(obtenerOcupacion).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rechazar = reject
      })
    )
    const wrapper = mount(OcupacionView)
    await completar(wrapper)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(obtenerOcupacion).toHaveBeenCalledTimes(1)
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    rechazar(new Error('Sin conexión'))
    await flushPromises()
    expect(wrapper.text()).toContain('No se pudo consultar la ocupación')
    vi.mocked(obtenerOcupacion).mockResolvedValueOnce({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-14',
      sedes: [],
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(obtenerOcupacion).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('No se pudo consultar la ocupación')
  })
})
