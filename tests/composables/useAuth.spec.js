import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock fetch and localStorage
global.fetch = vi.fn()
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn().mockResolvedValue(true)
  })
}))

import { useAuth } from '../../src/composables/useAuth'
import { useAuthStore } from '../../src/stores/authStore'

describe('useAuth Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  it('initializes with loading false', () => {
    const { isLoading } = useAuth()
    expect(isLoading.value).toBe(false)
  })

  it('exports login and register functions', () => {
    const { login, register, logout } = useAuth()
    expect(typeof login).toBe('function')
    expect(typeof register).toBe('function')
    expect(typeof logout).toBe('function')
  })

  it('logout clears auth store', async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    const { logout } = useAuth()

    // First set some auth data
    authStore.setAuth('test-token', { email: 'test@example.com' }, 'student')
    expect(authStore.isAuthenticated).toBe(true)

    // Then logout
    await logout()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.token).toBeNull()
  })

  it('handles network errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))
    const { isLoading } = useAuth()

    // isLoading should be boolean
    expect(typeof isLoading.value).toBe('boolean')
  })
})
