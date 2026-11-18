// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import http from '@/common/api/http'
import { toast } from '@/common/utils/toast'
import GestionMembresiasView from '@/modules/gerencia/views/GestionMembresiasView.vue'
import {
  calcularVencimiento,
  membresiaActual,
} from '@/modules/gerencia/utils/membresias'
import type {
  EstadoMembresia,
  MembresiaSocio,
  PlanMembresia,
  SocioResumen,
  UsuarioListado,
} from '@/modules/gerencia/types/gerencia.types'
import { boton, errorHttp } from './utils/gerencia-test-utils'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/common/utils/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const ESTADOS: EstadoMembresia[] = [
  { id_membresia_estado: 1, descripcion: 'Activa' },
  { id_membresia_estado: 2, descripcion: 'Vencida' },
  { id_membresia_estado: 3, descripcion: 'Suspendida' },
]

const PLANES: PlanMembresia[] = [
  {
    id: 1,
    id_plan: 1,
    nombre: 'Plan Mensual',
    duracion_dias: 30,
    precio: 25000,
  },
  {
    id: 2,
    id_plan: 2,
    nombre: 'Plan Trimestral',
    duracion_dias: 90,
    precio: 65000,
  },
]

const socio = (
  id_usuario: number,
  nombre: string,
  apellido: string,
  dni: string
): SocioResumen => ({
  id_usuario,
  nombre,
  apellido,
  dni,
  email: `${nombre.toLowerCase()}@test.local`,
})

const SOFIA = socio(1, 'Sofía', 'Gómez', '30111222')
const VICTOR = socio(2, 'Víctor', 'Paz', '30222333')
const LUCIA = socio(3, 'Lucía', 'Ruiz', '30333444')
const CARLA = socio(4, 'Carla', 'Benítez', '30444555')
const MARTIN = socio(5, 'Martín', 'Torres', '30555666')

const ROL_SOCIO = [{ id_rol: 1, nombre: 'socio' }]
const CENTRO = { id_sede: 1, nombre: 'Centro' }
const NORTE = { id_sede: 2, nombre: 'Norte' }

const USUARIOS: UsuarioListado[] = [
  { ...SOFIA, id_sede: 1, sede: CENTRO, roles: ROL_SOCIO },
  { ...VICTOR, id_sede: 2, sede: NORTE, roles: ROL_SOCIO },
  {
    ...LUCIA,
    id_sede: 1,
    sede: CENTRO,
    usuario_rol: [{ rol: { id_rol: 1, nombre: 'socio' } }],
  },
  { ...CARLA, id_sede: 2, sede: NORTE, roles: ROL_SOCIO },
  { ...MARTIN, id_sede: 1, sede: CENTRO, roles: ROL_SOCIO },
  {
    ...socio(9, 'Gerardo', 'Luna', '20999888'),
    id_sede: 1,
    sede: CENTRO,
    roles: [{ id_rol: 3, nombre: 'gerente' }],
  },
]

function membresia(
  id_membresia: number,
  usuario: SocioResumen,
  idPlan: number,
  idEstado: number,
  fecha_inicio: string,
  fecha_fin: string,
  renovacion_automatica = false
): MembresiaSocio {
  const plan = PLANES[idPlan - 1]
  return {
    id_membresia,
    fecha_inicio: `${fecha_inicio}T00:00:00.000Z`,
    fecha_fin: `${fecha_fin}T00:00:00.000Z`,
    renovacion_automatica,
    id_usuario: usuario.id_usuario,
    id_membresia_plan: idPlan,
    id_membresia_estado: idEstado,
    membresia_plan: {
      id_membresia_plan: idPlan,
      nombre: plan.nombre,
      duracion_dias: plan.duracion_dias,
      precio: plan.precio,
    },
    membresia_estado: ESTADOS[idEstado - 1],
    usuario,
  }
}

// Las vigentes vencen en 2099 para que la prueba no dependa de la fecha de hoy.
const MEMBRESIAS: MembresiaSocio[] = [
  membresia(10, SOFIA, 1, 1, '2026-10-01', '2099-11-01'),
  membresia(11, VICTOR, 2, 2, '2026-06-01', '2026-09-01', true),
  membresia(12, CARLA, 1, 3, '2026-01-01', '2026-02-01'),
  membresia(13, CARLA, 2, 1, '2026-09-15', '2099-12-15'),
  membresia(14, MARTIN, 1, 3, '2026-10-10', '2099-11-10'),
]

function servidor(respuestas: Record<string, unknown> = {}) {
  const datos: Record<string, unknown> = {
    '/membresias': MEMBRESIAS,
    '/membresias/estados': ESTADOS,
    '/planes': PLANES,
    '/usuarios': USUARIOS,
    ...respuestas,
  }
  vi.mocked(http.get).mockImplementation(async (url: string) => {
    const respuesta = datos[url]
    if (respuesta instanceof Error) throw respuesta
    return { data: respuesta }
  })
}

