import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RegisterPage from '../../src/views/Auth/RegisterPage.vue'

const { mockRegister } = vi.hoisted(() => ({
  mockRegister: vi.fn()
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
      register: mockRegister,
      isLoading: ref(false)
    })
  }
})

describe('RegisterPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockRegister.mockReset()
    mockRegister.mockResolvedValue()
  })

  it('sends the registration payload expected by the backend', async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await wrapper.find('input[name="name"]').setValue('Test Student')
    await wrapper.find('input[name="email"]').setValue('student@example.com')
    await wrapper.find('input[name="password"]').setValue('ValidPass123!')
    await wrapper.find('input[name="confirmPassword"]').setValue('ValidPass123!')
    await wrapper.find('select[name="role"]').setValue('student')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockRegister).toHaveBeenCalledWith({
      name: 'Test Student',
      email: 'student@example.com',
      password: 'ValidPass123!',
      password_confirmation: 'ValidPass123!',
      role: 'student'
    })
  })
})
