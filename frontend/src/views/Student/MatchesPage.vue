<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useJobMatching } from '../../composables/useJobMatching'
import { useErrorStore } from '../../stores/errorStore'
import MatchCard from '../../components/Student/MatchCard.vue'

const router = useRouter()
const { fetchMatches, matchStore, applyToMatch, isLoading } = useJobMatching()
const errorStore = useErrorStore()
const { filteredMatches, filters } = storeToRefs(matchStore)

/**
 * Load matches when component mounts
 * ERROR HANDLING: Try-catch with error store
 */
onMounted(async () => {
  console.debug('[MatchesPage] Component mounted')
  errorStore.clearError()
  
  try {
    console.debug('[MatchesPage] Fetching job matches')
    await fetchMatches()
    console.log('[MatchesPage] Matches loaded successfully')
  } catch (error) {
    console.error('[MatchesPage] Failed to load matches', { error: error.message })
    // Error already set in errorStore
  }
})

/**
 * FIX: HIGH SEVERITY - Poor error handling and UX
 * 
 * BEFORE (BAD):
 * - Used alert() for success (blocks UI, poor UX)
 * - Used console.error for failure (no UI feedback)
 * - No error store integration
 * 
 * AFTER (GOOD):
 * - Uses error store for UI notification
 * - Provides feedback via global error bar
 * - Logs for debugging
 * - Allows user to continue without modal blocking
 */
const handleApply = async (matchId) => {
  console.debug('[MatchesPage] handleApply called', { matchId })
  errorStore.clearError()
  
  try {
    console.debug('[MatchesPage] Submitting application', { postingId: matchId })
    
    // Apply to job with empty cover letter (user can add later)
    const result = await applyToMatch(matchId, { cover_letter: '' })
    
    console.log('[MatchesPage] Application submitted successfully', { 
      postingId: matchId,
      applicationId: result.id 
    })
    
    // SUCCESS: Show feedback
    // TODO: Show toast notification instead of error bar
    errorStore.setError('Application submitted successfully!', null, 200)
    
    // Optional: Refresh matches list
    // Could also show a \"view applications\" button
    
  } catch (error) {
    console.error('[MatchesPage] Failed to submit application', { 
      postingId: matchId,
      error: error.message,
      details: error.details,
      statusCode: error.statusCode 
    })
    // Error already set in errorStore, no need to set again
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-lg shadow">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Job Matches</h1>
          <p class="text-sm text-gray-500 mt-1">Your AI-ranked compatibility list for current OJT postings.</p>
        </div>
        <router-link 
          to="/student/dashboard" 
          class="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Dashboard
        </router-link>
      </div>

      <!-- Global Error/Success Alert -->
      <div v-if="errorStore.globalError" :class="[
        'rounded-md p-4 border',
        errorStore.globalError.statusCode === 200 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      ]">
        <h3 :class="[
          'text-sm font-medium',
          errorStore.globalError.statusCode === 200 ? 'text-green-800' : 'text-red-800'
        ]">
          {{ errorStore.globalError.message }}
        </h3>
      </div>

      <!-- Filters & Sorting -->
      <div class="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Search roles, companies, locations..."
          class="flex-1 min-w-[200px] border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
        />
        
        <select 
          v-model="filters.minScore"
          class="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pl-3 pr-10 py-2 border"
        >
          <option :value="0">All Matches</option>
          <option :value="80">Highly Compatible (80%+)</option>
          <option :value="60">Compatible (60%+)</option>
          <option :value="40">Moderately Compatible (40%+)</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12 text-gray-500">
        <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Calculating latest matches...
      </div>

      <!-- Match Cards Grid -->
      <div v-else-if="filteredMatches.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MatchCard 
          v-for="match in filteredMatches" 
          :key="match.id" 
          :match="match"
          @apply="handleApply"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16 bg-white rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900">No matches found</h3>
        <p class="text-gray-500 mt-2 max-w-md mx-auto">
           Try adjusting your search criteria or head to your profile and add more skills to improve your compatibility scores.
        </p>
      </div>

    </div>
  </div>
</template>
