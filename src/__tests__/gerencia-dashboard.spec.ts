// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/common/api/http'
import GerenciaDashboardView from '@/modules/gerencia/views/GerenciaDashboardView.vue'
import { RUTA_POR_ROL } from '@/common/guards/ruta-por-rol'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn() },
}))

type Respuestas = Partial<Record<string, unknown>>

function servidor(respuestas: Respuestas) {
  vi.mocked(http.get).mockImplementation(async (url: string) => {
    const data = respuestas[url]
    if (data === undefined) {
      throw new Error(`Falla simulada en ${url}`)
    }
    return { data }
  })
}

const RESPUESTAS: Respuestas = {
  '/sedes': [
    { id_sede: 1, nombre: 'Centro' },
    { id_sede: 2, nombre: 'Norte' },
    { id_sede: 3, nombre: 'Sur' },
  ],
  '/planes': [
    { id: 1, id_plan: 1, nombre: 'Mensual', duracion_dias: 30, precio: 1 },
    { id: 2, id_plan: 2, nombre: 'Anual', duracion_dias: 365, precio: 2 },
  ],
  '/reportes/ingresos': {
    fecha_desde: '2026-10-01',
    fecha_hasta: '2026-10-23',
    total_ingresos: 150000,
    sedes: [],
  },
  '/reportes/ocupacion': {
    fecha_desde: '2026-10-23',
    fecha_hasta: '2026-10-23',
    sedes: [
      {
        id_sede: 1,
        nombre_sede: 'Centro',
        total_asistencias: 40,
        total_reservas_canchas: 3,
        total_reservas_clases: 4,
      },
      {
        id_sede: 2,
        nombre_sede: 'Norte',
        total_asistencias: 10,
        total_reservas_canchas: 2,
        total_reservas_clases: 1,
      },
    ],
  },
}

async function montar() {
  const wrapper = mount(GerenciaDashboardView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

function valores(wrapper: Awaited<ReturnType<typeof montar>>): string[] {
  return wrapper
    .findAll('[data-testid="valor-indicador"]')
    .map((valor) => valor.text())
}

describe('Dashboard del gerente', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
    // Solo se simula la fecha: "hoy" es el 23/10/2026 en hora local.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 23, 10, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('es la pantalla de inicio del rol gerente', () => {
    expect(RUTA_POR_ROL.gerente).toBe('/gerencia')
  })

  it('muestra los indicadores calculados con los endpoints existentes', async () => {
    servidor(RESPUESTAS)
    const wrapper = await montar()

    expect(http.get).toHaveBeenCalledWith('/reportes/ingresos', {
      params: { fecha_desde: '2026-10-01', fecha_hasta: '2026-10-23' },
    })
    expect(http.get).toHaveBeenCalledWith('/reportes/ocupacion', {
      params: { fecha_desde: '2026-10-23', fecha_hasta: '2026-10-23' },
    })
    // Sedes activas, planes, ingresos del mes y reservas de hoy (3+4+2+1)
    const [sedes, planes, ingresos, reservas] = valores(wrapper)
    expect([sedes, planes, reservas]).toEqual(['3', '2', '10'])
    expect(ingresos).toContain('150.000,00')
    expect(wrapper.text()).toContain('Desde el 01/10/2026')
  })

  it('ofrece accesos a sedes, planes, canchas y reportes', async () => {
    servidor(RESPUESTAS)
    const wrapper = await montar()

    const destinos = wrapper
      .findAllComponents(RouterLinkStub)
      .map((enlace) => enlace.props('to'))

    expect(destinos).toEqual([
      '/gerencia/sedes',
      '/gerencia/planes',
      '/gerencia/canchas',
      '/gerencia/reportes',
      '/gerencia/reportes/ocupacion',
    ])
  })

  it('si un indicador falla, los demás se muestran igual', async () => {
    servidor({ ...RESPUESTAS, '/reportes/ocupacion': undefined })
    const wrapper = await montar()

    const mostrados = valores(wrapper)
    expect(mostrados).toHaveLength(3)
    expect(mostrados.slice(0, 2)).toEqual(['3', '2'])
    expect(wrapper.text()).toContain('No disponible')
  })
})
