import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppShell from '../../src/components/AppShell.vue'
import { useAuthStore } from '../../src/stores/authStore'

function installLocalStorage() {
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
      clear: () => values.clear()
    }
  })
}

describe('AppShell help navigation', () => {
  beforeEach(() => {
    installLocalStorage()
  })

  it('shows one active Help & FAQ link for every supported role', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const authStore = useAuthStore()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/faq', component: { template: '<div />' }, meta: { title: 'Help & FAQ' } }]
    })

    await router.push('/faq')
    await router.isReady()

    const wrapper = mount(AppShell, {
      global: { plugins: [pinia, router] }
    })

    for (const role of ['admin', 'coordinator', 'company', 'student']) {
      authStore.role = role
      await nextTick()

      const helpLinks = wrapper.findAll('a').filter(link => link.text().trim() === 'Help & FAQ')
      expect(helpLinks).toHaveLength(1)
      expect(helpLinks[0].attributes('href')).toBe('/faq')
      expect(helpLinks[0].classes()).toContain('bg-indigo-50')
    }
  })
})
