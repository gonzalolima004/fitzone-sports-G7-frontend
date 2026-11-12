// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  flushPromises,
  mount,
  RouterLinkStub,
  type DOMWrapper,
  type VueWrapper,
} from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/common/api/http'
import { toast } from '@/common/utils/toast'
import { useSedeStore, type HorarioOperativo } from '@/store/sede'
import type { RolUsuario } from '@/store/auth'
import GestionCalendarioView from '@/modules/gerencia/views/GestionCalendarioView.vue'
import {
  excepcionSchema,
  feriadoSchema,
} from '@/modules/gerencia/schemas/calendario.schema'
import {
  describirFecha,
  moverMes,
  rangoDelMes,
  semanasDelMes,
} from '@/modules/gerencia/utils/calendario'
import type {
  ExcepcionSede,
  FechaCalendario,
  SedeGestion,
} from '@/modules/gerencia/types/gerencia.types'
import { boton, errorHttp } from './utils/gerencia-test-utils'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/common/utils/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

// Sesión simulada para probar el guard real del router.
const sesion = vi.hoisted(() => ({
  isInitialized: true,
  isAuthenticated: true,
  rol: 'gerente' as string,
  usuario: { rol: 'gerente' as string },
  initialize: async () => {},
  logout: async () => {},
  setPerfilInterno: () => {},
}))
vi.mock('@/store/auth', () => ({ useAuthStore: () => sesion }))
vi.mock('@/common/api/supabase', () => ({ supabase: {} }))
vi.mock('@/common/utils/supabase', () => ({ supabase: {} }))

// "Hoy" es el martes 10/11/2026.
const NOVIEMBRE = { desde: '2026-11-01', hasta: '2026-11-30' }

const SEDES: SedeGestion[] = [
  {
    id_sede: 1,
    nombre: 'Centro',
    direccion: 'San Martín 100',
    aforo_maximo: 120,
    activo: true,
    id_ciudad: 1,
  },
  {
    id_sede: 2,
    nombre: 'Norte',
    direccion: 'Belgrano 50',
    aforo_maximo: 80,
    activo: true,
    id_ciudad: 2,
  },
]

const SOBERANIA: FechaCalendario = {
  id_calendario: 1,
  fecha: '2026-11-23',
  descripcion: 'Día de la Soberanía Nacional',
  es_feriado: true,
  es_dia_habil: false,
}

// Día común: el backend lo agrega al cargar la excepción de una sede.
const DIA_COMUN: FechaCalendario = {
  id_calendario: 2,
  fecha: '2026-11-10',
  descripcion: null,
  es_feriado: false,
  es_dia_habil: true,
}

const CIERRE_CENTRO: ExcepcionSede = {
  id_calendario_sede: 1,
  id_sede: 1,
  id_calendario: 2,
  fecha: '2026-11-10',
  cerrado: true,
  hora_apertura: null,
  hora_cierre: null,
  motivo: 'Fumigación',
  calendario: DIA_COMUN,
}

const HORARIO_CENTRO: ExcepcionSede = {
  id_calendario_sede: 2,
  id_sede: 1,
  id_calendario: 1,
  fecha: '2026-11-23',
  cerrado: false,
  hora_apertura: '10:00',
  hora_cierre: '14:00',
  motivo: 'Horario reducido por feriado',
  calendario: SOBERANIA,
}

const CIERRE_NORTE: ExcepcionSede = {
  id_calendario_sede: 3,
  id_sede: 2,
  id_calendario: 1,
  fecha: '2026-11-23',
  cerrado: true,
  hora_apertura: null,
  hora_cierre: null,
  motivo: null,
  calendario: SOBERANIA,
}

const HORARIO_SEMANAL: HorarioOperativo = {
  abierto: true,
  hora_apertura: '08:00',
  hora_cierre: '22:00',
}

let fechas: FechaCalendario[] = []
let excepciones: ExcepcionSede[] = []
let errorCalendario: Error | null = null

