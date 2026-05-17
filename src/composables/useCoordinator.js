import { ref } from 'vue'
import { apiClient } from '../utils/apiClient'
import { useAuthStore } from '../stores/authStore'
import { useCoordinatorStore } from '../stores/coordinatorStore'

const unwrapData = payload => payload?.data || payload || null
const unwrapList = payload => {
  const data = unwrapData(payload)
  return Array.isArray(data) ? data : []
}

export function normalizeProgram(program) {
  if (!program) return null
  return {
    ...program,
    academic_programs: Array.isArray(program.academic_programs) ? program.academic_programs : []
  }
}

export function normalizeCompanyRow(row) {
  const company = row?.company || row?.Company || row
  return {
    ...row,
    company,
    user: company?.User || company?.user || row?.User || row?.user || null,
    status: row?.status || company?.accreditation_status || 'pending'
  }
}

export function useCoordinator() {
  const store = useCoordinatorStore()
  const authStore = useAuthStore()
  const isLoading = ref(false)
  const actionLoading = ref(null)

  const run = async (task) => {
    isLoading.value = true
    try {
      return await task()
    } finally {
      isLoading.value = false
    }
  }

  const fetchDashboard = () => run(async () => {
    const payload = await apiClient('/coordinator/dashboard', { method: 'GET', retries: 0 })
    const data = unwrapData(payload)
    store.setDashboard(data)
    return data
  })

  const fetchPrograms = () => run(async () => {
    const payload = await apiClient('/coordinator/programs', { method: 'GET', retries: 0 })
    const programs = unwrapList(payload).map(normalizeProgram)
    store.setPrograms(programs)
    return programs
  })

  const createProgram = programData => run(async () => {
    const payload = await apiClient('/coordinator/programs', {
      method: 'POST',
      body: JSON.stringify(programData)
    })
    const program = normalizeProgram(unwrapData(payload))
    store.setPrograms([program, ...store.programs])
    return program
  })

  const fetchProgram = programId => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}`, { method: 'GET', retries: 0 })
    const program = normalizeProgram(unwrapData(payload))
    store.setSelectedProgram(program)
    return program
  })

  const updateProgram = (programId, programData) => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}`, {
      method: 'PUT',
      body: JSON.stringify(programData)
    })
    const program = normalizeProgram(unwrapData(payload))
    store.setSelectedProgram(program)
    return program
  })

  const fetchProgramStudents = programId => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}/students`, { method: 'GET', retries: 0 })
    const students = unwrapList(payload)
    store.setProgramStudents(students)
    return students
  })

  const addProgramStudents = (programId, studentIds) => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}/students`, {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds })
    })
    await fetchProgramStudents(programId)
    return unwrapList(payload)
  })

  const updateProgramStudentStatus = (programId, studentId, statusData) => {
    actionLoading.value = `student-${studentId}`
    return run(async () => {
      const payload = await apiClient(`/coordinator/programs/${programId}/students/${studentId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
      })
      await fetchProgramStudents(programId)
      return unwrapData(payload)
    }).finally(() => {
      actionLoading.value = null
    })
  }

  const fetchProgramCompanies = programId => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}/companies`, { method: 'GET', retries: 0 })
    const companies = unwrapList(payload).map(normalizeCompanyRow)
    store.setProgramCompanies(companies)
    return companies
  })

  const addProgramCompanies = (programId, companyIds) => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}/companies`, {
      method: 'POST',
      body: JSON.stringify({ company_ids: companyIds })
    })
    await fetchProgramCompanies(programId)
    return unwrapList(payload)
  })

  const fetchProgramPostings = programId => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}/postings`, { method: 'GET', retries: 0 })
    const postings = unwrapList(payload)
    store.setProgramPostings(postings)
    return postings
  })

  const addProgramPostings = (programId, postingIds) => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}/postings`, {
      method: 'POST',
      body: JSON.stringify({ posting_ids: postingIds })
    })
    await fetchProgramPostings(programId)
    return unwrapList(payload)
  })

  const fetchProgramMetrics = programId => run(async () => {
    const payload = await apiClient(`/coordinator/programs/${programId}/metrics`, { method: 'GET', retries: 0 })
    const metrics = unwrapData(payload)
    store.setProgramMetrics(metrics)
    return metrics
  })

  const fetchCompanies = (status = '') => run(async () => {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : ''
    const payload = await apiClient(`/coordinator/companies${suffix}`, { method: 'GET', retries: 0 })
    const companies = unwrapList(payload).map(normalizeCompanyRow)
    store.setCompanies(companies)
    return companies
  })

  const updateCompanyAccreditation = (companyId, statusData) => {
    actionLoading.value = `company-${companyId}`
    return run(async () => {
      const payload = await apiClient(`/coordinator/companies/${companyId}/accreditation`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
      })
      await fetchCompanies()
      return unwrapData(payload)
    }).finally(() => {
      actionLoading.value = null
    })
  }

  const fetchStudents = () => run(async () => {
    const payload = await apiClient('/coordinator/students', { method: 'GET', retries: 0 })
    const students = unwrapList(payload)
    store.setStudents(students)
    return students
  })

  const fetchAuditLogs = (limit = 50) => run(async () => {
    const payload = await apiClient(`/coordinator/audit-logs?limit=${limit}`, { method: 'GET', retries: 0 })
    const logs = unwrapList(payload)
    store.setAuditLogs(logs)
    return logs
  })

  const fetchPlacementReport = params => run(async () => {
    const search = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, value)
    })
    const payload = await apiClient(`/coordinator/reports/placement?${search.toString()}`, { method: 'GET', retries: 0 })
    store.setPlacementReport(payload)
    return payload
  })

  const downloadPlacementCsv = async params => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const search = new URLSearchParams({ ...(params || {}), format: 'csv' })
    const response = await fetch(`${baseURL}/coordinator/reports/placement?${search.toString()}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to export placement report')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'placement-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    isLoading,
    actionLoading,
    fetchDashboard,
    fetchPrograms,
    createProgram,
    fetchProgram,
    updateProgram,
    fetchProgramStudents,
    addProgramStudents,
    updateProgramStudentStatus,
    fetchProgramCompanies,
    addProgramCompanies,
    fetchProgramPostings,
    addProgramPostings,
    fetchProgramMetrics,
    fetchCompanies,
    updateCompanyAccreditation,
    fetchStudents,
    fetchAuditLogs,
    fetchPlacementReport,
    downloadPlacementCsv
  }
}
