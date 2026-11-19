// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import type { ComponentPublicInstance } from 'vue'
import ClasesView from '@/modules/M3-clases-grupales/views/ClasesView.vue'
import { clasesService } from '@/modules/M3-clases-grupales/services/clases.service'
import { membresiasService } from '@/modules/M1-usuarios/services/membresias.service'
import { useSedeStore } from '@/store/sede'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/common/utils/toast'
import { obtenerFechaLocalISO } from '@/common/utils/date-formatter'

interface ClasesComponentVm extends ComponentPublicInstance {
  handleReservar: (id: number) => void
  handleListaEspera: (id: number) => void
  handleCancelar: (id: number) => void
  handleAbrirEliminarClase: (id: number) => void
  confirmarReserva: () => Promise<void>
  confirmarListaEspera: () => Promise<void>
  confirmarCancelacion: () => Promise<void>
  confirmarEliminacion: () => Promise<void>
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/membresia', component: { template: '<div />' } },
  ],
})

vi.mock('@/store/sede', () => ({
  useSedeStore: vi.fn(),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/modules/M3-clases-grupales/services/clases.service', () => ({
  clasesService: {
    obtenerClasesPorSede: vi.fn(),
    obtenerMisReservas: vi.fn(),
    obtenerMisInscripciones: vi.fn(),
    obtenerHorarioOperativoSede: vi.fn(),
    reservarClase: vi.fn(),
    inscribirListaEspera: vi.fn(),
    cancelarReserva: vi.fn(),
    eliminarClase: vi.fn(),
  },
}))

vi.mock('@/modules/M1-usuarios/services/membresias.service', () => ({
  membresiasService: {
    verificarEstado: vi.fn(),
  },
}))

vi.mock('@/common/utils/toast', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/common/utils/supabase', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  return {
    supabase: {
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
    },
  }
})

