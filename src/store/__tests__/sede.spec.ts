// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSedeStore } from '../sede'
import http from '@/common/api/http'
import axios from 'axios'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('sede.ts - Sede Store Coverage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { onLine: true })
  })

  it('carga las sedes exitosamente desde la API y selecciona la primera', async () => {
    const mockSedes = [
      { id_sede: 1, nombre: 'Sede Central', activo: true },
      { id_sede: 2, nombre: 'Sede Norte', activo: true },
    ]
    vi.mocked(http.get).mockResolvedValue({ data: mockSedes })

    const store = useSedeStore()
    await store.cargarSedes()

    expect(store.sedes).toHaveLength(2)
    expect(store.idSedeSeleccionada).toBe(1)
    expect(store.sedeSeleccionada?.nombre).toBe('Sede Central')
  })

  it('carga las ciudades exitosamente desde la API', async () => {
    const mockCiudades = [{ id_ciudad: 1, nombre: 'Concordia' }]
    vi.mocked(http.get).mockResolvedValue({ data: mockCiudades })

    const store = useSedeStore()
    await store.cargarCiudades()

    expect(store.ciudades).toEqual(mockCiudades)
  })

  it('permite cambiar la sede activa mediante seleccionarSede', async () => {
    const store = useSedeStore()
    store.sedes = [
      { id_sede: 1, nombre: 'Sede 1' },
      { id_sede: 2, nombre: 'Sede 2' },
    ]

    store.seleccionarSede(2)
    expect(store.idSedeSeleccionada).toBe(2)
    expect(store.versionContexto).toBe(1)
  })

  it('restaura sedes de caché local si el navegador está offline y no hay sedes', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const cachedSedes = [{ id_sede: 5, nombre: 'Sede Offline' }]
    localStorage.setItem('fitzone_sedes_cache', JSON.stringify(cachedSedes))

    const store = useSedeStore()
    await store.cargarSedes()

    expect(store.sedes).toEqual(cachedSedes)
    expect(store.idSedeSeleccionada).toBe(5)
  })

  it('maneja errores de Axios al fallar la carga de sedes', async () => {
    const axiosError = new Error('Network Error') as unknown as {
      isAxiosError: boolean
      response: { data: { message: string } }
    }
    axiosError.isAxiosError = true
    axiosError.response = { data: { message: 'Error en servidor' } }

    vi.mocked(http.get).mockRejectedValue(axiosError)
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)

    const store = useSedeStore()
    await store.cargarSedes(true)

    expect(store.error).toBe('Error en servidor')
  })

  it('obtiene y almacena en caché el horario operativo de una sede', async () => {
    const mockHorario = {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    }
    vi.mocked(http.get).mockResolvedValue({ data: mockHorario })

    const store = useSedeStore()
    const horario = await store.obtenerHorarioOperativo(1, '2026-11-19')

    expect(horario).toEqual(mockHorario)
    // Segunda llamada debe retornar desde caché en memoria
    const horarioCache = await store.obtenerHorarioOperativo(1, '2026-11-19')
    expect(horarioCache).toEqual(mockHorario)
    expect(http.get).toHaveBeenCalledTimes(1)
  })

  it('permite guardar o actualizar un horario manualmente en caché con guardarHorarioEnCache', () => {
    const store = useSedeStore()
    store.guardarHorarioEnCache(1, '2026-11-19', {
      abierto: false,
      hora_apertura: '00:00',
      hora_cierre: '00:00',
      motivo_cierre: 'Feriado',
    })

    const key = '1_2026-11-19'
    expect(store.horariosCache[key].motivo_cierre).toBe('Feriado')
  })
})
