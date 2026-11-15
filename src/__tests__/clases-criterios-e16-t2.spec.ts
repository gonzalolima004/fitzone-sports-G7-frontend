// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ModalClaseForm from '@/modules/M3-clases-grupales/components/ModalClaseForm.vue'
import ClaseCard from '@/modules/M3-clases-grupales/components/ClaseCard.vue'
import ClasesView from '@/modules/M3-clases-grupales/views/ClasesView.vue'

const mocks = vi.hoisted(() => ({
  on: vi.fn(),
  subscribe: vi.fn(),
  removeChannel: vi.fn(),
  toastSuccess: vi.fn(),
  toastWarning: vi.fn(),
  toastInfo: vi.fn(),
  agenda: vi.fn().mockResolvedValue([]),
  actualizarClase: vi.fn().mockResolvedValue({}),
  crearClase: vi.fn().mockResolvedValue({}),
  obtenerHorario: vi.fn().mockResolvedValue({
    abierto: true,
    hora_apertura: '08:00',
    hora_cierre: '21:00',
  }),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    rol: 'gerente',
    isAuthenticated: true,
    usuario: { id: 99, rol: 'gerente', id_sede: 1 },
  }),
}))

vi.mock('@/store/sede', () => ({
  useSedeStore: () => ({
    idSedeSeleccionada: 1,
    cargarSedes: vi.fn(),
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
  const channel = { on: mocks.on, subscribe: mocks.subscribe }
  mocks.on.mockReturnValue(channel)
  mocks.subscribe.mockReturnValue(channel)
  return {
    supabase: {
      channel: () => channel,
      removeChannel: mocks.removeChannel,
    },
  }
})

vi.mock('@/modules/M3-clases-grupales/services/clases.service', () => ({
  clasesService: {
    obtenerClasesPorSede: mocks.agenda,
    obtenerMisReservas: vi.fn().mockResolvedValue([]),
    obtenerMisInscripciones: vi.fn().mockResolvedValue([]),
    obtenerHorarioOperativoSede: mocks.obtenerHorario,
    actualizarClase: mocks.actualizarClase,
    crearClase: mocks.crearClase,
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

describe('Verificación de Criterios de Aceptación E16-T2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.obtenerHorario.mockResolvedValue({
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '21:00',
    })
  })

  describe('Criterio 1: Cupos disponibles actualizados en vivo mediante Supabase Realtime', () => {
    it('establece suscripción Realtime a tabla clase_reserva y actualiza agenda al disparar cambios', async () => {
      mount(ClasesView)
      await flushPromises()

      // Verificar que se haya registrado canal para clase_reserva
      const matchCall = mocks.on.mock.calls.find(
        (call) =>
          call[0] === 'postgres_changes' && call[1]?.table === 'clase_reserva'
      )
      expect(matchCall).toBeDefined()

      // Simular cambio en reservas (INSERT / UPDATE / DELETE)
      const callbackCupos = matchCall![2]
      mocks.agenda.mockClear()
      callbackCupos()
      await new Promise((resolve) => setTimeout(resolve, 200))
      await flushPromises()

      expect(mocks.agenda).toHaveBeenCalled()
    })
  })

  describe('Criterio 2: Aviso visual en interfaz cuando se libera vacante para usuario en lista de espera', () => {
    it('muestra notificación toast permanente cuando el estado cambia a 2 (promovido)', async () => {
      mount(ClasesView)
      await flushPromises()

      const matchCall = mocks.on.mock.calls.find(
        (call) =>
          call[0] === 'postgres_changes' &&
          call[1]?.table === 'clase_lista_espera'
      )
      expect(matchCall).toBeDefined()

      const callbackListaEspera = matchCall![2]
      callbackListaEspera({ new: { id_clase_lista_espera_estado: 2 } })
      await flushPromises()

      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Se liberó un lugar en tu clase'),
        expect.objectContaining({ autoClose: false })
      )
    })
  })

  describe('Criterio 3: Carga y guardado de descripción en formulario administrativo sin pérdida de datos', () => {
    it('carga la descripción previa al editar y la envía completa en la actualización', async () => {
      const claseExistente = {
        id: 42,
        nombre: 'Spinning Power',
        descripcion: 'Clase intensa de resistencia cardiovascular en bicicleta',
        profesor: 'Carlos Ruiz',
        sala: 'Sala 1',
        horario_inicio: '09:00',
        horario_fin: '10:00',
        capacidadMaxima: 25,
        dias_semana: [1, 3],
        fecha: null,
      }

      const wrapper = mount(ModalClaseForm, {
        props: {
          modelValue: true,
          idSede: 1,
          claseAEditar: claseExistente,
        },
        global: {
          stubs: {
            Teleport: true,
            Transition: true,
          },
        },
      })
      await flushPromises()

      // Verificar que el textarea contenga la descripción preexistente
      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe(
        'Clase intensa de resistencia cardiovascular en bicicleta'
      )

      // Guardar clase (botón Crear/Actualizar Clase con variant="secondary")
      const botones = wrapper.findAll('button')
      const botonGuardar = botones.find((b) =>
        b.text().includes('Actualizar Clase')
      )
      expect(botonGuardar).toBeDefined()
      await botonGuardar!.trigger('click')
      await flushPromises()

      expect(mocks.actualizarClase).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          descripcion:
            'Clase intensa de resistencia cardiovascular en bicicleta',
        })
      )
    })
  })

  describe('Criterio 4: Validación y bloqueo de horarios fuera del rango operativo de apertura y cierre', () => {
    it('bloquea la creación cuando el horario de inicio es anterior a la apertura de la sede', async () => {
      mocks.obtenerHorario.mockResolvedValue({
        abierto: true,
        hora_apertura: '08:00',
        hora_cierre: '20:00',
      })

      const wrapper = mount(ModalClaseForm, {
        props: {
          modelValue: true,
          idSede: 1,
          fechaPorDefecto: '2026-11-15',
        },
        global: {
          stubs: {
            Teleport: true,
            Transition: true,
          },
        },
      })
      await flushPromises()

      // Modificar horario inicio a 07:00 (sede abre a las 08:00)
      const inputs = wrapper.findAll('input[type="time"]')
      await inputs[0].setValue('07:00')
      await inputs[1].setValue('08:30')

      // Intentar guardar
      const botonGuardar = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Crear Clase'))
      expect(botonGuardar).toBeDefined()
      await botonGuardar!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('fuera del horario operativo de la sede')
      expect(mocks.crearClase).not.toHaveBeenCalled()
    })

    it('bloquea la creación cuando el horario de fin es posterior al cierre de la sede', async () => {
      mocks.obtenerHorario.mockResolvedValue({
        abierto: true,
        hora_apertura: '08:00',
        hora_cierre: '20:00',
      })

      const wrapper = mount(ModalClaseForm, {
        props: {
          modelValue: true,
          idSede: 1,
          fechaPorDefecto: '2026-11-15',
        },
        global: {
          stubs: {
            Teleport: true,
            Transition: true,
          },
        },
      })
      await flushPromises()

      const inputs = wrapper.findAll('input[type="time"]')
      await inputs[0].setValue('19:30')
      await inputs[1].setValue('21:00')

      const botonGuardar = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Crear Clase'))
      expect(botonGuardar).toBeDefined()
      await botonGuardar!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('fuera del horario operativo de la sede')
      expect(mocks.crearClase).not.toHaveBeenCalled()
    })

    it('bloquea la creación si la sede se encuentra cerrada en la fecha', async () => {
      mocks.obtenerHorario.mockResolvedValue({
        abierto: false,
        hora_apertura: '00:00',
        hora_cierre: '00:00',
      })

      const wrapper = mount(ModalClaseForm, {
        props: {
          modelValue: true,
          idSede: 1,
          fechaPorDefecto: '2026-11-15',
        },
        global: {
          stubs: {
            Teleport: true,
            Transition: true,
          },
        },
      })
      await flushPromises()

      const botonGuardar = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Crear Clase'))
      expect(botonGuardar).toBeDefined()
      await botonGuardar!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('sede se encuentra cerrada')
      expect(mocks.crearClase).not.toHaveBeenCalled()
    })
  })

  describe('Criterio 5: Selección de tipo de clase clarificada y cursor pointer en botones', () => {
    it('provee selector claro de disciplina (Spinning, Yoga, CrossFit) y actualiza el tipo activo', async () => {
      const wrapper = mount(ModalClaseForm, {
        props: {
          modelValue: true,
          idSede: 1,
        },
        global: {
          stubs: {
            Teleport: true,
            Transition: true,
          },
        },
      })
      await flushPromises()

      // Verificar existencia de botones de disciplina
      expect(wrapper.text()).toContain('Spinning')
      expect(wrapper.text()).toContain('Yoga Vinyasa')
      expect(wrapper.text()).toContain('CrossFit')

      // Al hacer clic en Yoga, se actualiza el nombre por defecto
      const botonYoga = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Yoga Vinyasa'))
      expect(botonYoga).toBeDefined()
      await botonYoga!.trigger('click')

      const inputNombre = wrapper.find<HTMLInputElement>('input[type="text"]')
      expect(inputNombre.element.value).toBe('Yoga Vinyasa')
    })

    it('todos los botones de selección y acción cuentan con la clase cursor-pointer', () => {
      const wrapper = mount(ModalClaseForm, {
        props: {
          modelValue: true,
          idSede: 1,
        },
        global: {
          stubs: {
            Teleport: true,
            Transition: true,
          },
        },
      })

      const botones = wrapper.findAll('button')
      expect(botones.length).toBeGreaterThan(0)
      botones.forEach((boton) => {
        expect(boton.classes()).toContain('cursor-pointer')
      })
    })

    it('el botón "Reservar Clase" mantiene siempre el mismo color institucional (#202759) para cualquier disciplina', () => {
      const ahora = new Date()
      const fechaFutura = new Date(
        ahora.getTime() + 10 * 3600 * 1000
      ).toISOString()
      const fechaFinFutura = new Date(
        ahora.getTime() + 11 * 3600 * 1000
      ).toISOString()

      const claseCrossfit = {
        id: 1,
        nombre: 'CrossFit WOD',
        tipo: 'CROSSFIT',
        icono: 'PhBarbell',
        horario: '10:00 - 11:00 hs',
        fecha_inicio: fechaFutura,
        fecha_fin: fechaFinFutura,
        capacidadMaxima: 20,
        cuposOcupados: 5,
        cuposDisponibles: 15,
        enListaEspera: 0,
        estado: 'DISPONIBLE' as const,
      }

      const claseSpinning = {
        ...claseCrossfit,
        id: 2,
        nombre: 'Spinning Power',
        tipo: 'SPINNING',
      }

      const wrapperCrossfit = mount(ClaseCard, {
        props: { clase: claseCrossfit },
        global: { stubs: { RouterLink: true } },
      })
      const wrapperSpinning = mount(ClaseCard, {
        props: { clase: claseSpinning },
        global: { stubs: { RouterLink: true } },
      })

      const btnCrossfit = wrapperCrossfit.find('button')
      const btnSpinning = wrapperSpinning.find('button')

      expect(btnCrossfit.text()).toContain('Reservar Clase')
      expect(btnSpinning.text()).toContain('Reservar Clase')

      // Ambos deben poseer la misma clase de color base sin importar el tipo
      expect(btnCrossfit.classes()).toContain('bg-[#202759]')
      expect(btnSpinning.classes()).toContain('bg-[#202759]')
      expect(btnCrossfit.classes()).not.toContain('bg-rose-500')
      expect(btnSpinning.classes()).not.toContain('bg-rose-500')
    })
  })
})