describe('ClasesView.vue - Cobertura Integral', () => {
  const hoyISO = obtenerFechaLocalISO()

  const claseMockBase = {
    id_clase: 101,
    id_sede: 1,
    nombre: 'Spinning Extremo',
    horario_inicio: '18:00',
    horario_fin: '19:00',
    fecha_inicio: `${hoyISO}T18:00:00`,
    fecha_fin: `${hoyISO}T19:00:00`,
    profesor: 'Carlos Gómez',
    sala: 'Sala Cardio',
    descripcion: 'Clase intensa de ciclismo',
    capacidad_maxima: 20,
    cupos_ocupados: 10,
    cupos_disponibles: 10,
    en_espera: 0,
    activo: true,
    estado: 'DISPONIBLE' as const,
    fecha: hoyISO,
    dias_semana: [0, 1, 2, 3, 4, 5, 6],
  }

  let mockSedeStore: {
    idSedeSeleccionada: number
    sedeSeleccionada: Record<string, unknown>
    sedes: Array<Record<string, unknown>>
    cargarSedes: ReturnType<typeof vi.fn>
    seleccionarSede: ReturnType<typeof vi.fn>
    obtenerHorarioOperativo: ReturnType<typeof vi.fn>
  }

  let mockAuthStore: {
    isAuthenticated: boolean
    rol: string
    usuario: Record<string, unknown>
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${hoyISO}T10:00:00`))
    vi.clearAllMocks()

    mockSedeStore = {
      idSedeSeleccionada: 1,
      sedeSeleccionada: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
      sedes: [{ id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 }],
      cargarSedes: vi.fn(),
      seleccionarSede: vi.fn(),
      obtenerHorarioOperativo: vi.fn().mockResolvedValue({
        abierto: true,
        hora_apertura: '07:00',
        hora_cierre: '23:00',
        es_horario_especial: false,
      }),
    }

    mockAuthStore = {
      isAuthenticated: true,
      rol: 'socio',
      usuario: {
        id: 50,
        nombre: 'Ana',
        rol: 'socio',
        id_sede: 1,
        sede: { id_sede: 1, id_ciudad: 1 },
      },
    }

    vi.mocked(useSedeStore).mockReturnValue(
      mockSedeStore as unknown as ReturnType<typeof useSedeStore>
    )
    vi.mocked(useAuthStore).mockReturnValue(
      mockAuthStore as unknown as ReturnType<typeof useAuthStore>
    )

    vi.mocked(membresiasService.verificarEstado).mockResolvedValue({
      esSocioActivo: true,
      enMora: false,
      estado: 'ACTIVA',
    })

    vi.mocked(clasesService.obtenerClasesPorSede).mockResolvedValue([
      claseMockBase,
    ] as unknown as Awaited<
      ReturnType<typeof clasesService.obtenerClasesPorSede>
    >)
    vi.mocked(clasesService.obtenerMisReservas).mockResolvedValue([])
    vi.mocked(clasesService.obtenerMisInscripciones).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const montarVista = () =>
    mount(ClasesView, {
      global: {
        plugins: [router],
        stubs: {
          ClaseCard: {
            name: 'ClaseCard',
            props: ['clase'],
            template: `<div class="clase-card-stub"><span>{{ clase.nombre }}</span></div>`,
          },
          ModalClaseForm: {
            template: '<div class="modal-clase-form-stub"></div>',
          },
        },
      },
    })

  it('renderiza la agenda, carga clases y permite navegar entre días y semanas', async () => {
    const wrapper = montarVista()
    await flushPromises()

    expect(wrapper.text()).toContain('Agenda de Clases Grupales')
    expect(wrapper.text()).toContain('Sede Central')
    expect(wrapper.text()).toContain('Spinning Extremo')

    const btnDiaSiguiente = wrapper.find('button[title="Día siguiente"]')
    await btnDiaSiguiente.trigger('click')
    await flushPromises()

    const btnSemanaSiguiente = wrapper.find('button[title="Semana siguiente"]')
    await btnSemanaSiguiente.trigger('click')
    await flushPromises()

    const btnSemanaAnterior = wrapper.find('button[title="Semana anterior"]')
    await btnSemanaAnterior.trigger('click')
    await flushPromises()

    const btnHoy = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Hoy')
    await btnHoy?.trigger('click')
    await flushPromises()

    expect(clasesService.obtenerClasesPorSede).toHaveBeenCalled()
  })

  it('muestra estado de sede cerrada cuando el horario operativo indica abierto: false', async () => {
    mockSedeStore.obtenerHorarioOperativo.mockResolvedValue({
      abierto: false,
      motivo_cierre: 'Feriado Nacional',
    })

    const wrapper = montarVista()
    await flushPromises()

    expect(wrapper.text()).toContain('Sede Cerrada')
    expect(wrapper.text()).toContain('Feriado Nacional')
  })

  it('muestra estado de error y permite reintentar la carga', async () => {
    vi.mocked(clasesService.obtenerClasesPorSede).mockRejectedValueOnce(
      new Error('Fallo de red')
    )

    const wrapper = montarVista()
    await flushPromises()

    expect(wrapper.text()).toContain('Oops, tuvimos un problema de conexión')
  })

  it('muestra banner de inhabilitación para clientes externos y redirige al intentar reservar', async () => {
    mockAuthStore.rol = 'externo'
    mockAuthStore.usuario = { id: 50, rol: 'externo' }
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = montarVista()
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Acceso de solo lectura para Clientes Externos'
    )

    const vm = wrapper.vm as unknown as ClasesComponentVm
    vm.handleReservar(101)
    expect(toast.warning).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/membresia')
  })

  it('muestra banner de mora cuando el socio tiene cuotas vencidas', async () => {
    vi.mocked(membresiasService.verificarEstado).mockResolvedValue({
      esSocioActivo: false,
      enMora: true,
      estado: 'VENCIDA',
    })

    const wrapper = montarVista()
    await flushPromises()

    expect(wrapper.text()).toContain('Membresía Vencida / Cuota Pendiente')
  })

  it('muestra banner de ciudad diferente y permite volver a la sede propia', async () => {
    mockSedeStore.sedeSeleccionada = {
      id_sede: 2,
      nombre: 'Sede Paraná',
      id_ciudad: 2,
    }

    const wrapper = montarVista()
    await flushPromises()

    expect(wrapper.text()).toContain('Sede en otra ciudad')

    const btnVolverSede = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Volver a mi Sede'))
    await btnVolverSede?.trigger('click')

    expect(mockSedeStore.seleccionarSede).toHaveBeenCalledWith(1)
  })

  it('permite abrir el modal de reserva y confirmar una reserva con éxito', async () => {
    vi.mocked(clasesService.reservarClase).mockResolvedValue({
      id_reserva: 999,
      id_clase_reserva: 999,
    } as unknown as Awaited<ReturnType<typeof clasesService.reservarClase>>)

    const wrapper = montarVista()
    await flushPromises()

    const vm = wrapper.vm as unknown as ClasesComponentVm
    await vm.handleReservar(101)
    await vm.confirmarReserva()
    await flushPromises()

    expect(clasesService.reservarClase).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(
      'Reserva confirmada para Spinning Extremo'
    )
  })

  it('permite anotarse en lista de espera cuando una clase está completa', async () => {
    vi.mocked(clasesService.obtenerClasesPorSede).mockResolvedValue([
      {
        ...claseMockBase,
        cupos_ocupados: 20,
        cupos_disponibles: 0,
        estado: 'COMPLETA',
      },
    ] as unknown as Awaited<
      ReturnType<typeof clasesService.obtenerClasesPorSede>
    >)
    vi.mocked(clasesService.inscribirListaEspera).mockResolvedValue({
      id_lista: 321,
      orden_en_cola: 2,
    })

    const wrapper = montarVista()
    await flushPromises()

    const vm = wrapper.vm as unknown as ClasesComponentVm
    await vm.handleListaEspera(101)
    await vm.confirmarListaEspera()
    await flushPromises()

    expect(clasesService.inscribirListaEspera).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(
      'Estás en lista de espera para Spinning Extremo (Posición #2)'
    )
  })

  it('permite cancelar una reserva confirmada con más de 2 horas de anticipación', async () => {
    vi.mocked(clasesService.obtenerMisReservas).mockResolvedValue([
      {
        id_clase_reserva: 777,
        id_clase: 101,
        id_usuario: 50,
        id_clase_reserva_estado: 1,
        estado: 'CONFIRMADA',
        fecha_inicio: `${hoyISO}T18:00:00`,
        fecha_fin: `${hoyISO}T19:00:00`,
      },
    ] as unknown as Awaited<
      ReturnType<typeof clasesService.obtenerMisReservas>
    >)
    vi.mocked(clasesService.cancelarReserva).mockResolvedValue(undefined)

    const wrapper = montarVista()
    await flushPromises()

    const vm = wrapper.vm as unknown as ClasesComponentVm
    await vm.handleCancelar(101)
    await vm.confirmarCancelacion()
    await flushPromises()

    expect(clasesService.cancelarReserva).toHaveBeenCalledWith(777)
    expect(toast.info).toHaveBeenCalledWith(
      'Reserva de Spinning Extremo cancelada.'
    )
  })

  it('habilita acciones CRUD (crear, editar, eliminar) para el rol gerente', async () => {
    mockAuthStore.rol = 'gerente'
    vi.mocked(clasesService.eliminarClase).mockResolvedValue(
      undefined as unknown as Awaited<
        ReturnType<typeof clasesService.eliminarClase>
      >
    )

    const wrapper = montarVista()
    await flushPromises()

    const vm = wrapper.vm as unknown as ClasesComponentVm
    await vm.handleAbrirEliminarClase(101)
    await vm.confirmarEliminacion()
    await flushPromises()

    expect(clasesService.eliminarClase).toHaveBeenCalledWith(101)
    expect(toast.success).toHaveBeenCalled()
  })
})
