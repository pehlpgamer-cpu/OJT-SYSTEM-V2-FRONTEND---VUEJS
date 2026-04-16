import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Match Store (Pinia)
 * 
 * Manages job matching state for students
 * - Stores matches (job postings with compatibility scores)
 * - Filters (score threshold, search, sort)
 * - Computed filtered/sorted list
 * 
 * ARCHITECTURE:
 * - matches: Raw results from API
 * - filters: User preferences for filtering
 * - filteredMatches: Computed filtered/sorted results
 * 
 * FILTERING FLOW:
 * 1. User changes filter (minScore, search term)
 * 2. filteredMatches computed property recalculates
 * 3. Component watches filteredMatches and re-renders
 * 4. No API call needed (all client-side filtering)
 */
export const useMatchStore = defineStore('match', () => {
  /**
   * @type {Ref<Array>}
   * Full list of job matches from API
   * Each match includes overall_score calculated by backend
   * Structure: { id, OjtPosting: {...}, overall_score: 85 }
   */
  const matches = ref([])
  
  /**
   * @type {Ref<Object>}
   * User-selected filter preferences
   * - minScore: Minimum compatibility score (0, 40, 60, 80)
   * - search: Search text for role/company/location
   * - sortBy: Sort order (\"overall_score\" or \"date_posted\")
   */
  const filters = ref({
    minScore: 0,
    search: '',
    sortBy: 'overall_score'  // Sorted by score first (highest first)
  })
  
  /**
   * Set matches array from API
   * @param {Array} data - Matches from /student/matches endpoint
   */
  const setMatches = (data) => {
    console.debug('[MatchStore] setMatches called', { count: data?.length })
    matches.value = data
  }

  /**
   * Update single filter
   * FIX: Should validate key to prevent arbitrary mutations
   * @param {string} key - Filter key: minScore, search, sortBy
   * @param {*} value - Filter value
   */
  const setFilter = (key, value) => {
    console.debug('[MatchStore] setFilter called', { key, value })
    // FIX: Validate key is allowed
    const allowedKeys = ['minScore', 'search', 'sortBy']
    if (!allowedKeys.includes(key)) {
      console.warn('[MatchStore] Invalid filter key', { key })
      return
    }
    filters.value[key] = value
  }

  /**
   * Computed property: Filtered and sorted matches
   * 
   * WHAT: Returns filtered/sorted version of all matches
   * HOW: Applies filters in sequence (score, search, sort)
   * WHY: Reactive - auto-updates when filters or matches change
   * 
   * PERFORMANCE:
   * - Filters happen client-side (no API calls)
   * - Good for small datasets (<1000)
   * - If many matches, consider server-side filtering
   * 
   * @type {ComputedRef<Array>}
   * @returns {Array} Filtered matches
   */
  const filteredMatches = computed(() => {
    console.debug('[MatchStore] filteredMatches computed', { 
      totalMatches: matches.value.length,
      filters: filters.value
    })
    
    let result = matches.value

    // FILTER 1: Minimum compatibility score
    // Only show if user selected a threshold (default 0 = show all)
    if (filters.value.minScore > 0) {
      const before = result.length
      result = result.filter(m => m.overall_score >= filters.value.minScore)
      console.debug('[MatchStore] Filtered by score', { minScore: filters.value.minScore, before, after: result.length })
    }
    
    // FILTER 2: Text search
    // Searches across title, company name, location
    if (filters.value.search) {
      const q = filters.value.search.toLowerCase()
      const before = result.length
      result = result.filter(m => 
        m.OjtPosting?.title?.toLowerCase().includes(q) ||
        m.OjtPosting?.Company?.company_name?.toLowerCase().includes(q) ||
        m.OjtPosting?.location?.toLowerCase().includes(q)
      )
      console.debug('[MatchStore] Filtered by search', { query: q, before, after: result.length })
    }

    // SORT: Applied after filtering
    if (filters.value.sortBy === 'overall_score') {
      // Sort by compatibility score (highest first)
      result = [...result].sort((a, b) => b.overall_score - a.overall_score)
      console.debug('[MatchStore] Sorted by overall_score')
    } else if (filters.value.sortBy === 'date_posted') {
      // Sort by creation date (newest first)
      result = [...result].sort((a, b) => 
        new Date(b.OjtPosting?.created_at) - new Date(a.OjtPosting?.created_at)
      )
      console.debug('[MatchStore] Sorted by date_posted')
    }

    console.debug('[MatchStore] filteredMatches final result', { count: result.length })
    return result
  })

  // Store exports
  return {
    // Reactive state
    matches,
    filters,
    
    // Computed
    filteredMatches,
    
    // Mutations
    setMatches,
    setFilter
  }
})
