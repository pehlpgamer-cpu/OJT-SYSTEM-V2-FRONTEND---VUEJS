<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { PlusCircle } from 'lucide-vue-next'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'
import { useErrorStore } from '../../stores/errorStore'

const { fetchPrograms, isLoading } = useCoordinator()
const coordinatorStore = useCoordinatorStore()
const errorStore = useErrorStore()
const { programs } = storeToRefs(coordinatorStore)

onMounted(async () => {
  errorStore.clearError()
  try {
    await fetchPrograms()
  } catch (error) {
    console.error('[ProgramsList] Failed to load programs', error)
  }
})

const activeCount = computed(() => programs.value.filter(program => program.status === 'active').length)
const formatDate = value => value ? new Date(value).toLocaleDateString() : 'N/A'
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-950">OJT Programs</h1>
          <p class="mt-2 text-sm text-gray-600">{{ programs.length }} programs · {{ activeCount }} active</p>
        </div>
        <RouterLink to="/coordinator/programs/new" class="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <PlusCircle class="h-4 w-4" />
          New Program
        </RouterLink>
      </div>

      <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">
        Loading programs...
      </div>
      <div v-else-if="programs.length === 0" class="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <h2 class="text-lg font-semibold text-gray-950">No programs yet</h2>
        <p class="mt-2 text-sm text-gray-500">Create the first OJT program to start enrollment and reporting.</p>
      </div>
      <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Program</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Dates</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Requirements</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="program in programs" :key="program.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <RouterLink :to="`/coordinator/programs/${program.id}`" class="font-medium text-indigo-700 hover:text-indigo-900">
                  {{ program.name }}
                </RouterLink>
                <p class="mt-1 max-w-xl truncate text-sm text-gray-500">{{ program.description || 'No description' }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(program.start_date) }} - {{ formatDate(program.end_date) }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">
                GPA {{ program.minimum_gpa || 'Any' }} · {{ program.academic_programs?.length || 0 }} programs
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">{{ program.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
