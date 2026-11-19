// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import CredencialView from '@/modules/M2-accesos/views/CredencialView.vue'
import { accesosService } from '@/modules/M2-accesos/services/accesos.service'
import { useQr } from '@/modules/M2-accesos/composables/useQr'
import { useAuthStore } from '@/store/auth'
import { useSedeStore } from '@/store/sede'
import type {
  QrResponseDto,
  SocioPerfilDto,
} from '@/modules/M2-accesos/types/accesos.types'

vi.mock('@/modules/M2-accesos/services/accesos.service', () => ({
  accesosService: {
    obtenerPerfilSocio: vi.fn(),
  },
}))

vi.mock('@/modules/M2-accesos/composables/useQr', () => ({
  useQr: vi.fn(),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/store/sede', () => ({
  useSedeStore: vi.fn(),
}))

vi.mock('qrcode.vue', () => ({
  default: {
    name: 'Qrcode',
    props: ['value', 'size', 'level', 'renderAs'],
    template: '<div data-testid="qrcode-svg">{{ value }}</div>',
  },
}))

describe('CredencialView.vue', () => {
  const cargarQrMock = vi.fn()
  const cargarSedesMock = vi.fn()
  const setPerfilInternoMock = vi.fn()

  let qrDataRef = ref<QrResponseDto | null>(null)
  let timeRemainingRef = ref(65)
  let isQrLoadingRef = ref(false)
  let qrErrorRef = ref<string | null>(null)
  let isExpiredRef = ref(false)

  let authStoreMock: {
    usuario: {
      id: number
      nombre?: string
      apellido?: string
      email?: string
      dni?: string
      foto_url?: string
      id_ciudad?: number
      estadoMembresia?: string
    } | null
    setPerfilInterno: typeof setPerfilInternoMock
  }

  let sedeStoreMock: {
    sedeSeleccionada: {
      id_sede: number
      nombre: string
      id_ciudad?: number
    } | null
    cargarSedes: typeof cargarSedesMock
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { onLine: true })

    qrDataRef = ref<QrResponseDto | null>({
      token: '10.1.9999.abcdef',
      validSeconds: 65,
      expiresAt: '2026-11-19T18:00:00Z',
    })
    timeRemainingRef = ref(65)
    isQrLoadingRef = ref(false)
    qrErrorRef = ref<string | null>(null)
    isExpiredRef = ref(false)

    authStoreMock = {
      usuario: {
        id: 10,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@fitzone.com',
        dni: '30111222',
        id_ciudad: 1,
        estadoMembresia: 'ACTIVA',
      },
      setPerfilInterno: setPerfilInternoMock,
    }

    sedeStoreMock = {
      sedeSeleccionada: { id_sede: 1, nombre: 'Sede Centro', id_ciudad: 1 },
      cargarSedes: cargarSedesMock.mockResolvedValue(undefined),
    }

    vi.mocked(useAuthStore).mockReturnValue(
      authStoreMock as unknown as ReturnType<typeof useAuthStore>
    )
    vi.mocked(useSedeStore).mockReturnValue(
      sedeStoreMock as unknown as ReturnType<typeof useSedeStore>
    )
    vi.mocked(useQr).mockReturnValue({
      qrData: qrDataRef,
      timeRemaining: timeRemainingRef,
      isLoading: isQrLoadingRef,
      errorMessage: qrErrorRef,
      isExpired: isExpiredRef,
      cargarQr: cargarQrMock.mockResolvedValue(undefined),
      stopTimer: vi.fn(),
    } as unknown as ReturnType<typeof useQr>)
  })

  it('carga perfil con membresía activa en arreglo, foto y renderiza el QR y temporizador', async () => {
    vi.mocked(accesosService.obtenerPerfilSocio).mockResolvedValue({
      socioId: 10,
      nombre: 'Juan Pérez',
      dni: '30111222',
      iniciales: 'JP',
      foto_url: 'https://cdn.fitzone.com/juan.png',
      id_ciudad: 1,
      membresia: [
        { membresia_estado: { descripcion: 'vencida' } },
        { membresia_estado: { descripcion: 'activa' } },
      ],
    } as unknown as SocioPerfilDto)

    const wrapper = mount(CredencialView)
    await flushPromises()

    expect(cargarSedesMock).toHaveBeenCalled()
    expect(setPerfilInternoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoMembresia: 'ACTIVA',
        enMora: false,
      })
    )
    expect(cargarQrMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('img').attributes('src')).toBe(
      'https://cdn.fitzone.com/juan.png'
    )
    expect(wrapper.text()).toContain('01:05')
    expect(wrapper.text()).toContain('TOKEN: 10.1.9999.abcdef')
    expect(wrapper.find('[data-testid="qrcode-svg"]').exists()).toBe(true)
  })

  it('calcula iniciales sin foto ni iniciales explícitas y maneja membresía inactiva como objeto único', async () => {
    vi.mocked(accesosService.obtenerPerfilSocio).mockResolvedValue({
      socioId: 0,
      nombre: 'Ana Maria',
      dni: '',
      iniciales: '',
      foto_url: null,
      membresia: { membresia_estado: { descripcion: 'pausada' } },
    } as unknown as SocioPerfilDto)

    const wrapper = mount(CredencialView)
    await flushPromises()

    expect(wrapper.text()).toContain('AM')
    expect(wrapper.text()).toContain('Sin especificar')
    expect(wrapper.text()).toContain('PAUSADA')
    expect(wrapper.html()).toContain('bg-rose-50 text-rose-800')
  })

  it('bloquea generación de QR si la ciudad de la sede no coincide con la del socio y permite reintentar', async () => {
    sedeStoreMock.sedeSeleccionada = {
      id_sede: 9,
      nombre: 'Sede Rosario',
      id_ciudad: 99,
    }
    vi.mocked(accesosService.obtenerPerfilSocio).mockResolvedValue({
      socioId: 10,
      nombre: 'Juan',
      dni: '30111222',
      iniciales: '',
      id_ciudad: 1,
      membresia: undefined,
    } as unknown as SocioPerfilDto)

    const wrapper = mount(CredencialView)
    await flushPromises()

    expect(cargarQrMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Acceso restringido')
    expect(wrapper.text()).toContain('Sede Rosario')

    sedeStoreMock.sedeSeleccionada = {
      id_sede: 1,
      nombre: 'Sede Centro',
      id_ciudad: 1,
    }
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(cargarQrMock).toHaveBeenCalledTimes(1)
  })

  it('usa datos locales cuando navigator está offline o cuando falla obtenerPerfilSocio', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    const wrapperOffline = mount(CredencialView)
    await flushPromises()

    expect(accesosService.obtenerPerfilSocio).not.toHaveBeenCalled()
    expect(wrapperOffline.text()).toContain('Juan Pérez')
    expect(wrapperOffline.text()).toContain('ACTIVA')

    vi.stubGlobal('navigator', { onLine: true })
    authStoreMock.usuario = null
    vi.mocked(accesosService.obtenerPerfilSocio).mockRejectedValue(
      new Error('API caída')
    )
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapperError = mount(CredencialView)
    await flushPromises()

    expect(wrapperError.text()).toContain('Socio FitZone')
    expect(wrapperError.text()).toContain('INACTIVA')
    consoleSpy.mockRestore()
  })

  it('muestra estado de QR expirado y permite solicitar nuevo QR', async () => {
    isExpiredRef.value = true
    vi.mocked(accesosService.obtenerPerfilSocio).mockResolvedValue({
      socioId: 10,
      nombre: 'Lucia',
      dni: '11222333',
      iniciales: 'L',
      membresia: { membresia_estado: { descripcion: 'ACTIVA' } },
    } as unknown as SocioPerfilDto)

    const wrapper = mount(CredencialView)
    await flushPromises()

    expect(wrapper.text()).toContain('La credencial de acceso ha expirado.')
    await wrapper.find('button').trigger('click')
    expect(cargarQrMock).toHaveBeenCalledTimes(2)
  })
})
