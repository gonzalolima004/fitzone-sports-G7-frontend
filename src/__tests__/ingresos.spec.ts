// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ReportesView from '../modules/M6-reportes/views/ReportesView.vue'
import { obtenerIngresos } from '../modules/M6-reportes/services/reportes.service'

vi.mock('../modules/M6-reportes/services/reportes.service', () => ({
  obtenerIngresos: vi.fn(),
}))
vi.mock('@/store/sede', () => ({
  useSedeStore: () => ({
    sedes: [{ id_sede: 2, nombre: 'Centro' }],
    cargando: false,
    error: null,
  }),
}))

describe('Ingresos dentro del panel', () => {
  beforeEach(() => vi.resetAllMocks())
  it('conserva filtros y resultados al consultar desde el formulario', async () => {
    vi.mocked(obtenerIngresos).mockResolvedValue({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-14',
      total_ingresos: 1500,
      sedes: [{ id_sede: 2, nombre_sede: 'Centro', total_ingresos: 1500 }],
    })
    const wrapper = mount(ReportesView)
    await wrapper.get('#fecha-desde').setValue('2026-10-01')
    await wrapper.get('#fecha-hasta').setValue('2026-10-14')
    await wrapper.get('#sede-reporte').setValue('2')
    await wrapper.get('#concepto').setValue('cancha')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(obtenerIngresos).toHaveBeenCalledWith({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-14',
      id_sede: 2,
      concepto: 'cancha',
    })
    expect(wrapper.get('tbody').text()).toContain('Centro')
    expect(wrapper.text()).toContain('1.500,00')
  })
  it('mantiene la validación de fechas', async () => {
    const wrapper = mount(ReportesView)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Seleccioná las dos fechas')
    expect(obtenerIngresos).not.toHaveBeenCalled()
  })
})
