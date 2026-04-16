<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  match: {
    type: Object,
    required: true
  }
})

const ojtPosting = computed(() => props.match.OjtPosting || {})
const company = computed(() => ojtPosting.value.Company || {})

const matchStatusConfig = computed(() => {
  const score = props.match.overall_score || 0
  if (score >= 80) return { label: 'Highly Compatible', color: 'bg-green-100 text-green-800 border-green-200' }
  if (score >= 60) return { label: 'Compatible', color: 'bg-blue-100 text-blue-800 border-blue-200' }
  if (score >= 40) return { label: 'Moderately Compatible', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  if (score >= 20) return { label: 'Weak Match', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  return { label: 'Not Compatible', color: 'bg-red-100 text-red-800 border-red-200' }
})

</script>

<template>
  <div class="bg-white rounded-lg shadow border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-xl font-bold text-gray-900 truncate pr-4">{{ ojtPosting.title }}</h3>
        <p class="text-sm text-gray-600">{{ company.company_name }} &bull; {{ ojtPosting.location }}</p>
      </div>
      
      <div 
        class="text-center px-4 py-2 rounded-lg border-2 shadow-sm flex flex-col justify-center items-center"
        :class="matchStatusConfig.color"
      >
        <span class="text-2xl font-black">{{ Math.round(match.overall_score) }}%</span>
        <span class="text-xs font-semibold uppercase tracking-wide">{{ matchStatusConfig.label }}</span>
      </div>
    </div>

    <!-- Match Statistics breakdown using native progress bars -->
    <div class="space-y-3 my-4 bg-gray-50 p-4 rounded-md border border-gray-100">
      <div class="flex items-center text-xs">
        <span class="w-24 text-gray-600 font-medium">Skill</span>
        <div class="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden mx-2">
          <div class="bg-indigo-500 h-full" :style="{ width: `${match.skill_score || 0}%` }"></div>
        </div>
        <span class="w-8 text-right font-semibold text-gray-700">{{ Math.round(match.skill_score || 0) }}%</span>
      </div>

      <div class="flex items-center text-xs">
        <span class="w-24 text-gray-600 font-medium">Location</span>
        <div class="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden mx-2">
          <div class="bg-indigo-400 h-full" :style="{ width: `${match.location_score || 0}%` }"></div>
        </div>
        <span class="w-8 text-right font-semibold text-gray-700">{{ Math.round(match.location_score || 0) }}%</span>
      </div>

      <div class="flex items-center text-xs">
        <span class="w-24 text-gray-600 font-medium">Availability</span>
        <div class="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden mx-2">
          <div class="bg-indigo-400 h-full" :style="{ width: `${match.availability_score || 0}%` }"></div>
        </div>
        <span class="w-8 text-right font-semibold text-gray-700">{{ Math.round(match.availability_score || 0) }}%</span>
      </div>

      <div class="flex items-center text-xs">
        <span class="w-24 text-gray-600 font-medium">Other</span>
        <div class="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden mx-2 flex">
          <div class="bg-indigo-300 h-full" :style="{ width: `${match.gpa_score || 0}%` }" title="GPA"></div>
          <div class="bg-indigo-200 h-full" :style="{ width: `${match.program_score || 0}%` }" title="Program"></div>
        </div>
        <span class="w-8 text-right font-semibold text-gray-700">{{ Math.round((match.gpa_score || 0) + (match.program_score || 0)) }}%</span>
      </div>
    </div>

    <div class="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
      <span class="text-sm font-medium text-gray-500">
        {{ ojtPosting.duration_weeks ? `${ojtPosting.duration_weeks} weeks` : 'Duration unspecified' }}
      </span>
      <button 
        @click="$emit('apply', match.id)"
        class="inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        View & Apply
      </button>
    </div>
  </div>
</template>
