<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCoordinator } from '../../composables/useCoordinator'
import { useCoordinatorStore } from '../../stores/coordinatorStore'

const coordinatorStore = useCoordinatorStore()
const { students } = storeToRefs(coordinatorStore)
const { fetchStudents, isLoading } = useCoordinator()
const search = ref('')

onMounted(fetchStudents)

const filteredStudents = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return students.value
  return students.value.filter(student => {
    const user = student.User || student.user || {}
    return [user.name, user.email, student.academic_program, student.first_name, student.last_name]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query))
  })
})

const studentName = student => student.User?.name || [student.first_name, student.last_name].filter(Boolean).join(' ') || `Student #${student.id}`
const enrollmentText = student => {
  const enrollments = student.programEnrollments || student.program_enrollments || []
  if (enrollments.length === 0) return 'No program'
  return enrollments.map(row => `${row.status}/${row.eligibility_status}`).join(', ')
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div class="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-950">Students</h1>
          <p class="mt-2 text-sm text-gray-600">Review student eligibility, GPA, profile completeness, and program status.</p>
        </div>
        <input v-model="search" placeholder="Search students" class="rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading students...</div>
      <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Student</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Program</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">GPA</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Completion</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Enrollment</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <p class="font-medium text-gray-950">{{ studentName(student) }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ student.User?.email }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ student.academic_program || 'Not set' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ student.gpa || 'N/A' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ student.profile_completeness_percentage || 0 }}%</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ enrollmentText(student) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
