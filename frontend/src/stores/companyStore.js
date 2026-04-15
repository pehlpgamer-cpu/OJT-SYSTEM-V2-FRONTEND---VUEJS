import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Company Store (Pinia)
 * 
 * Manages company-related data state:
 * - Company profile (name, description, logo, etc.)
 * - Job postings created by company
 * - Student applications received for each posting
 * 
 * ARCHITECTURE:
 * - profile: Single company profile object
 * - postings: Array of all postings created by company
 * - applications: Object/Map with structure { postingId: [applications] }
 *   Why map? Different postings have different applicants
 *   Keyed by postingId for fast lookup
 * 
 * REACTIVITY:
 * - All state is reactive (Vue Refs)
 * - Changes automatically propagate to all subscribed components
 * - Used by useCompany composable for API operations
 */
export const useCompanyStore = defineStore('company', () => {
  /**
   * @type {Ref<Object|null>}
   * Current company profile
   * Structure: { id, company_name, about, logo_url, industry, founded_at, ... }
   * Set when company profile is fetched/updated
   * Null until first fetch
   */
  const profile = ref(null)
  
  /**
   * @type {Ref<Array>}
   * All job postings created by this company
   * Each posting: { id, title, description, status, created_at, ... }
   * Populated by fetchPostings composable
   * Updated when postings are created, edited, or status changes
   */
  const postings = ref([])
  
  /**
   * @type {Ref<Object>}
   * Applications received for each posting
   * Structure: { postingId: [applications], postingId2: [applications], ... }
   * Allows quick lookup of applications by posting
   * Example: applications[123] returns array of apps for posting 123
   * 
   * WHY MAP FORMAT:
   * - Fast O(1) lookup: applications[postingId]
   * - Different views fetch different postings
   * - Don't waste memory with postings that have no view open
   * - Can update single posting without affecting others
   */
  const applications = ref({})

  /**
   * Update company profile state
   * 
   * @param {Object|null} p - Company profile object or null
   * @returns {void}
   */
  const setProfile = (p) => { 
    console.debug('[CompanyStore] setProfile called', { companyId: p?.id })
    profile.value = p 
  }
  
  /**
   * Update postings list
   * 
   * @param {Array} p - Array of posting objects
   * @returns {void}
   */
  const setPostings = (p) => { 
    console.debug('[CompanyStore] setPostings called', { count: p?.length })
    postings.value = p 
  }
  
  /**
   * Update applications for a specific posting
   * 
   * WHAT: Set applications array for one posting
   * HOW: Map posting ID to applications array
   * WHY: Allows independent updates per posting
   * 
   * @param {string|number} postingId - ID of posting
   * @param {Array} apps - Applications array for this posting
   * @returns {void}
   */
  const setApplications = (postingId, apps) => { 
    console.debug('[CompanyStore] setApplications called', { postingId, count: apps?.length })
    applications.value[postingId] = apps 
  }

  // Store exports
  return {
    // Reactive state (read-only)
    profile,
    postings,
    applications,
    
    // Mutations (write operations)
    setProfile,
    setPostings,
    setApplications
  }
})
