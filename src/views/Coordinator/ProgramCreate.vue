<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCoordinator } from '../../composables/useCoordinator'
import { useUiStore } from '../../stores/uiStore'

const router = useRouter()
const uiStore = useUiStore()
const { createProgram, isLoading } = useCoordinator()

const form = ref({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  minimum_gpa: '',
  academic_programs: '',
  enrollment_enabled: true,
  status: 'active'
})

const submit = async () => {
  const program = await createProgram({
    ...form.value,
    minimum_gpa: form.value.minimum_gpa === '' ? null : Number(form.value.minimum_gpa),
    academic_programs: form.value.academic_programs.split(',').map(item => item.trim()).filter(Boolean)
  })
  uiStore.showSuccess('Program created.')
  await router.push(`/coordinator/programs/${program.id}`)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <form class="mx-auto max-w-3xl space-y-6" @submit.prevent="submit">
      <div class="border-b border-gray-200 pb-5">
        <h1 class="text-3xl font-bold text-gray-950">Create OJT Program</h1>
        <p class="mt-2 text-sm text-gray-600">Define dates, GPA requirements, and academic program eligibility.</p>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label class="sm:col-span-2">
            <span class="text-sm font-medium text-gray-700">Program name</span>
            <input v-model="form.name" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>

          <label class="sm:col-span-2">
            <span class="text-sm font-medium text-gray-700">Description</span>
            <textarea v-model="form.description" rows="3" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </label>

          <label>
            <span class="text-sm font-medium text-gray-700">Start date</span>
            <input v-model="form.start_date" required type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>

          <label>
            <span class="text-sm font-medium text-gray-700">End date</span>
            <input v-model="form.end_date" required type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>

          <label>
            <span class="text-sm font-medium text-gray-700">Minimum GPA</span>
            <input v-model="form.minimum_gpa" type="number" min="0" max="4" step="0.01" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>

          <label>
            <span class="text-sm font-medium text-gray-700">Status</span>
            <select v-model="form.status" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label class="sm:col-span-2">
            <span class="text-sm font-medium text-gray-700">Academic programs</span>
            <input v-model="form.academic_programs" placeholder="Computer Science, Information Technology" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>

          <label class="flex items-center gap-2 sm:col-span-2">
            <input v-model="form.enrollment_enabled" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <span class="text-sm font-medium text-gray-700">Enrollment enabled</span>
          </label>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <RouterLink to="/coordinator/programs" class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </RouterLink>
          <button :disabled="isLoading" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Create Program
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
