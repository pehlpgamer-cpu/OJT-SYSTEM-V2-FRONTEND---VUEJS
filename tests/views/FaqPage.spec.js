import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import FaqPage from '../../src/views/System/FaqPage.vue'
import { useAuthStore } from '../../src/stores/authStore'

const roles = ['Admin', 'Coordinator', 'Company', 'Student']

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

async function mountPage(role = 'student') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const authStore = useAuthStore()
  authStore.role = role

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
  })
  await router.push('/faq')
  await router.isReady()

  return mount(FaqPage, {
    global: { plugins: [pinia, router] }
  })
}

describe('Help & FAQ page', () => {
  beforeEach(() => {
    installLocalStorage()
  })

  it('shows all role tabs and starts on the signed-in user role', async () => {
    const wrapper = await mountPage('company')
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs.map(tab => tab.text().replace('Your role', '').trim())).toEqual(roles)
    expect(tabs[2].attributes('aria-selected')).toBe('true')
    expect(tabs[2].attributes('aria-controls')).toBe('faq-panel-company')
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(4)

    tabs.forEach(tab => {
      expect(wrapper.find(`#${tab.attributes('aria-controls')}`).exists()).toBe(true)
    })

    const companyPanel = wrapper.get('#faq-panel-company')
    expect(companyPanel.attributes('aria-labelledby')).toBe('faq-tab-company')
    expect(companyPanel.attributes('hidden')).toBeUndefined()
    expect(companyPanel.text()).toContain('Company guide')
    expect(companyPanel.findAll('[data-testid="faq-card"]')).toHaveLength(5)
  })

  it('switches guides and renders numbered steps for every topic', async () => {
    const wrapper = await mountPage('student')
    const expectedTopicCounts = {
      Admin: 4,
      Coordinator: 8,
      Company: 5,
      Student: 5
    }

    for (const tab of wrapper.findAll('[role="tab"]')) {
      const label = tab.text().replace('Your role', '').trim()
      await tab.trigger('click')

      expect(tab.attributes('aria-selected')).toBe('true')
      const panel = wrapper.get(`#faq-panel-${label.toLowerCase()}`)
      expect(panel.attributes('hidden')).toBeUndefined()
      expect(panel.text()).toContain(`${label} guide`)

      const cards = panel.findAll('[data-testid="faq-card"]')
      expect(cards).toHaveLength(expectedTopicCounts[label])
      cards.forEach(card => {
        expect(card.findAll('ol li')).toHaveLength(3)
      })
    }
  })

  it('only links to portal areas the signed-in role can access', async () => {
    const studentWrapper = await mountPage('student')
    await studentWrapper.get('#faq-tab-company').trigger('click')
    const companyPanel = studentWrapper.get('#faq-panel-company')

    expect(companyPanel.findAll('a[href^="/company"]')).toHaveLength(0)
    expect(companyPanel.findAll('[data-testid="restricted-link"]')).toHaveLength(5)
    expect(companyPanel.text()).toContain('Available in the Company portal')

    const adminWrapper = await mountPage('admin')
    await adminWrapper.get('#faq-tab-coordinator').trigger('click')
    const coordinatorPanel = adminWrapper.get('#faq-panel-coordinator')

    expect(coordinatorPanel.findAll('a[href^="/coordinator"]')).toHaveLength(8)
    expect(coordinatorPanel.findAll('[data-testid="restricted-link"]')).toHaveLength(0)
  })

  it('supports arrow, Home, and End keys across role tabs', async () => {
    const wrapper = await mountPage('admin')

    await wrapper.get('#faq-tab-admin').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('#faq-tab-coordinator').attributes('aria-selected')).toBe('true')

    await wrapper.get('#faq-tab-coordinator').trigger('keydown', { key: 'End' })
    expect(wrapper.get('#faq-tab-student').attributes('aria-selected')).toBe('true')

    await wrapper.get('#faq-tab-student').trigger('keydown', { key: 'Home' })
    expect(wrapper.get('#faq-tab-admin').attributes('aria-selected')).toBe('true')

    await wrapper.get('#faq-tab-admin').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.get('#faq-tab-student').attributes('aria-selected')).toBe('true')
  })
})
