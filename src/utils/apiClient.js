import { useAuthStore } from '../stores/authStore'
import { useErrorStore } from '../stores/errorStore'

const IDEMPOTENT_METHODS = ['GET', 'HEAD', 'OPTIONS']
const NEVER_RETRY_ENDPOINTS = ['/auth/login', '/auth/register']

export const apiClient = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const url = `${baseURL}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  const authStore = useAuthStore()
  const errorStore = useErrorStore()

  const timeout = options.timeout || 30000
  const isIdempotent = IDEMPOTENT_METHODS.includes(method)
  const isNeverRetryEndpoint = method === 'POST' && NEVER_RETRY_ENDPOINTS.includes(endpoint)
  const maxRetries = isNeverRetryEndpoint
    ? 0
    : (options.retries !== undefined ? options.retries : (isIdempotent ? 3 : 0))
  let retryCount = 0

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`
    console.debug('[API] Authentication token attached to request', { endpoint })
  } else {
    console.debug('[API] No authentication token available', { endpoint })
  }

  const executeRequest = async () => {
    try {
      console.debug('[API] Request started', {
        endpoint,
        method,
        timeout,
        retryCount,
        maxRetries
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      if (options.signal) {
        if (options.signal.aborted) {
          controller.abort()
        } else {
          options.signal.addEventListener('abort', () => controller.abort(), { once: true })
        }
      }

      let response
      try {
        response = await fetch(url, {
          ...options,
          method,
          headers,
          credentials: options.credentials || 'same-origin',
          signal: controller.signal,
        })
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
      }

      let payload
      try {
        payload = await response.json()
        console.debug('[API] Response parsed successfully', {
          endpoint,
          statusCode: response.status
        })
      } catch {
        console.warn('[API] Failed to parse response as JSON', { endpoint, statusCode: response.status })
        payload = null
      }

      if (!response.ok) {
        console.error('[API] Response error', {
          endpoint,
          statusCode: response.status,
          statusText: response.statusText,
          payload
        })

        if (response.status === 401) {
          console.warn('[API] Unauthorized (401) - Logging out user', { endpoint })

          const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
          const isAuthPage = currentPath === '/login' || currentPath === '/register'

          authStore.logout()
          console.debug('[API] User logged out due to 401', { endpoint, isAuthPage })

          if (!isAuthPage && typeof window !== 'undefined') {
            console.debug('[API] Redirecting to login page', { endpoint, currentPath })
            window.location.href = '/login'
          }
        }

        const errorBody = typeof payload?.error === 'object' && payload.error !== null
          ? payload.error
          : payload || {}
        const errorMessage = payload?.message || errorBody?.message || payload?.error || response.statusText || 'An unknown error occurred'
        const errorDetails = payload?.details || errorBody?.details || payload?.errors || errorBody?.errors || null

        const error = new Error(errorMessage)
        error.statusCode = response.status
        error.details = errorDetails
        error.code = payload?.code || errorBody?.code || null

        console.error('[API] Throwing error', {
          endpoint,
          statusCode: error.statusCode,
          message: error.message,
          details: error.details
        })

        throw error
      }

      console.debug('[API] Request successful', {
        endpoint,
        statusCode: response.status
      })

      return payload
    } catch (error) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false
      const isNetworkError = error.message === 'Request timeout' || offline || error instanceof TypeError
      const shouldRetry = isIdempotent && retryCount < maxRetries && (isNetworkError || error.statusCode >= 500)

      if (shouldRetry) {
        retryCount++
        const delayMs = Math.pow(2, retryCount - 1) * 1000

        console.warn('[API] Request failed, will retry', {
          endpoint,
          error: error.message,
          retryCount,
          delayMs,
          maxRetries
        })

        await new Promise(resolve => setTimeout(resolve, delayMs))
        return executeRequest()
      }

      console.error('[API] Request failed permanently after retries', {
        endpoint,
        error: error.message,
        retryCount,
        statusCode: error.statusCode
      })

      errorStore.setError(error.message, error.details, error.statusCode)
      throw error
    }
  }

  return executeRequest()
}
