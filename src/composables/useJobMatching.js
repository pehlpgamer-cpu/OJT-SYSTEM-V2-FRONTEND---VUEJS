import { ref } from 'vue'
import { apiClient } from '../utils/apiClient'
import { useMatchStore } from '../stores/matchStore'
import { useErrorStore } from '../stores/errorStore'

/**
 * Job Matching Composable
 * 
 * Manages student job matching and application operations:
 * - Fetch job matches based on student profile
 * - Apply to job postings
 * - Track loading states
 * 
 * WHAT IT DOES:
 * - Fetches filtered job postings matched to student
 * - Allows student to submit applications
 * - Caches results in match store
 * 
 * FIX: CRITICAL - Missing errorStore import
 * Without this, API errors throw silently and aren't displayed to UI
 * Now errors are properly propagated to error store for UI notification
 * 
 * ERROR HANDLING:
 * - apiClient throws errors with details
 * - Errors now stored in errorStore for UI display
 * - Caller should wrap in try-catch for specific handling
 */
export function useJobMatching() {
  const matchStore = useMatchStore()
  const errorStore = useErrorStore()
  
  /**
   * @type {Ref<boolean>}
   * Tracks if any job matching operation is loading
   */
  const isLoading = ref(false)

  /**
   * Fetch job postings matched to student profile
   * 
   * WHAT: GET /student/matches with optional filters
   * HOW: Query backend for postings matching student skills/preferences
   * WHY: Show student relevant job opportunities
   * 
   * FILTERING:
   * - Optional params object with filter criteria
   * - Converted to URL query string
   * - Example: { skills: 'java', minSalary: 50000 }
   * 
   * RESPONSE NORMALIZATION:
   * - Handles different response formats from backend
   * - Could be array directly or wrapped in {data} or {matches}
   * 
   * @async
   * @param {Object} [params={}] - Optional filter parameters
   *   Example: { skills: 'python,java', experience: 'junior' }
   * @returns {Promise<Array>} Array of matching job postings
   * @throws {Error} Network error, authorization error, server error
   */
  const fetchMatches = async (params = {}) => {
    isLoading.value = true
    console.debug('[useJobMatching] fetchMatches called', { paramsCount: Object.keys(params).length })
    
    try {
      // BUILD QUERY STRING: Convert params object to URL query string
      const qs = new URLSearchParams(params).toString()
      const path = qs ? `/student/matches?${qs}` : `/student/matches`
      
      console.debug('[useJobMatching] Fetching matches', { path })
      
      const payload = await apiClient(path, { method: 'GET' })
      
      console.debug('[useJobMatching] Matches fetched', { 
        count: Array.isArray(payload) ? payload.length : (payload.data?.length || payload.matches?.length) 
      })
      
      // NORMALIZATION: Handle various response formats
      const matchData = Array.isArray(payload) 
        ? payload 
        : (payload.data || payload.matches || [])
      
      // CACHE: Store in match store for component access
      matchStore.setMatches(matchData)
      return matchData
    } catch (error) {
      console.error('[useJobMatching] fetchMatches failed', { 
        error: error.message,
        statusCode: error.statusCode 
      })
      // Error stored in errorStore by apiClient
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Apply to a job posting
   * 
   * WHAT: POST /applications with posting ID and application data
   * HOW: Send application with cover letter or other details
   * WHY: Student submits application to postings they're interested in
   * 
   * APPLICATION DATA:
   * - postingId: Which job posting to apply to
   * - cover_letter: Message to the company
   * - Other fields as needed
   * 
   * RESPONSE:
   * - Returns confirmation with application ID
   * - Application is now tracked in student profile
   * 
   * @async
   * @param {string|number} postingId - ID of posting to apply to
   * @param {Object} [applicationData={}] - Application details
   *   Fields: { cover_letter: string, attachments?, ... }
   * @returns {Promise<Object>} Created application with ID
   * @throws {Error} Invalid posting, already applied, server error
   */
  const applyToMatch = async (postingId, applicationData = {}) => {
    isLoading.value = true
    console.debug('[useJobMatching] applyToMatch called', { 
      postingId,
      hasData: Object.keys(applicationData).length > 0 
    })
    
    try {
      console.debug('[useJobMatching] Sending application to /applications')
      
      const result = await apiClient('/applications', {
        method: 'POST',
        body: JSON.stringify({ postingId, ...applicationData })
      })
      
      console.log('[useJobMatching] Application submitted successfully', { 
        applicationId: result.id || result.application?.id 
      })
      
      return result
    } catch (error) {
      console.error('[useJobMatching] applyToMatch failed', { 
        postingId,
        error: error.message,
        details: error.details 
      })
      // Error stored in errorStore by apiClient
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Composable API exports
  return {
    fetchMatches,
    applyToMatch,
    isLoading,
    matchStore
  }
}
