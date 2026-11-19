// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IndicadorAforo from '@/modules/M2-accesos/components/IndicadorAforo.vue'

describe('IndicadorAforo.vue', () => {
  it('usa valores por defecto (0/100) y aplica estilo normal (<75%)', () => {
    const wrapper = mount(IndicadorAforo)

    expect(wrapper.text()).toContain('0% Ocupación')
    expect(wrapper.text()).toContain('/ 100 personas permitidas')
    expect(wrapper.html()).toContain('text-[#202759] bg-slate-50 border-slate-200')
    expect(wrapper.text()).not.toContain('capacidad máxima')
  })

  it('retorna 0% de ocupación cuando maximo es 0 sin dividir por cero', () => {
    const wrapper = mount(IndicadorAforo, {
      props: { actual: 15, maximo: 0 },
    })

    expect(wrapper.text()).toContain('0% Ocupación')
    expect(wrapper.text()).toContain('15')
  })

  it('aplica estilo de advertencia ámbar cuando la ocupación está entre 75% y 89%', () => {
    const wrapper = mount(IndicadorAforo, {
      props: { actual: 80, maximo: 100 },
    })

    expect(wrapper.text()).toContain('80% Ocupación')
    expect(wrapper.html()).toContain('text-amber-600 bg-amber-50 border-amber-200')
    expect(wrapper.text()).not.toContain('capacidad máxima')
  })

  it('aplica alerta roja, barra al 100% max y mensaje de límite cuando ocupación >= 90%', () => {
    const wrapper = mount(IndicadorAforo, {
      props: { actual: 110, maximo: 100 },
    })

    expect(wrapper.text()).toContain('110% Ocupación')
    expect(wrapper.html()).toContain('text-[#F96167] bg-rose-50 border-rose-200')
    expect(wrapper.html()).toContain('bg-[#F96167]')
    expect(wrapper.html()).toContain('width: 100%')
    expect(wrapper.text()).toContain(
      '¡Atención! La sede ha alcanzado o está próxima a su capacidad máxima.'
    )
  })
})
