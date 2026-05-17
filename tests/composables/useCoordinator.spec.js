import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

vi.mock('../../src/utils/apiClient', () => ({
  apiClient: vi.fn()
}))

import { apiClient } from '../../src/utils/apiClient'
import {
  normalizeCompanyRow,
  normalizeProgram,
  useCoordinator
} from '../../src/composables/useCoordinator'
import { useCoordinatorStore } from '../../src/stores/coordinatorStore'

describe('useCoordinator Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('exports coordinator portal actions', () => {
    const composable = useCoordinator()

    expect(composable.isLoading.value).toBe(false)
    expect(typeof composable.fetchPrograms).toBe('function')
    expect(typeof composable.createProgram).toBe('function')
    expect(typeof composable.updateProgramStudentStatus).toBe('function')
    expect(typeof composable.updateCompanyAccreditation).toBe('function')
    expect(typeof composable.fetchPlacementReport).toBe('function')
  })

  it('normalizes program academic programs to an array', () => {
    expect(normalizeProgram({ id: 1, academic_programs: ['BSIT'] }).academic_programs).toEqual(['BSIT'])
    expect(normalizeProgram({ id: 2, academic_programs: null }).academic_programs).toEqual([])
  })

  it('normalizes program company rows from nested backend payloads', () => {
    const row = normalizeCompanyRow({
      id: 7,
      status: 'approved',
      Company: {
        id: 3,
        company_name: 'Tech Corp',
        User: { email: 'company@example.com' }
      }
    })

    expect(row.company.company_name).toBe('Tech Corp')
    expect(row.user.email).toBe('company@example.com')
    expect(row.status).toBe('approved')
  })

  it('fetches programs and stores normalized response', async () => {
    apiClient.mockResolvedValueOnce({
      data: [{ id: 1, name: 'Summer OJT 2026', academic_programs: null }]
    })

    const { fetchPrograms } = useCoordinator()
    const store = useCoordinatorStore()
    const programs = await fetchPrograms()

    expect(apiClient).toHaveBeenCalledWith('/coordinator/programs', { method: 'GET', retries: 0 })
    expect(programs[0].academic_programs).toEqual([])
    expect(store.programs).toEqual(programs)
  })

  it('sends company accreditation decisions then refreshes company list', async () => {
    apiClient
      .mockResolvedValueOnce({ data: { id: 4, accreditation_status: 'approved' } })
      .mockResolvedValueOnce({ data: [{ id: 4, company_name: 'Approved Co', accreditation_status: 'approved' }] })

    const { updateCompanyAccreditation } = useCoordinator()
    const result = await updateCompanyAccreditation(4, { status: 'approved', note: 'Ready' })

    expect(apiClient).toHaveBeenNthCalledWith(1, '/coordinator/companies/4/accreditation', {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved', note: 'Ready' })
    })
    expect(apiClient).toHaveBeenNthCalledWith(2, '/coordinator/companies', { method: 'GET', retries: 0 })
    expect(result.accreditation_status).toBe('approved')
  })
})
