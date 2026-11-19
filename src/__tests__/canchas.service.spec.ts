// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { canchasService } from '@/modules/M4-canchas/services/canchas.service'
import { canchasTiposService } from '@/modules/M4-canchas/services/canchas-tipos.service'
import { mantenimientosService } from '@/modules/M4-canchas/services/mantenimientos.service'
import { useSedeStore } from '@/store/sede'
import { supabase } from '@/common/utils/supabase'
import http from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('@/common/utils/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

vi.mock('@/modules/M4-canchas/services/canchas-tipos.service', () => ({
  canchasTiposService: {
    getTiposCancha: vi.fn(),
    getCanchasTipos: vi.fn(),
    crearTipoCancha: vi.fn(),
    crearCanchaTipo: vi.fn(),
    actualizarTipoCancha: vi.fn(),
    actualizarCanchaTipo: vi.fn(),
    reactivarTipoCancha: vi.fn(),
    eliminarTipoCancha: vi.fn(),
  },
}))

vi.mock('@/modules/M4-canchas/services/mantenimientos.service', () => ({
  mantenimientosService: {
    getMantenimientos: vi.fn(),
    programarMantenimiento: vi.fn(),
    crearMantenimiento: vi.fn(),
    actualizarMantenimiento: vi.fn(),
    eliminarMantenimiento: vi.fn(),
  },
}))

describe('canchas.service.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('getCanchas obtiene la lista de canchas correctamente con filtros', async () => {
    const mockCanchas = [{ id_cancha: 1, nombre: 'Cancha 1 de Fútbol' }]
    vi.mocked(http.get).mockResolvedValue({ data: mockCanchas })

    const resultado = await canchasService.getCanchas({ sedeId: 1 })

    expect(http.get).toHaveBeenCalledWith('/canchas?sedeId=1')
    expect(resultado).toEqual(mockCanchas)

    await canchasService.getCanchasPorSede(4)
    expect(http.get).toHaveBeenCalledWith('/canchas?sedeId=4')
  })

  it('getCanchas retorna un arreglo vacío si ocurre un error o la respuesta no es array', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(http.get).mockResolvedValueOnce({ data: { invalid: true } })
    expect(await canchasService.getCanchas({ id_sede: 2 })).toEqual([])

    vi.mocked(http.get).mockRejectedValueOnce(new Error('Network error'))
    const resultado = await canchasService.getCanchas()

    expect(resultado).toEqual([])
    warnSpy.mockRestore()
  })

  it('crearCancha, actualizarCancha y eliminarCancha ejecutan las peticiones HTTP', async () => {
    const nuevaCanchaDto = {
      id_sede: 1,
      nombre: 'Cancha Nueva',
      id_cancha_tipo: 1,
      costo_base: 5000,
    }
    const respuestaBackend = { id_cancha: 10, ...nuevaCanchaDto }
    vi.mocked(http.post).mockResolvedValue({ data: respuestaBackend })
    vi.mocked(http.patch).mockResolvedValue({
      data: { ...respuestaBackend, nombre: 'Editada' },
    })
    vi.mocked(http.delete).mockResolvedValue({ data: {} })

    const creada = await canchasService.crearCancha(
      nuevaCanchaDto as Parameters<typeof canchasService.crearCancha>[0]
    )
    const editada = await canchasService.actualizarCancha(10, {
      nombre: 'Editada',
    })
    await canchasService.eliminarCancha(5)

    expect(http.post).toHaveBeenCalledWith('/canchas', nuevaCanchaDto)
    expect(creada).toEqual(respuestaBackend)
    expect(http.patch).toHaveBeenCalledWith('/canchas/10', {
      nombre: 'Editada',
    })
    expect(editada.nombre).toBe('Editada')
    expect(http.delete).toHaveBeenCalledWith('/canchas/5')
  })

  it('delega métodos de tipos, mantenimientos y getHorarioOperativo', async () => {
    const sedeStore = useSedeStore()
    const spyHorario = vi
      .spyOn(sedeStore, 'obtenerHorarioOperativo')
      .mockResolvedValue({
        abierto: true,
        hora_apertura: '08:00',
        hora_cierre: '22:00',
      })

    await canchasService.getHorarioOperativo(1, '2026-11-19')
    expect(spyHorario).toHaveBeenCalledWith(1, '2026-11-19')

    await canchasService.getTiposCancha(true)
    await canchasService.getCanchasTipos(false)
    await canchasService.crearTipoCancha('Padel')
    await canchasService.crearCanchaTipo('Tenis')
    await canchasService.actualizarTipoCancha(1, { descripcion: 'A' })
    await canchasService.actualizarCanchaTipo(1, { descripcion: 'B' })
    await canchasService.reactivarTipoCancha(1)
    await canchasService.eliminarTipoCancha(1)

    expect(canchasTiposService.getTiposCancha).toHaveBeenCalledWith(true)
    expect(canchasTiposService.crearCanchaTipo).toHaveBeenCalledWith('Tenis')
    expect(canchasTiposService.eliminarTipoCancha).toHaveBeenCalledWith(1)

    await canchasService.getMantenimientos({ canchaId: 1 })
    await canchasService.programarMantenimiento(1, {} as never)
    await canchasService.crearMantenimiento(1, {} as never)
    await canchasService.actualizarMantenimiento(2, {} as never)
    await canchasService.eliminarMantenimiento(2)

    expect(mantenimientosService.getMantenimientos).toHaveBeenCalledWith({
      canchaId: 1,
    })
    expect(mantenimientosService.eliminarMantenimiento).toHaveBeenCalledWith(2)
  })

  it('getDisponibilidad y getDisponibilidadPorSede normalizan slots y contemplan sede cerrada o error', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: [{ horaInicio: '09:00', horaFin: '10:00', estado: 'disponible' }],
    })
    const disp1 = await canchasService.getDisponibilidad(
      3,
      '2026-11-19',
      0,
      true
    )
    expect(disp1.nombre_cancha).toBe('Cancha #3')
    expect(disp1.slots).toHaveLength(1)

    vi.mocked(http.get).mockResolvedValueOnce({
      data: { slots: [null] },
    })
    const disp2 = await canchasService.getDisponibilidad(
      3,
      '2026-11-19',
      5000,
      false,
      'Central'
    )
    expect(disp2.nombre_cancha).toBe('Central')
    expect(disp2.slots).toEqual([])

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(http.get).mockRejectedValueOnce(new Error('500'))
    const dispErr = await canchasService.getDisponibilidad(3, '2026-11-19')
    expect(dispErr.slots).toEqual([])
    errSpy.mockRestore()

    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        horario: {
          abierto: false,
          hora_apertura: '08:00',
          hora_cierre: '22:00',
        },
        canchas: [{ id_cancha: 1, slots: [] }],
      },
    })
    const cerrado = await canchasService.getDisponibilidadPorSede(
      1,
      '2026-11-19',
      undefined,
      true,
      2
    )
    expect(cerrado).toEqual({})

    vi.mocked(http.get).mockResolvedValueOnce({
      data: [
        null,
        {
          id_cancha: 7,
          slots: [
            { horaInicio: '10:00', horaFin: '11:00', estado: 'disponible' },
          ],
        },
      ],
    })
    const mapa = await canchasService.getDisponibilidadPorSede(
      1,
      '2026-11-20',
      [{ id_cancha: 7, costo_base: 6000 } as never]
    )
    expect(mapa[7]).toHaveLength(1)
  })

  it('suscribirTurnoReservado y suscribirCambiosDisponibilidad escuchan y desuscriben canales', () => {
    const onTurno = vi.fn()
    const onCambio = vi.fn()

    const unsub1 = canchasService.suscribirTurnoReservado(1, onTurno)
    const cbBroadcast = mockChannel.on.mock.calls[0][2] as (res: {
      payload?: unknown
    }) => void
    cbBroadcast({ payload: { id_cancha: 1 } })
    expect(onTurno).toHaveBeenCalledWith({ id_cancha: 1 })
    unsub1()
    expect(supabase.removeChannel).toHaveBeenCalled()

    const unsub2 = canchasService.suscribirCambiosDisponibilidad(2, onCambio)
    const cbChanges = mockChannel.on.mock.calls[1][2] as (p: unknown) => void
    cbChanges({ eventType: 'INSERT' })
    expect(onCambio).toHaveBeenCalledWith({ eventType: 'INSERT' })
    unsub2()
    expect(supabase.removeChannel).toHaveBeenCalledTimes(2)
  })
})
