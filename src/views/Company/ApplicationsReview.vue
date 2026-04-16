<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompany } from '../../composables/useCompany'
import { useCompanyStore } from '../../stores/companyStore'
import { useErrorStore } from '../../stores/errorStore'
import { User, CheckCircle, XCircle, Clock } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

/**
 * FIX: actionLoading is now properly exported from useCompany
 * This was causing ApplicationsReview to fail before
 * actionLoading tracks which application ID is being updated
 */
const { fetchApplications, updateApplicationStatus, isLoading, actionLoading } = useCompany()
const companyStore = useCompanyStore()
const errorStore = useErrorStore()

/**
 * @type {Ref<string|null>}
 * Current posting ID being reviewed
 * Set from route params (e.g., /company/applications/:id)
 * Used to fetch applications for this specific posting
 * Also passed to updateApplicationStatus API call
 */
const currentPostingId = ref(route.params.id || null)

/**
 * Load applications when component mounts
 * 
 * HOW IT WORKS:
 * 1. Check if postingId is provided in URL
 * 2. Fetch applications for that posting
 * 3. Show error if fetch fails
 * 
 * ERROR HANDLING: Try-catch wraps async operation
 * If fetch fails, error is stored in errorStore for UI display
 */
onMounted(async () => {
    console.debug('[ApplicationsReview] Component mounted', { postingId: currentPostingId.value })
    
    try {
        if (currentPostingId.value) {
            console.debug('[ApplicationsReview] Fetching applications for posting', { postingId: currentPostingId.value })
            await fetchApplications(currentPostingId.value)
        } else {
            console.warn('[ApplicationsReview] No posting ID provided in route')
            errorStore.setError('Posting ID is required to view applications')
        }
    } catch (error) {
        console.error('[ApplicationsReview] Failed to load applications', { 
            error: error.message,
            postingId: currentPostingId.value 
        })
        // Error already set in errorStore by apiClient/composable
    }
})

/**
 * @type {ComputedRef<Array>}
 * Get applications for current posting
 * Computed property ensures reactivity to store updates
 */
const applications = computed(() => {
    const apps = companyStore.applications[currentPostingId.value] || []
    console.debug('[ApplicationsReview] Applications computed', { 
        postingId: currentPostingId.value, 
        count: apps.length 
    })
    return apps
})

/**
 * Handle application status update (accept, reject, shortlist)
 * 
 * WHAT: Updates application status with user confirmation
 * HOW: 
 * 1. Show confirmation dialog
 * 2. Call updateApplicationStatus with postingId + applicationId + status
 * 3. Refresh applications list
 * 4. Show success/error feedback
 * WHY: Ensures company confirms decision before submitting
 * 
 * FIX CRITICAL BUG: Now passes postingId (was missing before)
 * The API endpoint requires all three parameters
 * 
 * @param {string|number} applicationId - ID of application to update
 * @param {string} status - New status: 'accepted', 'rejected', 'shortlisted'
 */
const handleStatusUpdate = async (applicationId, status) => {
    console.debug('[ApplicationsReview] handleStatusUpdate called', { 
        applicationId, 
        status,
        postingId: currentPostingId.value 
    })
    
    // CONFIRMATION: Ask user to confirm decision
    // WHY: Prevents accidental rejections of good candidates
    const confirmed = confirm(`Are you sure you want to ${status} this applicant?`)
    
    if (!confirmed) {
        console.debug('[ApplicationsReview] User cancelled status update', { applicationId, status })
        return
    }
    
    try {
        // FIX: Pass postingId as first parameter (was missing before)
        // API endpoint: PUT /company/postings/{postingId}/applications/{applicationId}/status
        await updateApplicationStatus(currentPostingId.value, applicationId, status)
        
        console.debug('[ApplicationsReview] Status updated successfully', { 
            applicationId, 
            status 
        })
        
        // REFRESH: Reload applications to get updated list
        // This ensures we see the updated status
        await fetchApplications(currentPostingId.value)
        
        // SUCCESS: Show feedback to user
        console.log(`[ApplicationsReview] Application ${status}ed successfully`)
    } catch (error) {
        console.error('[ApplicationsReview] Failed to update status', { 
            error: error.message,
            applicationId,
            status,
            statusCode: error.statusCode 
        })
        // Error already set in errorStore
    }
}

/**
 * @param {string} status - Application status
 * @returns {string} Tailwind CSS classes for status badge styling
 * 
 * Maps status to appropriate visual styling
 * Different colors for different statuses:
 * - Green for accepted (positive)
 * - Red for rejected (negative)
 * - Blue for shortlisted (neutral)
 * - Yellow for pending/other (waiting)
 */
