<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
  Search,
  SlidersHorizontal
} from 'lucide-vue-next'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'

const coordinatorStore = useCoordinatorStore()
const { auditLogs, auditPagination } = storeToRefs(coordinatorStore)
const { fetchAuditLogs, isLoading } = useCoordinator()

const pageSize = ref(25)
const expandedLogId = ref(null)
const loadError = ref('')
const showAdvancedFilters = ref(false)
const filters = reactive({
  search: '',
  action: '',
  entityType: '',
  severity: '',
  status: '',
  userRole: '',
  startDate: '',
  endDate: ''
})

let filterTimer

const activeFilterCount = computed(() => Object.values(filters).filter(Boolean).length)
const advancedFilterCount = computed(() => [
  filters.entityType,
  filters.severity,
  filters.userRole,
  filters.startDate,
  filters.endDate
].filter(Boolean).length)
const hasFilters = computed(() => activeFilterCount.value > 0)

const pageItems = computed(() => {
  const current = auditPagination.value.page
  const total = auditPagination.value.totalPages

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => ({ type: 'page', value: index + 1 }))
  }

  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter(page => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const items = []
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      items.push({ type: 'gap', value: `gap-${page}` })
    }
    items.push({ type: 'page', value: page })
  })
  return items
})

function toDateBoundary(value, endOfDay = false) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  )
  return date.toISOString()
}

async function load(page = 1) {
  loadError.value = ''
  expandedLogId.value = null

  try {
    await fetchAuditLogs({
      page,
      limit: pageSize.value,
      search: filters.search.trim(),
      action: filters.action,
      entity_type: filters.entityType,
      severity: filters.severity,
      status: filters.status,
      user_role: filters.userRole,
      start_date: toDateBoundary(filters.startDate),
      end_date: toDateBoundary(filters.endDate, true)
    })
  } catch (error) {
    loadError.value = error.message || 'Unable to load audit logs'
  }
}

function scheduleFilteredLoad() {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => load(1), 300)
}

function goToPage(page) {
  const nextPage = Math.min(Math.max(page, 1), auditPagination.value.totalPages)
  if (nextPage !== auditPagination.value.page && !isLoading.value) load(nextPage)
}

function resetFilters() {
  Object.assign(filters, {
    search: '',
    action: '',
    entityType: '',
    severity: '',
    status: '',
    userRole: '',
    startDate: '',
    endDate: ''
  })
  showAdvancedFilters.value = false
}

function toggleDetails(logId) {
  expandedLogId.value = expandedLogId.value === logId ? null : logId
}

