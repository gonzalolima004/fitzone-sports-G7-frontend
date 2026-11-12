// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ClasesView from '@/modules/M3-clases-grupales/views/ClasesView.vue'
import ClaseCard from '@/modules/M3-clases-grupales/components/ClaseCard.vue'
import Sidebar from '@/common/components/Sidebar.vue'
import routerInstance from '@/router/index'
import type { Usuario } from '@/store/auth'

const mockAuth = vi.hoisted(() => ({
  rol: 'socio' as 'socio' | 'externo' | 'gerente',
  isAuthenticated: true,
  usuario: {
    id: 10,
    nombre: 'Juan Perez',
    id_sede: 1,
    sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
  } as Usuario | null,
}))

const mockSedeStore = vi.hoisted(() => ({
  idSedeSeleccionada: 1,
  sedeSeleccionada: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 } as {
    id_sede: number
    nombre: string
    id_ciudad?: number
  } | null,
  sedes: [
    { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
    { id_sede: 2, nombre: 'Sede Córdoba', id_ciudad: 2 },
  ],
  cargarSedes: vi.fn(),
  seleccionarSede: vi.fn(),
}))

const mockMembresias = vi.hoisted(() => ({
  verificarEstado: vi.fn(),
}))

const mockClasesService = vi.hoisted(() => ({
  obtenerClasesPorSede: vi.fn(),
  obtenerMisReservas: vi.fn(),
  obtenerMisInscripciones: vi.fn(),
  obtenerHorarioOperativoSede: vi.fn(),
  reservarClase: vi.fn(),
  inscribirListaEspera: vi.fn(),
}))

const mockToast = vi.hoisted(() => ({
  warning: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: () => mockAuth,
}))

vi.mock('@/store/sede', () => ({
  useSedeStore: () => mockSedeStore,
}))

vi.mock('@/common/utils/toast', () => ({
  toast: mockToast,
}))

vi.mock('@/modules/M1-usuarios/services/membresias.service', () => ({
  membresiasService: mockMembresias,
}))

vi.mock('@/modules/M3-clases-grupales/services/clases.service', () => ({
  clasesService: mockClasesService,
}))

vi.mock('@/common/utils/supabase', () => ({
  supabase: {
    channel: () => ({
      on: () => ({ subscribe: vi.fn() }),
    }),
    removeChannel: vi.fn(),
  },
}))

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/clases', component: { template: '<div />' } },
      { path: '/membresia', component: { template: '<div />' } },
    ],
  })
}

// Fecha 12 horas en el futuro (dentro de la ventana de reserva de 48 hs)
const fechaFutura = new Date(Date.now() + 12 * 3600 * 1000)
const fechaFuturaISO = fechaFutura.toISOString().split('T')[0]
const fechaFuturaInicio = fechaFutura.toISOString()
const fechaFuturaFin = new Date(
  fechaFutura.getTime() + 3600 * 1000
).toISOString()

const mockClaseItem = {
  id_clase: 101,
  nombre: 'Spinning Power',
  fecha: fechaFuturaISO,
  horario_inicio: '18:00',
  horario_fin: '19:00',
  capacidad_maxima: 20,
  cupos_ocupados: 5,
  cupos_disponibles: 15,
  en_espera: 0,
  estado: 'DISPONIBLE' as const,
  profesor: 'Carlos Gomez',
  sala: 'Sala 1',
}

