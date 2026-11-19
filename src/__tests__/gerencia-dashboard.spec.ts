// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  flushPromises,
  mount,
  RouterLinkStub,
  type DOMWrapper,
  type VueWrapper,
} from '@vue/test-utils'
import http from '@/common/api/http'
import GerenciaDashboardView from '@/modules/gerencia/views/GerenciaDashboardView.vue'
import { RUTA_POR_ROL } from '@/common/guards/ruta-por-rol'
import type {
  Ciudad,
  SedeGestion,
} from '@/modules/gerencia/types/gerencia.types'
import type {
  ReporteAforo,
  ReporteSociosActivos,
} from '@/modules/M6-reportes/services/reportes.service'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn() },
}))

// "Hoy" es el 27/10/2026: el mes en curso va del 01/10 al 27/10.
const HOY = '2026-10-27'
const INICIO_DE_MES = '2026-10-01'

const SEDES: SedeGestion[] = [
  {
    id_sede: 2,
    nombre: 'Norte',
    direccion: 'Belgrano 200',
    aforo_maximo: 50,
    activo: true,
    id_ciudad: 2,
  },
  {
    id_sede: 1,
    nombre: 'Centro',
    direccion: 'San Martín 100',
    aforo_maximo: 100,
    activo: true,
    id_ciudad: 1,
  },
  {
    id_sede: 3,
    nombre: 'Sur',
    direccion: 'Mitre 300',
    aforo_maximo: 80,
    activo: true,
    id_ciudad: 1,
  },
]

const CIUDADES: Ciudad[] = [
  { id_ciudad: 1, nombre: 'Paraná', activo: true },
  { id_ciudad: 2, nombre: 'Santa Fe', activo: true },
]

// Socios activos según el backend: 2 en Centro, 1 en Norte y 1 en Sur.
const SOCIOS_ACTIVOS: ReporteSociosActivos = {
  fecha: HOY,
  total_socios_activos: 4,
  sedes: [
    { id_sede: 1, nombre_sede: 'Centro', socios_activos: 2 },
    { id_sede: 2, nombre_sede: 'Norte', socios_activos: 1 },
    { id_sede: 3, nombre_sede: 'Sur', socios_activos: 1 },
  ],
}

const AFORO: ReporteAforo = {
  total_aforo_actual: 151,
  total_aforo_maximo: 230,
  sedes: [
    { id_sede: 1, nombre_sede: 'Centro', aforo_actual: 45, aforo_maximo: 100 },
    { id_sede: 2, nombre_sede: 'Norte', aforo_actual: 46, aforo_maximo: 50 },
    { id_sede: 3, nombre_sede: 'Sur', aforo_actual: 60, aforo_maximo: 80 },
  ],
}

function ocupacion(
  fecha_desde: string,
  reservasPorSede: Array<[idSede: number, canchas: number, clases: number]>
) {
  return {
    fecha_desde,
    fecha_hasta: HOY,
    sedes: reservasPorSede.map(([id_sede, canchas, clases]) => ({
      id_sede,
      nombre_sede: `Sede ${id_sede}`,
      total_asistencias: 0,
      total_reservas_canchas: canchas,
      total_reservas_clases: clases,
    })),
  }
}

/**
 * Respuestas por URL. La ocupación se pide dos veces (hoy y el mes), así que
 * su clave lleva además la fecha desde. `undefined` simula una falla.
 */
const RESPUESTAS: Record<string, unknown> = {
  '/sedes': SEDES,
  '/ciudades': CIUDADES,
  '/reportes/aforo': AFORO,
  '/reportes/socios-activos': SOCIOS_ACTIVOS,
  '/reportes/ingresos': {
    fecha_desde: INICIO_DE_MES,
    fecha_hasta: HOY,
    total_ingresos: 150000,
    sedes: [
      { id_sede: 1, nombre_sede: 'Centro', total_ingresos: 100000 },
      { id_sede: 2, nombre_sede: 'Norte', total_ingresos: 50000 },
    ],
  },
  [`/reportes/ocupacion ${HOY}`]: ocupacion(HOY, [
    [1, 3, 4],
    [2, 2, 1],
  ]),
  [`/reportes/ocupacion ${INICIO_DE_MES}`]: ocupacion(INICIO_DE_MES, [
    [1, 30, 40],
    [2, 12, 8],
    [3, 5, 0],
  ]),
}

function servidor(cambios: Record<string, unknown> = {}) {
  const datos = { ...RESPUESTAS, ...cambios }
  vi.mocked(http.get).mockImplementation(
    async (url: string, config?: { params?: unknown }) => {
      const params = (config?.params ?? {}) as Record<string, string>
      const clave =
        url === '/reportes/ocupacion' ? `${url} ${params.fecha_desde}` : url
      const data = datos[clave]
      if (data === undefined) {
        throw new Error(`Falla simulada en ${clave}`)
      }
      return { data }
    }
  )
}

