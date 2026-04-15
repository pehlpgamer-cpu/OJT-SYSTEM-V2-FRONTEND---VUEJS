import { ref } from 'vue'
import { apiClient } from '../utils/apiClient'
import { useCompanyStore } from '../stores/companyStore'

/**
 * Company Management Composable
 * 
 * Provides all company-related operations with API integration:
 * - Profile management (fetch, update)
 * - Job posting operations (create, list, update status)
 * - Application review (fetch, update status)
 * 
 * ARCHITECTURE:
 * - Uses apiClient for HTTP requests
 * - Uses companyStore for state persistence
 * - All async operations share isLoading state
 * - actionLoading tracks per-application status updates
 * 
 * WHY SEPARATE?: Business logic is separated from Vue components,
 * making it reusable across multiple views and easily testable
 * 
 * ERROR HANDLING STRATEGY:
 * - apiClient throws errors with statusCode and details
 * - Errors propagate to caller for UI handling
 * - Loading state resets in finally block (always)
 * - Caller should wrap in try-catch for error UI feedback
 */
export function useCompany() {
  // Reference to company store for persisting data
  const store = useCompanyStore()
  
  /**
   * @type {Ref<boolean>}
   * Tracks if any company operation is in progress
   * Used by components to disable buttons and show loading spinners
   * Examples: fetchProfile, createPosting, updatePostingStatus
   */
  const isLoading = ref(false)
  
  /**
   * @type {Ref<string|null>}
   * FIX: CRITICAL BUG - This was missing, causing ApplicationsReview.vue to fail
   * Tracks which application is being updated (accepts, rejects, or shortlists)
   * WHY: Allows per-application loading state instead of disabling all buttons
   * 
   * Set to application ID during update, null when complete
   * Components check: if (actionLoading.value === app.id) show spinner on that app
   * This prevents disabling all buttons when updating one application
   * 
   * Example flow:
   * 1. User clicks "Accept" on app #123
   * 2. actionLoading.value = 123
   * 3. Only app #123's buttons show loader
   * 4. API request completes
   * 5. actionLoading.value = null
   * 6. All buttons enabled again
   */
  const actionLoading = ref(null)

  // ==================== PROFILE OPERATIONS ====================

  /**
   * Fetch current company profile from API
   * 
   * WHAT: GET request to /company/profile
   * HOW: Calls apiClient, handles response normalization, stores result
   * WHY: Loads company data (name, description, logo, etc.) on app startup
   * 
   * RESPONSE HANDLING:
   * - Backend might return { profile: {...} } or just {...}
   * - Handles both formats with: data.profile || data
   * 
   * ERROR HANDLING:
   * - apiClient throws on 401, 4xx, 5xx errors
   * - Caller must wrap in try-catch
   * - Loading state resets in finally block
   * 
   * @async
   * @returns {Promise<Object>} Profile object
   * @throws {Error} Network error, 401 unauthorized, validation error
   * 
   * @example
   * try {
   *   const profile = await fetchProfile()
   *   console.log(profile.company_name)
   * } catch (error) {
   *   showError(error.message)
   * }
   */
  const fetchProfile = async () => {
    isLoading.value = true
    console.debug('[useCompany] fetchProfile called')
    
    try {
      const data = await apiClient('/company/profile', { method: 'GET' })
      console.debug('[useCompany] Profile fetched successfully', { companyId: data.id })
      
      // NORMALIZATION: Handle both response formats
      store.setProfile(data.profile || data)
      return data
    } catch (error) {
      console.error('[useCompany] fetchProfile failed', { 
        error: error.message, 
        statusCode: error.statusCode 
      })
      throw error
    } finally {
      // CLEANUP: Always reset loading state, even on error
      isLoading.value = false
    }
  }

  /**
   * Update company profile
   * 
   * WHAT: PUT request to /company/profile with updated data
   * HOW: Sends new profile data, receives updated profile back
   * WHY: Allows company to update name, description, logo, etc.
   * 
   * VALIDATION NOTE:
   * Frontend validation should happen before calling this
   * Backend will reject invalid data with 400 + details
   * 
   * @async
   * @param {Object} profileData - Company profile fields to update
   *   Typically: { company_name, about, logo_url, industry }
   * @returns {Promise<Object>} Updated profile object from backend
   * @throws {Error} Validation error, authorization error, server error
   */
  const updateProfile = async (profileData) => {
    isLoading.value = true
    console.debug('[useCompany] updateProfile called', { fieldsCount: Object.keys(profileData).length })
    
    try {
      const data = await apiClient('/company/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      })
      console.debug('[useCompany] Profile updated successfully')
      
      store.setProfile(data.profile || data)
      return data
    } catch (error) {
      console.error('[useCompany] updateProfile failed', { 
        error: error.message,
        details: error.details 
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // ==================== JOB POSTING OPERATIONS ====================

  /**
   * Create a new job posting
   * 
   * WHAT: POST request to /company/postings with job details
   * HOW: Sends posting data, receives created posting back
   * WHY: Company creates job postings for students to apply to
   * 
   * RESPONSE FLOW:
   * 1. Backend creates posting, returns it with ID
   * 2. Prepend to postings array (newest first)
   * 3. Update store for UI refresh
   * 4. Return to caller for success notification
   * 
   * @async
   * @param {Object} postingData - Job posting details
   *   Fields: { title, description, duration_weeks, skills[], requirements }
   * @returns {Promise<Object>} Created posting with ID
   * @throws {Error} Validation error, authorization error
   */
  const createPosting = async (postingData) => {
    isLoading.value = true
    console.debug('[useCompany] createPosting called', { title: postingData.title })
    
    try {
      const data = await apiClient('/company/postings', {
        method: 'POST',
        body: JSON.stringify(postingData)
      })
      console.debug('[useCompany] Posting created successfully', { postingId: data.posting?.id || data.id })
      
      // STORE UPDATE: Prepend new posting to list (newest first)
      // This ensures UI shows new posting immediately without refetch
      if (Array.isArray(store.postings)) {
        store.setPostings([data.posting || data, ...store.postings])
      }
      return data
    } catch (error) {
      console.error('[useCompany] createPosting failed', { 
        error: error.message,
        details: error.details 
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch all company job postings
   * 
   * WHAT: GET request to /company/postings
   * HOW: Retrieves list of all postings created by this company
   * WHY: Display postings on company dashboard
   * 
   * RESPONSE NORMALIZATION:
   * Backend might return different formats:
   * - Array directly: [posting, posting, ...]
   * - Wrapped object: { postings: [...] }
   * - Named data: { data: [...] }
   * This handles all three cases
   * 
   * @async
   * @returns {Promise<Array>} Array of posting objects
   * @throws {Error} Network error, authorization error
   */
  const fetchPostings = async () => {
    isLoading.value = true
    console.debug('[useCompany] fetchPostings called')
    
    try {
      const data = await apiClient('/company/postings', { method: 'GET' })
      console.debug('[useCompany] Postings fetched successfully', { count: Array.isArray(data) ? data.length : data.postings?.length || data.data?.length })
      
      // NORMALIZATION: Handle various response formats from backend
      const postingsArray = Array.isArray(data) 
        ? data 
        : (data.postings || data.data || [])
      
      store.setPostings(postingsArray)
      return postingsArray
    } catch (error) {
      console.error('[useCompany] fetchPostings failed', { 
        error: error.message,
        statusCode: error.statusCode 
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update job posting status
   * 
   * WHAT: PUT request to /company/postings/{id}/status
   * HOW: Sends new status (active, archived, closed, etc.)
   * WHY: Company can archive, publish, or close postings
   * 
   * STORE SYNC: After update, replaces posting in store array
   * This ensures all components see updated status immediately
   * 
   * @async
   * @param {string|number} postingId - ID of posting to update
   * @param {string} status - New status: 'active', 'archived', 'closed'
   * @returns {Promise<Object>} Updated posting object
   * @throws {Error} Not found, authorization error, validation error
   */
  const updatePostingStatus = async (postingId, status) => {
    isLoading.value = true
    console.debug('[useCompany] updatePostingStatus called', { postingId, status })
    
    try {
      const data = await apiClient(`/company/postings/${postingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
      console.debug('[useCompany] Posting status updated', { postingId, newStatus: status })
      
      // STORE SYNC: Update posting in array
      // Find posting by ID and replace with updated version
      const updatedIndex = store.postings.findIndex(p => p.id === postingId)
      if (updatedIndex !== -1) {
        store.postings[updatedIndex] = data.posting || data
        console.debug('[useCompany] Store updated with new posting status', { postingId })
      } else {
        console.warn('[useCompany] Posting not found in store', { postingId })
      }
      
      return data
    } catch (error) {
      console.error('[useCompany] updatePostingStatus failed', { 
        error: error.message,
        postingId,
        statusCode: error.statusCode 
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // ==================== APPLICATION OPERATIONS ====================

  /**
   * Fetch all applications for a posting
   * 
   * WHAT: GET request to /company/postings/{postingId}/applications
   * HOW: Retrieves list of student applications for specific posting
   * WHY: Show company the applications they've received
   * 
   * PAGINATION NOTE:
   * Current implementation fetches ALL applications
   * For large volumes, backend should support pagination
   * TODO: Add limit/offset support for large postings
   * 
   * @async
   * @param {string|number} postingId - ID of posting to fetch applications for
   * @returns {Promise<Array>} Array of application objects
   * @throws {Error} Posting not found, authorization error
   */
  const fetchApplications = async (postingId) => {
    isLoading.value = true
    console.debug('[useCompany] fetchApplications called', { postingId })
    
    try {
      const data = await apiClient(`/company/postings/${postingId}/applications`, { method: 'GET' })
      console.debug('[useCompany] Applications fetched', { 
        postingId, 
        count: Array.isArray(data) ? data.length : data.applications?.length || data.data?.length 
      })
      
      // NORMALIZATION: Handle various response formats
      const apps = Array.isArray(data) 
        ? data 
        : (data.applications || data.data || [])
      
      store.setApplications(postingId, apps)
      return apps
    } catch (error) {
      console.error('[useCompany] fetchApplications failed', { 
        error: error.message,
        postingId,
        statusCode: error.statusCode 
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update application status (accept, reject, shortlist)
   * 
   * WHAT: PUT request to /company/postings/{postingId}/applications/{applicationId}/status
   * HOW: Sends new status and optional feedback/rejection reason
   * WHY: Company reviews applications and makes hiring decisions
   * 
   * FIX CRITICAL BUG: Previous code only passed (applicationId, status)
   * but backend requires all three: (postingId, applicationId, status)
   * Without postingId, endpoint is incomplete and fails
   * 
   * LOAD STATE: Uses actionLoading to track this specific application
   * WHY: Component can show loading only on the updated app, not all apps
   * 
   * STORE SYNC: Updates application in store array by ID
   * Ensures UI reflects decision immediately
   * 
   * @async
   * @param {string|number} postingId - ID of posting (REQUIRED, was missing before)
   * @param {string|number} applicationId - ID of application to update
   * @param {string} status - New status: 'accepted', 'rejected', 'shortlisted', 'pending'
   * @param {string} [feedback=''] - Optional feedback/rejection reason for student
   * @returns {Promise<Object>} Updated application object
   * @throws {Error} Application not found, authorization error, validation error
   */
  const updateApplicationStatus = async (postingId, applicationId, status, feedback = '') => {
    // LOAD STATE: Set to this application's ID for per-app loading
    actionLoading.value = applicationId
    console.debug('[useCompany] updateApplicationStatus called', { 
      postingId, 
      applicationId, 
      status,
      hasFeedback: !!feedback 
    })
    
    try {
      // FIX: Include postingId in the URL endpoint (was missing before)
      const data = await apiClient(`/company/postings/${postingId}/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, feedback })
      })
      console.debug('[useCompany] Application status updated', { 
        applicationId, 
        newStatus: status 
      })
      
      // STORE SYNC: Find and update application in store
      // This keeps the UI in sync without refetching all applications
      const apps = store.applications[postingId]
      if (apps) {
        const appIndex = apps.findIndex(a => a.id === applicationId)
        if (appIndex !== -1) {
          apps[appIndex] = data.application || data
          console.debug('[useCompany] Application updated in store', { applicationId })
        } else {
          console.warn('[useCompany] Application not found in store', { postingId, applicationId })
        }
      } else {
        console.warn('[useCompany] No applications cached for posting', { postingId })
      }
      
      return data
    } catch (error) {
      console.error('[useCompany] updateApplicationStatus failed', { 
        error: error.message,
        applicationId,
        statusCode: error.statusCode 
      })
      throw error
    } finally {
      // CLEANUP: Clear action loading state
      actionLoading.value = null
    }
  }

  // ==================== EXPORTS ====================

  /**
   * Composable API - all functions and reactive state
   * 
   * REACTIVE EXPORTS:
   * - isLoading: boolean - tracks any company operation
   * - actionLoading: string|null - tracks specific application update
   * 
   * METHOD EXPORTS (all async):
   * - fetchProfile, updateProfile
   * - createPosting, fetchPostings, updatePostingStatus
   * - fetchApplications, updateApplicationStatus
   */
  return {
    // Reactive state (read-only, updated by methods)
    isLoading,
    actionLoading, // FIX: Add missing export for ApplicationsReview component
    
    // Profile operations
    fetchProfile,
    updateProfile,
    
    // Job posting operations
    createPosting,
    fetchPostings,
    updatePostingStatus,
    
    // Application operations
    fetchApplications,
    updateApplicationStatus,
  }
}