describe('E16-T1: Visualización para externos y restricciones por membresía', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClasesService.obtenerClasesPorSede.mockResolvedValue([mockClaseItem])
    mockClasesService.obtenerMisReservas.mockResolvedValue([])
    mockClasesService.obtenerMisInscripciones.mockResolvedValue([])
    mockClasesService.obtenerHorarioOperativoSede.mockResolvedValue({
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    })
  })

  describe('Configuración de Rutas y Sidebar', () => {
    it('permite a clientes externos acceder a la ruta /clases', () => {
      const rutaClases = routerInstance
        .getRoutes()
        .find((r) => r.path === '/clases' || r.name === 'clases')
      expect(rutaClases).toBeDefined()
      expect(rutaClases?.meta?.roles).toContain('externo')
    })

    it('muestra el acceso a Clases Grupales en el Sidebar para rol externo', () => {
      mockAuth.rol = 'externo'
      const router = createTestRouter()
      const wrapper = mount(Sidebar, {
        global: { plugins: [router] },
      })
      const link = wrapper
        .findAll('a')
        .find((a) => a.text().includes('Clases Grupales'))
      expect(link).toBeDefined()
      expect(link?.attributes('href')).toBe('/clases')
    })
  })

  describe('Clientes Externos (rol: externo)', () => {
    beforeEach(() => {
      mockAuth.rol = 'externo'
      mockAuth.usuario = { id: 50, nombre: 'Cliente Externo' }
    })

    it('visualiza la agenda de clases pero muestra banner explicativo y enlace a /membresia', async () => {
      const router = createTestRouter()
      router.push('/clases')
      await router.isReady()

      const wrapper = mount(ClasesView, {
        global: { plugins: [router] },
      })
      await flushPromises()

      // Banner para externos presente con enlace
      expect(wrapper.text()).toContain(
        'Acceso de solo lectura para Clientes Externos'
      )
      expect(wrapper.text()).toContain('Ver Planes de Membresía')

      // No invoca endpoints de reservas personales de socio
      expect(mockClasesService.obtenerMisReservas).not.toHaveBeenCalled()
      expect(mockClasesService.obtenerMisInscripciones).not.toHaveBeenCalled()

      // El enlace apunta a membresía
      const bannerLink = wrapper
        .findAll('a')
        .find((a) => a.text().includes('Ver Planes de Membresía'))
      expect(bannerLink?.attributes('href')).toBe('/membresia')
    })

    it('en ClaseCard el botón de inscripción redirige hacia /membresia', async () => {
      const router = createTestRouter()
      const wrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 101,
            nombre: 'Spinning Power',
            tipo: 'SPINNING',
            icono: 'bicycle',
            horario: '18:00 - 19:00 hs',
            fecha_inicio: fechaFuturaInicio,
            fecha_fin: fechaFuturaFin,
            capacidadMaxima: 20,
            cuposOcupados: 5,
            cuposDisponibles: 15,
            enListaEspera: 0,
            estado: 'DISPONIBLE',
          },
          motivoInhabilitacion: 'EXTERNO',
        },
        global: { plugins: [router] },
      })

      expect(wrapper.text()).toContain('Exclusivo Socios · Ver Planes')
      const btnLink = wrapper.find('a[href="/membresia"]')
      expect(btnLink.exists()).toBe(true)
    })
  })

  describe('Socios en Mora / Membresía Vencida', () => {
    beforeEach(() => {
      mockAuth.rol = 'socio'
      mockAuth.usuario = { id: 20, nombre: 'Socio Moroso' }
      mockMembresias.verificarEstado.mockResolvedValue({
        esSocioActivo: false,
        enMora: true,
        estado: 'VENCIDA',
      })
    })

    it('muestra aviso de mora con enlace a membresías e inhabilita reservas', async () => {
      const router = createTestRouter()
      router.push('/clases')
      await router.isReady()

      const wrapper = mount(ClasesView, {
        global: { plugins: [router] },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Membresía Vencida / Cuota Pendiente')
      expect(wrapper.text()).toContain('Regularizar Membresía')

      const bannerLink = wrapper
        .findAll('a')
        .find((a) => a.text().includes('Regularizar Membresía'))
      expect(bannerLink?.attributes('href')).toBe('/membresia')
    })

    it('en ClaseCard para mora muestra botón de pago hacia /membresia', () => {
      const router = createTestRouter()
      const wrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 101,
            nombre: 'Crossfit WOD',
            tipo: 'CROSSFIT',
            icono: 'barbell',
            horario: '18:00 - 19:00 hs',
            fecha_inicio: fechaFuturaInicio,
            fecha_fin: fechaFuturaFin,
            capacidadMaxima: 15,
            cuposOcupados: 5,
            enListaEspera: 0,
            estado: 'DISPONIBLE',
          },
          motivoInhabilitacion: 'MORA',
        },
        global: { plugins: [router] },
      })

      expect(wrapper.text()).toContain('Cuota Pendiente · Regularizar')
      expect(wrapper.find('a[href="/membresia"]').exists()).toBe(true)
    })
  })

  describe('Socios con Membresía Suspendida', () => {
    beforeEach(() => {
      mockAuth.rol = 'socio'
      mockAuth.usuario = { id: 30, nombre: 'Socio Suspendido' }
      mockMembresias.verificarEstado.mockResolvedValue({
        esSocioActivo: false,
        enMora: false,
        estado: 'SUSPENDIDA',
      })
    })

    it('muestra banner de membresía suspendida con enlace a /membresia', async () => {
      const router = createTestRouter()
      router.push('/clases')
      await router.isReady()

      const wrapper = mount(ClasesView, {
        global: { plugins: [router] },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Membresía Suspendida')
      expect(wrapper.text()).toContain('Gestionar Membresía')

      const bannerLink = wrapper
        .findAll('a')
        .find((a) => a.text().includes('Gestionar Membresía'))
      expect(bannerLink?.attributes('href')).toBe('/membresia')
    })

    it('en ClaseCard para suspendida muestra botón contextual hacia /membresia', () => {
      const router = createTestRouter()
      const wrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 102,
            nombre: 'Yoga Vinyasa',
            tipo: 'YOGA VINYASA',
            icono: 'lotus',
            horario: '18:00 - 19:00 hs',
            fecha_inicio: fechaFuturaInicio,
            fecha_fin: fechaFuturaFin,
            capacidadMaxima: 12,
            cuposOcupados: 2,
            enListaEspera: 0,
            estado: 'DISPONIBLE',
          },
          motivoInhabilitacion: 'SUSPENDIDA',
        },
        global: { plugins: [router] },
      })

      expect(wrapper.text()).toContain('Membresía Suspendida · Gestionar')
      expect(wrapper.find('a[href="/membresia"]').exists()).toBe(true)
    })
  })

  describe('Socio Activo Habilitado', () => {
    beforeEach(() => {
      mockAuth.rol = 'socio'
      mockAuth.usuario = {
        id: 40,
        nombre: 'Socio Activo',
        id_sede: 1,
        sede: { id_sede: 1, nombre: 'Sede Central', id_ciudad: 1 },
      }
      mockMembresias.verificarEstado.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
        estado: 'ACTIVA',
      })
    })

    it('no muestra banners de restricción y en ClaseCard dentro de la ventana de reserva muestra Reservar Lugar', async () => {
      const router = createTestRouter()
      router.push('/clases')
      await router.isReady()

      const wrapper = mount(ClasesView, {
        global: { plugins: [router] },
      })
      await flushPromises()

      // No se muestran avisos de restricción
      expect(wrapper.text()).not.toContain('Acceso de solo lectura')
      expect(wrapper.text()).not.toContain('Membresía Vencida')
      expect(wrapper.text()).not.toContain('Membresía Suspendida')
      expect(wrapper.text()).not.toContain('Sede en otra ciudad')

      // Verificamos ClaseCard directamente dentro de la ventana
      const cardWrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 101,
            nombre: 'Spinning Power',
            tipo: 'SPINNING',
            icono: 'bicycle',
            horario: '18:00 - 19:00 hs',
            fecha_inicio: fechaFuturaInicio,
            fecha_fin: fechaFuturaFin,
            capacidadMaxima: 20,
            cuposOcupados: 5,
            cuposDisponibles: 15,
            enListaEspera: 0,
            estado: 'DISPONIBLE',
          },
          motivoInhabilitacion: null,
        },
        global: { plugins: [router] },
      })
      expect(cardWrapper.text()).toContain('Reservar Clase')
    })
  })

  describe('Validación de Jurisdicción por Ciudad (Regla 4)', () => {
    beforeEach(() => {
      mockAuth.rol = 'socio'
      // Socio pertenece a Sede Córdoba (id_ciudad: 2)
      mockAuth.usuario = {
        id: 45,
        nombre: 'Socio Cordoba',
        id_sede: 2,
        sede: { id_sede: 2, nombre: 'Sede Córdoba', id_ciudad: 2 },
      }
      // Membresía activa sin mora
      mockMembresias.verificarEstado.mockResolvedValue({
        esSocioActivo: true,
        enMora: false,
        estado: 'ACTIVA',
      })
      // Sede seleccionada en vista es Sede Central (id_ciudad: 1)
      mockSedeStore.idSedeSeleccionada = 1
      mockSedeStore.sedeSeleccionada = {
        id_sede: 1,
        nombre: 'Sede Central',
        id_ciudad: 1,
      }
    })

    it('bloquea la reserva y muestra banner informativo cuando la sede pertenece a otra ciudad', async () => {
      const router = createTestRouter()
      router.push('/clases')
      await router.isReady()

      const wrapper = mount(ClasesView, {
        global: { plugins: [router] },
      })
      await flushPromises()

      // Banner específico de sede en otra ciudad
      expect(wrapper.text()).toContain('Sede en otra ciudad')
      expect(wrapper.text()).toContain(
        'Tu membresía te permite reservar clases únicamente en sedes de tu misma ciudad'
      )

      // Botón para volver a su sede nativa
      const volverBtn = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Volver a mi Sede'))
      expect(volverBtn).toBeDefined()
      await volverBtn?.trigger('click')
      expect(mockSedeStore.seleccionarSede).toHaveBeenCalledWith(2)
    })

    it('en ClaseCard muestra botón deshabilitado "Sede en otra ciudad"', () => {
      const router = createTestRouter()
      const cardWrapper = mount(ClaseCard, {
        props: {
          clase: {
            id: 101,
            nombre: 'Spinning Power',
            tipo: 'SPINNING',
            icono: 'bicycle',
            horario: '18:00 - 19:00 hs',
            fecha_inicio: fechaFuturaInicio,
            fecha_fin: fechaFuturaFin,
            capacidadMaxima: 20,
            cuposOcupados: 5,
            cuposDisponibles: 15,
            enListaEspera: 0,
            estado: 'DISPONIBLE',
          },
          motivoInhabilitacion: 'CIUDAD_DIFERENTE',
        },
        global: { plugins: [router] },
      })

      expect(cardWrapper.text()).toContain('Sede en otra ciudad')
      const btn = cardWrapper.find('button[disabled]')
      expect(btn.exists()).toBe(true)
    })
  })
})
