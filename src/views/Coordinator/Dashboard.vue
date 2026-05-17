<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Building2, ClipboardList, FileText, GraduationCap, Users } from 'lucide-vue-next'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'
import { useErrorStore } from '../../stores/errorStore'

const { fetchDashboard, isLoading } = useCoordinator()
const coordinatorStore = useCoordinatorStore()
const errorStore = useErrorStore()
const { dashboard } = storeToRefs(coordinatorStore)

onMounted(async () => {
  errorStore.clearError()
  try {
    await fetchDashboard()
  } catch (error) {
    console.error('[CoordinatorDashboard] Failed to load dashboard', error)
  }
})

const metrics = computed(() => dashboard.value?.metrics || {})
const programs = computed(() => dashboard.value?.programs || [])
const pendingCompanies = computed(() => dashboard.value?.pending_companies || [])
const auditLogs = computed(() => dashboard.value?.recent_audit_logs || [])

const statItems = computed(() => [
  { label: 'Students', value: metrics.value.total_students || 0, icon: Users },
  { label: 'Approved Companies', value: metrics.value.approved_companies || 0, icon: Building2 },
  { label: 'Jobs Posted', value: metrics.value.jobs_posted || 0, icon: ClipboardList },
  { label: 'Applications', value: metrics.value.total_applications || 0, icon: FileText },
  { label: 'Hired', value: metrics.value.hired_students || 0, icon: GraduationCap },
  { label: 'Placement Rate', value: `${metrics.value.placement_rate || 0}%`, icon: FileText }
])

const formatDate = value => value ? new Date(value).toLocaleDateString() : 'N/A'
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="border-b border-gray-200 pb-5">
        <p class="text-sm font-medium text-indigo-700">Coordinator Portal</p>
        <h1 class="mt-2 text-3xl font-bold text-gray-950">Coordinator Dashboard</h1>
        <p class="mt-2 text-sm text-gray-600">Monitor active OJT programs, company approvals, placements, and audit activity.</p>
      </div>

      <div v-if="errorStore.globalError" class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {{ errorStore.globalError.message }}
      </div>

      <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">
        Loading coordinator dashboard...
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div v-for="item in statItems" :key="item.label" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-500">{{ item.label }}</p>
              <component :is="item.icon" class="h-4 w-4 text-indigo-600" />
            </div>
            <p class="mt-3 text-2xl font-semibold text-gray-950">{{ item.value }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section class="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-2">
            <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 class="text-base font-semibold text-gray-950">Active Programs</h2>
                <p class="mt-1 text-sm text-gray-500">Coordinator-owned program cohorts.</p>
              </div>
              <RouterLink to="/coordinator/programs/new" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                New Program
              </RouterLink>
            </div>

            <div v-if="programs.length === 0" class="px-5 py-8 text-sm text-gray-500">
              No active programs yet.
            </div>
            <div v-else class="divide-y divide-gray-200">
              <RouterLink
                v-for="program in programs"
                :key="program.id"
                :to="`/coordinator/programs/${program.id}`"
                class="grid gap-2 px-5 py-4 hover:bg-gray-50 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p class="font-medium text-gray-950">{{ program.name }}</p>
                  <p class="mt-1 text-sm text-gray-500">{{ formatDate(program.start_date) }} - {{ formatDate(program.end_date) }}</p>
                </div>
                <span class="self-start rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">{{ program.status }}</span>
              </RouterLink>
            </div>
          </section>

          <section class="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div class="border-b border-gray-200 px-5 py-4">
              <h2 class="text-base font-semibold text-gray-950">Pending Companies</h2>
              <p class="mt-1 text-sm text-gray-500">Waiting for accreditation decision.</p>
            </div>
            <div v-if="pendingCompanies.length === 0" class="px-5 py-8 text-sm text-gray-500">No pending companies.</div>
            <div v-else class="divide-y divide-gray-200">
              <div v-for="row in pendingCompanies" :key="row.id" class="px-5 py-4">
                <p class="font-medium text-gray-950">{{ row.company_name || row.User?.name || 'Company' }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ row.industry_type || 'Industry not set' }}</p>
              </div>
            </div>
            <div class="border-t border-gray-200 px-5 py-3">
              <RouterLink to="/coordinator/companies" class="text-sm font-medium text-indigo-700 hover:text-indigo-900">Review approvals</RouterLink>
            </div>
          </section>
        </div>

        <section class="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-5 py-4">
            <h2 class="text-base font-semibold text-gray-950">Recent Audit Activity</h2>
          </div>
          <div v-if="auditLogs.length === 0" class="px-5 py-8 text-sm text-gray-500">No audit activity yet.</div>
          <div v-else class="divide-y divide-gray-200">
            <div v-for="log in auditLogs" :key="log.id" class="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_auto]">
              <p class="text-gray-800">{{ log.action }} {{ log.entity_type }} #{{ log.entity_id }}</p>
              <p class="text-gray-500">{{ formatDate(log.createdAt || log.created_at) }}</p>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
