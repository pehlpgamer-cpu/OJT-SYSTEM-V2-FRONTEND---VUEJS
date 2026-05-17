<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'

const coordinatorStore = useCoordinatorStore()
const { auditLogs } = storeToRefs(coordinatorStore)
const { fetchAuditLogs, isLoading } = useCoordinator()
const limit = ref(50)

const load = () => fetchAuditLogs(limit.value)
onMounted(load)
const formatDate = value => value ? new Date(value).toLocaleString() : 'N/A'
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-950">Audit Logs</h1>
          <p class="mt-2 text-sm text-gray-600">Review registrations, approvals, applications, and status changes.</p>
        </div>
        <select v-model="limit" class="rounded-md border border-gray-300 px-3 py-2 text-sm" @change="load">
          <option :value="25">Last 25</option>
          <option :value="50">Last 50</option>
          <option :value="100">Last 100</option>
        </select>
      </div>

      <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading audit logs...</div>
      <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Entity</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Severity</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">When</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-950">{{ log.action }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ log.entity_type }} #{{ log.entity_id }}</td>
              <td class="px-6 py-4 text-sm capitalize text-gray-600">{{ log.severity }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(log.createdAt || log.created_at) }}</td>
            </tr>
            <tr v-if="auditLogs.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-sm text-gray-500">No audit logs.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
