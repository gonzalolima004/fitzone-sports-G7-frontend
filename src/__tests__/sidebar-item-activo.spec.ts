// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import Sidebar from '@/common/components/Sidebar.vue'
import type { RolUsuario } from '@/store/auth'

let rolActual: RolUsuario = 'gerente'

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ rol: rolActual, logout: vi.fn() }),
}))

const PantallaVacia = { template: '<div />' }

async function montarSidebar(ruta: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: PantallaVacia }],
  })
  router.push(ruta)
  await router.isReady()

  return mount(Sidebar, { global: { plugins: [router] } })
}

async function itemsActivosEn(ruta: string): Promise<string[]> {
  const wrapper = await montarSidebar(ruta)

  return wrapper
    .findAll('nav a')
    .filter((enlace) => enlace.classes().includes('bg-[#F96167]'))
    .map((enlace) => enlace.text())
}

beforeEach(() => {
  rolActual = 'gerente'
})

describe('Sidebar: ítem activo del gerente', () => {
  it('marca Panel de gerencia en la portada del gerente', async () => {
    expect(await itemsActivosEn('/gerencia')).toEqual(['Panel de gerencia'])
  })

  it('marca el ítem de cada área con pestañas', async () => {
    for (const ruta of [
      '/gerencia/sedes',
      '/gerencia/sedes/horarios',
      '/gerencia/sedes/calendario',
    ])
      expect(await itemsActivosEn(ruta)).toEqual(['Sedes y Horarios'])
    for (const ruta of ['/gerencia/reportes', '/gerencia/reportes/ocupacion'])
      expect(await itemsActivosEn(ruta)).toEqual(['Reportes'])
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

  it('al abrir un acordeón cierra el que estaba abierto', async () => {
    const wrapper = await montarSidebar('/gerencia/sedes')
    const botones = wrapper.findAll('nav button[aria-expanded]')

    const btnInstalaciones = botones.find((b) =>
      b.text().includes('Instalaciones')
    )!
    const btnFinanzas = botones.find((b) => b.text().includes('Finanzas'))!

    expect(btnInstalaciones.attributes('aria-expanded')).toBe('true')
    expect(btnFinanzas.attributes('aria-expanded')).toBe('false')

    await btnFinanzas.trigger('click')

    expect(btnFinanzas.attributes('aria-expanded')).toBe('true')
    expect(btnInstalaciones.attributes('aria-expanded')).toBe('false')
  })

  it('para otros roles muestra secciones fijas sin acordeones', async () => {
    rolActual = 'socio'
    const wrapper = await montarSidebar('/socio-dashboard')

    expect(wrapper.findAll('nav button[aria-expanded]')).toHaveLength(0)
    expect(wrapper.findAll('nav h2').map((h) => h.text())).toEqual([
      'OPERACIONES',
      'ADMINISTRACIÓN',
    ])
    expect(await itemsActivosEn('/socio-dashboard')).toEqual(['Dashboard'])
  })
})
