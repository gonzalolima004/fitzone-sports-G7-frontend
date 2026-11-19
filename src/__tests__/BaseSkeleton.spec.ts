// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'

describe('BaseSkeleton.vue', () => {
  it('renderiza todas las variantes y radios redondeados correctamente', () => {
    const variants = [
      'text',
      'circular',
      'rounded',
      'rectangular',
      'badge',
      'button',
    ] as const
    const expectedVariantClasses: Record<(typeof variants)[number], string> = {
      text: 'rounded-md',
      circular: 'rounded-full',
      rounded: 'rounded-2xl',
      rectangular: 'rounded-none',
      badge: 'h-6',
      button: 'rounded-xl',
    }

    for (const variant of variants) {
      const w = mount(BaseSkeleton, { props: { variant } })
      expect(w.classes()).toContain(expectedVariantClasses[variant])
    }

    const rounds = [
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      'full',
      'none',
    ] as const
    for (const rounded of rounds) {
      const w = mount(BaseSkeleton, { props: { rounded } })
      expect(w.classes()).toContain(`rounded-${rounded}`)
    }
  })

  it('soporta width/height CSS vs clases Tailwind y animated=false', () => {
    const cssWrapper = mount(BaseSkeleton, {
      props: { width: '120px', height: '32px', animated: false },
    })
    expect(cssWrapper.attributes('style')).toContain('width: 120px')
    expect(cssWrapper.attributes('style')).toContain('height: 32px')
    expect(cssWrapper.classes()).not.toContain('animate-pulse')

    const twWrapper = mount(BaseSkeleton, {
      props: { width: 'w-24', height: 'h-8' },
    })
    expect(twWrapper.classes()).toContain('w-24')
    expect(twWrapper.classes()).toContain('h-8')
    expect(twWrapper.classes()).toContain('animate-pulse')
  })
})
