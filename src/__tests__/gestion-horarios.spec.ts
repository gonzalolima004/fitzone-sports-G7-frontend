// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  flushPromises,
  mount,
  RouterLinkStub,
  type VueWrapper,
} from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/common/api/http'
import { toast } from '@/common/utils/toast'
import { useSedeStore, type HorarioOperativo } from '@/store/sede'
import GestionHorariosView from '@/modules/gerencia/views/GestionHorariosView.vue'
import {
  armarSemana,
  diaDesdeGuardado,
  operacionDe,
} from '@/modules/gerencia/utils/horarios'
import type {
  HorarioSemanal,
  SedeGestion,
} from '@/modules/gerencia/types/gerencia.types'
import { boton, errorHttp } from './utils/gerencia-test-utils'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/common/utils/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

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
    id_ciudad: 1,
  },
]

const horario = (
  id: number,
  idSede: number,
  dia: number,
  apertura: string | null,
  cierre: string | null = null
): HorarioSemanal => ({
  id_sede_horario: id,
  id_sede: idSede,
  dia_semana: dia,
  hora_apertura: apertura ?? '00:00',
  hora_cierre: cierre ?? '00:00',
  abierto: apertura !== null,
})

/**
 * Centro: de lunes a viernes de 07:00 a 23:00, sábado de 08:00 a 20:00 y
 * domingo cerrado. Norte: solo de lunes a viernes, de 06:30 a 22:00.
 */
const semanaInicial = (): HorarioSemanal[] => [
  ...[1, 2, 3, 4, 5].map((dia) => horario(dia, 1, dia, '07:00', '23:00')),
  horario(6, 1, 6, '08:00', '20:00'),
  horario(7, 1, 0, null),
  ...[1, 2, 3, 4, 5].map((dia) => horario(10 + dia, 2, dia, '06:30', '22:00')),
]

const ABIERTA: HorarioOperativo = {
  abierto: true,
  hora_apertura: '07:00',
  hora_cierre: '23:00',
}

let horarios: HorarioSemanal[] = []
let errorListado: Error | null = null
let siguienteId = 100

function servidor() {
  vi.mocked(http.get).mockImplementation(async (url: string) => {
    if (url === '/sedes') return { data: SEDES }
    const deSede = url.match(/^\/sedes\/(\d+)\/horarios$/)
    if (deSede) {
      if (errorListado) throw errorListado
      return {
        data: horarios.filter((fila) => fila.id_sede === Number(deSede[1])),
      }
    }
    throw new Error(`URL no esperada: ${url}`)
  })
  vi.mocked(http.post).mockImplementation(
    async (url: string, cuerpo?: unknown) => {
      const datos = cuerpo as Partial<HorarioSemanal>
      const nuevo = horario(
        siguienteId++,
        Number(url.split('/')[2]),
        Number(datos.dia_semana),
        datos.abierto ? (datos.hora_apertura ?? null) : null,
        datos.hora_cierre ?? null
      )
      horarios.push(nuevo)
      return { data: nuevo }
    }
  )
  vi.mocked(http.patch).mockImplementation(
    async (url: string, cuerpo?: unknown) => {
      const datos = cuerpo as Partial<HorarioSemanal>
      const id = Number(url.split('/').pop())
      const fila = horarios.find((actual) => actual.id_sede_horario === id)
      if (!fila) throw errorHttp(404, 'Horario no encontrado en esta sede')
      Object.assign(
        fila,
        datos.abierto
          ? {
              abierto: true,
              hora_apertura: datos.hora_apertura,
              hora_cierre: datos.hora_cierre,
            }
          : { abierto: false, hora_apertura: '00:00', hora_cierre: '00:00' }
      )
      return { data: { ...fila } }
    }
  )
  vi.mocked(http.delete).mockImplementation(async (url: string) => {
    const id = Number(url.split('/').pop())
    const fila = horarios.find((actual) => actual.id_sede_horario === id)
    horarios = horarios.filter((actual) => actual !== fila)
    return { data: fila }
  })
}