function humanize(value) {
  if (!value) return 'Unknown'
  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function toValidDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function formatDate(value) {
  const date = toValidDate(value)
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

function formatTime(value) {
  const date = toValidDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function formatJson(value) {
  if (value === null || value === undefined) return ''
  return JSON.stringify(value, null, 2)
}

function actorName(log) {
  return log.actor?.name || (log.user_id ? `User #${log.user_id}` : 'System')
}

function actorDetail(log) {
  return log.actor?.email || humanize(log.user_role || log.actor?.role || 'system')
}

function severityClass(severity) {
  return {
    low: 'bg-sky-50 text-sky-700 ring-sky-200',
    medium: 'bg-amber-50 text-amber-800 ring-amber-200',
    high: 'bg-orange-50 text-orange-800 ring-orange-200',
    critical: 'bg-red-50 text-red-700 ring-red-200'
  }[severity] || 'bg-gray-50 text-gray-700 ring-gray-200'
}

function statusClass(status) {
  return {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    failed: 'bg-red-50 text-red-700 ring-red-200',
    pending: 'bg-amber-50 text-amber-800 ring-amber-200'
  }[status] || 'bg-gray-50 text-gray-700 ring-gray-200'
}

watch(
  [
    () => filters.search,
    () => filters.action,
    () => filters.entityType,
    () => filters.severity,
    () => filters.status,
    () => filters.userRole,
    () => filters.startDate,
    () => filters.endDate,
    pageSize
  ],
  scheduleFilteredLoad
)

onMounted(() => load())
onBeforeUnmount(() => clearTimeout(filterTimer))
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-[1500px]">
      <header class="border-b border-gray-200 pb-4">
        <h1 class="text-xl font-semibold text-gray-950">Activity history</h1>
        <p class="mt-1 text-sm text-gray-600">Security and operational events across OJT workflows.</p>
      </header>

      <section aria-label="Audit log filters" class="border-b border-gray-200 py-4">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_150px_150px_auto_auto] xl:items-end">
          <label class="sm:col-span-2 xl:col-span-1">
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">Search</span>
            <span class="relative block">
              <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                v-model="filters.search"
                type="search"
                placeholder="Actor, reason, entity, IP or ID"
                class="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </span>
          </label>

          <label>
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">Action</span>
            <select v-model="filters.action" class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="">All actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="view">View</option>
            </select>
          </label>

          <label>
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">Status</span>
            <select v-model="filters.status" class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </label>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium"
            :class="showAdvancedFilters || advancedFilterCount ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'"
            :aria-expanded="showAdvancedFilters"
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            <SlidersHorizontal class="h-4 w-4" />
            Filters
            <span v-if="advancedFilterCount" class="inline-flex h-5 min-w-5 items-center justify-center rounded bg-teal-700 px-1 text-xs text-white">{{ advancedFilterCount }}</span>
          </button>

          <button
            type="button"
            class="inline-flex h-10 w-full items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 xl:w-10"
            :disabled="!hasFilters"
            aria-label="Clear filters"
            title="Clear filters"
            @click="resetFilters"
          >
            <FilterX class="h-4 w-4" />
            <span class="ml-2 text-sm font-medium xl:hidden">Clear filters</span>
          </button>
        </div>

        <div v-if="showAdvancedFilters" class="mt-3 grid gap-3 border-t border-gray-200 pt-3 sm:grid-cols-2 xl:grid-cols-5">
          <label>
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">Entity</span>
            <select v-model="filters.entityType" class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="">All entities</option>
              <option value="User">User</option>
              <option value="Student">Student</option>
              <option value="StudentSkill">Student skill</option>
              <option value="Company">Company</option>
              <option value="OjtPosting">OJT posting</option>
              <option value="Application">Application</option>
              <option value="OjtProgram">OJT program</option>
              <option value="ProgramStudent">Program student</option>
            </select>
          </label>

          <label>
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">Severity</span>
            <select v-model="filters.severity" class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label>
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">Actor role</span>
            <select v-model="filters.userRole" class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
              <option value="">All roles</option>
              <option value="student">Student</option>
              <option value="company">Company</option>
              <option value="coordinator">Coordinator</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label>
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">From</span>
            <input v-model="filters.startDate" type="date" class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          </label>

          <label>
            <span class="mb-1.5 block text-xs font-semibold text-gray-700">To</span>
            <input v-model="filters.endDate" type="date" class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          </label>
        </div>
      </section>

      <div v-if="loadError" role="alert" class="mt-4 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
        {{ loadError }}
      </div>

      <section class="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" :aria-busy="isLoading">
        <div class="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
          <div>
            <p class="text-sm font-semibold text-gray-950">
              {{ auditPagination.total.toLocaleString() }} {{ auditPagination.total === 1 ? 'event' : 'events' }}
            </p>
            <p class="mt-0.5 text-xs text-gray-500">
              <template v-if="auditPagination.total">Showing {{ auditPagination.from }}-{{ auditPagination.to }}</template>
              <template v-else>No matching activity</template>
              <template v-if="activeFilterCount"> with {{ activeFilterCount }} active {{ activeFilterCount === 1 ? 'filter' : 'filters' }}</template>
            </p>
          </div>

          <div class="flex items-center gap-3">
            <span v-if="isLoading" class="text-xs font-medium text-teal-700">Refreshing...</span>
            <label class="flex items-center gap-2 text-xs font-medium text-gray-600">
              Rows
              <select v-model="pageSize" class="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>
          </div>
        </div>

        <div v-if="isLoading && auditLogs.length === 0" class="space-y-2 p-4" aria-label="Loading audit logs">
          <div v-for="index in 6" :key="index" class="h-14 animate-pulse rounded bg-gray-100" />
        </div>

        <div v-else-if="auditLogs.length === 0" class="px-5 py-14 text-center">
          <Search class="mx-auto h-8 w-8 text-gray-300" />
          <p class="mt-3 text-sm font-medium text-gray-800">No audit events found</p>
          <button v-if="hasFilters" type="button" class="mt-2 text-sm font-medium text-teal-700 hover:text-teal-800" @click="resetFilters">
            Clear filters
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table data-testid="audit-table" class="w-full table-fixed border-collapse xl:table-auto">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="w-11 px-2 py-3"><span class="sr-only">Details</span></th>
                <th scope="col" class="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500">Activity</th>
                <th scope="col" class="hidden w-48 px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500 xl:table-cell">Actor</th>
                <th scope="col" class="hidden w-28 px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500 sm:table-cell sm:w-32">Outcome</th>
                <th scope="col" class="hidden w-36 px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500 2xl:table-cell">Source</th>
                <th scope="col" class="hidden w-40 px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500 xl:table-cell">When</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <template v-for="log in auditLogs" :key="log.id">
                <tr class="align-middle hover:bg-gray-50">
                  <td class="px-2 py-3 text-center">
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      :aria-expanded="expandedLogId === log.id"
                      :aria-label="`${expandedLogId === log.id ? 'Hide' : 'Show'} details for audit event ${log.id}`"
                      :title="expandedLogId === log.id ? 'Hide details' : 'Show details'"
                      @click="toggleDetails(log.id)"
                    >
                      <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': expandedLogId === log.id }" />
                    </button>
                  </td>

                  <td class="min-w-0 px-3 py-3">
                    <div class="flex min-w-0 items-center gap-2">
                      <span class="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">{{ humanize(log.action) }}</span>
                      <span class="min-w-0 truncate text-xs text-gray-500" :title="`${humanize(log.entity_type)} #${log.entity_id}`">
                        {{ humanize(log.entity_type) }} #{{ log.entity_id }}
                      </span>
                      <span class="ml-auto flex shrink-0 items-center gap-1 sm:hidden">
                        <span class="rounded px-1.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset" :class="statusClass(log.status)">{{ log.status || 'unknown' }}</span>
                        <span class="rounded px-1.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset" :class="severityClass(log.severity)">{{ log.severity || 'unknown' }}</span>
                      </span>
                    </div>
                    <p class="mt-1 max-w-[60ch] truncate text-sm font-medium text-gray-950" :title="log.reason || `${humanize(log.entity_type)} changed`">
                      {{ log.reason || `${humanize(log.entity_type)} changed` }}
                    </p>
                    <div class="mt-1 flex min-w-0 items-center gap-2 text-xs text-gray-500 xl:hidden">
                      <span class="min-w-0 truncate" :title="actorDetail(log)">{{ actorName(log) }}</span>
                      <span class="shrink-0 text-gray-300">/</span>
                      <time class="shrink-0 whitespace-nowrap" :datetime="log.createdAt || log.created_at">
                        {{ formatDate(log.createdAt || log.created_at) }} {{ formatTime(log.createdAt || log.created_at) }}
                      </time>
                    </div>
                  </td>

                  <td class="hidden px-3 py-3 xl:table-cell">
                    <p class="truncate text-sm font-medium text-gray-900" :title="actorName(log)">{{ actorName(log) }}</p>
                    <p class="mt-0.5 truncate text-xs text-gray-500" :title="actorDetail(log)">{{ actorDetail(log) }}</p>
                  </td>

                  <td class="hidden px-3 py-3 sm:table-cell">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="rounded px-1.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset" :class="statusClass(log.status)">{{ log.status || 'unknown' }}</span>
                      <span class="rounded px-1.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset" :class="severityClass(log.severity)">{{ log.severity || 'unknown' }}</span>
                    </div>
                  </td>

                  <td class="hidden px-3 py-3 2xl:table-cell">
                    <p class="truncate text-sm text-gray-700" :title="log.ip_address || 'Not recorded'">{{ log.ip_address || 'Not recorded' }}</p>
                  </td>

                  <td class="hidden px-3 py-3 xl:table-cell">
                    <time :datetime="log.createdAt || log.created_at">
                      <span class="block whitespace-nowrap text-sm text-gray-700">{{ formatDate(log.createdAt || log.created_at) }}</span>
                      <span class="mt-0.5 block whitespace-nowrap text-xs text-gray-500">{{ formatTime(log.createdAt || log.created_at) }}</span>
                    </time>
                  </td>
                </tr>

                <tr v-if="expandedLogId === log.id" class="bg-gray-50">
                  <td colspan="6" class="px-4 py-5 sm:px-6">
                    <div class="grid gap-5 xl:grid-cols-[minmax(190px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <dl class="grid grid-cols-[90px_minmax(0,1fr)] content-start gap-x-3 gap-y-2 text-sm">
                        <dt class="text-gray-500">Event ID</dt>
                        <dd class="font-medium text-gray-900">#{{ log.id }}</dd>
                        <dt class="text-gray-500">Actor ID</dt>
                        <dd class="font-medium text-gray-900">{{ log.user_id || 'System' }}</dd>
                        <dt class="text-gray-500">Actor</dt>
                        <dd class="break-words font-medium text-gray-900">{{ actorName(log) }}</dd>
                        <dt class="text-gray-500">Contact</dt>
                        <dd class="break-all font-medium text-gray-900">{{ actorDetail(log) }}</dd>
                        <dt class="text-gray-500">Actor role</dt>
                        <dd class="font-medium text-gray-900">{{ humanize(log.user_role || log.actor?.role || 'system') }}</dd>
                        <dt class="text-gray-500">IP address</dt>
                        <dd class="break-all font-medium text-gray-900">{{ log.ip_address || 'Not recorded' }}</dd>
                        <dt class="text-gray-500">User agent</dt>
                        <dd class="break-words font-medium text-gray-900">{{ log.user_agent || 'Not recorded' }}</dd>
                        <template v-if="log.error_message">
                          <dt class="text-red-600">Error</dt>
                          <dd class="break-words font-medium text-red-700">{{ log.error_message }}</dd>
                        </template>
                      </dl>

                      <div class="min-w-0">
                        <h3 class="text-xs font-semibold uppercase text-gray-500">Previous values</h3>
                        <pre v-if="log.old_values" class="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-700 [overflow-wrap:anywhere]">{{ formatJson(log.old_values) }}</pre>
                        <p v-else class="mt-2 text-sm text-gray-500">No previous values recorded.</p>
                      </div>

                      <div class="min-w-0">
                        <h3 class="text-xs font-semibold uppercase text-gray-500">New values</h3>
                        <pre v-if="log.new_values" class="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-700 [overflow-wrap:anywhere]">{{ formatJson(log.new_values) }}</pre>
                        <p v-else class="mt-2 text-sm text-gray-500">No new values recorded.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <footer v-if="auditPagination.total > 0" class="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:px-5">
          <p class="text-xs text-gray-500">Page {{ auditPagination.page }} of {{ auditPagination.totalPages }}</p>
          <nav aria-label="Audit log pagination" class="flex items-center gap-1">
            <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!auditPagination.hasPreviousPage || isLoading" aria-label="First page" title="First page" @click="goToPage(1)">
              <ChevronsLeft class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!auditPagination.hasPreviousPage || isLoading" aria-label="Previous page" title="Previous page" @click="goToPage(auditPagination.page - 1)">
              <ChevronLeft class="h-4 w-4" />
            </button>

            <div class="hidden items-center gap-1 sm:flex">
              <template v-for="item in pageItems" :key="item.value">
                <span v-if="item.type === 'gap'" class="inline-flex h-9 w-8 items-center justify-center text-sm text-gray-400">...</span>
                <button
                  v-else
                  type="button"
                  class="inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium"
                  :class="item.value === auditPagination.page ? 'border-teal-700 bg-teal-700 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
                  :aria-current="item.value === auditPagination.page ? 'page' : undefined"
                  :disabled="isLoading"
                  @click="goToPage(item.value)"
                >
                  {{ item.value }}
                </button>
              </template>
            </div>

            <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!auditPagination.hasNextPage || isLoading" aria-label="Next page" title="Next page" @click="goToPage(auditPagination.page + 1)">
              <ChevronRight class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!auditPagination.hasNextPage || isLoading" aria-label="Last page" title="Last page" @click="goToPage(auditPagination.totalPages)">
              <ChevronsRight class="h-4 w-4" />
            </button>
          </nav>
        </footer>
      </section>
    </div>
  </div>
</template>
