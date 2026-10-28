// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import Sidebar from '@/common/components/Sidebar.vue'

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ rol: 'gerente', logout: vi.fn() }),
}))

const PantallaVacia = { template: '<div />' }

async function itemsActivosEn(ruta: string): Promise<string[]> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: PantallaVacia }],
  })
  router.push(ruta)
  await router.isReady()

  const wrapper = mount(Sidebar, { global: { plugins: [router] } })

  return wrapper
    .findAll('nav a')
    .filter((enlace) => enlace.classes().includes('bg-[#F96167]'))
    .map((enlace) => enlace.text())
}

describe('Sidebar: ítem activo del gerente', () => {
  it('marca Panel de gerencia en la portada del gerente', async () => {
    expect(await itemsActivosEn('/gerencia')).toEqual(['Panel de gerencia'])
  })

  it('marca Panel de gerencia en sus pantallas sin ítem propio', async () => {
    expect(await itemsActivosEn('/gerencia/sedes')).toEqual([
      'Panel de gerencia',
    ])
    expect(await itemsActivosEn('/gerencia/reportes/ocupacion')).toEqual([
      'Panel de gerencia',
    ])
  })

  it('marca solo Gestión de Canchas en /gerencia/canchas', async () => {
    expect(await itemsActivosEn('/gerencia/canchas')).toEqual([
      'Gestión de Canchas',
    ])
  })

  it('marca solo Directorio de Usuarios en su pantalla', async () => {
    expect(await itemsActivosEn('/gerencia/directorio-usuarios')).toEqual([
      'Directorio de Usuarios',
    ])
  })
})
