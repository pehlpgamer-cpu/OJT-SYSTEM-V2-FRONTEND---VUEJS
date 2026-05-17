<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Download } from 'lucide-vue-next'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'
import { useUiStore } from '../../stores/uiStore'

const coordinatorStore = useCoordinatorStore()
const uiStore = useUiStore()
const { programs, placementReport } = storeToRefs(coordinatorStore)
const { fetchPrograms, fetchPlacementReport, downloadPlacementCsv, isLoading } = useCoordinator()

const filters = ref({
  programId: '',
  startDate: '',
  endDate: ''
})

onMounted(async () => {
  await fetchPrograms()
  if (programs.value[0]) {
    filters.value.programId = programs.value[0].id
    await generateReport()
  }
})

const summary = computed(() => placementReport.value?.summary || {})
const rows = computed(() => placementReport.value?.rows || [])

const generateReport = async () => {
  await fetchPlacementReport(filters.value)
}

const exportCsv = async () => {
  await downloadPlacementCsv(filters.value)
  uiStore.showSuccess('CSV export generated.')
}

const formatDate = value => value ? new Date(value).toLocaleDateString() : ''
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="border-b border-gray-200 pb-5">
        <h1 class="text-3xl font-bold text-gray-950">Reports</h1>
        <p class="mt-2 text-sm text-gray-600">Generate placement analytics by program and date range.</p>
      </div>

      <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label>
            <span class="text-sm font-medium text-gray-700">Program</span>
            <select v-model="filters.programId" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">All accessible programs</option>
              <option v-for="program in programs" :key="program.id" :value="program.id">{{ program.name }}</option>
            </select>
          </label>
          <label>
            <span class="text-sm font-medium text-gray-700">Start date</span>
            <input v-model="filters.startDate" type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <label>
            <span class="text-sm font-medium text-gray-700">End date</span>
            <input v-model="filters.endDate" type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <div class="flex items-end gap-2">
            <button class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" @click="generateReport">
              Generate
            </button>
            <button class="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="exportCsv">
              <Download class="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-gray-500">Applications</p>
          <p class="mt-2 text-2xl font-semibold text-gray-950">{{ summary.total_applications || 0 }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-gray-500">Hired</p>
          <p class="mt-2 text-2xl font-semibold text-gray-950">{{ summary.hired || 0 }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-gray-500">Rejected</p>
          <p class="mt-2 text-2xl font-semibold text-gray-950">{{ summary.rejected || 0 }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-gray-500">Placement Rate</p>
          <p class="mt-2 text-2xl font-semibold text-gray-950">{{ summary.placement_rate || 0 }}%</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase text-gray-500">Avg Match</p>
          <p class="mt-2 text-2xl font-semibold text-gray-950">{{ summary.average_match_score || 0 }}</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div v-if="isLoading" class="p-8 text-sm text-gray-500">Loading report...</div>
        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Student</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Company</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Posting</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Applied</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="row in rows" :key="row.application_id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <p class="font-medium text-gray-950">{{ row.student_name || 'Student' }}</p>
                <p class="text-sm text-gray-500">{{ row.student_email }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ row.company_name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ row.posting_title }}</td>
              <td class="px-6 py-4 text-sm capitalize text-gray-600">{{ row.status }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(row.applied_at) }}</td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">No report rows.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
