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

  it('cubre lectura de id guardado, horarioOperativoActual y deduplicación concurrente', async () => {
    localStorage.setItem('id_sede_seleccionada', '2')
    let resolverSedes: (v: unknown) => void = () => {}
    const promesaSedes = new Promise((r) => {
      resolverSedes = r
    })
    vi.mocked(http.get).mockReturnValueOnce(promesaSedes as never)

    const store = useSedeStore()
    expect(store.horarioOperativoActual).toBeNull()

    const p1 = store.cargarSedes()
    const p2 = store.cargarSedes()
    expect(http.get).toHaveBeenCalledTimes(1)

    resolverSedes({
      data: [
        { id_sede: 1, nombre: 'Sede 1' },
        { id_sede: 2, nombre: 'Sede 2' },
      ],
    })
    await Promise.all([p1, p2])

    await store.cargarSedes()
    expect(http.get).toHaveBeenCalledTimes(1)

    store.seleccionarSede(2)
    expect(store.versionContexto).toBe(0)

    store.fechaReferenciaHorario = '2026-11-19'
    store.guardarHorarioEnCache(2, '2026-11-19', {
      abierto: true,
      hora_apertura: '07:00',
      hora_cierre: '23:00',
      es_horario_especial: true,
    })
    store.guardarHorarioEnCache(2, '2026-11-19', {
      abierto: true,
      hora_apertura: '08:00',
      hora_cierre: '22:00',
    })
    expect(store.horarioOperativoActual?.es_horario_especial).toBe(true)

    let resolverHorario: (v: unknown) => void = () => {}
    vi.mocked(http.get).mockReturnValueOnce(
      new Promise((r) => {
        resolverHorario = r
      }) as never
    )
    const h1 = store.obtenerHorarioOperativo(1, '2026-11-20')
    const h2 = store.obtenerHorarioOperativo(1, '2026-11-20')
    expect(http.get).toHaveBeenCalledTimes(2)
    resolverHorario({
      data: { abierto: true, hora_apertura: '09:00', hora_cierre: '21:00' },
    })
    await Promise.all([h1, h2])
  })

  it('cubre fallbacks offline, caché corrupto, errores no-Axios y cargarCiudades con error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('fitzone_sedes_cache', '{corrupto')
    vi.stubGlobal('navigator', { onLine: false })
    const storeOffline = useSedeStore()
    await storeOffline.cargarSedes()
    expect(storeOffline.sedes).toEqual([])

    vi.stubGlobal('navigator', { onLine: true })
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false)
    vi.mocked(http.get).mockRejectedValueOnce(new Error('Fallo genérico'))
    await storeOffline.cargarSedes(true)
    expect(storeOffline.error).toBe('Fallo genérico')

    vi.mocked(http.get).mockRejectedValueOnce('string error')
    await storeOffline.cargarSedes(true)
    expect(storeOffline.error).toBe('Error al cargar sedes')

    localStorage.setItem(
      'fitzone_sedes_cache',
      JSON.stringify([{ id_sede: 9, nombre: 'Cacheada' }])
    )
    vi.mocked(http.get).mockRejectedValueOnce(new Error('Sin red'))
    await storeOffline.cargarSedes(true)
    expect(storeOffline.sedes).toEqual([{ id_sede: 9, nombre: 'Cacheada' }])

    vi.mocked(http.get).mockResolvedValueOnce({ data: 'no-es-array' } as never)
    await storeOffline.cargarCiudades()
    expect(storeOffline.ciudades).toEqual([])

    vi.mocked(http.get).mockRejectedValueOnce(new Error('Error ciudades'))
    await storeOffline.cargarCiudades(true)
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