async function montar() {
  const wrapper = mount(GerenciaDashboardView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

/** Texto visible con los espacios normalizados. */
const texto = (elemento: Pick<DOMWrapper<Element>, 'text'>) =>
  elemento.text().replace(/\s+/g, ' ').trim()

/** Valor de cada indicador por título ("No disponible" si falló). */
function indicadores(wrapper: VueWrapper): Record<string, string> {
  const resultado: Record<string, string> = {}
  for (const tarjeta of wrapper.findAll('article')) {
    const valor = tarjeta.find('[data-testid="valor-indicador"]')
    resultado[tarjeta.get('h2').text()] = valor.exists()
      ? texto(valor)
      : 'No disponible'
  }
  return resultado
}

function filas(wrapper: VueWrapper) {
  return wrapper.findAll('[data-testid="fila-rendimiento"]').map((fila) => ({
    sede: texto(fila.get('th')),
    socios: texto(fila.get('[data-testid="socios-sede"]')),
    aforo: texto(fila.get('[data-testid="aforo-sede"]')),
    reservas: texto(fila.get('[data-testid="reservas-sede"]')),
    recaudacion: texto(fila.get('[data-testid="recaudacion-sede"]')),
  }))
}

describe('Dashboard del gerente', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Solo se simula la fecha: "hoy" es el 27/10/2026 en hora local.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 27, 10, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('es la pantalla de inicio del rol gerente', () => {
    expect(RUTA_POR_ROL.gerente).toBe('/gerencia')
  })

  it('muestra los indicadores de toda la cadena', async () => {
    servidor()
    const wrapper = await montar()

    expect(http.get).toHaveBeenCalledWith('/reportes/ingresos', {
      params: { fecha_desde: INICIO_DE_MES, fecha_hasta: HOY },
    })
    expect(http.get).toHaveBeenCalledWith('/reportes/ocupacion', {
      params: { fecha_desde: HOY, fecha_hasta: HOY },
    })
    expect(http.get).toHaveBeenCalledWith('/reportes/socios-activos', {
      params: { fecha: HOY },
    })
    expect(http.get).toHaveBeenCalledWith('/reportes/aforo')
    // Socios activos que informa el backend; reservas de hoy: 3+4+2+1;
    // aforo simultáneo: 45+46+60.
    expect(indicadores(wrapper)).toEqual({
      'Socios activos': '4',
      'Facturación del mes': expect.stringContaining('150.000,00'),
      'Reservas de hoy': '10',
      'Aforo simultáneo': '151',
    })
    expect(wrapper.text()).toContain('desde el 01/10/2026')
    expect(texto(wrapper.get('[data-testid="sedes-activas"]'))).toBe(
      'Red de sedes: 3 activas'
    )
  })

  it('pide el aforo y los socios activos una sola vez, sin importar cuántas sedes haya', async () => {
    servidor()
    await montar()

    const urls = vi.mocked(http.get).mock.calls.map(([url]) => url)
    expect(urls.filter((url) => url.startsWith('/accesos/aforo'))).toEqual([])
    expect(urls).not.toContain('/usuarios')
    expect(urls).not.toContain('/membresias')
    expect(urls.filter((url) => url === '/reportes/aforo')).toHaveLength(1)
    expect(
      urls.filter((url) => url === '/reportes/socios-activos')
    ).toHaveLength(1)
    // Sedes, ciudades, aforo, socios activos, ingresos y ocupación (hoy y mes).
    expect(urls).toHaveLength(7)
  })

  it('arma el rendimiento del mes de cada sede', async () => {
    servidor()
    const wrapper = await montar()

    expect(http.get).toHaveBeenCalledWith('/reportes/ocupacion', {
      params: { fecha_desde: INICIO_DE_MES, fecha_hasta: HOY },
    })
    // Ordenadas por nombre, con su ciudad debajo.
    expect(filas(wrapper)).toEqual([
      {
        sede: 'Centro Paraná',
        socios: '2',
        aforo: '45 / 100 45%',
        reservas: '70',
        recaudacion: expect.stringContaining('100.000,00'),
      },
      {
        sede: 'Norte Santa Fe',
        socios: '1',
        aforo: '46 / 50 92%',
        reservas: '20',
        recaudacion: expect.stringContaining('50.000,00'),
      },
      {
        sede: 'Sur Paraná',
        socios: '1',
        aforo: '60 / 80 75%',
        reservas: '5',
        recaudacion: expect.stringMatching(/\$\s0,00$/),
      },
    ])
  })

  it('resalta el porcentaje de aforo según qué tan llena está la sede', async () => {
    servidor()
    const wrapper = await montar()

    const [centro, norte, sur] = wrapper
      .findAll('[data-testid="porcentaje-aforo"]')
      .map((porcentaje) => porcentaje.classes())

    expect(centro).toContain('bg-emerald-50')
    expect(norte).toContain('bg-rose-50')
    expect(sur).toContain('bg-amber-50')
  })

  it('agrupa los accesos por área: sedes, socios, canchas y reportes', async () => {
    servidor()
    const wrapper = await montar()

    const accesos = wrapper.get('[data-testid="accesos"]').element
    const destinos = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((enlace) => accesos.contains(enlace.element))
      .map((enlace) => enlace.props('to'))

    expect(
      wrapper
        .findAll('[data-testid="grupo-accesos"]')
        .map((grupo) => grupo.attributes('aria-label'))
    ).toEqual(['Sedes', 'Socios y membresías', 'Canchas', 'Reportes'])
    expect(destinos).toEqual([
      '/gerencia/sedes',
      '/gerencia/sedes/horarios',
      '/gerencia/sedes/calendario',
      '/gerencia/planes',
      '/gerencia/membresias',
      '/gerencia/directorio-usuarios',
      '/gerencia/canchas',
      '/gerencia/reportes',
      '/gerencia/reportes/ocupacion',
    ])
    const administrarSedes = wrapper
      .findAllComponents(RouterLinkStub)
      .find((enlace) => enlace.text().includes('Administrar sedes'))
    expect(administrarSedes?.props('to')).toBe('/gerencia/sedes')
  })

  it('si la ocupación no responde, el resto del panel se muestra igual', async () => {
    servidor({
      [`/reportes/ocupacion ${HOY}`]: undefined,
      [`/reportes/ocupacion ${INICIO_DE_MES}`]: undefined,
    })
    const wrapper = await montar()

    expect(indicadores(wrapper)).toEqual({
      'Socios activos': '4',
      'Facturación del mes': expect.stringContaining('150.000,00'),
      'Reservas de hoy': 'No disponible',
      'Aforo simultáneo': '151',
    })
    expect(filas(wrapper).map((fila) => fila.reservas)).toEqual(['—', '—', '—'])
    expect(filas(wrapper).map((fila) => fila.socios)).toEqual(['2', '1', '1'])
  })

  it('si una sede no figura en el aforo, suma las demás y la marca con un guion', async () => {
    servidor({
      '/reportes/aforo': {
        total_aforo_actual: 91,
        total_aforo_maximo: 150,
        sedes: AFORO.sedes.slice(0, 2),
      },
    })
    const wrapper = await montar()

    expect(indicadores(wrapper)['Aforo simultáneo']).toBe('91')
    expect(filas(wrapper)[2].aforo).toBe('— / 80')
  })

  it('si el aforo no responde, el indicador queda no disponible y la tabla muestra guiones', async () => {
    servidor({ '/reportes/aforo': undefined })
    const wrapper = await montar()

    expect(indicadores(wrapper)['Aforo simultáneo']).toBe('No disponible')
    expect(filas(wrapper).map((fila) => fila.aforo)).toEqual([
      '— / 100',
      '— / 50',
      '— / 80',
    ])
    expect(indicadores(wrapper)['Socios activos']).toBe('4')
  })

  it('si los socios activos no cargan, no los muestra', async () => {
    servidor({ '/reportes/socios-activos': undefined })
    const wrapper = await montar()

    expect(indicadores(wrapper)['Socios activos']).toBe('No disponible')
    expect(filas(wrapper).map((fila) => fila.socios)).toEqual(['—', '—', '—'])
    expect(indicadores(wrapper)['Reservas de hoy']).toBe('10')
  })

  it('si las sedes no cargan, avisa en la tabla y mantiene los demás indicadores', async () => {
    servidor({ '/sedes': undefined })
    const wrapper = await montar()

    expect(texto(wrapper.get('[data-testid="sedes-activas"]'))).toBe(
      'Sedes no disponibles'
    )
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'No se pudieron cargar las sedes.'
    )
    // El aforo ya no depende de la lista de sedes: el indicador se ve igual.
    expect(indicadores(wrapper)).toMatchObject({
      'Socios activos': '4',
      'Reservas de hoy': '10',
      'Aforo simultáneo': '151',
    })
  })

  it('sin sedes activas muestra la tabla vacía', async () => {
    servidor({
      '/sedes': [],
      '/reportes/aforo': {
        total_aforo_actual: 0,
        total_aforo_maximo: 0,
        sedes: [],
      },
    })
    const wrapper = await montar()

    expect(wrapper.text()).toContain('Todavía no hay sedes activas.')
    expect(texto(wrapper.get('[data-testid="sedes-activas"]'))).toBe(
      'Red de sedes: 0 activas'
    )
    expect(indicadores(wrapper)['Aforo simultáneo']).toBe('0')
  })
})
