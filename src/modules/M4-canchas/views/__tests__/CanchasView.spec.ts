// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/common/api/http'
import { toast } from '@/common/utils/toast'
import { useSedeStore } from '@/store/sede'
import BaseButton from '@/common/components/BaseButton.vue'
import CanchasView from '../CanchasView.vue'
import ConfirmarReserva from '@/modules/M4-canchas/components/ConfirmarReserva.vue'
import GrillaTurnos from '@/modules/M4-canchas/components/GrillaTurnos.vue'
import type {
  Cancha,
  TurnoSlot,
  TurnoReservadoPayload,
} from '@/modules/M4-canchas/types/canchas.types'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/common/utils/toast', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
  notify: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

let realtimeCallback: ((payload: TurnoReservadoPayload) => void) | null = null

vi.mock('@/modules/M4-canchas/composables/useCanchasRealtime', () => ({
  useCanchasRealtime: vi.fn(
    (
      _idSede: () => number | null,
      onTurnoReservado: (payload: TurnoReservadoPayload) => void
    ) => {
      realtimeCallback = onTurnoReservado
      return { desuscribir: vi.fn() }
    }
  ),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    params: {},
    query: {},
  }),
}))

const CANCHA_MOCK: Cancha = {
  id_cancha: 1,
  id_sede: 1,
  id_cancha_tipo: 1,
  nombre: 'Cancha Pádel 1',
  costo_base: 8000,
  disponible: true,
  activo: true,
}

const SLOT_DISPONIBLE: TurnoSlot = {
  hora_inicio: '18:00',
  hora_fin: '19:00',
  estado: 'DISPONIBLE',
  es_horario_pico: false,
  precio_estimado: 8000,
}

describe('CanchasView.vue - Manejo de Colisiones Concurrentes y Concurrencia 409', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    realtimeCallback = null

    // Congelar tiempo a las 10:00 hs para que el turno de las 18:00 sea válido y futuro
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-20T10:00:00'))

    const sedeStore = useSedeStore()
    sedeStore.sedes = [
      {
        id_sede: 1,
        nombre: 'Sede Central FitZone',
        activo: true,
      },
    ]
    sedeStore.idSedeSeleccionada = 1
    sedeStore.horariosCache['1_2026-11-20'] = {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    }

    vi.mocked(http.get).mockImplementation(async (url: string) => {
      if (url === '/canchas/tipos') {
        return {
          data: [{ id_cancha_tipo: 1, descripcion: 'Pádel', activo: true }],
        }
      }
      if (url.startsWith('/canchas?sedeId=')) {
        return { data: [CANCHA_MOCK] }
      }
      if (url === '/canchas/disponibilidad') {
        return {
          data: {
            horario: {
              abierto: true,
              hora_apertura: '08:00',
              hora_cierre: '22:00',
            },
            canchas: [
              {
                id_cancha: 1,
                costo_base: 8000,
                slots: [SLOT_DISPONIBLE],
              },
            ],
          },
        }
      }
      if (url === '/canchas/cotizar') {
        return {
          data: {
            costo_base: 8000,
            descuento_porcentaje: 15,
            monto_descuento: 1200,
            es_horario_pico: false,
            monto_recargo_pico: 0,
            precio_final: 6800,
            es_socio: true,
            aplica_descuento_socio: true,
            motivo_sin_descuento: null,
          },
        }
      }
      return { data: [] }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('al recibir HTTP 409 Conflict en la confirmación de reserva, cierra el modal, muestra toast de error y marca el slot como RESERVADO', async () => {
    const wrapper = mount(CanchasView)
    await flushPromises()

    // 1. Verificar montaje inicial y grilla con turno disponible
    const grilla = wrapper.findComponent(GrillaTurnos)
    expect(grilla.exists()).toBe(true)
    const botonSlot = grilla.find('button[type="button"]')
    expect(botonSlot.exists()).toBe(true)
    expect(botonSlot.text()).toContain('Disponible')

    // 2. Usuario selecciona el turno
    await botonSlot.trigger('click')
    await wrapper.vm.$nextTick()

    // 3. Usuario abre el modal de confirmación desde la barra flotante
    const botonContinuar = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Continuar Reserva'))
    expect(botonContinuar?.exists()).toBe(true)
    await botonContinuar!.trigger('click')
    await flushPromises()

    // El modal de confirmación está abierto en el DOM
    const modalConfirmar = wrapper.findComponent(ConfirmarReserva)
    expect(modalConfirmar.exists()).toBe(true)

    // 4. Mockear respuesta de colisión concurrente HTTP 409 del servidor al intentar reservar
    const mensajeServidor =
      'La cancha ya fue reservada en este horario por otro usuario.'
    vi.mocked(http.post).mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          message: mensajeServidor,
        },
      },
    })

    // 5. Usuario confirma la reserva (se busca en BaseButton ya que BaseModal utiliza Teleport)
    const botonConfirmar = modalConfirmar
      .findAllComponents(BaseButton)
      .find((b) => b.text().includes('Confirmar y Reservar'))
    expect(botonConfirmar?.exists()).toBe(true)
    await botonConfirmar!.trigger('click')
    await flushPromises()

    // 6. Verificaciones esperadas:
    // a) El modal de confirmación debe cerrarse inmediatamente
    expect(wrapper.findComponent(ConfirmarReserva).exists()).toBe(false)

    // b) Se debe invocar el Toast de error con el mensaje retornado por el servidor
    expect(toast.error).toHaveBeenCalledWith(mensajeServidor)

    // c) El slot involucrado en la grilla debe actualizarse a estado RESERVADO
    const mapaDisponibilidad = grilla.props(
      'disponibilidadMap'
    ) as Record<number, TurnoSlot[]>
    expect(mapaDisponibilidad[1][0].estado).toBe('RESERVADO')

    // En el DOM de la grilla ahora se muestra como "Ocupado"
    expect(grilla.text()).toContain('Ocupado')
    expect(grilla.findAll('button[type="button"]')).toHaveLength(0)
  })

  it('si mientras el modal está abierto llega un evento realtime de turno_reservado para ese turno, fuerza el cierre y emite toast.warning', async () => {
    const wrapper = mount(CanchasView)
    await flushPromises()

    // Seleccionar turno y abrir modal
    const grilla = wrapper.findComponent(GrillaTurnos)
    await grilla.find('button[type="button"]').trigger('click')
    await wrapper.vm.$nextTick()

    const botonContinuar = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Continuar Reserva'))
    expect(botonContinuar?.exists()).toBe(true)
    await botonContinuar!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(ConfirmarReserva).exists()).toBe(true)

    // Simular que otro usuario reservó concurrentemente el mismo turno antes de que este usuario confirmara
    expect(realtimeCallback).toBeDefined()
    realtimeCallback?.({
      id_cancha: 1,
      fecha: '2026-11-20',
      hora_inicio: '18:00',
      hora_fin: '19:00',
    })

    await wrapper.vm.$nextTick()

    // El modal debe haberse forzado a cerrar
    expect(wrapper.findComponent(ConfirmarReserva).exists()).toBe(false)

    // Debe mostrar advertencia clara al usuario
    expect(toast.warning).toHaveBeenCalledWith(
      'El turno que estabas por confirmar fue ocupado por otro usuario.'
    )

    // El slot en la grilla debe reflejar el estado ocupado
    const mapaDisponibilidad = grilla.props(
      'disponibilidadMap'
    ) as Record<number, TurnoSlot[]>
    expect(mapaDisponibilidad[1][0].estado).toBe('RESERVADO')
  })
})
