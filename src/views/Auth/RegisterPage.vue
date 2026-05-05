<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useErrorStore } from '../../stores/errorStore'
import { z } from 'zod'

const router = useRouter()
const { register, isLoading } = useAuth()
const errorStore = useErrorStore()

const formData = ref({
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student'
})

const validationErrors = ref({})

/**
 * FIX: Password validation now matches backend requirements
 * Backend enforces:
 * - Minimum 8 characters (was 6, now fixed)
 * - At least 1 uppercase letter
 * - At least 1 digit (0-9)
 * - At least 1 special character (!@#$%^&*)
 * 
 * WHY: Prevents users from registering passwords that fail backend validation
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'company'])
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

const handleSubmit = async () => {
  validationErrors.value = {}
  errorStore.clearError()
  
  console.debug('[RegisterPage] Form submitted')

  try {
    // VALIDATION: Check form matches schema
    console.debug('[RegisterPage] Validating registration form', { role: formData.value.role })
    const validData = registerSchema.parse(formData.value)
    
    console.debug('[RegisterPage] Form validation passed, calling register')
    
    // API PAYLOAD: Remove confirmPassword before sending
    // Backend only expects email, password, role
    const { confirmPassword, ...apiPayload } = validData
    console.debug('[RegisterPage] Sending to backend', { email: apiPayload.email.split('@')[0] + '@...', role: apiPayload.role })
    
    await register(apiPayload)
    
    console.log('[RegisterPage] Registration successful')
  } catch (err) {
    if (err instanceof z.ZodError) {
      // VALIDATION ERROR: Format and display
      console.warn('[RegisterPage] Validation errors', { errorCount: err.issues.length })
      
      const formattedErrors = {}
      err.issues.forEach(e => {
        formattedErrors[e.path[0]] = e.message
        console.debug('[RegisterPage] Validation error', { field: e.path[0], message: e.message })
      })
      validationErrors.value = formattedErrors
    } else {
      // API ERROR: Handled by useAuth
      console.error('[RegisterPage] Registration failed', { 
        error: err.message,
        details: err.details 
      })
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create an account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div v-if="errorStore.globalError" class="rounded-md bg-red-50 p-4 mb-4">
           <h3 class="text-sm font-medium text-red-800">
              {{ errorStore.globalError.message }}
           </h3>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Account Type</label>
            <select v-model="formData.role" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border">
              <option value="student">Student</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Email address</label>
            <input 
              v-model="formData.email" 
              type="email" 
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              :class="{'border-red-300': validationErrors.email}"
            />
            <span v-if="validationErrors.email" class="text-red-500 text-xs mt-1">{{ validationErrors.email }}</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input 
              v-model="formData.password" 
              type="password" 
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              :class="{'border-red-300': validationErrors.password}"
            />
            <span v-if="validationErrors.password" class="text-red-500 text-xs mt-1">{{ validationErrors.password }}</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input 
              v-model="formData.confirmPassword" 
              type="password" 
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              :class="{'border-red-300': validationErrors.confirmPassword}"
            />
            <span v-if="validationErrors.confirmPassword" class="text-red-500 text-xs mt-1">{{ validationErrors.confirmPassword }}</span>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="isLoading" class="mr-2">Loading...</span>
            Register
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
