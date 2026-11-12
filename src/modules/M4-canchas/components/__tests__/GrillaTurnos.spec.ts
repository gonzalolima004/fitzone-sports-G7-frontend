// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GrillaTurnos from '../GrillaTurnos.vue'
import type {
  Cancha,
  TurnoSlot,
  HorarioOperativoDia,
} from '@/modules/M4-canchas/types/canchas.types'

const CANCHA_MOCK: Cancha = {
  id_cancha: 1,
  id_sede: 1,
  id_cancha_tipo: 1,
  nombre: 'Cancha Pádel 1',
  costo_base: 8000,
  activo: true,
}

const HORARIO_ABIERTO: HorarioOperativoDia = {
  abierto: true,
  hora_apertura: '08:00',
  hora_cierre: '22:00',
}

describe('GrillaTurnos.vue - Interacción y estados de usuario', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('click en slot DISPONIBLE emite el evento seleccionarTurno con { cancha, slot }', async () => {
    const slotDisponible: TurnoSlot = {
      hora_inicio: '18:00',
      hora_fin: '19:00',
      estado: 'DISPONIBLE',
      es_horario_pico: false,
      precio_estimado: 8000,
    }

    const wrapper = mount(GrillaTurnos, {
      props: {
        canchas: [CANCHA_MOCK],
        disponibilidadMap: { 1: [slotDisponible] },
        turnoSeleccionado: null,
        cargando: false,
        fecha: '2026-11-20',
        fechaHoy: '2026-11-10', // Fecha futura para no considerarlo pasado
        horarioOperativo: HORARIO_ABIERTO,
      },
    })

    const botonSlot = wrapper.find('button[type="button"]')
    expect(botonSlot.exists()).toBe(true)
    expect(botonSlot.text()).toContain('Disponible')

    await botonSlot.trigger('click')

    const eventosEmitidos = wrapper.emitted('seleccionarTurno')
    expect(eventosEmitidos).toBeDefined()
    expect(eventosEmitidos).toHaveLength(1)
    expect(eventosEmitidos?.[0]?.[0]).toEqual({
      cancha: CANCHA_MOCK,
      slot: slotDisponible,
    })
  })

  it('click en slots RESERVADO o MANTENIMIENTO NO debe emitir ningún evento', async () => {
    const slotReservado: TurnoSlot = {
      hora_inicio: '18:00',
      hora_fin: '19:00',
      estado: 'RESERVADO',
      es_horario_pico: false,
      precio_estimado: 8000,
    }

    const slotMantenimiento: TurnoSlot = {
      hora_inicio: '19:00',
      hora_fin: '20:00',
      estado: 'MANTENIMIENTO',
      es_horario_pico: false,
      precio_estimado: 8000,
    }

    const wrapper = mount(GrillaTurnos, {
      props: {
        canchas: [CANCHA_MOCK],
        disponibilidadMap: { 1: [slotReservado, slotMantenimiento] },
        turnoSeleccionado: null,
        cargando: false,
        fecha: '2026-11-20',
        fechaHoy: '2026-11-10',
        horarioOperativo: HORARIO_ABIERTO,
      },
    })

    // El slot reservado se renderiza como div con texto Ocupado
    const textoCompleto = wrapper.text()
    expect(textoCompleto).toContain('Ocupado')
    expect(textoCompleto).toContain('Mantenimiento')

    // No debe haber botones clickeables para slots ocupados o en mantenimiento
    const botones = wrapper.findAll('button[type="button"]')
    expect(botones).toHaveLength(0)

    // Al hacer click sobre los contenedores no clickeables no se emite evento
    const divsNoDisponibles = wrapper.findAll('.cursor-not-allowed')
    expect(divsNoDisponibles.length).toBeGreaterThanOrEqual(2)

    for (const div of divsNoDisponibles) {
      await div.trigger('click')
    }

    expect(wrapper.emitted('seleccionarTurno')).toBeUndefined()
  })

  it('un slot con hora anterior a la hora congelada con vi.useFakeTimers() no permite interacción', async () => {
    // Congelar el reloj en 2026-11-20 a las 15:30 hs
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-20T15:30:00'))

    const slotPasado: TurnoSlot = {
      hora_inicio: '14:00',
      hora_fin: '15:00',
      estado: 'DISPONIBLE',
      es_horario_pico: false,
      precio_estimado: 8000,
    }

    const slotFuturo: TurnoSlot = {
      hora_inicio: '17:00',
      hora_fin: '18:00',
      estado: 'DISPONIBLE',
      es_horario_pico: false,
      precio_estimado: 8000,
    }

    const wrapper = mount(GrillaTurnos, {
      props: {
        canchas: [CANCHA_MOCK],
        disponibilidadMap: { 1: [slotPasado, slotFuturo] },
        turnoSeleccionado: null,
        cargando: false,
        fecha: '2026-11-20',
        fechaHoy: '2026-11-20', // Mismo día que la fecha congelada
        horarioOperativo: HORARIO_ABIERTO,
      },
    })

    // Debe renderizar el slot pasado como no disponible
    expect(wrapper.text()).toContain('Pasado')

    // Solo debe haber un botón activo (el de las 17:00)
    const botones = wrapper.findAll('button[type="button"]')
    expect(botones).toHaveLength(1)

    // Click en el contenedor de slot pasado no emite evento
    const divPasado = wrapper.find('.cursor-not-allowed')
    await divPasado.trigger('click')
    expect(wrapper.emitted('seleccionarTurno')).toBeUndefined()

    // Click en el slot futuro sí emite el evento
    await botones[0].trigger('click')
    expect(wrapper.emitted('seleccionarTurno')).toBeDefined()
    expect(wrapper.emitted('seleccionarTurno')?.[0]?.[0]).toEqual({
      cancha: CANCHA_MOCK,
      slot: slotFuturo,
    })
  })

  it('si horarioOperativo indica abierto === false, renderiza el banner de sede cerrada y no muestra botones de reserva', () => {
    const horarioCerrado: HorarioOperativoDia = {
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
      motivo_cierre: 'Cierre por obras de mantenimiento general en la sede',
    }

    const wrapper = mount(GrillaTurnos, {
      props: {
        canchas: [CANCHA_MOCK],
        disponibilidadMap: {},
        turnoSeleccionado: null,
        cargando: false,
        fecha: '2026-11-20',
        horarioOperativo: horarioCerrado,
      },
    })

    expect(wrapper.text()).toContain('Sede Cerrada')
    expect(wrapper.text()).toContain(
      'Cierre por obras de mantenimiento general en la sede'
    )
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.findAll('button').length).toBe(0)
  })
})
