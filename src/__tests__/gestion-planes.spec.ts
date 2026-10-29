// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import http from '@/common/api/http'
import GestionPlanesView from '@/modules/gerencia/views/GestionPlanesView.vue'
import { planSchema } from '@/modules/gerencia/schemas/plan.schema'
import type { PlanMembresia } from '@/modules/gerencia/types/gerencia.types'
import { boton, errorHttp } from './utils/gerencia-test-utils'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/common/utils/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const PLANES: PlanMembresia[] = [
  { id: 3, id_plan: 3, nombre: 'Anual', duracion_dias: 365, precio: 250000 },
  { id: 1, id_plan: 1, nombre: 'Mensual', duracion_dias: 30, precio: 25000 },
]

async function montar() {
  const wrapper = mount(GestionPlanesView, {
    global: { stubs: { teleport: true, RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

describe('Gestión de planes de membresía (panel de gerencia)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(http.get).mockResolvedValue({ data: PLANES })
  })

  it('lista los planes ordenados por duración, con precio en pesos y resumen', async () => {
    const wrapper = await montar()
    const filas = wrapper.findAll('[data-testid="fila-plan"]')

    expect(http.get).toHaveBeenCalledWith('/planes')
    expect(filas).toHaveLength(2)
    expect(filas[0].text()).toContain('Mensual')
    expect(filas[0].text()).toContain('30 días · Mensual')
    expect(filas[0].text()).toContain('25.000,00')
    expect(filas[1].text()).toContain('365 días · Anual')
    expect(wrapper.get('[data-testid="total-planes"]').text()).toBe('2')
  })

  it('crea un plan usando una duración sugerida y envía números', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Nuevo plan').trigger('click')
    await wrapper.get('#plan-nombre').setValue('Plan Trimestral')
    await boton(wrapper, 'Trimestral · 90 días').trigger('click')
    await wrapper.get('#plan-precio').setValue('68000.5')
    await boton(wrapper, 'Crear plan').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/planes', {
      nombre: 'Plan Trimestral',
      duracion_dias: 90,
      precio: 68000.5,
    })
    expect(http.get).toHaveBeenCalledTimes(2)
  })

  it('no envía el formulario si los datos son inválidos', async () => {
    const wrapper = await montar()

    await boton(wrapper, 'Nuevo plan').trigger('click')
    await wrapper.get('#plan-duracion').setValue('0')
    await wrapper.get('#plan-precio').setValue('-10')
    await boton(wrapper, 'Crear plan').trigger('click')

    expect(wrapper.text()).toContain('Ingresá el nombre del plan.')
    expect(wrapper.text()).toContain('La duración debe ser de al menos 1 día.')
    expect(wrapper.text()).toContain('El precio no puede ser negativo.')
    expect(http.post).not.toHaveBeenCalled()
  })

  it('edita el precio de un plan existente', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Editar plan Mensual').trigger('click')
    await wrapper.get('#plan-precio').setValue('27500')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    expect(http.patch).toHaveBeenCalledWith('/planes/1', {
      nombre: 'Mensual',
      duracion_dias: 30,
      precio: 27500,
    })
  })

  it('al fallar la eliminación explica el caso de membresías asociadas', async () => {
    vi.mocked(http.delete).mockRejectedValue(
      errorHttp(500, 'Internal server error')
    )
    const wrapper = await montar()

    await boton(wrapper, 'Eliminar plan Anual').trigger('click')
    expect(http.delete).not.toHaveBeenCalled()

    await boton(wrapper, 'Sí, eliminar').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/planes/3')
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Si tiene membresías asociadas no puede eliminarse'
    )
  })
})

describe('planSchema', () => {
  it('convierte los textos del formulario en números', () => {
    expect(
      planSchema.parse({
        nombre: '  Anual ',
        duracion_dias: '365',
        precio: '250000',
      })
    ).toEqual({ nombre: 'Anual', duracion_dias: 365, precio: 250000 })
  })

  it('rechaza duraciones con decimales y precios con más de 2 decimales', () => {
    const resultado = planSchema.safeParse({
      nombre: 'Promo',
      duracion_dias: '7.5',
      precio: '10.999',
    })

    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues.map((issue) => issue.path[0])).toEqual([
      'duracion_dias',
      'precio',
    ])
  })
})
