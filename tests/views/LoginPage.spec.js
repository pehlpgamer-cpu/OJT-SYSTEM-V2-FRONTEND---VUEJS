import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import LoginPage from '../../src/views/Auth/LoginPage.vue'

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('../../src/composables/useAuth', async () => {
  const { ref } = await vi.importActual('vue')

  return {
    useAuth: () => ({
      login: mockLogin,
      isLoading: ref(false)
    })
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockLogin.mockReset()
    mockLogin.mockResolvedValue()
  })

  it('allows existing valid credentials without signup-strength validation', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await wrapper.find('input[name="email"]').setValue('student@example.com')
    await wrapper.find('input[name="password"]').setValue('oldpass')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockLogin).toHaveBeenCalledWith('student@example.com', 'oldpass')
  })
})
