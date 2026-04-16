import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Global Error Store (Pinia)
 * 
 * Centralized error state management for displaying errors across the app
 * 
 * ARCHITECTURE:
 * - Single globalError ref holds current error state
 * - apiClient, composables, and components set errors here
 * - Error notification UI components read from this store
 * 
 * WHY: Instead of each component having its own error state, this single
 * source of truth ensures consistent error display. Multiple errors don't
 * override each other - only the most recent one displays (typical UX pattern)
 * 
 * HOW ERROR FLOW WORKS:
 * 1. API request fails in apiClient.js
 * 2. apiClient calls errorStore.setError()
 * 3. Error appears in global error bar/modal
 * 4. User dismisses it or tries again
 * 5. clearError() is called
 * 
 * ERROR HANDLING STRATEGY:
 * - Async errors from API: caught and stored immediately
 * - Validation errors: set by components before submission
 * - Network errors: caught with retry logic then stored
 */
export const useErrorStore = defineStore('error', () => {
  /**
   * @type {Ref<Object|null>}
   * Current error state with three properties:
   * - message: string describing what went wrong
   * - details: object with field-level errors (e.g., validation)
   * - statusCode: HTTP status code (401, 403, 404, 500, etc.)
   * 
   * Set to null when no error or after dismissal
   * 
   * Example structure:
   * {
   *   message: "Email already exists",
   *   details: { email: "This email is already registered" },
   *   statusCode: 409
   * }
   */
  const globalError = ref(null)

  /**
   * Store an error in global state
   * 
   * WHAT: Captures error information for UI display
   * HOW: Creates error object and stores in ref
   * WHY: Single source of truth for all app errors
   * 
   * CALLED BY:
   * - apiClient.js when API request fails
   * - Composables when operations fail
   * - Components for validation errors
   * 
   * @param {string} message - Human-readable error message
   * @param {Object|null} [details=null] - Additional error details
   *   Often contains field-level errors from validation (e.g., { email: "Invalid" })
   * @param {number|null} [statusCode=null] - HTTP status code if from API
   *   Helps determine retry strategy (401 = logout, 5xx = retry, 4xx = user error)
   * @returns {void}
   */
  const setError = (message, details = null, statusCode = null) => {
    console.error('[ErrorStore] Error set', { message, statusCode, hasDetails: !!details })
    
    // OVERWRITE: Each setError call replaces previous error
    // UI should call clearError() before new operation or show toast stack
    globalError.value = { message, details, statusCode }
  }

  /**
   * Clear current error state
   * 
   * WHAT: Removes error from display
   * HOW: Sets globalError to null
   * WHY: Called after user dismisses error or successful retry
   * 
   * CALLED BY:
   * - Error notification close button
   * - User click/action that might fix the error
   * - After successful retry following an error
   * 
   * @returns {void}
   */
  const clearError = () => {
    console.debug('[ErrorStore] Error cleared')
    globalError.value = null
  }

  return { 
    globalError, 
    setError, 
    clearError 
  }
})