const getStatusBadge = (status) => {
    const badgeMap = {
        'accepted': 'bg-green-100 text-green-800 border-green-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200',
        'shortlisted': 'bg-blue-100 text-blue-800 border-blue-200',
        'default': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return badgeMap[status] || badgeMap['default']
}

/**
 * Format date string to user-friendly format
 * 
 * @param {string|null} dateString - ISO date string from API
 * @returns {string} Formatted date (MM/DD/YYYY) or 'N/A' if invalid
 * 
 * WHY: Dates from API are ISO strings, hard for users to read
 * JavaScript's toLocaleDateString() handles locale automatically
 */
const formatDate = (dateString) => {
    if (!dateString) {
        console.debug('[ApplicationsReview] No date provided')
        return 'N/A'
    }
    
    try {
        const formatted = new Date(dateString).toLocaleDateString()
        console.debug('[ApplicationsReview] Date formatted', { input: dateString, output: formatted })
        return formatted
    } catch (error) {
        console.error('[ApplicationsReview] Date formatting failed', { dateString, error: error.message })
        return 'Invalid Date'
    }
}
</script>

<template>
<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Review Applications</h1>
                <p class="mt-2 text-sm text-gray-500">Manage incoming student applications for your postings.</p>
            </div>
            <router-link 
                to="/company/dashboard" 
                class="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
                Back to Dashboard
            </router-link>
        </div>

        <!-- Global Error Alert -->
        <div v-if="errorStore.globalError" class="rounded-md bg-red-50 p-4 border border-red-200">
            <h3 class="text-sm font-medium text-red-800">{{ errorStore.globalError.message }}</h3>
            <p v-if="errorStore.globalError.details" class="text-xs text-red-700 mt-2">
                Details: {{ JSON.stringify(errorStore.globalError.details) }}
            </p>
        </div>

        <!-- Applications Container with Loading/Empty States -->
        <div class="relative min-h-[400px]">
             <!-- Loading State: Show spinner overlay -->
            <div v-if="isLoading" class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p class="mt-4 text-sm text-gray-600">Loading applications...</p>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="applications.length === 0" class="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
                <User class="mx-auto h-12 w-12 text-gray-300" />
                <h3 class="mt-4 text-sm font-medium text-gray-900">No Applications Found</h3>
                <p class="mt-1 text-sm text-gray-500">You haven't received any applications for this posting yet.</p>
            </div>

            <!-- Applications List: Grid of application cards -->
            <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div 
                    v-for="app in applications" 
                    :key="app.id" 
                    class="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow relative"
                >
                    <!-- Per-Application Loading Overlay -->
                    <!-- 
                        FIX: This now works because actionLoading is properly exported from useCompany
                        Shows spinner only on the application being updated, not all of them
                        Previous bug: buttons were disabled globally, not per-application
                    -->
                    <div v-if="actionLoading === app.id" class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p class="mt-2 text-xs text-gray-600">Updating...</p>
                        </div>
                    </div>

                    <!-- Application Card Content -->
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-medium text-gray-900 truncate">
                                Student #{{ app.student_id || 'Unknown' }}
                            </h3>
                            <!-- Status Badge -->
                            <span :class="['px-2.5 py-0.5 rounded-full text-xs font-medium border', getStatusBadge(app.status || 'pending')]">
                                {{ (app.status || 'pending').toUpperCase() }}
                            </span>
                        </div>

                        <!-- Cover Letter Section -->
                        <div class="mt-4 break-words">
                            <p class="text-sm font-medium text-gray-500">Cover Letter</p>
                            <p class="text-sm text-gray-900 mt-1 line-clamp-3 italic bg-gray-50 p-3 rounded border border-gray-100">
                                "{{ app.cover_letter || 'No cover letter provided.' }}"
                            </p>
                        </div>

                        <!-- Application Date -->
                        <div class="mt-4 flex items-center text-xs text-gray-500">
                            <Clock class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            Applied: {{ formatDate(app.created_at) }}
                        </div>
                    </div>
                    
                    <!-- Action Buttons: Only show if application is pending or shortlisted -->
                    <!-- This allows reviewing only applications that haven't been finalized -->
                    <div v-if="(app.status || 'pending') === 'pending' || (app.status || 'pending') === 'shortlisted'" class="bg-gray-50 px-6 py-4 flex justify-between space-x-3 border-t border-gray-200">
                        <!-- Reject Button -->
                        <button 
                            @click="handleStatusUpdate(app.id, 'rejected')"
                            :disabled="actionLoading === app.id"
                            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <XCircle class="-ml-1 mr-2 h-4 w-4 text-red-500" />
                            Reject
                        </button>
                        
                        <!-- Shortlist Button: Only show if not already shortlisted -->
                        <button 
                            v-if="app.status !== 'shortlisted'"
                            @click="handleStatusUpdate(app.id, 'shortlisted')"
                            :disabled="actionLoading === app.id"
                            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Shortlist
                        </button>

                        <!-- Accept Button -->
                        <button 
                            @click="handleStatusUpdate(app.id, 'accepted')"
                            :disabled="actionLoading === app.id"
                            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle class="-ml-1 mr-2 h-4 w-4" />
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>