async function montar() {
  const wrapper = mount(GestionMembresiasView, {
    global: { stubs: { teleport: true, RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

type Envoltorio = Awaited<ReturnType<typeof montar>>

const filas = (wrapper: Envoltorio) =>
  wrapper.findAll('[data-testid="fila-socio"]')

const valorDe = (wrapper: Envoltorio, selector: string) =>
  (wrapper.get(selector).element as HTMLSelectElement).value

describe('Membresías de socios (panel de gerencia)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    servidor()
  })

  it('muestra una fila por socio con sede, plan y vencimiento, estado y resumen', async () => {
    const wrapper = await montar()

    expect(http.get).toHaveBeenCalledWith('/membresias')
    expect(http.get).toHaveBeenCalledWith('/membresias/estados')
    expect(http.get).toHaveBeenCalledWith('/usuarios')

    const listado = filas(wrapper)
    expect(listado.map((fila) => fila.find('th').text())).toEqual([
      expect.stringContaining('Carla Benítez'),
      expect.stringContaining('Sofía Gómez'),
      expect.stringContaining('Víctor Paz'),
      expect.stringContaining('Lucía Ruiz'),
      expect.stringContaining('Martín Torres'),
    ])
    expect(wrapper.text()).not.toContain('Gerardo')

    // Carla tuvo una suspendida y hoy tiene una activa: se muestra la activa.
    expect(listado[0].text()).toContain('Plan Trimestral')
    expect(listado[0].text()).toContain('Vence el 15/12/2099')
    expect(listado[0].text()).toContain('Norte')
    expect(listado[1].get('[data-testid="estado-membresia"]').text()).toBe(
      'Activa'
    )
    expect(listado[3].text()).toContain('Sin membresía')

    expect(wrapper.get('[data-testid="total-1"]').text()).toBe('2')
    expect(wrapper.get('[data-testid="total-2"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="total-3"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="total-sin-membresia"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="total-socios"]').text()).toBe('5 socios')
  })

  it('filtra por estado (incluido sin membresía), por sede y por búsqueda', async () => {
    const wrapper = await montar()

    await wrapper.get('#filtro-estado').setValue('sin-membresia')
    expect(filas(wrapper)).toHaveLength(1)
    expect(filas(wrapper)[0].text()).toContain('Lucía Ruiz')

    await wrapper.get('#filtro-estado').setValue('1')
    await wrapper.get('#filtro-sede').setValue('2')
    expect(filas(wrapper)).toHaveLength(1)
    expect(filas(wrapper)[0].text()).toContain('Carla Benítez')

    await wrapper.get('#filtro-estado').setValue('')
    await wrapper.get('#filtro-sede').setValue('')
    await wrapper.get('#filtro-busqueda').setValue('martin')
    expect(filas(wrapper)).toHaveLength(1)
    expect(filas(wrapper)[0].text()).toContain('Martín Torres')

    await wrapper.get('#filtro-busqueda').setValue('nadie')
    expect(wrapper.text()).toContain('Ningún socio coincide')
    await boton(wrapper, 'Limpiar filtros').trigger('click')
    expect(filas(wrapper)).toHaveLength(5)
  })

  it('Asociar abre el alta con el socio elegido y la crea', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: membresia(20, LUCIA, 1, 1, '2026-10-27', '2026-11-27'),
    })
    const wrapper = await montar()

    await boton(wrapper, 'Asociar membresía a Lucía Ruiz').trigger('click')
    expect(wrapper.text()).toContain('Asociar membresía')
    expect(valorDe(wrapper, '#membresia-socio')).toBe('3')

    await wrapper.get('#membresia-plan').setValue('1')
    await wrapper.get('#membresia-inicio').setValue('2026-10-27')
    expect(
      wrapper.get('[data-testid="vencimiento-estimado"]').text()
    ).toContain('27/11/2026')
    await boton(wrapper, 'Dar de alta').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/membresias', {
      id_usuario: 3,
      id_membresia_plan: 1,
      fecha_inicio: '2026-10-27',
      renovacion_automatica: false,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Membresía de Lucía Ruiz dada de alta.'
    )
  })

  it('Renovar abre el alta con el socio y el mismo plan', async () => {
    const wrapper = await montar()

    await boton(wrapper, 'Renovar membresía de Víctor Paz').trigger('click')

    expect(wrapper.text()).toContain('Renovar membresía')
    expect(valorDe(wrapper, '#membresia-socio')).toBe('2')
    expect(valorDe(wrapper, '#membresia-plan')).toBe('2')
  })

  it('Reactivar pasa la membresía suspendida a Activa', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Reactivar membresía de Martín Torres').trigger(
      'click'
    )
    await flushPromises()

    expect(http.patch).toHaveBeenCalledWith('/membresias/14/estado', {
      id_membresia_estado: 1,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Membresía de Martín Torres reactivada.'
    )
  })

  it('Gestionar edita estado y vencimiento con sus endpoints', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Gestionar membresía de Víctor Paz').trigger('click')
    await wrapper.get('#membresia-estado').setValue('1')
    await wrapper.get('#membresia-vencimiento').setValue('2026-12-31')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    expect(http.patch).toHaveBeenCalledWith('/membresias/11', {
      fecha_fin: '2026-12-31',
    })
    expect(http.patch).toHaveBeenCalledWith('/membresias/11/estado', {
      id_membresia_estado: 1,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Membresía de Víctor Paz actualizada.'
    )
  })

  it('si solo cambia el estado, usa únicamente PATCH /membresias/:id/estado', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Gestionar membresía de Sofía Gómez').trigger('click')
    await wrapper.get('#membresia-estado').setValue('3')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    expect(http.patch).toHaveBeenCalledTimes(1)
    expect(http.patch).toHaveBeenCalledWith('/membresias/10/estado', {
      id_membresia_estado: 3,
    })
  })

  it('no guarda un vencimiento anterior al inicio', async () => {
    const wrapper = await montar()

    await boton(wrapper, 'Gestionar membresía de Sofía Gómez').trigger('click')
    await wrapper.get('#membresia-vencimiento').setValue('2026-09-01')
    await boton(wrapper, 'Guardar cambios').trigger('click')

    expect(wrapper.text()).toContain(
      'El vencimiento no puede ser anterior al inicio de la membresía.'
    )
    expect(http.patch).not.toHaveBeenCalled()
  })

  it('elimina desde la gestión con confirmación y muestra el motivo si tiene pagos', async () => {
    vi.mocked(http.delete)
      .mockRejectedValueOnce(
        errorHttp(
          409,
          'La membresía tiene pagos registrados y no se puede eliminar. Cambiá su estado a Suspendida.'
        )
      )
      .mockResolvedValueOnce({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Gestionar membresía de Sofía Gómez').trigger('click')
    await boton(wrapper, 'Eliminar membresía').trigger('click')
    expect(wrapper.text()).toContain('Se eliminará la membresía de')
    await boton(wrapper, 'Sí, eliminar').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/membresias/10')
    expect(wrapper.text()).toContain('tiene pagos registrados')
    expect(toast.success).not.toHaveBeenCalled()

    await boton(wrapper, 'Gestionar membresía de Víctor Paz').trigger('click')
    await boton(wrapper, 'Eliminar membresía').trigger('click')
    await boton(wrapper, 'Sí, eliminar').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenLastCalledWith('/membresias/11')
    expect(toast.success).toHaveBeenCalledWith(
      'Membresía de Víctor Paz eliminada.'
    )
  })

  it('valida los obligatorios del alta y avisa si el socio ya tiene una activa', async () => {
    const wrapper = await montar()

    await boton(wrapper, 'Nueva membresía').trigger('click')
    await boton(wrapper, 'Dar de alta').trigger('click')

    expect(wrapper.text()).toContain('Elegí un socio.')
    expect(wrapper.text()).toContain('Elegí un plan.')
    expect(http.post).not.toHaveBeenCalled()

    await wrapper.get('#membresia-socio').setValue('1')
    expect(
      wrapper.get('[data-testid="aviso-membresia-activa"]').text()
    ).toContain('la anterior pasa a Suspendida')
  })

  it('muestra un error si no se pudieron cargar los datos y permite reintentar', async () => {
    servidor({ '/membresias': errorHttp(500, 'Error interno') })
    const wrapper = await montar()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudieron cargar las membresías'
    )

    servidor()
    await boton(wrapper, 'Reintentar').trigger('click')
    await flushPromises()
    expect(filas(wrapper)).toHaveLength(5)
  })
})

describe('membresiaActual', () => {
  it('prefiere la activa más reciente y si no hay, la última que tuvo', () => {
    const anterior = membresia(1, SOFIA, 1, 3, '2026-01-01', '2026-02-01')
    const activa = membresia(2, SOFIA, 1, 1, '2026-03-01', '2026-04-01')
    const posteriorSuspendida = membresia(
      3,
      SOFIA,
      1,
      3,
      '2026-05-01',
      '2026-06-01'
    )

    expect(
      membresiaActual([anterior, activa, posteriorSuspendida])?.id_membresia
    ).toBe(2)
    expect(membresiaActual([anterior, posteriorSuspendida])?.id_membresia).toBe(
      3
    )
    expect(membresiaActual([])).toBeNull()
  })
})

describe('calcularVencimiento', () => {
  it.each([
    ['2026-10-27', 30, '2026-11-27'],
    ['2026-01-31', 30, '2026-02-28'],
    ['2026-11-30', 90, '2027-02-28'],
    ['2026-02-28', 365, '2027-02-28'],
    ['2026-10-27', 15, '2026-11-11'],
  ])('%s + plan de %i días vence el %s', (inicio, dias, esperado) => {
    expect(calcularVencimiento(inicio, dias)).toBe(esperado)
  })
})
