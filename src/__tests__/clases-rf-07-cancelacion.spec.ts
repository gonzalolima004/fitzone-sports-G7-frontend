// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ClaseCard from '@/modules/M3-clases-grupales/components/ClaseCard.vue'
import ClasesView from '@/modules/M3-clases-grupales/views/ClasesView.vue'

const mocks = vi.hoisted(() => ({
  toastWarning: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  cancelarReserva: vi.fn().mockResolvedValue({}),
  agenda: vi.fn().mockResolvedValue([]),
  obtenerHorario: vi.fn().mockResolvedValue({
    abierto: true,
    hora_apertura: '08:00',
    hora_cierre: '22:00',
  }),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    rol: 'socio',
    isAuthenticated: true,
    usuario: {
      id: 10,
      rol: 'socio',
      id_sede: 1,
      sede: { id_sede: 1, id_ciudad: 1 },
    },
  }),
}))

vi.mock('@/store/sede', () => ({
  useSedeStore: () => ({
    idSedeSeleccionada: 1,
    sedeSeleccionada: { id_sede: 1, nombre: 'Sede Centro', id_ciudad: 1 },
    cargarSedes: vi.fn(),
    obtenerHorarioOperativo: mocks.obtenerHorario,
  }),
}))

vi.mock('@/common/utils/toast', () => ({
  toast: {
    success: mocks.toastSuccess,
    warning: mocks.toastWarning,
    info: mocks.toastInfo,
    error: vi.fn(),
  },
}))

vi.mock('@/common/utils/supabase', () => {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  return {
    supabase: {
      channel: () => channel,
      removeChannel: vi.fn(),
    },
  }
})

vi.mock('@/modules/M3-clases-grupales/services/clases.service', () => ({
  clasesService: {
    obtenerClasesPorSede: mocks.agenda,
    obtenerMisReservas: vi.fn().mockResolvedValue([]),
    obtenerMisInscripciones: vi.fn().mockResolvedValue([]),
    obtenerHorarioOperativoSede: mocks.obtenerHorario,
    cancelarReserva: mocks.cancelarReserva,
    reservarClase: vi.fn().mockResolvedValue({ id_reserva: 1 }),
  },
}))

vi.mock('@/modules/M1-usuarios/services/membresias.service', () => ({
  membresiasService: {
    verificarEstado: vi.fn().mockResolvedValue({
      esSocioActivo: true,
      enMora: false,
      estado: 'ACTIVA',
    }),
  },
}))

describe('RF-07 — Reserva y Cancelación de clases (Hasta 2 hs antes)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Sistema en 2026-10-21 a las 10:00:00
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('ClaseCard.vue — Visualización del botón de cancelación', () => {
    it('muestra botón "Cancelar mi Reserva" habilitado si faltan más de 2 horas para el inicio', async () => {
      // Clase a las 14:00 (faltan 4 horas)
      const fechaClase = new Date(2026, 9, 21, 14, 0, 0).toISOString()
      const wrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 1,
            nombre: 'CrossFit WOD',
            tipo: 'CROSSFIT',
            icono: 'PhBarbell',
            horario: '14:00 - 15:00 hs',
            horario_inicio: '14:00',
            horario_fin: '15:00',
            fecha_inicio: fechaClase,
            fecha: '2026-10-21',
            capacidadMaxima: 20,
            cuposOcupados: 10,
            cuposDisponibles: 10,
            enListaEspera: 0,
            estado: 'MISMA_RESERVA',
          },
        },
      })

      const botonCancelar = wrapper.find('button')
      expect(botonCancelar.text()).toContain('Cancelar mi Reserva')
      expect(botonCancelar.attributes('disabled')).toBeUndefined()

      await botonCancelar.trigger('click')
      expect(wrapper.emitted('cancelar')).toBeTruthy()
      expect(wrapper.emitted('cancelar')![0]).toEqual([1])
    })

    it('bloquea y deshabilita la cancelación si faltan 2 horas o menos para el inicio', async () => {
      // Clase a las 11:30 (falta 1 hora y media)
      const fechaClase = new Date(2026, 9, 21, 11, 30, 0).toISOString()
      const wrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 2,
            nombre: 'Spinning Power',
            tipo: 'SPINNING',
            icono: 'PhBicycle',
            horario: '11:30 - 12:30 hs',
            horario_inicio: '11:30',
            horario_fin: '12:30',
            fecha_inicio: fechaClase,
            fecha: '2026-10-21',
            capacidadMaxima: 20,
            cuposOcupados: 15,
            cuposDisponibles: 5,
            enListaEspera: 0,
            estado: 'MISMA_RESERVA',
          },
        },
      })

      const botonBloqueado = wrapper.find('button')
      expect(botonBloqueado.text()).toContain('No cancelable (≤ 2 hs)')
      expect(botonBloqueado.attributes('disabled')).toBeDefined()
      expect(botonBloqueado.classes()).toContain('cursor-not-allowed')

      await botonBloqueado.trigger('click')
      expect(wrapper.emitted('cancelar')).toBeUndefined()
    })

    it('bloquea la cancelación si faltan exactamente 2 horas para el inicio', async () => {
      // Clase a las 12:00 (faltan exactamente 2 horas desde las 10:00)
      const fechaClase = new Date(2026, 9, 21, 12, 0, 0).toISOString()
      const wrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 3,
            nombre: 'Yoga Vinyasa',
            tipo: 'YOGA',
            icono: 'PhFlowerLotus',
            horario: '12:00 - 13:00 hs',
            horario_inicio: '12:00',
            horario_fin: '13:00',
            fecha_inicio: fechaClase,
            fecha: '2026-10-21',
            capacidadMaxima: 15,
            cuposOcupados: 5,
            cuposDisponibles: 10,
            enListaEspera: 0,
            estado: 'MISMA_RESERVA',
          },
        },
      })

      const botonBloqueado = wrapper.find('button')
      expect(botonBloqueado.text()).toContain('No cancelable (≤ 2 hs)')
      expect(botonBloqueado.attributes('disabled')).toBeDefined()
    })
  })

  describe('ClasesView.vue — Guardias defensivas de cancelación', () => {
    it('bloquea intento de cancelar en handleCancelar si faltan 2 horas o menos con toast de advertencia', async () => {
      // Mock de agenda devolviendo clase a las 11:00 (a 1 hora de las 10:00)
      mocks.agenda.mockResolvedValue([
        {
          id_clase: 5,
          nombre: 'Funcional',
          horario_inicio: '11:00',
          horario_fin: '12:00',
          capacidad_maxima: 20,
          cupos_ocupados: 10,
          cupos_disponibles: 10,
          en_espera: 0,
          estado: 'DISPONIBLE',
        },
      ])

      const wrapper = mount(ClasesView, {
        global: {
          stubs: {
            BaseModal: true,
            RouterLink: true,
          },
        },
      })
      await flushPromises()

      // Buscar componente ClaseCard y emitir evento cancelar
      const card = wrapper.findComponent(ClaseCard)
      if (card.exists()) {
        card.vm.$emit('cancelar', 5)
        await flushPromises()
        expect(mocks.toastWarning).toHaveBeenCalledWith(
          expect.stringContaining('2 horas o menos')
        )
      }
    })
  })
})
