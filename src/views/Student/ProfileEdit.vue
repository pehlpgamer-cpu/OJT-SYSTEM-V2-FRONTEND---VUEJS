<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentProfile } from '../../composables/useStudentProfile'
import { useErrorStore } from '../../stores/errorStore'
import { z } from 'zod'

const router = useRouter()
const errorStore = useErrorStore()
const { fetchProfile, updateProfile, isLoading } = useStudentProfile()

// Basic profile mapping keys
const formData = ref({
  first_name: '',
  last_name: '',
  phone: '',
  bio: '',
  preferred_location: '',
  availability_start: '',
  availability_end: '',
  gpa: '',
  academic_program: ''
})

const validationErrors = ref({})

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  preferred_location: z.string().optional(),
  availability_start: z.string().optional(),
  availability_end: z.string().optional(),
  gpa: z.number().min(0).max(4.0).optional().or(z.string().regex(/^\d*\.?\d*$/).transform(Number)),
  academic_program: z.string().optional()
})

const loadProfile = async () => {
  try {
    const data = await fetchProfile()
    if (data) {
      Object.keys(formData.value).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.value[key] = data[key]
        }
      })
    }
  } catch (err) {
    console.error('Failed to load profile', err)
  }
}

onMounted(() => {
  loadProfile()
})

const handleSubmit = async () => {
  validationErrors.value = {}
  errorStore.clearError()

  try {
    const validData = profileSchema.parse(formData.value)
    await updateProfile(validData)
    // Success: show feedback and redirect
    errorStore.clearError()
    // Brief delay to allow user to see success message if added
    setTimeout(() => {
      router.push('/student/dashboard')
    }, 500)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = {}
      err.issues.forEach(e => {
        formattedErrors[e.path[0]] = e.message
      })
      validationErrors.value = formattedErrors
    } else {
      // API error already in errorStore, just log for debugging
      console.error('Profile update failed', err.message)
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-gray-900 bg-white rounded-lg shadow p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Edit Your Profile</h1>
        <router-link to="/student/dashboard" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to Dashboard
        </router-link>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="errorStore.globalError" class="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
           <h3 class="text-sm font-medium text-red-800">
              {{ errorStore.globalError.message }}
           </h3>
        </div>

        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700">First Name <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.first_name" 
              type="text" 
              required
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.first_name}"
            />
            <span v-if="validationErrors.first_name" class="text-red-500 text-xs mt-1">{{ validationErrors.first_name }}</span>
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Last Name <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.last_name" 
              type="text" 
              required
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.last_name}"
            />
            <span v-if="validationErrors.last_name" class="text-red-500 text-xs mt-1">{{ validationErrors.last_name }}</span>
          </div>

          <!-- Academic Program -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Academic Program</label>
            <input 
              v-model="formData.academic_program" 
              type="text" 
              placeholder="e.g., B.S. Computer Science"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <input 
              v-model="formData.phone" 
              type="tel" 
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <!-- GPA -->
          <div>
            <label class="block text-sm font-medium text-gray-700">GPA (0.0 - 4.0)</label>
            <input 
              v-model="formData.gpa" 
              type="number" 
              step="0.01"
              min="0"
              max="4.0"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.gpa}"
            />
            <span v-if="validationErrors.gpa" class="text-red-500 text-xs mt-1">{{ validationErrors.gpa }}</span>
          </div>

          <!-- Availability Start -->
          <div>
            <label class="block text-sm font-medium text-gray-700">OJT Start Date</label>
            <input 
              v-model="formData.availability_start" 
              type="date" 
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <!-- Availability End -->
          <div>
            <label class="block text-sm font-medium text-gray-700">OJT End Date</label>
            <input 
              v-model="formData.availability_end" 
              type="date" 
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <!-- Location Pref -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Preferred Location</label>
            <input 
              v-model="formData.preferred_location" 
              type="text" 
              placeholder="e.g., Remote, San Francisco, CA"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <!-- Bio -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Bio</label>
            <div class="mt-1">
              <textarea 
                v-model="formData.bio" 
                rows="4" 
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border px-3 py-2"
                :class="{'border-red-300': validationErrors.bio}"
                placeholder="Briefly describe your objectives and skills..."
              ></textarea>
            </div>
            <span v-if="validationErrors.bio" class="text-red-500 text-xs mt-1">{{ validationErrors.bio }}</span>
          </div>
        </div>

        <div class="pt-5 border-t border-gray-200">
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="router.push('/student/dashboard')"
              class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              <span v-if="isLoading" class="mr-2">Saving...</span>
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
