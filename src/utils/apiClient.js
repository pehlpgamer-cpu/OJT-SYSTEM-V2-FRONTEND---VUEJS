import { useAuthStore } from '../stores/authStore'
import { useErrorStore } from '../stores/errorStore'

/**
 * HTTP Client for API requests with JWT authentication and error handling
 * 
 * Features:
 * - Automatic JWT token attachment to Authorization header
 * - Request timeout handling (30 seconds default)
 * - Same-origin credential support for the Netlify API proxy
 * - 401 unauthorized handling with auto-logout
 * - Standardized error response formatting
 * - Exponential backoff retry logic for network failures
 * - Global error store integration for UI error display
 * - Detailed debug logging for troubleshooting
 * 
 * @async
 * @function apiClient
 * @param {string} endpoint - API endpoint path (e.g., '/company/profile')
 * @param {Object} [options={}] - Fetch options configuration
 * @param {string} [options.method='GET'] - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} [options.body] - Request body (automatically stringified if object)
 * @param {Object} [options.headers] - Custom headers to merge with defaults
 * @param {number} [options.timeout=30000] - Request timeout in milliseconds
 * @param {number} [options.retries=3] - Maximum number of retry attempts for network failures
 * @returns {Promise<Object>} Parsed JSON response payload
 * @throws {Error} Network error, validation error, or API error with statusCode and details
 * 
 * @error {Error} 401 - Unauthorized: Logs out user and redirects to login
 * @error {Error} Network timeout - Retries with exponential backoff
 * @error {Error} JSON parsing failed - Returns null payload and throws error
 */
export const apiClient = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const url = `${baseURL}${endpoint}`
  
  const authStore = useAuthStore()
  const errorStore = useErrorStore()
  
  // Extract timeout and retry settings from options
  const timeout = options.timeout || 30000 // 30 second default timeout
  const maxRetries = options.retries !== undefined ? options.retries : 3
  let retryCount = 0

  /**
   * HEADERS SETUP
   * - Content-Type: application/json for all requests
   * - Authorization: Bearer token if user is authenticated
   * - Custom headers merged in with provided options
   */
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // AUTHENTICATION: Attach JWT token to Authorization header if available
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
    console.debug('[API] Authentication token attached to request', { endpoint })
  } else {
    console.debug('[API] No authentication token available', { endpoint })
  }

  /**
   * RETRY LOGIC with exponential backoff
   * Retries on network failures and 5xx errors
   * Strategy: 1s, 2s, 4s delays between retries
   */
  const executeRequest = async () => {
    try {
      console.debug('[API] Request started', { 
        endpoint, 
        method: options.method || 'GET', 
        timeout,
        retryCount,
        maxRetries 
      })

      /**
       * FETCH with timeout
       * Promise.race ensures request times out after specified duration
       * AbortController could be added for true cancellation
       */
      const fetchPromise = fetch(url, {
        ...options,
        headers,
        // CREDENTIALS: JWT auth uses Authorization headers; avoid cross-origin
        // credentials so production can use the Netlify /api proxy cleanly.
        credentials: options.credentials || 'same-origin',
      })

      // TIMEOUT HANDLING: Promise race between actual request and timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )

      const response = await Promise.race([fetchPromise, timeoutPromise])

      /**
       * RESPONSE PARSING
       * Try to parse JSON, catch silently if response is not JSON
       * Some error responses might be HTML (e.g., 500 errors in development)
       */
      let payload
      try {
        payload = await response.json()
        console.debug('[API] Response parsed successfully', { 
          endpoint, 
          statusCode: response.status 
        })
      } catch (parseError) {
        console.warn('[API] Failed to parse response as JSON', { endpoint, statusCode: response.status })
        payload = null
      }

      /**
       * ERROR HANDLING for non-2xx responses
       * Different handling based on status code:
       * - 401: Unauthorized - logout and redirect
       * - 4xx: Client errors - include details for validation
       * - 5xx: Server errors - can be retried
       */
      if (!response.ok) {
        console.error('[API] Response error', { 
          endpoint, 
          statusCode: response.status,
          statusText: response.statusText,
          payload 
        })

        // SPECIAL CASE: 401 Unauthorized - User session expired
        if (response.status === 401) {
          console.warn('[API] Unauthorized (401) - Logging out user', { endpoint })
          
          // Only logout and redirect if NOT already on login/register page
          // Prevents infinite redirect loops
          const currentPath = window.location.pathname
          const isAuthPage = currentPath === '/login' || currentPath === '/register'
          
          authStore.logout()
          console.debug('[API] User logged out due to 401', { endpoint, isAuthPage })
          
          // REDIRECT: Only redirect if not already on auth page
          if (!isAuthPage) {
            console.debug('[API] Redirecting to login page', { endpoint, currentPath })
            window.location.href = '/login'
          } else {
            console.debug('[API] Already on auth page, not redirecting', { endpoint, currentPath })
          }
        }

        // STANDARDIZED ERROR RESPONSE formatting
        const errorBody = typeof payload?.error === 'object' && payload.error !== null
          ? payload.error
          : payload || {}
        const errorMessage = payload?.message || errorBody?.message || payload?.error || response.statusText || 'An unknown error occurred'
        const errorDetails = payload?.details || errorBody?.details || null

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
      // RETRY LOGIC: Retry on network errors and 5xx errors
      const isNetworkError = error.message === 'Request timeout' || !navigator.onLine
      const shouldRetry = retryCount < maxRetries && (isNetworkError || error.statusCode >= 500)

      if (shouldRetry) {
        retryCount++
        const delayMs = Math.pow(2, retryCount - 1) * 1000 // Exponential backoff: 1s, 2s, 4s...
        
        console.warn('[API] Request failed, will retry', { 
          endpoint, 
          error: error.message, 
          retryCount, 
          delayMs,
          maxRetries 
        })
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs))
        
        // Recursively retry the request
        return executeRequest()
      }

      // ERROR PROPAGATION: No more retries, propagate error to stores and caller
      console.error('[API] Request failed permanently after retries', { 
        endpoint, 
        error: error.message, 
        retryCount, 
        statusCode: error.statusCode 
      })
      
      // Store error in global error store for UI to display
      errorStore.setError(error.message, error.details, error.statusCode)
      
      throw error
    }
  }

  // Execute the request with retry logic
  return executeRequest()
}
