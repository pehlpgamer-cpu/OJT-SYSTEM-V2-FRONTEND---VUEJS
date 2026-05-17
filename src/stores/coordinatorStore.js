import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCoordinatorStore = defineStore('coordinator', () => {
  const dashboard = ref(null)
  const programs = ref([])
  const selectedProgram = ref(null)
  const programMetrics = ref(null)
  const programStudents = ref([])
  const programCompanies = ref([])
  const programPostings = ref([])
  const companies = ref([])
  const students = ref([])
  const auditLogs = ref([])
  const placementReport = ref(null)

  const setDashboard = value => { dashboard.value = value }
  const setPrograms = value => { programs.value = value || [] }
  const setSelectedProgram = value => { selectedProgram.value = value }
  const setProgramMetrics = value => { programMetrics.value = value }
  const setProgramStudents = value => { programStudents.value = value || [] }
  const setProgramCompanies = value => { programCompanies.value = value || [] }
  const setProgramPostings = value => { programPostings.value = value || [] }
  const setCompanies = value => { companies.value = value || [] }
  const setStudents = value => { students.value = value || [] }
  const setAuditLogs = value => { auditLogs.value = value || [] }
  const setPlacementReport = value => { placementReport.value = value }

  return {
    dashboard,
    programs,
    selectedProgram,
    programMetrics,
    programStudents,
    programCompanies,
    programPostings,
    companies,
    students,
    auditLogs,
    placementReport,
    setDashboard,
    setPrograms,
    setSelectedProgram,
    setProgramMetrics,
    setProgramStudents,
    setProgramCompanies,
    setProgramPostings,
    setCompanies,
    setStudents,
    setAuditLogs,
    setPlacementReport
  }
})
