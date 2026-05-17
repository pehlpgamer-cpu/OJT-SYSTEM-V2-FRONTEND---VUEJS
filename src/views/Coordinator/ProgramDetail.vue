<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'
import { useUiStore } from '../../stores/uiStore'

const route = useRoute()
const programId = computed(() => route.params.id)
const uiStore = useUiStore()
const coordinatorStore = useCoordinatorStore()
const {
  selectedProgram,
  programMetrics,
  programStudents,
  programCompanies,
  programPostings
} = storeToRefs(coordinatorStore)

const {
  fetchProgram,
  fetchProgramMetrics,
  fetchProgramStudents,
  addProgramStudents,
  updateProgramStudentStatus,
  fetchProgramCompanies,
  addProgramCompanies,
  fetchProgramPostings,
  addProgramPostings,
  isLoading,
  actionLoading
} = useCoordinator()

const activeTab = ref('students')
const studentIds = ref('')
const companyIds = ref('')
const postingIds = ref('')

const tabs = [
  { id: 'students', label: 'Students' },
  { id: 'companies', label: 'Companies' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'reports', label: 'Reports' }
]

const metricItems = computed(() => [
  { label: 'Students', value: programMetrics.value?.total_students || 0 },
  { label: 'Approved Companies', value: programMetrics.value?.approved_companies || 0 },
  { label: 'Jobs', value: programMetrics.value?.jobs_posted || 0 },
  { label: 'Applications', value: programMetrics.value?.total_applications || 0 },
  { label: 'Hired', value: programMetrics.value?.hired_students || 0 },
  { label: 'Placement', value: `${programMetrics.value?.placement_rate || 0}%` }
])

const idsFromInput = value => value.split(',').map(item => Number.parseInt(item.trim(), 10)).filter(Number.isInteger)
const formatDate = value => value ? new Date(value).toLocaleDateString() : 'N/A'
const studentName = row => row.student?.User?.name || [row.student?.first_name, row.student?.last_name].filter(Boolean).join(' ') || `Student #${row.student_id}`
const companyName = row => row.company?.company_name || row.company?.User?.name || `Company #${row.company_id}`

const loadAll = async () => {
  await Promise.all([
    fetchProgram(programId.value),
    fetchProgramMetrics(programId.value),
    fetchProgramStudents(programId.value),
    fetchProgramCompanies(programId.value),
    fetchProgramPostings(programId.value)
  ])
}

onMounted(loadAll)

const handleAddStudents = async () => {
  const ids = idsFromInput(studentIds.value)
  if (ids.length === 0) return
  await addProgramStudents(programId.value, ids)
  studentIds.value = ''
  uiStore.showSuccess('Students added to program.')
}

const handleAddCompanies = async () => {
  const ids = idsFromInput(companyIds.value)
  if (ids.length === 0) return
  await addProgramCompanies(programId.value, ids)
  companyIds.value = ''
  uiStore.showSuccess('Companies added to program.')
}

const handleAddPostings = async () => {
  const ids = idsFromInput(postingIds.value)
  if (ids.length === 0) return
  await addProgramPostings(programId.value, ids)
  postingIds.value = ''
  uiStore.showSuccess('Postings added to program.')
}

