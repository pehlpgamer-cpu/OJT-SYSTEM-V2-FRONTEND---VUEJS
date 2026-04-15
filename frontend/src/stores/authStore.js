import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Authentication Store (Pinia)
 * 
 * Manages global authentication state including:
 * - JWT token storage and persistence
 * - User identity and role information
 * - Authentication status tracking
 * - Local storage synchronization
 * 
 * WHY: Centralized state management allows all components and composables
 * to reference the same auth state without prop drilling. Persisting to
 * localStorage ensures users stay logged in across browser sessions.
 * 
 * HOW: Uses Pinia composition-api syntax with refs for reactivity. localStorage
 * is checked on initialization. All state updates sync to localStorage.
 */
export const useAuthStore = defineStore('auth', () => {
  // Check if running in browser environment (not SSR)
  // This prevents localStorage errors during server-side rendering
  const isClient = typeof window !== 'undefined'
  
  /**
   * @type {Ref<Object|null>}
   * Currently authenticated user object with id, email, name, etc.
   * Set to null when user logs out
   */
  const user = ref(null)
  
  /**
   * @type {Ref<string|null>}
   * JWT token for API authentication
   * Persisted in localStorage as 'ojt_jwt_token'
   * Checked on app startup and attached to all API requests
   * WHY stored: So users don't need to login again after page refresh
   */
  const token = ref(isClient ? localStorage.getItem('ojt_jwt_token') : null)
  
  /**
   * @type {Ref<boolean>}
   * Loading state during auth operations (login, register, logout)
   * Used by components to disable buttons and show loaders during requests
   */
  const isLoading = ref(false)

  /**
   * @type {Ref<boolean>}
   * Derived reactive boolean - computed from token existence
   * WHY separate: Components can subscribe to "are we logged in?" state
   * without accessing token directly (security principle of least privilege)
   */
  const isAuthenticated = ref(!!token.value)
  
  /**
   * @type {Ref<string|null>}
   * User role for authorization: 'student', 'company', or 'coordinator'
   * Used in router navigation guards to protect routes
   * Example: student routes check if role === 'student'
   * Persisted in localStorage as 'ojt_user_role'
   */
  const role = ref(isClient ? localStorage.getItem('ojt_user_role') : null)

  /**
   * Set authentication data after successful login/registration
   * 
   * WHAT: Updates all auth-related state - token, user, role, authenticated status
   * HOW: Synchronously sets all refs, then persists to localStorage
   * WHY separate method: Ensures all auth state stays in sync. If components
   *     set token directly, they might forget to set role, causing inconsistency
   * 
   * HOW IT WORKS:
   * 1. Update all reactive refs (triggers Vue reactivity)
   * 2. Persist to localStorage (survives page reload)
   * 3. All watchers/computed properties automatically update
   * 
   * @param {string} newToken - JWT token from backend
   * @param {Object} newUser - User object {id, email, name, ...}
   * @param {string} newRole - User role: 'student', 'company', 'coordinator'
   * @returns {void}
   */
  const setAuth = (newToken, newUser, newRole) => {
    console.debug('[AuthStore] setAuth called', { 
      userId: newUser?.id, 
      role: newRole,
      tokenLength: newToken?.length 
    })
    
    // Update reactive refs - triggers all watchers and computed properties
    token.value = newToken
    user.value = newUser
    role.value = newRole
    isAuthenticated.value = true
    
    // PERSISTENCE: Sync to localStorage for session continuity
    // Next time app loads, user will still be logged in
    if (isClient) {
      localStorage.setItem('ojt_jwt_token', newToken)
      localStorage.setItem('ojt_user_role', newRole)
      console.debug('[AuthStore] Auth data persisted to localStorage', { role: newRole })
    }
  }

  /**
   * Clear authentication data on logout
   * 
   * WHAT: Resets all auth state to logged-out state
   * HOW: Nullifies all refs and removes from localStorage
   * WHY: Ensures complete logout - no residual auth state remains
   * 
   * ERROR HANDLING NOTE:
   * This method is called when:
   * 1. User clicks logout button (intentional)
   * 2. API returns 401 Unauthorized (session expired)
   * In both cases, we clear all state to a clean slate
   * 
   * @returns {void}
   */
  const logout = () => {
    console.debug('[AuthStore] logout called')
    
    // Clear all auth state
    token.value = null
    user.value = null
    role.value = null
    isAuthenticated.value = false
    
    // CLEANUP: Remove from localStorage to prevent accidental reuse
    // NOTE: If token was compromised, this deletion from client
    // doesn't invalidate it on the server (backend should handle token expiration)
    if (isClient) {
      localStorage.removeItem('ojt_jwt_token')
      localStorage.removeItem('ojt_user_role')
      console.debug('[AuthStore] Auth data removed from localStorage')
    }
  }

  // Store exports - make all state and methods available to components
  return {
    /**
     * Reactive state (read/write)
     */
    user,
    token,
    isLoading,
    isAuthenticated,
    role,
    
    /**
     * Methods (write operations)
     */
    setAuth,
    logout
  }
})