async function montar() {
  const wrapper = mount(GestionHorariosView, {
    global: { stubs: { teleport: true, RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

const fila = (wrapper: VueWrapper, dia: number) =>
  wrapper.get(`[data-testid="dia-${dia}"]`)

const valor = (wrapper: VueWrapper, selector: string) =>
  (wrapper.get(selector).element as HTMLInputElement).value

const marcado = (wrapper: VueWrapper, selector: string) =>
  (wrapper.get(selector).element as HTMLInputElement).checked

const resumen = (wrapper: VueWrapper) =>
  wrapper.get('[data-testid="resumen-cambios"]').text()

describe('Horarios semanales de las sedes (panel de gerencia)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
    horarios = semanaInicial()
    errorListado = null
    siguienteId = 100
    servidor()
  })

  it('muestra la semana de lunes a domingo de la sede elegida', async () => {
    const wrapper = await montar()

    expect(http.get).toHaveBeenCalledWith('/sedes/1/horarios')
    const dias = wrapper.findAll('li[data-testid^="dia-"]')
    expect(dias.map((dia) => dia.find('p').text())).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ])
    expect(marcado(wrapper, '#horario-abre-1')).toBe(true)
    expect(valor(wrapper, '#horario-apertura-1')).toBe('07:00')
    expect(valor(wrapper, '#horario-cierre-6')).toBe('20:00')
    expect(marcado(wrapper, '#horario-cerrada-0')).toBe(true)
    expect(fila(wrapper, 0).text()).toContain('No abre en todo el día.')
    expect(wrapper.find('[data-testid="aviso-sin-horario"]').exists()).toBe(
      false
    )
    expect(resumen(wrapper)).toBe('No hay cambios sin guardar.')
  })

  it('marca los días sin horario cargado de otra sede', async () => {
    const wrapper = await montar()

    await wrapper.get('#sede-horarios').setValue('2')
    await flushPromises()

    expect(useSedeStore().sedeSeleccionada?.id_sede).toBe(2)
    expect(http.get).toHaveBeenCalledWith('/sedes/2/horarios')
    expect(wrapper.get('[data-testid="aviso-sin-horario"]').text()).toBe(
      '2 días sin horario cargado: esos días la sede figura cerrada.'
    )
    expect(fila(wrapper, 6).text()).toContain('Sin horario cargado')
    expect(marcado(wrapper, '#horario-abre-6')).toBe(false)
    expect(marcado(wrapper, '#horario-cerrada-6')).toBe(false)
  })

  it('guarda solo los días que cambiaron, con un pedido por día', async () => {
    const wrapper = await montar()
    const sedeStore = useSedeStore()
    sedeStore.horariosCache['1_2026-11-14'] = ABIERTA
    sedeStore.horariosCache['1_2026-11-15'] = ABIERTA
    sedeStore.horariosCache['2_2026-11-14'] = ABIERTA

    // Sábado cierra más tarde, domingo pasa a abrir y el martes se quita.
    await wrapper.get('#horario-cierre-6').setValue('22:00')
    await wrapper.get('#horario-abre-0').setValue(true)
    await wrapper.get('#horario-apertura-0').setValue('09:00')
    await wrapper.get('#horario-cierre-0').setValue('13:00')
    await boton(wrapper, 'Quitar el horario del martes').trigger('click')

    expect(resumen(wrapper)).toBe('3 días con cambios sin guardar.')
    expect(fila(wrapper, 2).text()).toContain('Se quita al guardar')
    expect(http.post).not.toHaveBeenCalled()

    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    expect(http.patch).toHaveBeenCalledTimes(2)
    expect(http.patch).toHaveBeenCalledWith('/sedes/1/horarios/6', {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    })
    expect(http.patch).toHaveBeenCalledWith('/sedes/1/horarios/7', {
      abierto: true,
      hora_apertura: '09:00',
      hora_cierre: '13:00',
    })
    expect(http.delete).toHaveBeenCalledWith('/sedes/1/horarios/2')
    expect(http.post).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Horario de Centro guardado.')
    expect(resumen(wrapper)).toBe('No hay cambios sin guardar.')
    expect(fila(wrapper, 2).text()).toContain('Sin horario cargado')
    // Canchas y clases vuelven a pedir el horario de esta sede.
    expect(Object.keys(sedeStore.horariosCache)).toEqual(['2_2026-11-14'])
  })

  it('carga el horario de un día que no tenía', async () => {
    const wrapper = await montar()
    await wrapper.get('#sede-horarios').setValue('2')
    await flushPromises()

    await wrapper.get('#horario-cerrada-0').setValue(true)
    await wrapper.get('#horario-abre-6').setValue(true)
    // Propone el horario de otro día que abre.
    expect(valor(wrapper, '#horario-apertura-6')).toBe('06:30')
    expect(valor(wrapper, '#horario-cierre-6')).toBe('22:00')
    await wrapper.get('#horario-cierre-6').setValue('14:00')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/sedes/2/horarios', {
      dia_semana: 0,
      abierto: false,
    })
    expect(http.post).toHaveBeenCalledWith('/sedes/2/horarios', {
      dia_semana: 6,
      abierto: true,
      hora_apertura: '06:30',
      hora_cierre: '14:00',
    })
    expect(toast.success).toHaveBeenCalledWith('Horario de Norte guardado.')
    expect(wrapper.find('[data-testid="aviso-sin-horario"]').exists()).toBe(
      false
    )
  })

  it('valida las horas antes de enviar', async () => {
    const wrapper = await montar()

    await wrapper.get('#horario-apertura-6').setValue('21:00')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    expect(fila(wrapper, 6).text()).toContain(
      'El cierre tiene que ser posterior a la apertura.'
    )

    await wrapper.get('#horario-apertura-6').setValue('')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    expect(fila(wrapper, 6).text()).toContain('Indicá la hora de apertura.')
    expect(wrapper.get('#horario-apertura-6').attributes('aria-invalid')).toBe(
      'true'
    )

    expect(http.patch).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('deshacer y descartar vuelven a lo guardado', async () => {
    const wrapper = await montar()

    await wrapper.get('#horario-cierre-6').setValue('22:00')
    await wrapper.get('#horario-cerrada-1').setValue(true)
    expect(resumen(wrapper)).toBe('2 días con cambios sin guardar.')

    await boton(wrapper, 'Deshacer los cambios del sábado').trigger('click')
    expect(valor(wrapper, '#horario-cierre-6')).toBe('20:00')
    expect(resumen(wrapper)).toBe('1 día con cambios sin guardar.')
    // Con cambios sin guardar no se puede cambiar de sede.
    expect(wrapper.get('#sede-horarios').attributes('disabled')).toBeDefined()

    await boton(wrapper, 'Descartar cambios').trigger('click')
    expect(marcado(wrapper, '#horario-abre-1')).toBe(true)
    expect(valor(wrapper, '#horario-apertura-1')).toBe('07:00')
    expect(resumen(wrapper)).toBe('No hay cambios sin guardar.')
  })

  it('si un día falla, guarda los demás y ese día conserva lo editado', async () => {
    vi.mocked(http.patch).mockImplementationOnce(async () => {
      throw errorHttp(
        400,
        'La hora de apertura tiene que ser anterior a la de cierre.'
      )
    })
    const wrapper = await montar()

    await wrapper.get('#horario-cierre-1').setValue('22:00')
    await boton(wrapper, 'Quitar el horario del domingo').trigger('click')
    await boton(wrapper, 'Guardar cambios').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/sedes/1/horarios/7')
    expect(toast.success).not.toHaveBeenCalled()
    expect(fila(wrapper, 1).text()).toContain(
      'La hora de apertura tiene que ser anterior a la de cierre.'
    )
    expect(valor(wrapper, '#horario-cierre-1')).toBe('22:00')
    expect(wrapper.text()).toContain(
      'Se guardaron los demás días, pero no el lunes. Revisá el mensaje de cada uno.'
    )
    expect(resumen(wrapper)).toBe('1 día con cambios sin guardar.')
  })

  it('si la sede cambia desde el encabezado, descarta los cambios y avisa', async () => {
    const wrapper = await montar()

    await wrapper.get('#horario-cierre-6').setValue('22:00')
    useSedeStore().seleccionarSede(2)
    await flushPromises()

    expect(toast.info).toHaveBeenCalledWith(
      'Se descartaron los cambios sin guardar del horario de Centro.'
    )
    expect(http.get).toHaveBeenCalledWith('/sedes/2/horarios')
    expect(resumen(wrapper)).toBe('No hay cambios sin guardar.')
  })

  it('avisa si no pudo cargar el horario y permite reintentar', async () => {
    errorListado = errorHttp(500, 'Internal server error')
    const wrapper = await montar()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'No se pudo cargar el horario. Revisá la conexión e intentá nuevamente.'
    )

    errorListado = null
    await boton(wrapper, 'Reintentar').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('li[data-testid^="dia-"]')).toHaveLength(7)
  })
})

