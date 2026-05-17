<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { apiClient } from '../../utils/apiClient'

const authStore = useAuthStore()
const auditLogs = ref([])
const isLoading = ref(false)
const loadError = ref('')

const accountName = computed(() => authStore.user?.name || 'Administrator')

const summaryItems = computed(() => [
  {
    label: 'Session',
    value: authStore.isAuthenticated ? 'Active' : 'Signed out'
  },
  {
    label: 'Role',
    value: authStore.role || 'Unknown'
  },
  {
    label: 'Audit Logs',
    value: auditLogs.value.length
  }
])

function formatDate(value) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

onMounted(async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const payload = await apiClient('/audit-logs?limit=8', {
      method: 'GET',
      retries: 0
    })
    auditLogs.value = payload?.data || []
  } catch (error) {
    loadError.value = error.message || 'Unable to load audit logs'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8 border-b border-gray-200 pb-6">
        <p class="text-sm font-medium text-indigo-700">Administrator</p>
        <h2 class="mt-2 text-2xl font-bold text-gray-950">Welcome, {{ accountName }}</h2>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Monitor system access and verify that admin authentication is working in production.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="item in summaryItems"
          :key="item.label"
          class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p class="text-sm text-gray-500">{{ item.label }}</p>
          <p class="mt-2 text-2xl font-semibold capitalize text-gray-950">{{ item.value }}</p>
        </div>
      </div>

      <section class="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-5 py-4">
          <h3 class="text-base font-semibold text-gray-950">Recent Audit Logs</h3>
          <p class="mt-1 text-sm text-gray-500">Latest admin-visible activity from the backend.</p>
        </div>

        <div v-if="isLoading" class="px-5 py-8 text-sm text-gray-500">
          Loading audit logs...
        </div>

        <div v-else-if="loadError" class="px-5 py-8 text-sm text-red-600">
          {{ loadError }}
        </div>

        <div v-else-if="auditLogs.length === 0" class="px-5 py-8 text-sm text-gray-500">
          No audit logs yet.
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="log in auditLogs"
            :key="log.id"
            class="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_auto]"
          >
            <div>
              <p class="font-medium text-gray-950">
                {{ log.action }} {{ log.entity_type }}
              </p>
              <p class="mt-1 text-gray-500">
                User #{{ log.user_id || 'system' }} · {{ log.status || 'success' }} · {{ log.severity || 'medium' }}
              </p>
            </div>
            <p class="text-gray-500 sm:text-right">{{ formatDate(log.createdAt || log.created_at) }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
