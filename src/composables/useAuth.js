import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useErrorStore } from '../stores/errorStore'
import { apiClient } from '../utils/apiClient'

/**
 * Authentication Composable
 * 
 * Handles user authentication flows: login, registration, logout
 * Integrates with auth store for state management and router for navigation
 * 
 * WHAT IT DOES:
 * - Login: GET user token from backend, store it, redirect to dashboard
 * - Register: Create new user account, then redirect to login
 * - Logout: Clear auth state, redirect to login
 * 
 * ERROR HANDLING:
 * - Clears previous errors with each attempt
 * - apiClient throws errors with validation details
 * - Caller must handle errors for UI feedback
 * 
 * FLOW:
 * 1. Composable called from Login/Register component
 * 2. Show loading spinner
 * 3. Call API via apiClient
 * 4. Store token/user in authStore
 * 5. Navigate to appropriate dashboard
 */
export function useAuth() {
  const authStore = useAuthStore()
  const errorStore = useErrorStore()
  const router = useRouter()
  
  /**
   * @type {Ref<boolean>}
   * Tracks if login/register/logout is in progress
   * Disables submit button while request is pending
   */
  const isLoading = ref(false)

  /**
   * User login with email and password
   * 
   * WHAT: POST to /auth/login with credentials
   * HOW: Send email/password, get token and user back
   * WHY: Authenticates user for API requests
   * 
   * SUCCESS: Store token in auth store and redirect to dashboard
   * ERROR: Error stored in errorStore, caller shows UI feedback
   * 
   * ROLE-BASED ROUTING:
   * - student -> /student/dashboard
   * - company -> /company/dashboard
   * - coordinator -> /coordinator/dashboard (added in v2.1)
   * 
   * @async
   * @param {string} email - User email address
   * @param {string} password - User password (frontend validates before send)
   * @returns {Promise<void>}
   * @throws {Error} Invalid credentials, server error, network error
   */
  const login = async (email, password) => {
    isLoading.value = true
    console.debug('[useAuth] login called', { email: email.split('@')[0] + '@...' })
    
    // CLEANUP: Clear any previous error before trying again
    errorStore.clearError()

    try {
      console.debug('[useAuth] Sending login request to /auth/login')
      
      const payload = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      console.debug('[useAuth] Login successful', { 
        userId: payload.user?.id, 
        role: payload.user?.role 
      })
      
      // CRITICAL: Store token and user in global auth store
      // This persists to localStorage and makes it available to all components
      authStore.setAuth(payload.token, payload.user, payload.user.role)
      
      console.log('[useAuth] User authenticated and stored', { role: payload.user.role })
      
      // ROLE-BASED NAVIGATION: Route to correct dashboard
      const targetRoute = payload.user.role === 'student' 
        ? '/student/dashboard' 
        : '/company/dashboard'
      
      console.debug('[useAuth] Navigating to dashboard', { targetRoute })
      await router.push(targetRoute)
    } catch (error) {
      console.error('[useAuth] Login failed', { 
        email: email.split('@')[0] + '@...', 
        error: error.message,
        statusCode: error.statusCode 
      })
      // Error already set in errorStore by apiClient
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * User registration with account details
   * 
   * WHAT: POST to /auth/register with user data
   * HOW: Send name, email, password, password confirmation, and role; backend creates account
   * WHY: Allows new users to create accounts
   * 
   * FLOW:
   * 1. Send registration data to backend
   * 2. Backend validates and creates user
   * 3. Redirect to login (not auto-login after registration)
   * 4. User must login with credentials to get token
   * 
   * WHY NOT AUTO-LOGIN:
   * - Common pattern to confirm email before auto-login
   * - Gives backend time to perform async init tasks
   * - Extra security: user confirms they have access to email
   * 
   * @async
   * @param {Object} userData - Registration data
   *   Fields: { name, email, password, password_confirmation, role: 'student'|'company'|'coordinator' }
   * @returns {Promise<void>}
   * @throws {Error} Validation error, email exists, server error
   */
  const register = async (userData) => {
    isLoading.value = true
    console.debug('[useAuth] register called', { 
      email: userData.email.split('@')[0] + '@...', 
      role: userData.role 
    })
    
    // CLEANUP: Clear previous errors
    errorStore.clearError()

    try {
      console.debug('[useAuth] Sending registration request to /auth/register')
      
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      
      console.log('[useAuth] Registration successful, redirecting to login')
      
      // REDIRECT: Send to login page (user will login with their new credentials)
      // This is not auto-login - user must verify password works
      await router.push('/login')
    } catch (error) {
      console.error('[useAuth] Registration failed', { 
        email: userData.email.split('@')[0] + '@...', 
        error: error.message,
        details: error.details 
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * User logout
   * 
   * WHAT: Clear auth state and redirect to login
   * HOW: Call authStore.logout() then navigate
   * WHY: Cleanly exit authenticated session
   * 
   * NOTE: This is client-side logout only
   * TODO: Consider calling backend /auth/logout endpoint
   * Backend should invalidate token and clean up sessions
   * 
   * @async
   * @returns {Promise<void>}
   */
  const logout = async () => {
    console.debug('[useAuth] logout called')
    
    // CLEANUP: Remove all auth data from store and localStorage
    authStore.logout()
    console.log('[useAuth] User logged out')
    
    // REDIRECT: Send to login page
    await router.push('/login')
  }

  // Composable API exports
  return {
    login,
    register,
    logout,
    isLoading
  }
}
