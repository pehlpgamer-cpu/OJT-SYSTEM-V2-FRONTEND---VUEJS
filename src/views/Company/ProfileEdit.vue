<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCompany } from '../../composables/useCompany'
import { useErrorStore } from '../../stores/errorStore'
import { z } from 'zod'

const router = useRouter()
const errorStore = useErrorStore()
const { fetchProfile, updateProfile, isLoading } = useCompany()

const formData = ref({
  company_name: '',
  industry: '',
  company_size: '',
  address: '',
  website: '',
  logo: ''
})

const validationErrors = ref({})

const profileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  company_size: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal(''))
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
    console.error('Failed to load company profile', err)
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
    
    // Ensure empty strings for optional URL fields default to null backend logic if needed
    const payload = { ...validData }
    if (!payload.website) delete payload.website
    if (!payload.logo) delete payload.logo

    await updateProfile(payload)
    alert("Company Details updated successfully!")
    router.push('/company/dashboard')
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = {}
      err.issues.forEach(e => {
        formattedErrors[e.path[0]] = e.message
      })
      validationErrors.value = formattedErrors
    } else {
      console.error('Update failed', err)
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-gray-900 bg-white rounded-lg shadow p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Edit Company Profile</h1>
        <router-link to="/company/dashboard" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to Dashboard
        </router-link>
      </div>

      <div v-if="errorStore.globalError" class="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
         <h3 class="text-sm font-medium text-red-800">
            {{ errorStore.globalError.message }}
         </h3>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <!-- Company Name -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Company Name <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.company_name" 
              type="text" 
              required
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.company_name}"
            />
            <span v-if="validationErrors.company_name" class="text-red-500 text-xs mt-1">{{ validationErrors.company_name }}</span>
          </div>

          <!-- Industry -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Industry <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.industry" 
              type="text" 
              required
              placeholder="e.g., Software Development"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.industry}"
            />
            <span v-if="validationErrors.industry" class="text-red-500 text-xs mt-1">{{ validationErrors.industry }}</span>
          </div>

          <!-- Size -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Company Size</label>
            <select 
              v-model="formData.company_size" 
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="">Select Size</option>
              <option value="1-10">1-10 Employees</option>
              <option value="11-50">11-50 Employees</option>
              <option value="51-200">51-200 Employees</option>
              <option value="201-500">201-500 Employees</option>
              <option value="500+">500+ Employees</option>
            </select>
          </div>

          <!-- Address -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">HQ Address <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.address" 
              type="text" 
              required
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.address}"
            />
            <span v-if="validationErrors.address" class="text-red-500 text-xs mt-1">{{ validationErrors.address }}</span>
          </div>

          <!-- Website -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Website URL</label>
            <input 
              v-model="formData.website" 
              type="url" 
              placeholder="https://example.com"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.website}"
            />
            <span v-if="validationErrors.website" class="text-red-500 text-xs mt-1">{{ validationErrors.website }}</span>
          </div>

          <!-- Logo -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Logo URL</label>
            <input 
              v-model="formData.logo" 
              type="url" 
              placeholder="https://example.com/logo.png"
              class="mt-1 block flex-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              :class="{'border-red-300': validationErrors.logo}"
            />
            <span v-if="validationErrors.logo" class="text-red-500 text-xs mt-1">{{ validationErrors.logo }}</span>
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
              <span v-if="isLoading" class="mr-2">Saving...</span>
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
