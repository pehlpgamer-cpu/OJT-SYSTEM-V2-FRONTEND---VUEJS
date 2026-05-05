<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useErrorStore } from '../../stores/errorStore'
import { z } from 'zod'

const router = useRouter()
const { login, isLoading } = useAuth()
const errorStore = useErrorStore()

const formData = ref({
  email: '',
  password: ''
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
 * WHY: Prevents mismatch between frontend validation and backend rejection
 * Users won't enter passwords that fail on backend
 */
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/\d/, { message: 'Password must contain at least one digit' })
    .regex(/[!@#$%^&*]/, { message: 'Password must contain at least one special character (!@#$%^&*)' })
})

const handleSubmit = async () => {
  validationErrors.value = {}
  errorStore.clearError()
  
  console.debug('[LoginPage] Form submitted')

  try {
    // VALIDATION: Check form data against schema
    console.debug('[LoginPage] Validating login form')
    loginSchema.parse(formData.value)
    
    console.debug('[LoginPage] Form validation passed, calling login')
    // AUTHENTICATION: Send to auth composable
    await login(formData.value.email, formData.value.password)
    
    console.log('[LoginPage] Login successful')
  } catch (err) {
    if (err instanceof z.ZodError) {
      // VALIDATION ERROR: Format Zod errors for display
      console.warn('[LoginPage] Validation errors', { errorCount: err.issues.length })
      
      const formattedErrors = {}
      err.issues.forEach(e => {
        formattedErrors[e.path[0]] = e.message
        console.debug('[LoginPage] Validation error', { field: e.path[0], message: e.message })
      })
      validationErrors.value = formattedErrors
    } else {
      // API ERROR: Handled by useAuth and stored in errorStore
      console.error('[LoginPage] Login failed', { 
        error: err.message,
        statusCode: err.statusCode 
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
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
            register for a new account
          </router-link>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div v-if="errorStore.globalError" class="rounded-md bg-red-50 p-4 mb-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ errorStore.globalError.message }}
              </h3>
            </div>
          </div>
        </div>

        <div class="rounded-md shadow-sm -space-y-px mt-4">
          <div class="mb-4">
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
              v-model="formData.email"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
            <span v-if="validationErrors.email" class="text-red-500 text-xs mt-1 block">{{ validationErrors.email }}</span>
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              v-model="formData.password"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
            <span v-if="validationErrors.password" class="text-red-500 text-xs mt-1 block">{{ validationErrors.password }}</span>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="isLoading" class="mr-2">Loading...</span>
            Sign in
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
