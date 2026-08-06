import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCoordinatorStore } from '../../src/stores/coordinatorStore'

describe('Coordinator Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes coordinator portal state', () => {
    const store = useCoordinatorStore()

    expect(store.dashboard).toBeNull()
    expect(store.programs).toEqual([])
    expect(store.selectedProgram).toBeNull()
    expect(store.programStudents).toEqual([])
    expect(store.programCompanies).toEqual([])
    expect(store.programPostings).toEqual([])
    expect(store.companies).toEqual([])
    expect(store.students).toEqual([])
    expect(store.auditLogs).toEqual([])
    expect(store.auditPagination).toMatchObject({ total: 0, page: 1, limit: 25, totalPages: 1 })
    expect(store.placementReport).toBeNull()
  })

  it('sets coordinator portal collections and current report', () => {
    const store = useCoordinatorStore()
    const program = { id: 1, name: 'Summer OJT 2026' }
    const report = { summary: { applications: 2 }, rows: [] }

    store.setDashboard({ activePrograms: 1 })
    store.setPrograms([program])
    store.setSelectedProgram(program)
    store.setProgramMetrics({ enrolledStudents: 4 })
    store.setProgramStudents([{ id: 10 }])
    store.setProgramCompanies([{ id: 20 }])
    store.setProgramPostings([{ id: 30 }])
    store.setCompanies([{ id: 40 }])
    store.setStudents([{ id: 50 }])
    store.setAuditLogs([{ id: 60 }], { total: 40, page: 2, limit: 25, totalPages: 2 })
    store.setPlacementReport(report)

    expect(store.dashboard.activePrograms).toBe(1)
    expect(store.programs).toEqual([program])
    expect(store.selectedProgram).toEqual(program)
    expect(store.programMetrics.enrolledStudents).toBe(4)
    expect(store.programStudents).toHaveLength(1)
    expect(store.programCompanies).toHaveLength(1)
    expect(store.programPostings).toHaveLength(1)
    expect(store.companies).toHaveLength(1)
    expect(store.students).toHaveLength(1)
    expect(store.auditLogs).toHaveLength(1)
    expect(store.auditPagination).toMatchObject({ total: 40, page: 2, limit: 25, totalPages: 2 })
    expect(store.placementReport).toEqual(report)
  })
})
