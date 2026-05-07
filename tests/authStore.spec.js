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

const createToken = (overrides = {}) => {
  const payload = {
    id: 1,
    role: 'student',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides
  }

  return [
    'eyJhbGciOiJIUzI1NiJ9',
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
    'signature'
  ].join('.')
}

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
    const token = createToken()
    
    store.setAuth(token, { email: 'test@student.com', role: 'student' }, 'student')

    expect(store.token).toBe(token)
    expect(store.user.email).toBe('test@student.com')
    expect(store.role).toBe('student')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('ojt_jwt_token', token)
    expect(localStorage.setItem).toHaveBeenCalledWith('ojt_user', JSON.stringify({
      email: 'test@student.com',
      role: 'student'
    }))
  })

  it('clears properties on logout', () => {
    const store = useAuthStore()
    
    store.setAuth(createToken(), { role: 'student' }, 'student')
    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.role).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.removeItem).toHaveBeenCalledWith('ojt_jwt_token')
  })

  it('rejects malformed tokens', () => {
    const store = useAuthStore()

    expect(() => store.setAuth('fake-jwt-token', { role: 'student' }, 'student')).toThrow('Invalid authentication session')
    expect(store.isAuthenticated).toBe(false)
  })

  it('rejects expired tokens', () => {
    const store = useAuthStore()

    expect(() => store.setAuth(createToken({ exp: Math.floor(Date.now() / 1000) - 1 }), { role: 'student' }, 'student')).toThrow('Invalid authentication session')
    expect(store.isAuthenticated).toBe(false)
  })
})
