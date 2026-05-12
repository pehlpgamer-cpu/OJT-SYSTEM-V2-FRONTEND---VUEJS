<script setup>
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()

// TODO: Replace with actual coordinator features when backend is ready
const features = [
  {
    title: 'Student Management',
    description: 'Manage and verify student profiles',
    icon: 'SM',
    status: 'Coming Soon'
  },
  {
    title: 'Company Verification',
    description: 'Review and approve company registrations',
    icon: 'CV',
    status: 'Coming Soon'
  },
  {
    title: 'Job Postings Review',
    description: 'Monitor and approve job postings',
    icon: 'JR',
    status: 'Coming Soon'
  },
  {
    title: 'Matches & Analytics',
    description: 'View system-wide matching statistics',
    icon: 'MA',
    status: 'Coming Soon'
  }
]
</script>

<template>
  <div class="bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Status Alert -->
      <div class="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-blue-900 mb-2">Coordinator Portal Under Development</h2>
        <p class="text-blue-700 mb-4">
          Welcome, {{ authStore.user?.name || 'Coordinator' }}. Coordinator workflows are not active yet.
        </p>
        <ul class="list-disc list-inside text-blue-700 space-y-1">
          <li>Student profile reviews and verification</li>
          <li>Company registration approvals</li>
          <li>Job posting moderation</li>
          <li>System-wide analytics and reporting</li>
          <li>Job matching statistics</li>
        </ul>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="feature in features" :key="feature.title" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-700">{{ feature.icon }}</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
          <p class="text-sm text-gray-600 mb-4">{{ feature.description }}</p>
          <div class="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
            {{ feature.status }}
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Quick Reference</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold text-gray-900 mb-3">Documentation</h3>
            <p class="text-sm text-gray-600 mb-4">
              Check the backend documentation for API details and implementation guides.
            </p>
            <a href="/docs" class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View Documentation</a>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-3">Backend Status</h3>
            <p class="text-sm text-gray-600 mb-4">
              Coordinator endpoints are being developed. Estimated completion: Backend v2.0
            </p>
            <button disabled class="text-gray-400 text-sm font-medium cursor-not-allowed">Coming Soon</button>
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div class="mt-12 bg-gray-100 rounded-lg p-6 text-center">
        <p class="text-sm text-gray-600">
          Backend API: <span class="font-mono text-gray-800">https://ojt-system-v2-backend-nodejs.vercel.app</span>
        </p>
        <p class="text-xs text-gray-500 mt-2">
          For issues or questions, contact the development team.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component styling handled by Tailwind CSS */
</style>