const setStudentStatus = async (row, status) => {
  const confirmed = await uiStore.confirmAction({
    title: `${status.charAt(0).toUpperCase() + status.slice(1)} student`,
    message: `Update ${studentName(row)} to ${status}?`,
    confirmLabel: status.charAt(0).toUpperCase() + status.slice(1),
    tone: status === 'suspended' ? 'danger' : 'default'
  })

  if (!confirmed) return

  const payload = { status }
  if (status === 'suspended') {
    payload.suspension_reason = window.prompt('Suspension reason') || 'Suspended by coordinator'
  }

  await updateProgramStudentStatus(programId.value, row.student_id, payload)
  uiStore.showSuccess(`Student ${status}.`)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="border-b border-gray-200 pb-5">
        <RouterLink to="/coordinator/programs" class="text-sm font-medium text-indigo-700 hover:text-indigo-900">Back to programs</RouterLink>
        <h1 class="mt-2 text-3xl font-bold text-gray-950">{{ selectedProgram?.name || 'Program Details' }}</h1>
        <p class="mt-2 text-sm text-gray-600">
          {{ formatDate(selectedProgram?.start_date) }} - {{ formatDate(selectedProgram?.end_date) }} · GPA {{ selectedProgram?.minimum_gpa || 'Any' }}
        </p>
      </div>

      <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading program...</div>

      <template v-else>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <div v-for="item in metricItems" :key="item.label" class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p class="text-xs uppercase text-gray-500">{{ item.label }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-950">{{ item.value }}</p>
          </div>
        </div>

        <div class="border-b border-gray-200">
          <nav class="flex gap-4 overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="border-b-2 px-1 py-3 text-sm font-medium"
              :class="activeTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <section v-if="activeTab === 'students'" class="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row">
            <input v-model="studentIds" placeholder="Student IDs, comma separated" class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <button class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" @click="handleAddStudents">Add Students</button>
          </div>
          <div v-if="programStudents.length === 0" class="px-5 py-8 text-sm text-gray-500">No students in this program.</div>
          <div v-else class="divide-y divide-gray-200">
            <div v-for="row in programStudents" :key="row.id" class="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto]">
              <div>
                <p class="font-medium text-gray-950">{{ studentName(row) }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ row.student?.User?.email }} · GPA {{ row.student?.gpa || 'N/A' }} · {{ row.student?.academic_program || 'Program not set' }}</p>
                <p class="mt-1 text-sm text-gray-500">Status: {{ row.status }} · Eligibility: {{ row.eligibility_status }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button v-if="row.status !== 'suspended'" :disabled="actionLoading === `student-${row.student_id}`" class="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50" @click="setStudentStatus(row, 'suspended')">Suspend</button>
                <button v-if="row.status === 'suspended'" :disabled="actionLoading === `student-${row.student_id}`" class="rounded-md border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50" @click="setStudentStatus(row, 'active')">Reactivate</button>
                <button class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" @click="setStudentStatus(row, 'completed')">Complete</button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'companies'" class="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row">
            <input v-model="companyIds" placeholder="Company IDs, comma separated" class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <button class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" @click="handleAddCompanies">Add Companies</button>
          </div>
          <div v-if="programCompanies.length === 0" class="px-5 py-8 text-sm text-gray-500">No companies linked.</div>
          <div v-else class="divide-y divide-gray-200">
            <div v-for="row in programCompanies" :key="row.id" class="px-5 py-4">
              <p class="font-medium text-gray-950">{{ companyName(row) }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ row.company?.industry_type || 'Industry not set' }} · {{ row.status }}</p>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'jobs'" class="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row">
            <input v-model="postingIds" placeholder="Posting IDs, comma separated" class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <button class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" @click="handleAddPostings">Add Postings</button>
          </div>
          <div v-if="programPostings.length === 0" class="px-5 py-8 text-sm text-gray-500">No postings linked.</div>
          <div v-else class="divide-y divide-gray-200">
            <div v-for="row in programPostings" :key="row.id" class="px-5 py-4">
              <p class="font-medium text-gray-950">{{ row.posting?.title || `Posting #${row.posting_id}` }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ row.posting?.location || 'Location not set' }} · {{ row.posting?.posting_status || 'status unknown' }}</p>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'reports'" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="text-base font-semibold text-gray-950">Program Report Snapshot</h2>
          <p class="mt-2 text-sm text-gray-600">Applications: {{ programMetrics?.total_applications || 0 }} · Hired: {{ programMetrics?.hired_students || 0 }} · Average match: {{ programMetrics?.average_match_score || 0 }}</p>
          <RouterLink to="/coordinator/reports" class="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Open reports</RouterLink>
        </section>
      </template>
    </div>
  </div>
</template>
