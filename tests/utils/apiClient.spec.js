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
})
