// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/common/api/http'
import SelectorSede from '@/common/components/SelectorSede.vue'
import { useSedeStore } from '@/store/sede'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn() },
}))

const SEDES = [
  { id_sede: 1, nombre: 'Centro', direccion: 'San Martín 100' },
  { id_sede: 2, nombre: 'Norte', direccion: 'Belgrano 50' },
]

function montar(modelValue = '') {
  return mount(SelectorSede, {
    props: { modelValue, id: 'sede-prueba', required: true },
  })
}

describe('SelectorSede (registro con sede dinámica)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('mientras carga queda deshabilitado e informa la carga', () => {
    const sedeStore = useSedeStore()
    sedeStore.cargando = true

    const wrapper = montar()
    const select = wrapper.get('select')

    expect(select.attributes('disabled')).toBeDefined()
    expect(select.text()).toContain('Cargando sedes...')
  })

  it('lista las sedes de la API y emite el id elegido como texto', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: SEDES })
    await useSedeStore().cargarSedes()

    const wrapper = montar()
    const opciones = wrapper.findAll('option')

    expect(http.get).toHaveBeenCalledWith('/sedes')
    expect(opciones.map((opcion) => opcion.text())).toEqual([
      'Selecciona una sede',
      'Centro - San Martín 100',
      'Norte - Belgrano 50',
    ])
    expect(wrapper.get('select').attributes('disabled')).toBeUndefined()

    await wrapper.get('select').setValue('2')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2'])
  })

  it('si falla la carga muestra el error y permite reintentar', async () => {
    vi.mocked(http.get)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ data: SEDES })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await useSedeStore().cargarSedes()

    const wrapper = montar()
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudieron cargar las sedes'
    )
    expect(wrapper.get('select').attributes('disabled')).toBeDefined()

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(http.get).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('option')).toHaveLength(3)
  })

  it('sin sedes habilitadas queda deshabilitado y lo informa', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [] })
    await useSedeStore().cargarSedes()

    const wrapper = montar()

    expect(wrapper.get('select').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Todavía no hay sedes habilitadas')
  })
})
