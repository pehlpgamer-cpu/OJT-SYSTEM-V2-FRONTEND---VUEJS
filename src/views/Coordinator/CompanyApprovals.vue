<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { CheckCircle, XCircle } from 'lucide-vue-next'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'
import { useUiStore } from '../../stores/uiStore'

const coordinatorStore = useCoordinatorStore()
const uiStore = useUiStore()
const { companies } = storeToRefs(coordinatorStore)
const { fetchCompanies, updateCompanyAccreditation, isLoading, actionLoading } = useCoordinator()
const statusFilter = ref('pending')

const load = () => fetchCompanies(statusFilter.value)
onMounted(load)

const companyName = row => row.company?.company_name || row.company_name || row.user?.name || 'Company'
const contactEmail = row => row.user?.email || row.User?.email || 'No email'

const approveCompany = async row => {
  const confirmed = await uiStore.confirmAction({
    title: 'Approve company',
    message: `${companyName(row)} will be able to publish OJT postings.`,
    confirmLabel: 'Approve'
  })
  if (!confirmed) return
  await updateCompanyAccreditation(row.company?.id || row.id, { status: 'approved', note: 'Approved by coordinator' })
  uiStore.showSuccess('Company approved.')
  await load()
}

const rejectCompany = async row => {
  const reason = window.prompt('Rejection reason')
  if (!reason) return
  await updateCompanyAccreditation(row.company?.id || row.id, { status: 'rejected', reason })
  uiStore.showSuccess('Company rejected.')
  await load()
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-950">Company Approvals</h1>
          <p class="mt-2 text-sm text-gray-600">Review accreditation and posting eligibility.</p>
        </div>
        <select v-model="statusFilter" class="rounded-md border border-gray-300 px-3 py-2 text-sm" @change="load">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading companies...</div>
      <div v-else-if="companies.length === 0" class="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
        No companies found.
      </div>
      <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Company</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Contact</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th class="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Decision</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="row in companies" :key="row.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <p class="font-medium text-gray-950">{{ companyName(row) }}</p>
                <p class="mt-1 max-w-lg truncate text-sm text-gray-500">{{ row.company?.description || row.description || 'No description' }}</p>
                <p class="mt-1 text-xs text-gray-500">{{ row.company?.industry_type || row.industry_type || 'Industry not set' }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ contactEmail(row) }}</td>
              <td class="px-6 py-4">
                <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">{{ row.status }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex justify-end gap-2">
                  <button :disabled="actionLoading === `company-${row.company?.id || row.id}`" class="inline-flex items-center gap-1 rounded-md border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50" @click="approveCompany(row)">
                    <CheckCircle class="h-4 w-4" />
                    Approve
                  </button>
                  <button :disabled="actionLoading === `company-${row.company?.id || row.id}`" class="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50" @click="rejectCompany(row)">
                    <XCircle class="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
