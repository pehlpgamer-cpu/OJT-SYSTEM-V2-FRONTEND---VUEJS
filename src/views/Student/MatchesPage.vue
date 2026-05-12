<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useJobMatching } from '../../composables/useJobMatching'
import { useErrorStore } from '../../stores/errorStore'
import { useUiStore } from '../../stores/uiStore'
import MatchCard from '../../components/Student/MatchCard.vue'

const { fetchMatches, matchStore, applyToMatch, isLoading } = useJobMatching()
const errorStore = useErrorStore()
const uiStore = useUiStore()
const { filteredMatches, filters } = storeToRefs(matchStore)
const selectedMatch = ref(null)
const coverLetter = ref('')
const coverLetterError = ref('')
const isApplying = ref(false)

const selectedPosting = computed(() => selectedMatch.value?.OjtPosting || selectedMatch.value?.posting || {})
const selectedCompany = computed(() => selectedPosting.value?.Company || {})
const selectedPostingId = computed(() => selectedMatch.value?.posting_id || selectedMatch.value?.ojt_posting_id || selectedPosting.value?.id)

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
const openApplyModal = (match) => {
  selectedMatch.value = match
  coverLetter.value = ''
  coverLetterError.value = ''
}

const closeApplyModal = () => {
  if (isApplying.value) return
  selectedMatch.value = null
  coverLetter.value = ''
  coverLetterError.value = ''
}

const handleApply = async () => {
  const postingId = selectedPostingId.value
  console.debug('[MatchesPage] handleApply called', { postingId })
  errorStore.clearError()
  coverLetterError.value = ''

  if (!postingId) {
    errorStore.setError('Unable to identify this posting. Refresh matches and try again.', null, 400)
    return
  }

  if (coverLetter.value.trim().length < 20) {
    coverLetterError.value = 'Cover letter must be at least 20 characters.'
    return
  }
  
  try {
    isApplying.value = true
    console.debug('[MatchesPage] Submitting application', { postingId })
    
    const result = await applyToMatch(postingId, { cover_letter: coverLetter.value.trim() })
    
    console.log('[MatchesPage] Application submitted successfully', { 
      postingId,
      applicationId: result.id 
    })
    
    uiStore.showSuccess('Application submitted.')
    selectedMatch.value = null
    coverLetter.value = ''
  } catch (error) {
    console.error('[MatchesPage] Failed to submit application', { 
      postingId,
      error: error.message,
      details: error.details,
      statusCode: error.statusCode 
    })
    // Error already set in errorStore, no need to set again
  } finally {
    isApplying.value = false
  }
}
</script>

<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8">
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
          @view-apply="openApplyModal"
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

    <Teleport to="body">
      <div
        v-if="selectedMatch"
        class="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/40 px-4 py-6"
        role="dialog"
        aria-modal="true"
      >
        <div class="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-indigo-600">Review application</p>
              <h2 class="mt-1 text-2xl font-bold text-gray-950">{{ selectedPosting.title }}</h2>
              <p class="mt-1 text-sm text-gray-600">
                {{ selectedCompany.company_name || 'Company' }} &bull; {{ selectedPosting.location || 'Location TBD' }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-md px-2 py-1 text-2xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close application dialog"
              @click="closeApplyModal"
            >
              &times;
            </button>
          </div>

          <div class="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p class="text-sm leading-6 text-gray-700 whitespace-pre-line">
              {{ selectedPosting.description || 'No description provided.' }}
            </p>
            <div class="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p class="text-gray-500">Compatibility</p>
                <p class="font-semibold text-gray-900">{{ Math.round(selectedMatch.overall_score || 0) }}%</p>
              </div>
              <div>
                <p class="text-gray-500">Duration</p>
                <p class="font-semibold text-gray-900">{{ selectedPosting.duration_weeks ? `${selectedPosting.duration_weeks} weeks` : 'TBD' }}</p>
              </div>
              <div>
                <p class="text-gray-500">Positions</p>
                <p class="font-semibold text-gray-900">{{ selectedPosting.positions_available || 1 }}</p>
              </div>
            </div>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="handleApply">
            <div>
              <label class="block text-sm font-medium text-gray-700">Cover letter</label>
              <textarea
                v-model="coverLetter"
                rows="6"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                :class="{'border-red-300': coverLetterError}"
                placeholder="Tell the company why this OJT role fits your skills and goals."
              ></textarea>
              <p v-if="coverLetterError" class="mt-1 text-xs text-red-600">{{ coverLetterError }}</p>
            </div>

            <div class="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @click="closeApplyModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isApplying"
                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {{ isApplying ? 'Submitting...' : 'Submit Application' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
