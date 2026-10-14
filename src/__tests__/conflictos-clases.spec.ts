// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import ClasesView from '@/modules/M3-clases-grupales/views/ClasesView.vue'

const mocks = vi.hoisted(() => ({
  on: vi.fn(),
  subscribe: vi.fn(),
  removeChannel: vi.fn(),
  success: vi.fn(),
  agenda: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ usuario: { id: 7 }, isAuthenticated: true }),
}))
vi.mock('@/store/sede', () => ({
  useSedeStore: () => ({ idSedeSeleccionada: 1 }),
}))
vi.mock('@/common/utils/toast', () => ({ toast: { success: mocks.success } }))
vi.mock('@/common/utils/supabase', () => {
  const channel = { on: mocks.on, subscribe: mocks.subscribe }
  mocks.on.mockReturnValue(channel)
  mocks.subscribe.mockReturnValue(channel)
  return {
    supabase: { channel: () => channel, removeChannel: mocks.removeChannel },
  }
})
vi.mock('@/modules/M3-clases-grupales/services/clases.service', () => ({
  clasesService: {
    obtenerClasesPorSede: mocks.agenda,
    obtenerMisReservas: vi.fn().mockResolvedValue([]),
    obtenerMisInscripciones: vi.fn().mockResolvedValue([]),
  },
}))

describe('Contrato de lista de espera conservado al resolver el conflicto', () => {
  it('notifica con la columna vigente y libera la suscripción al salir', async () => {
    const wrapper = shallowMount(ClasesView)
    await flushPromises()
    expect(mocks.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'clase_lista_espera',
        filter: 'id_usuario=eq.7',
        event: 'UPDATE',
      }),
      expect.any(Function)
    )
    const callback = mocks.on.mock.calls[0]![2] as (payload: {
      new: Record<string, unknown>
    }) => void
    mocks.agenda.mockClear()
    callback({ new: { id_clase_lista_espera_estado: 1 } })
    expect(mocks.success).not.toHaveBeenCalled()
    callback({ new: { id_clase_lista_espera_estado: 2 } })
    await flushPromises()
    expect(mocks.success).toHaveBeenCalledOnce()
    expect(mocks.agenda).toHaveBeenCalledOnce()
    wrapper.unmount()
    expect(mocks.removeChannel).toHaveBeenCalledOnce()
  })
})
