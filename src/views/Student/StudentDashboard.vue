<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStudentStore } from '../../stores/studentStore'
import { useStudentProfile } from '../../composables/useStudentProfile'

const { fetchProfile, isLoading } = useStudentProfile()
const studentStore = useStudentStore()
const { profileCompleteness, isProfileComplete, profile } = storeToRefs(studentStore)

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Welcome Header -->
      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
        <h1 class="text-3xl font-bold text-gray-900">
          Welcome, {{ profile?.first_name || 'Student' }}!
        </h1>
        <p class="text-gray-600 mt-2">Manage your OJT profile and find your perfect internship.</p>
      </div>

      <!-- Quick Actions & Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Completeness Card -->
        <div class="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Profile Completeness</h2>
          
          <div class="relative w-32 h-32 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <!-- Simplified circular progress mapping -->
            <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" stroke-width="10" />
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke="#6366F1" stroke-width="10"
                stroke-dasharray="282.74" 
                :stroke-dashoffset="282.74 - (282.74 * profileCompleteness) / 100" 
                stroke-linecap="round"
                class="transition-all duration-1000 ease-out"
              />
            </svg>
            <span class="text-2xl font-bold text-indigo-700">{{ profileCompleteness }}%</span>
          </div>

          <p v-if="isProfileComplete" class="text-sm text-green-600 font-medium">Your profile is complete!</p>
          <p v-else class="text-sm text-orange-600 font-medium">Complete your profile to get matches.</p>

          <router-link 
            to="/student/profile/edit" 
            class="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
          >
            Edit Profile
          </router-link>
        </div>

        <!-- Next Action Card -->
        <div class="bg-white rounded-lg shadow p-6 md:col-span-2 flex flex-col justify-center">
          <h2 class="text-xl font-bold text-gray-900 mb-2">Next Steps</h2>
          <p class="text-gray-600 mb-6">
            Ensure you've added your core skills to maximize your match scores with companies.
          </p>
          
          <div class="flex flex-wrap gap-4">
            <router-link 
              to="/student/matches" 
              class="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Job Matches
            </router-link>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
