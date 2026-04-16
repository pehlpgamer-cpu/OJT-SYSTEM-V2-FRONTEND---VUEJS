import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock localStorage globally before importing the store
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

import { useAuthStore } from '../src/stores/authStore'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('sets authentication properties on login', () => {
    const store = useAuthStore()
    
    store.setAuth('fake-jwt-token', { email: 'test@student.com' }, 'student')

    expect(store.token).toBe('fake-jwt-token')
    expect(store.user.email).toBe('test@student.com')
    expect(store.role).toBe('student')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('ojt_jwt_token', 'fake-jwt-token')
  })

  it('clears properties on logout', () => {
    const store = useAuthStore()
    
    store.setAuth('fake', {}, 'student')
    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.role).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.removeItem).toHaveBeenCalledWith('ojt_jwt_token')
  })
})
