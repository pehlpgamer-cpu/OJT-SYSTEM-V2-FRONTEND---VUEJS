<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCompany } from '../../composables/useCompany'
import { useErrorStore } from '../../stores/errorStore'
import { z } from 'zod'

const router = useRouter()
const errorStore = useErrorStore()
const { createPosting, isLoading } = useCompany()

const formData = ref({
  title: '',
  description: '',
  location: '',
  salary_range: '',
  duration_weeks: null,
  positions_available: 1
})

const validationErrors = ref({})

const postingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be detailed'),
  location: z.string().min(1, 'Location is required'),
  salary_range: z.string().optional(),
  duration_weeks: z.number().int().min(1, 'Minimum 1 week required').optional().or(z.literal('').transform(() => null)),
  positions_available: z.number().int().min(1, 'At least 1 position must be available')
})

const submitPosting = async () => {
  validationErrors.value = {}
  errorStore.clearError()

  try {
    // Parse numeric inputs correctly
    const preParse = { ...formData.value }
    if (preParse.duration_weeks) preParse.duration_weeks = Number(preParse.duration_weeks)
    if (preParse.positions_available) preParse.positions_available = Number(preParse.positions_available)

    const validData = postingSchema.parse(preParse)
    
    await createPosting(validData)
    // Success: clear errors and redirect to postings list
    errorStore.clearError()
    // Brief delay to maintain UX
    setTimeout(() => {
      router.push('/company/postings')
    }, 500)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = {}
      err.errors.forEach(e => {
        formattedErrors[e.path[0]] = e.message
      })
      validationErrors.value = formattedErrors
    } else {
      // API error already stored in errorStore by apiClient
      console.error('Job posting creation failed', err.message)
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto text-gray-900 bg-white rounded-lg shadow p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Create New Job Posting</h1>
        <router-link to="/company/dashboard" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to Dashboard
        </router-link>
      </div>

      <div v-if="errorStore.globalError" class="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
         <h3 class="text-sm font-medium text-red-800">
            {{ errorStore.globalError.message }}
         </h3>
      </div>

      <form @submit.prevent="submitPosting" class="space-y-6">
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Job Title <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.title" 
              type="text" 
              required
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.title}"
            />
            <span v-if="validationErrors.title" class="text-red-500 text-xs mt-1">{{ validationErrors.title }}</span>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Job Description <span class="text-red-500">*</span></label>
            <textarea 
              v-model="formData.description" 
              rows="6" 
              required
              class="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border px-3 py-2"
              :class="{'border-red-300': validationErrors.description}"
              placeholder="Describe the role, responsibilities, and expected outcomes..."
            ></textarea>
            <span v-if="validationErrors.description" class="text-red-500 text-xs mt-1">{{ validationErrors.description }}</span>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Location <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.location" 
              type="text" 
              required
              placeholder="e.g., Remote, New York, Hybrid"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.location}"
            />
            <span v-if="validationErrors.location" class="text-red-500 text-xs mt-1">{{ validationErrors.location }}</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Salary Range</label>
            <input 
              v-model="formData.salary_range" 
              type="text" 
              placeholder="e.g., $15-$25/hr, Unpaid"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Positions Available <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.positions_available" 
              type="number" 
              min="1"
              required
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.positions_available}"
            />
            <span v-if="validationErrors.positions_available" class="text-red-500 text-xs mt-1">{{ validationErrors.positions_available }}</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Duration (Weeks)</label>
            <input 
              v-model="formData.duration_weeks" 
              type="number" 
              min="1"
              placeholder="e.g., 12"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.duration_weeks}"
            />
            <span v-if="validationErrors.duration_weeks" class="text-red-500 text-xs mt-1">{{ validationErrors.duration_weeks }}</span>
          </div>
        </div>

        <div class="pt-5 border-t border-gray-200">
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="router.push('/company/dashboard')"
              class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              <span v-if="isLoading" class="mr-2">Creating...</span>
              Create Job Posting
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
