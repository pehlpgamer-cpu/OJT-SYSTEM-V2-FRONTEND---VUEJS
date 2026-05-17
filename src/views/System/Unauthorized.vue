<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()

const dashboardRoute = computed(() => {
  if (authStore.role === 'admin') return '/admin/dashboard'
  if (authStore.role === 'company') return '/company/dashboard'
  if (authStore.role === 'coordinator') return '/coordinator/dashboard'
  return '/student/dashboard'
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
    <div class="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
      <p class="text-sm font-semibold uppercase tracking-wide text-red-600">Access denied</p>
      <h1 class="mt-2 text-2xl font-bold text-gray-950">Wrong account area</h1>
      <p class="mt-3 text-sm leading-6 text-gray-600">
        Your current role cannot open that page.
      </p>
      <RouterLink
        :to="dashboardRoute"
        class="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Go to dashboard
      </RouterLink>
    </div>
  </div>
</template>
