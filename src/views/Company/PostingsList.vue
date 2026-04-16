<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCompany } from '../../composables/useCompany'
import { useCompanyStore } from '../../stores/companyStore'
import { useErrorStore } from '../../stores/errorStore'
import { PlusCircle, Search, Edit2, Archive, CheckCircle } from 'lucide-vue-next'

const router = useRouter()
const { fetchPostings, updatePostingStatus, isLoading } = useCompany()
const companyStore = useCompanyStore()
const errorStore = useErrorStore()

// FIX: Track per-posting loading state (was global before)
const actionLoading = ref(null)

onMounted(async () => {
    console.debug('[PostingsList] Component mounted')
    errorStore.clearError()
    
    try {
        console.debug('[PostingsList] Fetching postings')
        await fetchPostings()
        console.log('[PostingsList] Postings loaded successfully')
    } catch (error) {
        console.error('[PostingsList] Failed to load postings', { error: error.message })
    }
})

const filteredPostings = computed(() => {
    console.debug('[PostingsList] filteredPostings computed', { count: companyStore.postings?.length })
    return companyStore.postings || []
})

const getStatusColor = (status) => {
    const colorMap = {
        'active': 'bg-green-100 text-green-800',
        'draft': 'bg-yellow-100 text-yellow-800',
        'closed': 'bg-gray-100 text-gray-800'
    }
    return colorMap[status] || colorMap['closed']
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
}

// FIX: CRITICAL - Add missing button handlers
// Previous bug: Buttons had no @click, making them non-functional

const handleEditPosting = (postingId) => {
  console.debug('[PostingsList] handleEditPosting called', { postingId })
  // TODO: Implement edit functionality in backend
  // For now, just log
}

const handleTogglePostingStatus = async (postingId, currentStatus) => {
  console.debug('[PostingsList] handleTogglePostingStatus', { postingId, currentStatus })
  
  const newStatus = currentStatus === 'active' ? 'closed' : 'active'
  const actionText = newStatus === 'active' ? 'publish' : 'close'
  
  if (!confirm(`Are you sure you want to ${actionText} this posting?`)) {
    console.debug('[PostingsList] User cancelled')
    return
  }
  
  actionLoading.value = postingId
  
  try {
    console.debug('[PostingsList] Updating status', { postingId, newStatus })
    await updatePostingStatus(postingId, newStatus)
    console.log('[PostingsList] Status updated successfully')
  } catch (error) {
    console.error('[PostingsList] Update failed', { postingId, error: error.message })
  } finally {
    actionLoading.value = null
  }
}

</script>

<template>
<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4 sm:space-y-0">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Job Postings</h1>
                <p class="mt-2 text-sm text-gray-500">Manage your active, draft, and closed job listings.</p>
            </div>
            <div class="flex space-x-3">
                 <router-link 
                    to="/company/dashboard" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Back to Dashboard
                </router-link>
                <button
                    @click="router.push('/company/postings/create')"
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusCircle class="-ml-1 mr-2 h-5 w-5" />
                    New Posting
                </button>
            </div>
        </div>

        <!-- Global Error State -->
         <div v-if="errorStore.globalError" class="rounded-md bg-red-50 p-4 border border-red-200">
            <div class="flex">
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error loading postings</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>{{ errorStore.globalError.message }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100 relative min-h-[400px]">
            <!-- Loading Overlay -->
            <div v-if="isLoading" class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                 <div class="flex flex-col items-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p class="text-gray-500 font-medium">Loading Postings...</p>
                 </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredPostings.length === 0" class="text-center py-24">
                <Search class="mx-auto h-12 w-12 text-gray-300" />
                <h3 class="mt-4 text-sm font-medium text-gray-900">No Postings Found</h3>
                <p class="mt-1 text-sm text-gray-500">Get started by creating a new job posting.</p>
                <div class="mt-6">
                     <button
                        @click="router.push('/company/postings/create')"
                        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusCircle class="-ml-1 mr-2 h-5 w-5" />
                        Create Posting
                    </button>
                </div>
            </div>

            <!-- Data Table -->
            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Position</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="posting in filteredPostings" :key="posting.id" class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900">{{ posting.title }}</div>
                                        <div class="text-sm text-gray-500 flex items-center space-x-2">
                                            <span>{{ posting.location }}</span>
                                            <span v-if="posting.salary_range">•</span>
                                            <span v-if="posting.salary_range" class="text-green-600 font-medium">{{ posting.salary_range }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span 
                                    class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                                    :class="getStatusColor(posting.status || 'active')"
                                >
                                    {{ (posting.status || 'active').toUpperCase() }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                 <div class="text-sm text-gray-900 hidden">
                                    <span class="font-bold border px-2 py-1 bg-gray-50 text-xs rounded-md">{{ posting.positions_available || 1 }}</span> Slots Open
                                </div>
                                 <div class="text-sm text-gray-500 mt-1">
                                    {{ posting.duration_weeks ? `${posting.duration_weeks} Weeks` : 'Duration TBD' }}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ formatDate(posting.created_at) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-3">
                                <!-- Edit Button: Currently TODO, logs message -->
                                <button 
                                    @click="handleEditPosting(posting.id)"
                                    :disabled="actionLoading === posting.id"
                                    class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50" 
                                    title="Edit Posting"
                                >
                                    <Edit2 class="w-4 h-4" />
                                </button>
                                
                                <!-- Archive/Close Button: Click to change status to 'closed' -->
                                <button 
                                    v-if="posting.status === 'active'"
                                    @click="handleTogglePostingStatus(posting.id, posting.status)"
                                    :disabled="actionLoading === posting.id"
                                    class="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50 transition-colors disabled:opacity-50" 
                                    title="Close/Archive"
                                >
                                    <Archive class="w-4 h-4" />
                                </button>
                                
                                <!-- Publish Button: Click to change status to 'active' -->
                                <button 
                                    v-if="posting.status !== 'active'"
                                    @click="handleTogglePostingStatus(posting.id, posting.status)"
                                    :disabled="actionLoading === posting.id"
                                    class="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50" 
                                    title="Publish"
                                >
                                    <CheckCircle class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
</template>
