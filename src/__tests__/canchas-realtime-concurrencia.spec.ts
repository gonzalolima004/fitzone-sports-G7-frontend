// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { supabase } from '@/common/utils/supabase'
import { toast } from '@/common/utils/toast'
import canchasService from '@/modules/M4-canchas/services/canchas.service'
import { useCanchasRealtime } from '@/modules/M4-canchas/composables/useCanchasRealtime'
import type {
  TurnoReservadoPayload,
  TurnoSlot,
} from '@/modules/M4-canchas/types/canchas.types'

vi.mock('@/common/utils/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

describe('M4-canchas: Suscripción Realtime y Manejo de Concurrencia', () => {
  let mockChannel: {
    on: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
  }
  let broadcastCallback:
    ((res: { payload: TurnoReservadoPayload }) => void) | null = null

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    broadcastCallback = null

    mockChannel = {
      on: vi.fn().mockImplementation((type, filter, cb) => {
        if (type === 'broadcast' && filter.event === 'turno_reservado') {
          broadcastCallback = cb
        }
        return mockChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }

    vi.spyOn(supabase, 'channel').mockReturnValue(
      mockChannel as unknown as ReturnType<typeof supabase.channel>
    )
    vi.spyOn(supabase, 'removeChannel').mockImplementation(() =>
      Promise.resolve('ok')
    )
  })

  describe('canchasService.suscribirTurnoReservado', () => {
    it('se suscribe al canal broadcast canchas:sede:${idSede} y recibe eventos de turno_reservado', () => {
      const onTurnoReservado = vi.fn()
      const unsub = canchasService.suscribirTurnoReservado(1, onTurnoReservado)

      expect(supabase.channel).toHaveBeenCalledWith('canchas:sede:1')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'turno_reservado' },
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()

      // Simular llegada de evento desde Supabase
      const payload: TurnoReservadoPayload = {
        id_cancha: 1,
        fecha: '2026-11-10',
        hora_inicio: '18:00',
        hora_fin: '19:00',
      }
      broadcastCallback?.({ payload })

      expect(onTurnoReservado).toHaveBeenCalledWith(payload)

      // Ejecutar desuscripción
      unsub()
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })

  describe('useCanchasRealtime composable', () => {
    it('reacciona al cambio de sede cerrando el canal anterior y suscribiendo a la nueva sede', async () => {
      const idSedeRef = ref<number | null>(1)
      const onTurno = vi.fn()

      const { desuscribir } = useCanchasRealtime(idSedeRef, onTurno)

      expect(supabase.channel).toHaveBeenCalledWith('canchas:sede:1')

      // Cambiar de sede
      idSedeRef.value = 2
      await vi.waitFor(() => {
        expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
        expect(supabase.channel).toHaveBeenCalledWith('canchas:sede:2')
      })

      desuscribir()
      expect(supabase.removeChannel).toHaveBeenCalledTimes(2)
    })
  })

  describe('Casos de uso de procesamiento de evento turno_reservado', () => {
    it('Caso 1: si la fecha del payload no coincide con la fecha seleccionada, no muta la grilla visible', () => {
      const fechaSeleccionada = '2026-11-10'
      const slots: TurnoSlot[] = [
        {
          hora_inicio: '18:00',
          hora_fin: '19:00',
          estado: 'DISPONIBLE',
          es_horario_pico: false,
          precio_estimado: 8000,
        },
      ]
      const disponibilidadMap: Record<number, TurnoSlot[]> = { 1: [...slots] }

      const payloadAjeno: TurnoReservadoPayload = {
        id_cancha: 1,
        fecha: '2026-11-11', // Otra fecha
        hora_inicio: '18:00',
        hora_fin: '19:00',
      }

      // Lógica de procesamiento
      if (payloadAjeno.fecha === fechaSeleccionada) {
        const target = disponibilidadMap[payloadAjeno.id_cancha]?.find(
          (s) => s.hora_inicio === payloadAjeno.hora_inicio
        )
        if (target) target.estado = 'RESERVADO'
      }

      expect(disponibilidadMap[1][0].estado).toBe('DISPONIBLE')
    })

    it('Caso 2: si la fecha coincide, busca reactivamente en la grilla y cambia el slot a RESERVADO', () => {
      const fechaSeleccionada = '2026-11-10'
      const slots: TurnoSlot[] = [
        {
          hora_inicio: '18:00',
          hora_fin: '19:00',
          estado: 'DISPONIBLE',
          es_horario_pico: false,
          precio_estimado: 8000,
        },
      ]
      const disponibilidadMap: Record<number, TurnoSlot[]> = { 1: slots }

      const payload: TurnoReservadoPayload = {
        id_cancha: 1,
        fecha: '2026-11-10',
        hora_inicio: '18:00',
        hora_fin: '19:00',
      }

      if (payload.fecha === fechaSeleccionada) {
        const target = disponibilidadMap[payload.id_cancha]?.find(
          (s) => s.hora_inicio === payload.hora_inicio
        )
        if (target) target.estado = 'RESERVADO'
      }

      expect(disponibilidadMap[1][0].estado).toBe('RESERVADO')
    })

    it('Caso 3: si coincide con turnoSeleccionado sin modal abierto, deselecciona y emite toast de alerta', () => {
      const fechaSeleccionada = '2026-11-10'
      let turnoSeleccionado: {
        id_cancha: number
        fecha: string
        hora_inicio: string
      } | null = {
        id_cancha: 1,
        fecha: '2026-11-10',
        hora_inicio: '18:00',
      }
      const modalAbierto = false

      const payload: TurnoReservadoPayload = {
        id_cancha: 1,
        fecha: '2026-11-10',
        hora_inicio: '18:00',
        hora_fin: '19:00',
      }

      if (payload.fecha === fechaSeleccionada) {
        if (
          turnoSeleccionado &&
          turnoSeleccionado.id_cancha === payload.id_cancha &&
          turnoSeleccionado.hora_inicio === payload.hora_inicio
        ) {
          if (modalAbierto) {
            toast.warning(
              'El turno que estabas por confirmar fue ocupado por otro usuario.'
            )
          } else {
            toast.warning(
              'El turno que tenías seleccionado acaba de ser reservado por otro usuario.'
            )
          }
          turnoSeleccionado = null
        }
      }

      expect(turnoSeleccionado).toBeNull()
      expect(toast.warning).toHaveBeenCalledWith(
        'El turno que tenías seleccionado acaba de ser reservado por otro usuario.'
      )
    })

    it('Caso 4: si coincide con turnoSeleccionado con modal abierto, fuerza cierre de modal y emite toast de advertencia', () => {
      const fechaSeleccionada = '2026-11-10'
      let turnoSeleccionado: {
        id_cancha: number
        fecha: string
        hora_inicio: string
      } | null = {
        id_cancha: 1,
        fecha: '2026-11-10',
        hora_inicio: '18:00',
      }
      let modalAbierto = true

      const payload: TurnoReservadoPayload = {
        id_cancha: 1,
        fecha: '2026-11-10',
        hora_inicio: '18:00',
        hora_fin: '19:00',
      }

      if (payload.fecha === fechaSeleccionada) {
        if (
          turnoSeleccionado &&
          turnoSeleccionado.id_cancha === payload.id_cancha &&
          turnoSeleccionado.hora_inicio === payload.hora_inicio
        ) {
          if (modalAbierto) {
            modalAbierto = false
            toast.warning(
              'El turno que estabas por confirmar fue ocupado por otro usuario.'
            )
          } else {
            toast.warning(
              'El turno que tenías seleccionado acaba de ser reservado por otro usuario.'
            )
          }
          turnoSeleccionado = null
        }
      }

      expect(modalAbierto).toBe(false)
      expect(turnoSeleccionado).toBeNull()
      expect(toast.warning).toHaveBeenCalledWith(
        'El turno que estabas por confirmar fue ocupado por otro usuario.'
      )
    })
  })
})
