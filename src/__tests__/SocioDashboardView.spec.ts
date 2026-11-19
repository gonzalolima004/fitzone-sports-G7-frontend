// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import SocioDashboardView from '@/modules/M1-usuarios/views/SocioDashboardView.vue'
import {
  usuariosService,
  type SocioDashboardResponse,
} from '@/modules/M1-usuarios/services/usuarios.service'
import { useAuthStore } from '@/store/auth'
import { useSedeStore } from '@/store/sede'
import { toast } from '@/common/utils/toast'

vi.mock('@/modules/M1-usuarios/services/usuarios.service', () => ({
  usuariosService: {
    obtenerDashboard: vi.fn(),
  },
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/store/sede', () => ({
  useSedeStore: vi.fn(),
}))

vi.mock('@/common/utils/toast', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('SocioDashboardView.vue', () => {
  const cargarSedesMock = vi.fn()
  let authStoreMock: {
    usuario: { nombre?: string; apellido?: string } | null
  }
  let sedeStoreMock: {
    sedes: Array<{ id_sede: number; nombre: string }>
    idSedeSeleccionada: number | null
    versionContexto: number
    sedeSeleccionada: { id_sede: number; nombre: string } | null
    cargarSedes: typeof cargarSedesMock
  }

  beforeEach(() => {
    vi.clearAllMocks()
    authStoreMock = reactive({
      usuario: { nombre: 'Marcos', apellido: 'Caraballo' },
    })
    sedeStoreMock = reactive({
      sedes: [],
      idSedeSeleccionada: 1,
      versionContexto: 0,
      sedeSeleccionada: { id_sede: 1, nombre: 'Sede Central' },
      cargarSedes: cargarSedesMock.mockResolvedValue(undefined),
    })

    vi.mocked(useAuthStore).mockReturnValue(
      authStoreMock as unknown as ReturnType<typeof useAuthStore>
    )
    vi.mocked(useSedeStore).mockReturnValue(
      sedeStoreMock as unknown as ReturnType<typeof useSedeStore>
    )
  })

  const mountView = () =>
    mount(SocioDashboardView, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          BaseSkeleton: { template: '<div data-testid="skeleton" />' },
        },
      },
    })

  it('carga sedes al montar si está vacío y renderiza métricas, membresía activa y próximas actividades', async () => {
    const mockDashboard: SocioDashboardResponse = {
      membresia: {
        id_membresia: 1,
        plan: 'Full',
        estado: 'Activa',
        fecha_inicio: '2026-11-01',
        fecha_fin: '2026-12-01',
        dias_restantes: 12,
        renovacion_automatica: true,
      },
      totales: {
        total_canchas: 4,
        total_clases: 9,
        total_actividades: 13,
        proximas_confirmadas: 2,
      },
      proximas_actividades: [
        {
          id: 'c-1',
          tipo: 'cancha',
          titulo: 'Fútbol 5',
          subtitulo: 'Cancha Techada',
          fecha_inicio: '2026-11-20T18:00:00Z',
          fecha_fin: '2026-11-20T19:00:00Z',
          estado: 'Confirmada',
          sede: { id_sede: 1, nombre: 'Sede Central' },
        },
        {
          id: 'cl-2',
          tipo: 'clase',
          titulo: 'Spinning',
          fecha_inicio: '2026-11-21T10:00:00Z',
          fecha_fin: '2026-11-21T11:00:00Z',
          estado: 'Pendiente',
          sede: { id_sede: 1, nombre: '' },
        },
      ],
    }
    vi.mocked(usuariosService.obtenerDashboard).mockResolvedValue(mockDashboard)

    const wrapper = mountView()
    expect(wrapper.findAll('[data-testid="skeleton"]').length).toBeGreaterThan(0)

    await flushPromises()

    expect(cargarSedesMock).toHaveBeenCalledTimes(1)
    expect(usuariosService.obtenerDashboard).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('¡Hola, Marcos Caraballo!')
    expect(wrapper.text()).toContain('Activa · 12 días')
    expect(wrapper.text()).toContain('Reserva de Cancha')
    expect(wrapper.text()).toContain('Clase Grupal')
    expect(wrapper.text()).toContain('Cancha Techada')
    expect(wrapper.text()).toContain('Confirmada')
    expect(wrapper.text()).toContain('Pendiente')
  })

  it('muestra estado vacío sin membresía, fallback de nombre y recarga al cambiar contexto de sede', async () => {
    authStoreMock.usuario = { nombre: 'Lucía' }
    sedeStoreMock.sedes = [{ id_sede: 2, nombre: 'Sede Sur' }]
    sedeStoreMock.sedeSeleccionada = null
    sedeStoreMock.idSedeSeleccionada = null

    vi.mocked(usuariosService.obtenerDashboard).mockResolvedValue({
      membresia: null,
      totales: {
        total_canchas: 0,
        total_clases: 0,
        total_actividades: 0,
        proximas_confirmadas: 0,
      },
      proximas_actividades: [],
    })

    const wrapper = mountView()
    await flushPromises()

    expect(cargarSedesMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('¡Hola, Lucía!')
    expect(wrapper.text()).toContain('Sin membresía')
    expect(wrapper.text()).toContain('No tenés reservas próximas registradas')

    authStoreMock.usuario = null
    sedeStoreMock.idSedeSeleccionada = 2
    sedeStoreMock.versionContexto += 1
    await flushPromises()

    expect(wrapper.text()).toContain('¡Hola, Socio FitZone!')
    expect(usuariosService.obtenerDashboard).toHaveBeenLastCalledWith(2)
  })

  it('muestra error con toast y permite reintentar cuando falla obtenerDashboard', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(usuariosService.obtenerDashboard).mockRejectedValueOnce(
      new Error('Timeout')
    )

    const wrapper = mountView()
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('Error al sincronizar el dashboard.')
    expect(wrapper.text()).toContain(
      'No se pudieron cargar tus actividades recientes.'
    )

    vi.mocked(usuariosService.obtenerDashboard).mockResolvedValueOnce({
      membresia: {
        id_membresia: 2,
        plan: 'Mensual',
        estado: 'Vencida',
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-11-01',
        dias_restantes: 0,
        renovacion_automatica: false,
      },
      totales: {
        total_canchas: 1,
        total_clases: 2,
        total_actividades: 3,
        proximas_confirmadas: 0,
      },
      proximas_actividades: [],
    })

    const btnReintentar = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Reintentar'))
    expect(btnReintentar).toBeDefined()
    await btnReintentar!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Vencida · 0 días')
    consoleSpy.mockRestore()
  })
})
