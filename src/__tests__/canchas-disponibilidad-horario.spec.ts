// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import http from '@/common/api/http'
import { useSedeStore } from '@/store/sede'
import canchasService from '@/modules/M4-canchas/services/canchas.service'
import GrillaTurnos from '@/modules/M4-canchas/components/GrillaTurnos.vue'
import type {
  Cancha,
  TurnoSlot,
  GrillaDisponibilidadBackendResponse,
} from '@/modules/M4-canchas/types/canchas.types'

vi.mock('@/common/api/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const CANCHA_MOCK: Cancha = {
  id_cancha: 1,
  id_sede: 1,
  id_cancha_tipo: 1,
  nombre: 'Cancha Central 1',
  costo_base: 10000,
  activo: true,
}

describe('M4-canchas: Disponibilidad y Horario Operativo sin Mocks de Feriados', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('canchasService.getDisponibilidadPorSede', () => {
    it('cuando el backend informa que la sede está cerrada, no retorna turnos y almacena el motivo en el store', async () => {
      const sedeStore = useSedeStore()
      const fechaPrueba = '2026-12-25' // Navidad: el backend es la única fuente de verdad
      const mockRespuesta: GrillaDisponibilidadBackendResponse = {
        horario: {
          abierto: false,
          hora_apertura: '00:00',
          hora_cierre: '00:00',
          motivo_cierre:
            'Feriado Nacional: Navidad (Sede Cerrada por Calendario)',
        },
        canchas: [],
      }

      vi.mocked(http.get).mockResolvedValueOnce({ data: mockRespuesta })

      const resultado = await canchasService.getDisponibilidadPorSede(
        1,
        fechaPrueba,
        [CANCHA_MOCK]
      )

      expect(resultado).toEqual({})
      const key = `1_${fechaPrueba}`
      expect(sedeStore.horariosCache[key]).toBeDefined()
      expect(sedeStore.horariosCache[key]?.abierto).toBe(false)
      expect(sedeStore.horariosCache[key]?.motivo_cierre).toBe(
        'Feriado Nacional: Navidad (Sede Cerrada por Calendario)'
      )
    })

    it('cuando el backend responde con horario especial, almacena el estado especial en Pinia y procesa los slots reales', async () => {
      const sedeStore = useSedeStore()
      const fechaEspecial = '2026-05-01'
      const mockRespuesta: GrillaDisponibilidadBackendResponse = {
        horario: {
          abierto: true,
          hora_apertura: '10:00',
          hora_cierre: '14:00',
          es_horario_especial: true,
        },
        canchas: [
          {
            id_cancha: 1,
            costo_base: 10000,
            slots: [
              {
                hora_inicio: '10:00',
                hora_fin: '11:00',
                estado: 'DISPONIBLE',
                precio_estimado: 8500,
              },
              {
                hora_inicio: '11:00',
                hora_fin: '12:00',
                estado: 'RESERVADO',
                precio_estimado: 8500,
              },
            ],
          },
        ],
      }

      vi.mocked(http.get).mockResolvedValueOnce({ data: mockRespuesta })

      const resultado = await canchasService.getDisponibilidadPorSede(
        1,
        fechaEspecial,
        [CANCHA_MOCK]
      )

      const key = `1_${fechaEspecial}`
      expect(sedeStore.horariosCache[key]?.es_horario_especial).toBe(true)
      expect(sedeStore.horariosCache[key]?.hora_apertura).toBe('10:00')
      expect(sedeStore.horariosCache[key]?.hora_cierre).toBe('14:00')

      expect(resultado[1]).toHaveLength(2)
      expect(resultado[1][0].hora_inicio).toBe('10:00')
      expect(resultado[1][0].estado).toBe('DISPONIBLE')
      expect(resultado[1][1].estado).toBe('RESERVADO')
    })

    it('no genera slots sintéticos ni inventa feriados si el endpoint falla', async () => {
      vi.mocked(http.get).mockRejectedValueOnce(new Error('Network error'))

      const resp = await canchasService.getDisponibilidad(1, '2026-07-09')
      expect(resp.slots).toEqual([])
    })
  })

  describe('GrillaTurnos.vue', () => {
    it('muestra el banner de cierre con el motivo devuelto por el backend sin renderizar matriz de turnos', () => {
      const wrapper = mount(GrillaTurnos, {
        props: {
          canchas: [CANCHA_MOCK],
          disponibilidadMap: {},
          turnoSeleccionado: null,
          cargando: false,
          fecha: '2026-12-25',
          horarioOperativo: {
            abierto: false,
            hora_apertura: '00:00',
            hora_cierre: '00:00',
            motivo_cierre: 'Cierre extraordinario por refacciones',
          },
        },
      })

      expect(wrapper.text()).toContain('Sede Cerrada')
      expect(wrapper.text()).toContain('Cierre extraordinario por refacciones')
      expect(wrapper.find('table').exists()).toBe(false)
    })

    it('muestra el distintivo visual de Horario Especial cuando es_horario_especial es true', () => {
      const slots: TurnoSlot[] = [
        {
          hora_inicio: '09:00',
          hora_fin: '10:00',
          estado: 'DISPONIBLE',
          es_horario_pico: false,
          precio_estimado: 9000,
        },
      ]

      const wrapper = mount(GrillaTurnos, {
        props: {
          canchas: [CANCHA_MOCK],
          disponibilidadMap: { 1: slots },
          turnoSeleccionado: null,
          cargando: false,
          fecha: '2026-05-01',
          horarioOperativo: {
            abierto: true,
            hora_apertura: '09:00',
            hora_cierre: '13:00',
            es_horario_especial: true,
          },
        },
      })

      expect(wrapper.text()).toContain('Horario Especial')
      expect(wrapper.text()).toContain('09:00 a 13:00 hs')
      expect(wrapper.find('table').exists()).toBe(true)
    })
  })
})
