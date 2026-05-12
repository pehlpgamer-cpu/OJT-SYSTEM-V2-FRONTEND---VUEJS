import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { apiClient } from '../../src/utils/apiClient'
import { useAuthStore } from '../../src/stores/authStore'
import { useErrorStore } from '../../src/stores/errorStore'

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

describe('apiClient', () => {
  beforeEach(() => {
    const storage = new Map()

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => storage.get(key) ?? null),
        setItem: vi.fn((key, value) => storage.set(key, String(value))),
        removeItem: vi.fn((key) => storage.delete(key)),
        clear: vi.fn(() => storage.clear())
      },
      configurable: true
    })

    setActivePinia(createPinia())
    global.fetch = vi.fn()
  })

  it('preserves backend validation errors as error details', async () => {
    const validationErrors = {
      name: ['Name must be between 2 and 255 characters'],
      password_confirmation: ['Passwords do not match']
    }

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: '',
      json: vi.fn().mockResolvedValue({
        message: 'Validation failed',
        statusCode: 422,
        errors: validationErrors
      })
    })

    await expect(apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
      retries: 0
    })).rejects.toMatchObject({
      message: 'Validation failed',
      statusCode: 422,
      details: validationErrors
    })

    const errorStore = useErrorStore()
    expect(errorStore.globalError.details).toEqual(validationErrors)
  })

  it('uses the local backend API as the default base URL', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ ok: true })
    })

    await apiClient('/health', { retries: 0 })

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/health',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('aborts requests that exceed the timeout', async () => {
    vi.useFakeTimers()

    global.fetch.mockImplementationOnce((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        reject(error)
      })
    }))

    const request = apiClient('/slow', {
      method: 'GET',
      timeout: 10,
      retries: 0
    })
    const assertion = expect(request).rejects.toMatchObject({
      message: 'Request timeout'
    })

    await vi.advanceTimersByTimeAsync(10)
    await assertion

    vi.useRealTimers()
  })

  it('does not retry register POST requests', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Network error'))

    await expect(apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
      retries: 3
    })).rejects.toThrow('Network error')

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('refreshes near-expiry tokens and uses the refreshed token on the request', async () => {
    const authStore = useAuthStore()
    const oldToken = createToken({ exp: Math.floor(Date.now() / 1000) + 1800 })
    const newToken = createToken({ exp: Math.floor(Date.now() / 1000) + 7200 })

    authStore.setAuth(oldToken, { id: 1, email: 'student@example.com', role: 'student' }, 'student')

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          token: newToken,
          user: { id: 1, email: 'student@example.com', role: 'student' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ ok: true })
      })

    await apiClient('/health', { retries: 0 })

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5000/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: `Bearer ${oldToken}` })
      })
    )
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:5000/api/health',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${newToken}` })
      })
    )
    expect(authStore.token).toBe(newToken)
  })
})
