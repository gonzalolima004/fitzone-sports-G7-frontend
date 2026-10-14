// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import PanelGerenciaView from '../modules/M6-reportes/views/PanelGerenciaView.vue'

describe('Navegación del panel de gerencia', () => {
  it('permite entrar por URL a ocupación y navegar entre ambos reportes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/reportes',
          component: PanelGerenciaView,
          children: [
            {
              path: '',
              name: 'reportes',
              component: { template: '<p>Consulta de ingresos</p>' },
            },
            {
              path: 'ocupacion',
              name: 'reportes-ocupacion',
              component: { template: '<p>Consulta de ocupación</p>' },
            },
          ],
        },
      ],
    })
    await router.push('/reportes/ocupacion')
    await router.isReady()
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [router] } }
    )
    expect(wrapper.text()).toContain('Consulta de ocupación')
    expect(
      wrapper.get('a[href="/reportes/ocupacion"]').attributes('aria-current')
    ).toBe('page')
    await wrapper.get('a[href="/reportes"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Consulta de ingresos')
    expect(wrapper.text()).not.toContain('Consulta de ocupación')
    expect(wrapper.get('a[href="/reportes"]').attributes('aria-current')).toBe(
      'page'
    )
    await wrapper.get('a[href="/reportes/ocupacion"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Consulta de ocupación')
  })
})