function servidor() {
  vi.mocked(http.get).mockImplementation(
    async (url: string, config?: { params?: unknown }) => {
      if (url === '/sedes') return { data: SEDES }

      const { desde, hasta } = config?.params as {
        desde: string
        hasta: string
      }
      const enRango = (fecha: string) => fecha >= desde && fecha <= hasta

      if (url === '/calendario') {
        if (errorCalendario) throw errorCalendario
        return { data: fechas.filter((dia) => enRango(dia.fecha)) }
      }
      const deSede = url.match(/^\/sedes\/(\d+)\/calendario$/)
      if (deSede) {
        return {
          data: excepciones.filter(
            (excepcion) =>
              excepcion.id_sede === Number(deSede[1]) &&
              enRango(excepcion.fecha)
          ),
        }
      }
      throw new Error(`URL no esperada: ${url}`)
    }
  )
}

async function montar() {
  const wrapper = mount(GestionCalendarioView, {
    global: { stubs: { teleport: true, RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

/** Texto visible con los espacios normalizados. */
const texto = (elemento: Pick<DOMWrapper<Element>, 'text'>) =>
  elemento.text().replace(/\s+/g, ' ').trim()

const celda = (wrapper: VueWrapper, fecha: string) =>
  wrapper.get(`[data-testid="dia-${fecha}"]`)

const tituloMes = (wrapper: VueWrapper) =>
  wrapper.get('[data-testid="titulo-mes"]').text()

const pedidosA = (url: string) =>
  vi.mocked(http.get).mock.calls.filter(([pedido]) => pedido === url)

describe('Calendario de sedes (panel de gerencia)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Solo se simula la fecha: "hoy" es el 10/11/2026 en hora local.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 10, 12, 0))
    localStorage.clear()
    setActivePinia(createPinia())
    fechas = [DIA_COMUN, SOBERANIA]
    excepciones = [CIERRE_CENTRO, HORARIO_CENTRO, CIERRE_NORTE]
    errorCalendario = null
    servidor()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra el mes en curso con los feriados y las excepciones de la sede', async () => {
    const wrapper = await montar()

    expect(http.get).toHaveBeenCalledWith('/calendario', { params: NOVIEMBRE })
    expect(http.get).toHaveBeenCalledWith('/sedes/1/calendario', {
      params: NOVIEMBRE,
    })
    expect(tituloMes(wrapper)).toBe('Noviembre 2026')

    // El 23 es feriado de toda la cadena y Centro abre con horario especial.
    const dia23 = celda(wrapper, '2026-11-23')
    expect(dia23.get('[data-testid="marca-feriado"]').text()).toBe(
      'Día de la Soberanía Nacional'
    )
    expect(dia23.get('[data-testid="marca-excepcion"]').text()).toBe(
      '10:00–14:00'
    )
    expect(dia23.attributes('aria-label')).toBe(
      'Lunes 23 de noviembre. Feriado: Día de la Soberanía Nacional. Centro: Abre de 10:00 a 14:00'
    )

    // El 10 es un día común con un cierre de Centro: solo se marca el cierre.
    const dia10 = celda(wrapper, '2026-11-10')
    expect(dia10.find('[data-testid="marca-feriado"]').exists()).toBe(false)
    expect(dia10.get('[data-testid="marca-excepcion"]').text()).toBe('Cerrada')
    expect(dia10.attributes('aria-pressed')).toBe('true')

    const detalle = texto(wrapper.get('[data-testid="detalle-dia"]'))
    expect(detalle).toContain('Martes 10 de noviembre')
    expect(detalle).toContain('Cerrada todo el día')
    expect(detalle).toContain('Fumigación')

    const filas = wrapper.findAll('[data-testid="fecha-del-mes"]').map(texto)
    expect(filas).toHaveLength(3)
    expect(filas[0]).toMatch(/^10\/11martes/)
    expect(filas[0]).toContain('Cierre · Centro')
    expect(filas[0]).toContain('Cerrada todo el día · Fumigación')
    expect(filas[1]).toMatch(/^23\/11lunes/)
    expect(filas[1]).toContain('Feriado · todas las sedes')
    expect(filas[1]).toContain('Día de la Soberanía Nacional')
    expect(filas[2]).toMatch(/^23\/11lunes/)
    expect(filas[2]).toContain('Horario especial · Centro')
    expect(filas[2]).toContain('Abre de 10:00 a 14:00 · Horario reducido')
  })

  it('vuelve a pedir el calendario al cambiar de mes y de sede', async () => {
    const wrapper = await montar()
    const diciembre = { desde: '2026-12-01', hasta: '2026-12-31' }

    await boton(wrapper, 'Mes siguiente').trigger('click')
    await flushPromises()

    expect(tituloMes(wrapper)).toBe('Diciembre 2026')
    expect(http.get).toHaveBeenCalledWith('/calendario', { params: diciembre })
    expect(http.get).toHaveBeenCalledWith('/sedes/1/calendario', {
      params: diciembre,
    })

    // La sede del calendario es la misma del selector del encabezado.
    await wrapper.get('#sede-calendario').setValue('2')
    await flushPromises()

    expect(useSedeStore().sedeSeleccionada?.id_sede).toBe(2)
    expect(http.get).toHaveBeenCalledWith('/sedes/2/calendario', {
      params: diciembre,
    })

    await boton(wrapper, 'Hoy').trigger('click')
    await flushPromises()

    expect(tituloMes(wrapper)).toBe('Noviembre 2026')
    expect(
      celda(wrapper, '2026-11-23').get('[data-testid="marca-excepcion"]').text()
    ).toBe('Cerrada')
  })

  it('valida y da de alta un feriado para toda la cadena', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: {} })
    const wrapper = await montar()
    const sedeStore = useSedeStore()
    sedeStore.horariosCache['1_2026-11-06'] = HORARIO_SEMANAL
    sedeStore.horariosCache['2_2026-11-06'] = HORARIO_SEMANAL
    sedeStore.horariosCache['1_2026-11-07'] = HORARIO_SEMANAL

    await celda(wrapper, '2026-11-06').trigger('click')
    await boton(wrapper, 'Agregar feriado este día').trigger('click')
    expect(
      (wrapper.get('#feriado-fecha').element as HTMLInputElement).value
    ).toBe('2026-11-06')

    await boton(wrapper, 'Agregar al calendario').trigger('click')
    expect(wrapper.text()).toContain(
      'Ingresá el nombre del feriado o de la fecha.'
    )
    expect(http.post).not.toHaveBeenCalled()

    await wrapper
      .get('#feriado-descripcion')
      .setValue(' Aniversario de la ciudad ')
    await boton(wrapper, 'Agregar al calendario').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/calendario', {
      fecha: '2026-11-06',
      descripcion: 'Aniversario de la ciudad',
      es_feriado: true,
      es_dia_habil: false,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Aniversario de la ciudad agregado al calendario.'
    )
    expect(wrapper.find('#feriado-descripcion').exists()).toBe(false)
    expect(pedidosA('/calendario')).toHaveLength(2)
    // Canchas y clases vuelven a pedir el horario de ese día en todas las sedes.
    expect(Object.keys(sedeStore.horariosCache)).toEqual(['1_2026-11-07'])
  })

  it('marca como feriado un día común que ya está en el calendario', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    // Hoy (10/11) ya existe como día común por el cierre de Centro.
    await boton(wrapper, 'Agregar feriado este día').trigger('click')
    await wrapper.get('#feriado-descripcion').setValue('Asueto administrativo')
    await boton(wrapper, 'Agregar al calendario').trigger('click')
    await flushPromises()

    expect(http.post).not.toHaveBeenCalled()
    expect(http.patch).toHaveBeenCalledWith('/calendario/2', {
      fecha: '2026-11-10',
      descripcion: 'Asueto administrativo',
      es_feriado: true,
      es_dia_habil: false,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Asueto administrativo agregado al calendario.'
    )
  })

  it('busca la fecha si ya existe en otro mes y la actualiza', async () => {
    fechas = [
      ...fechas,
      {
        id_calendario: 7,
        fecha: '2026-12-07',
        descripcion: null,
        es_feriado: false,
        es_dia_habil: true,
      },
    ]
    vi.mocked(http.post).mockRejectedValue(
      errorHttp(409, 'La fecha 2026-12-07 ya está cargada en el calendario.')
    )
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Nuevo feriado').trigger('click')
    await wrapper.get('#feriado-fecha').setValue('2026-12-07')
    await wrapper.get('#feriado-descripcion').setValue('Feriado puente')
    await boton(wrapper, 'Agregar al calendario').trigger('click')
    await flushPromises()

    expect(http.get).toHaveBeenCalledWith('/calendario', {
      params: { desde: '2026-12-07', hasta: '2026-12-07' },
    })
    expect(http.patch).toHaveBeenCalledWith('/calendario/7', {
      fecha: '2026-12-07',
      descripcion: 'Feriado puente',
      es_feriado: true,
      es_dia_habil: false,
    })
    // El calendario pasa al mes de la fecha cargada.
    expect(tituloMes(wrapper)).toBe('Diciembre 2026')
  })

  it('no duplica un feriado: pide editar la fecha que ya existe', async () => {
    const wrapper = await montar()

    await boton(wrapper, 'Nuevo feriado').trigger('click')
    await wrapper.get('#feriado-fecha').setValue('2026-11-23')
    await wrapper.get('#feriado-descripcion').setValue('Otro feriado')
    await boton(wrapper, 'Agregar al calendario').trigger('click')
    await flushPromises()

    expect(http.post).not.toHaveBeenCalled()
    expect(http.patch).not.toHaveBeenCalled()
    expect(texto(wrapper)).toContain(
      'El 23/11/2026 ya está en el calendario (Día de la Soberanía Nacional). Editá esa fecha en lugar de cargarla de nuevo.'
    )
  })

  it('carga un horario especial para la sede validando el rango horario', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: {} })
    const wrapper = await montar()
    const sedeStore = useSedeStore()
    sedeStore.horariosCache['1_2026-11-27'] = HORARIO_SEMANAL
    sedeStore.horariosCache['2_2026-11-27'] = HORARIO_SEMANAL

    await celda(wrapper, '2026-11-27').trigger('click')
    await boton(wrapper, 'Agregar excepción para Centro').trigger('click')
    await wrapper.get('#excepcion-tipo-horario').setValue(true)
    await boton(wrapper, 'Cargar excepción').trigger('click')

    expect(wrapper.text()).toContain('Indicá la hora de apertura.')
    expect(wrapper.text()).toContain('Indicá la hora de cierre.')

    await wrapper.get('#excepcion-apertura').setValue('18:00')
    await wrapper.get('#excepcion-cierre').setValue('09:00')
    await boton(wrapper, 'Cargar excepción').trigger('click')

    expect(wrapper.text()).toContain(
      'El cierre tiene que ser posterior a la apertura.'
    )
    expect(http.post).not.toHaveBeenCalled()

    await wrapper.get('#excepcion-cierre').setValue('22:00')
    await wrapper.get('#excepcion-motivo').setValue('Evento nocturno')
    await boton(wrapper, 'Cargar excepción').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/sedes/1/calendario', {
      fecha: '2026-11-27',
      cerrado: false,
      hora_apertura: '18:00',
      hora_cierre: '22:00',
      motivo: 'Evento nocturno',
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Excepción cargada para Centro el 27/11/2026.'
    )
    // Solo cambia el horario de Centro: el de Norte sigue en caché.
    expect(Object.keys(sedeStore.horariosCache)).toEqual(['2_2026-11-27'])
  })

  it('carga un cierre de todo el día sin enviar horarios', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await celda(wrapper, '2026-11-16').trigger('click')
    await boton(wrapper, 'Nueva excepción').trigger('click')

    expect(
      (wrapper.get('#excepcion-tipo-cierre').element as HTMLInputElement)
        .checked
    ).toBe(true)
    expect(wrapper.find('#excepcion-apertura').exists()).toBe(false)

    await wrapper.get('#excepcion-motivo').setValue('Mantenimiento eléctrico')
    await boton(wrapper, 'Cargar excepción').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/sedes/1/calendario', {
      fecha: '2026-11-16',
      cerrado: true,
      motivo: 'Mantenimiento eléctrico',
    })
  })

  it('edita una excepción sin reenviar la fecha si no cambió', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await celda(wrapper, '2026-11-23').trigger('click')
    await boton(wrapper, 'Editar excepción de Centro del 23/11').trigger(
      'click'
    )

    expect(
      (wrapper.get('#excepcion-tipo-horario').element as HTMLInputElement)
        .checked
    ).toBe(true)
    await wrapper.get('#excepcion-cierre').setValue('16:00')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    const [url, cuerpo] = vi.mocked(http.patch).mock.calls[0]
    expect(url).toBe('/sedes/1/calendario/2')
    expect(cuerpo).toEqual({
      cerrado: false,
      hora_apertura: '10:00',
      hora_cierre: '16:00',
      motivo: 'Horario reducido por feriado',
    })
    expect(JSON.stringify(cuerpo)).not.toContain('fecha')
    expect(toast.success).toHaveBeenCalledWith(
      'Excepción de Centro actualizada.'
    )
  })

  it('quita un feriado sin excepciones del calendario', async () => {
    fechas = [
      ...fechas,
      {
        id_calendario: 5,
        fecha: '2026-11-20',
        descripcion: 'Feriado puente',
        es_feriado: true,
        es_dia_habil: false,
      },
    ]
    vi.mocked(http.delete).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Quitar Feriado puente del 20/11').trigger('click')
    await boton(wrapper, 'Sí, quitar').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/calendario/5')
    expect(http.patch).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(
      'Feriado puente se quitó del calendario.'
    )
  })

  it('si alguna sede tiene excepción ese día, deja la fecha como día común', async () => {
    vi.mocked(http.delete).mockRejectedValue(
      errorHttp(
        409,
        'La fecha tiene excepciones cargadas en una o más sedes. Eliminá esas excepciones antes de borrar la fecha.'
      )
    )
    vi.mocked(http.patch).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await celda(wrapper, '2026-11-23').trigger('click')
    await boton(
      wrapper,
      'Quitar Día de la Soberanía Nacional del 23/11'
    ).trigger('click')
    expect(texto(wrapper)).toContain(
      'Las excepciones que tenga alguna sede ese día se mantienen.'
    )
    await boton(wrapper, 'Sí, quitar').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/calendario/1')
    expect(http.patch).toHaveBeenCalledWith('/calendario/1', {
      descripcion: null,
      es_feriado: false,
      es_dia_habil: true,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Día de la Soberanía Nacional se quitó del calendario. Las excepciones de las sedes para ese día se mantienen.'
    )
  })

  it('elimina la excepción y la sede vuelve a su horario semanal', async () => {
    vi.mocked(http.delete).mockResolvedValue({ data: {} })
    const wrapper = await montar()

    await boton(wrapper, 'Eliminar excepción de Centro del 10/11').trigger(
      'click'
    )
    expect(texto(wrapper)).toContain(
      'Centro vuelve a su horario semanal el 10/11/2026.'
    )
    await boton(wrapper, 'Sí, eliminar').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/sedes/1/calendario/1')
    expect(toast.success).toHaveBeenCalledWith(
      'Excepción de Centro del 10/11/2026 eliminada.'
    )
    expect(pedidosA('/calendario')).toHaveLength(2)
  })

  it('muestra el rechazo del servidor y deja el formulario abierto', async () => {
    vi.mocked(http.post).mockRejectedValue(
      errorHttp(
        403,
        'Acceso denegado: se requiere uno de los siguientes roles: [gerente].'
      )
    )
    const wrapper = await montar()

    await celda(wrapper, '2026-11-06').trigger('click')
    await boton(wrapper, 'Nuevo feriado').trigger('click')
    await wrapper.get('#feriado-descripcion').setValue('Aniversario')
    await boton(wrapper, 'Agregar al calendario').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Acceso denegado: se requiere uno de los siguientes roles: [gerente].'
    )
    expect(wrapper.find('#feriado-descripcion').exists()).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('avisa si no pudo cargar el calendario y permite reintentar', async () => {
    errorCalendario = errorHttp(500, 'Internal server error')
    const wrapper = await montar()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo cargar el calendario. Revisá la conexión e intentá nuevamente.'
    )
    expect(wrapper.find('[data-testid="grilla-calendario"]').exists()).toBe(
      false
    )

    errorCalendario = null
    await boton(wrapper, 'Reintentar').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="grilla-calendario"]').exists()).toBe(
      true
    )
  })
})

