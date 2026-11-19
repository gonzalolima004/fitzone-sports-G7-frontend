// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ClaseCard, {
  type ClaseCardProps,
  type MotivoInhabilitacion,
} from '@/modules/M3-clases-grupales/components/ClaseCard.vue'
import {
  obtenerEstadoVentanaReserva,
  obtenerEstadoCancelacionReserva,
} from '@/common/utils/date-formatter'

vi.mock('@/common/utils/date-formatter', () => ({
  formatearDiasSemana: vi.fn(() => 'Lun · Mié'),
  formatearFechaDDMMAAAA: vi.fn((f: string) => `fmt(${f})`),
  obtenerEstadoVentanaReserva: vi.fn(),
  obtenerEstadoCancelacionReserva: vi.fn(),
}))

const baseClase = (overrides: Partial<ClaseCardProps> = {}): ClaseCardProps => ({
  id: 10,
  nombre: 'Spinning Extremo',
  tipo: 'SPINNING',
  icono: 'bicycle',
  horario: '18:00 - 19:00',
  profesor: 'Laura',
  sala: 'Sala A',
  descripcion: 'Clase intensa',
  capacidadMaxima: 20,
  cuposOcupados: 10,
  enListaEspera: 0,
  estado: 'DISPONIBLE',
  dias_semana: [1, 3],
  ...overrides,
})

describe('ClaseCard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(obtenerEstadoVentanaReserva).mockReturnValue({
      puedeReservar: true,
      motivoBloqueo: null,
    } as never)
    vi.mocked(obtenerEstadoCancelacionReserva).mockReturnValue({
      puedeCancelar: true,
      mensajeBloqueo: null,
    } as never)
  })

  const mountCard = (
    clase: ClaseCardProps,
    opts?: {
      esAdminOGerente?: boolean
      motivoInhabilitacion?: MotivoInhabilitacion
    }
  ) =>
    mount(ClaseCard, {
      props: {
        clase,
        esAdminOGerente: opts?.esAdminOGerente,
        motivoInhabilitacion: opts?.motivoInhabilitacion,
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

  it('renderiza clase puntual con ícono yoga, admin editar/eliminar y emite reservar', async () => {
    const wrapper = mountCard(
      baseClase({
        tipo: 'YOGA FLOW',
        icono: 'lotus',
        fecha: '2026-11-25',
        profesor: null,
        sala: null,
        descripcion: null,
        capacidadMaxima: 0,
      }),
      { esAdminOGerente: true }
    )

    expect(wrapper.text()).toContain('Puntual: fmt(2026-11-25)')
    expect(wrapper.text()).toContain('Sin profesor asignado')
    expect(wrapper.text()).toContain('Sala no especificada')

    await wrapper.find('button[title="Editar clase"]').trigger('click')
    await wrapper.find('button[title="Eliminar clase"]').trigger('click')
    expect(wrapper.emitted('editar')?.[0]).toEqual([10])
    expect(wrapper.emitted('eliminar')?.[0]).toEqual([10])

    const btnReservar = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Reservar Clase'))
    await btnReservar?.trigger('click')
    expect(wrapper.emitted('reservar')?.[0]).toEqual([10])
  })

  it('cubre estado COMPLETO con y sin espera, ícono default y emite lista-espera', async () => {
    const wConEspera = mountCard(
      baseClase({
        tipo: 'FUNCIONAL',
        icono: 'barbell',
        estado: 'COMPLETO',
        cuposOcupados: 20,
        enListaEspera: 3,
      })
    )
    expect(wConEspera.text()).toContain('3 socios en lista de espera actualmente.')
    await wConEspera
      .findAll('button')
      .find((b) => b.text().includes('Anotarme en Lista de Espera'))
      ?.trigger('click')
    expect(wConEspera.emitted('lista-espera')?.[0]).toEqual([10])

    const wSinEspera = mountCard(
      baseClase({
        estado: 'COMPLETO',
        cuposOcupados: 20,
        enListaEspera: 0,
        dias_semana: [],
      })
    )
    expect(wSinEspera.text()).toContain('Sin socios en espera actualmente.')
  })

  it('cubre MISMA_RESERVA cancelable vs bloqueado <=2hs y EN_ESPERA con y sin orden', async () => {
    const wCancelable = mountCard(baseClase({ estado: 'MISMA_RESERVA' }))
    await wCancelable.find('button').trigger('click')
    expect(wCancelable.emitted('cancelar')?.[0]).toEqual([10])

    vi.mocked(obtenerEstadoCancelacionReserva).mockReturnValue({
      puedeCancelar: false,
      mensajeBloqueo: '',
    } as never)
    const wNoCancelable = mountCard(baseClase({ estado: 'MISMA_RESERVA' }))
    expect(wNoCancelable.text()).toContain('No cancelable')
    expect(wNoCancelable.find('button').attributes('disabled')).toBeDefined()

    const wEsperaOrden = mountCard(
      baseClase({ estado: 'EN_ESPERA', ordenEnCola: 2 })
    )
    expect(wEsperaOrden.text()).toContain('En Lista de Espera')
    expect(wEsperaOrden.text()).toContain('(#2)')

    const wEsperaSinOrden = mountCard(baseClase({ estado: 'EN_ESPERA' }))
    expect(wEsperaSinOrden.text()).not.toContain('(#')
  })

  it('cubre ventana PASADO, FUTURO_LEJANO y todos los motivos de inhabilitación', () => {
    vi.mocked(obtenerEstadoVentanaReserva).mockReturnValueOnce({
      puedeReservar: false,
      motivoBloqueo: 'PASADO',
    } as never)
    expect(mountCard(baseClase()).text()).toContain('Clase finalizada')

    vi.mocked(obtenerEstadoVentanaReserva).mockReturnValueOnce({
      puedeReservar: false,
      motivoBloqueo: 'FUTURO_LEJANO',
    } as never)
    expect(mountCard(baseClase()).text()).toContain('Abre 48 hs antes')

    const casos: Array<[MotivoInhabilitacion, string]> = [
      ['EXTERNO', 'Exclusivo Socios'],
      ['MORA', 'Cuota Pendiente'],
      ['SUSPENDIDA', 'Membresía Suspendida'],
      ['SIN_MEMBRESIA', 'Requiere Membresía'],
      ['CIUDAD_DIFERENTE', 'Sede en otra ciudad'],
    ]
    for (const [motivo, texto] of casos) {
      expect(
        mountCard(baseClase(), { motivoInhabilitacion: motivo }).text()
      ).toContain(texto)
    }
  })
})