describe('Utilidades del horario semanal', () => {
  it('arma la semana de lunes a domingo con los días sin horario', () => {
    const semana = armarSemana([horario(7, 1, 0, null)])

    expect(semana.map((dia) => dia.dia)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(semana[6]).toMatchObject({ nombre: 'Domingo', atencion: 'cerrada' })
    expect(semana[0]).toMatchObject({
      nombre: 'Lunes',
      atencion: 'sin-horario',
      guardado: null,
    })
  })

  it('decide qué pedido guarda cada día', () => {
    const lunes = horario(1, 1, 1, '07:00', '23:00')

    expect(operacionDe(diaDesdeGuardado(1, 'Lunes', lunes))).toBeNull()
    expect(
      operacionDe({
        ...diaDesdeGuardado(1, 'Lunes', lunes),
        hora_cierre: '22:00',
      })
    ).toEqual({
      tipo: 'actualizar',
      idHorario: 1,
      datos: { abierto: true, hora_apertura: '07:00', hora_cierre: '22:00' },
    })
    expect(
      operacionDe({
        ...diaDesdeGuardado(1, 'Lunes', lunes),
        atencion: 'cerrada',
      })
    ).toEqual({ tipo: 'actualizar', idHorario: 1, datos: { abierto: false } })
    expect(
      operacionDe({
        ...diaDesdeGuardado(1, 'Lunes', lunes),
        atencion: 'sin-horario',
      })
    ).toEqual({ tipo: 'quitar', idHorario: 1 })
    expect(operacionDe(diaDesdeGuardado(6, 'Sábado', null))).toBeNull()
    expect(
      operacionDe({
        ...diaDesdeGuardado(6, 'Sábado', null),
        atencion: 'cerrada',
      })
    ).toEqual({ tipo: 'crear', datos: { dia_semana: 6, abierto: false } })
  })
})