describe('Calendario de sedes: acceso por rol', () => {
  it('solo el gerente puede abrir la pantalla', async () => {
    const { router } = await import('@/router')
    const roles: RolUsuario[] = ['socio', 'externo', 'recepcionista']

    for (const rol of roles) {
      sesion.rol = rol
      sesion.usuario = { rol }
      // El guard lo saca de gerencia; adónde lo manda depende de cada rol.
      await router.push('/gerencia/sedes/calendario').catch(() => undefined)
      expect(router.currentRoute.value.path).not.toMatch(/^\/gerencia/)
    }

    sesion.rol = 'gerente'
    sesion.usuario = { rol: 'gerente' }
    await router.push('/gerencia/sedes/calendario')
    expect(router.currentRoute.value.name).toBe('gerencia-calendario')
  })

  it('la dirección anterior lleva al calendario dentro de sedes', async () => {
    const { router } = await import('@/router')
    sesion.rol = 'gerente'
    sesion.usuario = { rol: 'gerente' }

    await router.push('/gerencia/calendario')

    expect(router.currentRoute.value.fullPath).toBe(
      '/gerencia/sedes/calendario'
    )
  })
})

describe('Utilidades y validaciones del calendario', () => {
  it('arma las semanas de lunes a domingo con huecos al principio y al final', () => {
    const semanas = semanasDelMes(2026, 11)

    expect(semanas).toHaveLength(6)
    expect(semanas[0].slice(0, 6)).toEqual(Array(6).fill(null))
    expect(semanas[0][6]).toEqual({
      fecha: '2026-11-01',
      dia: 1,
      diaSemana: 0,
    })
    expect(semanas[5][0]).toEqual({
      fecha: '2026-11-30',
      dia: 30,
      diaSemana: 1,
    })
    expect(semanas[5].slice(1)).toEqual(Array(6).fill(null))
  })

  it('calcula el rango del mes, cruza de año y describe la fecha', () => {
    expect(rangoDelMes(2028, 2)).toEqual({
      desde: '2028-02-01',
      hasta: '2028-02-29',
    })
    expect(moverMes(2026, 12, 1)).toEqual({ anio: 2027, mes: 1 })
    expect(moverMes(2026, 1, -1)).toEqual({ anio: 2025, mes: 12 })
    expect(describirFecha('2026-12-25')).toBe('viernes 25 de diciembre')
  })

  it('rechaza fechas inexistentes y horarios invertidos', () => {
    const feriado = feriadoSchema.safeParse({
      fecha: '2026-02-30',
      descripcion: 'Fecha inválida',
      es_feriado: true,
      es_dia_habil: false,
    })
    expect(feriado.error?.issues.map((issue) => issue.message)).toEqual([
      'La fecha no existe.',
    ])

    const horario = excepcionSchema.safeParse({
      fecha: '2026-11-27',
      tipo: 'horario',
      hora_apertura: '22:00',
      hora_cierre: '22:00',
      motivo: '',
    })
    expect(horario.error?.issues.map((issue) => issue.message)).toEqual([
      'El cierre tiene que ser posterior a la apertura.',
    ])

    // Un cierre no necesita horas.
    const cierre = excepcionSchema.safeParse({
      fecha: '2026-11-27',
      tipo: 'cierre',
      hora_apertura: '',
      hora_cierre: '',
      motivo: '',
    })
    expect(cierre.success).toBe(true)
  })
})
