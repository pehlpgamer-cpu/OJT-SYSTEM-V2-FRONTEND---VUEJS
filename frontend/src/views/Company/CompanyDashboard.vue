<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCompanyStore } from '../../stores/companyStore'
import { useCompany } from '../../composables/useCompany'
import { useErrorStore } from '../../stores/errorStore'

const { fetchProfile, fetchPostings, isLoading } = useCompany()
const companyStore = useCompanyStore()
const errorStore = useErrorStore()
const { profile, postings } = storeToRefs(companyStore)

/**\n * FIX: HIGH SEVERITY - Sequential API calls now use Promise.all\n * \n * BEFORE (BAD):\n * await fetchProfile()    // Wait for this\n * await fetchPostings()   // Then wait for this\n * Total time: ~2-4 seconds\n * \n * AFTER (GOOD):\n * Promise.all([fetchProfile(), fetchPostings()])\n * Total time: ~2 seconds (parallel)\n * \n * ERROR HANDLING:\n * - If either call fails, Promise.all rejects\n * - error is caught and stored in errorStore\n * - Component shows error via global error display\n * - Partial data might still be available\n * \n * WHY: These two requests are independent\n * No data dependency between them\n * Browser can make both requests simultaneously\n */\nonMounted(async () => {\n  console.debug('[CompanyDashboard] Component mounted, loading data')\n  errorStore.clearError()\n  \n  try {\n    console.debug('[CompanyDashboard] Starting parallel data loads')\n    \n    // OPTIMIZATION: Load both profile and postings in parallel\n    // Promise.all waits for BOTH to complete\n    // If either fails, error is thrown\n    await Promise.all([\n      fetchProfile(),\n      fetchPostings()\n    ])\n    \n    console.log('[CompanyDashboard] Data loaded successfully')\n  } catch (error) {\n    console.error('[CompanyDashboard] Failed to load data', { \n      error: error.message,\n      statusCode: error.statusCode \n    })\n    // Error already set in errorStore by apiClient/composable\n    // UI will display error bar\n  }\n})

</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Welcome Header -->
      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
        <h1 class="text-3xl font-bold text-gray-900">
          Welcome, {{ profile?.company_name || 'Company Partner' }}!
        </h1>
        <p class="text-gray-600 mt-2">Manage your job postings and review OJT candidates.</p>
        <p v-if="profile?.accreditation_status === 'pending'" class="mt-4 text-orange-600 font-medium">
          Note: Your company account is currently pending admin approval. You may not be able to publish postings yet.
        </p>
      </div>

      <!-- Quick Actions & Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Action Actions -->
        <div class="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center row-span-2">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          
          <router-link 
            to="/company/postings/new" 
            class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 w-full mb-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Job Posting
          </router-link>

          <router-link 
            to="/company/postings" 
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full mb-3"
          >
            Manage Postings
          </router-link>

          <router-link 
            to="/company/profile/edit" 
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
          >
            Edit Company Profile
          </router-link>
        </div>

        <!-- Metrics Dashboards -->
        <div class="bg-white rounded-lg shadow p-6 md:col-span-2 flex flex-col justify-center text-center sm:text-left">
          <div class="grid grid-cols-2 gap-4">
             <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Postings</p>
                <p class="text-3xl font-black text-gray-900 mt-1">{{ postings.length }}</p>
             </div>
             
             <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide">Active Postings</p>
                <p class="text-3xl font-black text-indigo-600 mt-1">{{ postings.filter(p => p.posting_status === 'active').length }}</p>
             </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 md:col-span-2 flex flex-col justify-center">
           <h2 class="text-lg font-semibold text-gray-700 mb-4">Recent Postings Activity</h2>
           <div v-if="isLoading" class="text-sm text-gray-500">Loading...</div>
           <div v-else-if="postings.length === 0" class="text-sm text-gray-500">No postings yet. Create your first job posting.</div>
           <ul v-else class="divide-y divide-gray-200">
              <li v-for="posting in postings.slice(0, 3)" :key="posting.id" class="py-3 flex justify-between">
                 <div class="truncate pr-4">
                    <p class="font-medium text-gray-900 truncate">{{ posting.title }}</p>
                    <p class="text-sm text-gray-500 truncate">{{ posting.location }} &bull; {{ posting.positions_available }} positions</p>
                 </div>
                 <div class="flex-shrink-0 flex items-center">
                    <span 
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="posting.posting_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                    >
                      {{ posting.posting_status }}
                    </span>
                    <router-link :to="`/company/postings/${posting.id}/applications`" class="ml-4 text-indigo-600 hover:text-indigo-900 text-sm font-medium">Review</router-link>
                 </div>
              </li>
           </ul>
        </div>
      </div>
    </div>
  </div>
</template>
