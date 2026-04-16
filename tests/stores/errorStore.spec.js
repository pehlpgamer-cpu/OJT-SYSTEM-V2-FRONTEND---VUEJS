import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErrorStore } from '../../src/stores/errorStore'

describe('Error Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with no error', () => {
    const store = useErrorStore()
    expect(store.globalError).toBeNull()
  })

  it('sets error with message, details, and status code', () => {
    const store = useErrorStore()
    
    const testMessage = 'Network timeout'
    const testDetails = { field: 'email', error: 'Invalid' }
    const testStatusCode = 408

    store.setError(testMessage, testDetails, testStatusCode)

    expect(store.globalError).not.toBeNull()
    expect(store.globalError.message).toBe(testMessage)
    expect(store.globalError.details).toEqual(testDetails)
    expect(store.globalError.statusCode).toBe(testStatusCode)
  })

  it('sets error without details and status code (optional params)', () => {
    const store = useErrorStore()
    
    store.setError('Simple error message')

    expect(store.globalError.message).toBe('Simple error message')
    expect(store.globalError.details).toBeNull()
    expect(store.globalError.statusCode).toBeNull()
  })

  it('overwrites previous error when setError called again', () => {
    const store = useErrorStore()
    
    store.setError('First error', null, 400)
    store.setError('Second error', null, 500)

    expect(store.globalError.message).toBe('Second error')
    expect(store.globalError.statusCode).toBe(500)
  })

  it('clears error state', () => {
    const store = useErrorStore()
    
    store.setError('Some error', null, 400)
    expect(store.globalError).not.toBeNull()
    
    store.clearError()
    expect(store.globalError).toBeNull()
  })

  it('handles API error with details array', () => {
    const store = useErrorStore()
    
    const validationDetails = {
      email: 'Email already exists',
      password: 'Password too weak'
    }

    store.setError('Validation failed', validationDetails, 422)

    expect(store.globalError.details.email).toBe('Email already exists')
    expect(store.globalError.details.password).toBe('Password too weak')
  })
})
