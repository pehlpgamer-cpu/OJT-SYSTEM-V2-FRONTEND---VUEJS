import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { apiClient } from '../../src/utils/apiClient'
import { useErrorStore } from '../../src/stores/errorStore'

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
})
