<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()

const homeRoute = computed(() => {
  if (authStore.role === 'company') return '/company/dashboard'
  if (authStore.role === 'coordinator') return '/coordinator/dashboard'
  if (authStore.role === 'student') return '/student/dashboard'
  return '/login'
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
    <div class="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
      <p class="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
      <h1 class="mt-2 text-2xl font-bold text-gray-950">Page not found</h1>
      <p class="mt-3 text-sm leading-6 text-gray-600">The page you opened does not exist.</p>
      <RouterLink
        :to="homeRoute"
        class="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Go back
      </RouterLink>
    </div>
  </div>
</template>
