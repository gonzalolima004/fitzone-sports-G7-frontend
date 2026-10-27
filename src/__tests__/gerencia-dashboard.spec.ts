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
  AforoSede,
  Ciudad,
  EstadoMembresia,
  MembresiaSocio,
  SedeGestion,
  UsuarioListado,
} from '@/modules/gerencia/types/gerencia.types'

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

const aforo = (idSede: number, aforoActual: number): AforoSede => ({
  idSede,
  aforoActual,
  aforoMaximo: SEDES.find((sede) => sede.id_sede === idSede)?.aforo_maximo ?? 0,
})

const usuario = (
  id_usuario: number,
  nombre: string,
  id_sede: number | null,
  rol = 'socio'
): UsuarioListado => ({
  id_usuario,
  nombre,
  apellido: 'Prueba',
  dni: String(30000000 + id_usuario),
  email: `${nombre.toLowerCase()}@test.local`,
  id_sede,
  roles: [{ id_rol: rol === 'socio' ? 1 : 3, nombre: rol }],
})

const SOFIA = usuario(1, 'Sofia', 1)
const VICTOR = usuario(2, 'Victor', 2)
const CARLA = usuario(3, 'Carla', 2)
const MARTIN = usuario(4, 'Martin', 1)
const ANA = usuario(5, 'Ana', 3)
const USUARIOS = [
  SOFIA,
  VICTOR,
  CARLA,
  MARTIN,
  ANA,
  usuario(6, 'Gerardo', null, 'gerente'),
]

const ESTADOS: Record<string, EstadoMembresia> = {
  Activa: { id_membresia_estado: 1, descripcion: 'Activa' },
  Vencida: { id_membresia_estado: 2, descripcion: 'Vencida' },
  Suspendida: { id_membresia_estado: 3, descripcion: 'Suspendida' },
}

function membresia(
  id_membresia: number,
  titular: UsuarioListado,
  estado: keyof typeof ESTADOS,
  fecha_fin: string
): MembresiaSocio {
  return {
    id_membresia,
    fecha_inicio: '2026-01-01T00:00:00.000Z',
    fecha_fin: `${fecha_fin}T00:00:00.000Z`,
    renovacion_automatica: false,
    id_usuario: titular.id_usuario,
    id_membresia_plan: 1,
    id_membresia_estado: ESTADOS[estado].id_membresia_estado,
    membresia_plan: {
      id_membresia_plan: 1,
      nombre: 'Plan Mensual',
      duracion_dias: 30,
      precio: 25000,
    },
    membresia_estado: ESTADOS[estado],
    usuario: titular,
  }
}

// Socios activos: Sofía y Martín (Centro), Carla (Norte) y Ana (Sur).
const MEMBRESIAS: MembresiaSocio[] = [
  membresia(10, SOFIA, 'Activa', '2099-11-01'),
  // Figura activa pero venció ayer: no cuenta.
  membresia(11, VICTOR, 'Activa', '2026-10-26'),
  membresia(12, CARLA, 'Suspendida', '2026-08-01'),
  membresia(13, CARLA, 'Activa', '2099-12-15'),
  membresia(14, MARTIN, 'Activa', '2099-11-10'),
  // Vence hoy: sigue vigente.
  membresia(15, ANA, 'Activa', HOY),
  membresia(16, ANA, 'Vencida', '2026-09-27'),
]

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
  '/accesos/aforo/1': aforo(1, 45),
  '/accesos/aforo/2': aforo(2, 46),
  '/accesos/aforo/3': aforo(3, 60),
  '/membresias': MEMBRESIAS,
  '/usuarios': USUARIOS,
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
    // Socios con membresía activa y vigente; reservas de hoy: 3+4+2+1;
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

  it('arma el rendimiento del mes de cada sede', async () => {
    servidor()
    const wrapper = await montar()

    expect(http.get).toHaveBeenCalledWith('/reportes/ocupacion', {
      params: { fecha_desde: INICIO_DE_MES, fecha_hasta: HOY },
    })
    expect(http.get).toHaveBeenCalledWith('/accesos/aforo/3')
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

  it('ofrece accesos a sedes, planes, membresías, canchas y reportes', async () => {
    servidor()
    const wrapper = await montar()

    const accesos = wrapper.get('[data-testid="accesos"]').element
    const destinos = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((enlace) => accesos.contains(enlace.element))
      .map((enlace) => enlace.props('to'))

    expect(destinos).toEqual([
      '/gerencia/sedes',
      '/gerencia/planes',
      '/gerencia/membresias',
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

  it('si una sede no informa su aforo, suma las demás y la marca con un guion', async () => {
    servidor({ '/accesos/aforo/3': undefined })
    const wrapper = await montar()

    expect(indicadores(wrapper)['Aforo simultáneo']).toBe('91')
    expect(filas(wrapper)[2].aforo).toBe('— / 80')
  })

  it('si ninguna sede informa su aforo, el indicador queda no disponible', async () => {
    servidor({
      '/accesos/aforo/1': undefined,
      '/accesos/aforo/2': undefined,
      '/accesos/aforo/3': undefined,
    })
    const wrapper = await montar()

    expect(indicadores(wrapper)['Aforo simultáneo']).toBe('No disponible')
    expect(wrapper.findAll('[data-testid="fila-rendimiento"]')).toHaveLength(3)
  })

  it('si las membresías no cargan, no muestra socios activos', async () => {
    servidor({ '/membresias': undefined })
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
    expect(indicadores(wrapper)).toMatchObject({
      'Socios activos': '4',
      'Reservas de hoy': '10',
      'Aforo simultáneo': 'No disponible',
    })
    expect(http.get).not.toHaveBeenCalledWith('/accesos/aforo/1')
  })

  it('sin sedes activas muestra la tabla vacía', async () => {
    servidor({ '/sedes': [] })
    const wrapper = await montar()

    expect(wrapper.text()).toContain('Todavía no hay sedes activas.')
    expect(texto(wrapper.get('[data-testid="sedes-activas"]'))).toBe(
      'Red de sedes: 0 activas'
    )
    expect(indicadores(wrapper)['Aforo simultáneo']).toBe('0')
  })
})
