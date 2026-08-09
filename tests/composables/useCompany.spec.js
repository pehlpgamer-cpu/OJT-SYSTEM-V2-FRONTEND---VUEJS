import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

global.fetch = vi.fn()

import { useCompany } from '../../src/composables/useCompany'
import {
  normalizeCompanyProfileResponse,
  normalizePostingsResponse
} from '../../src/composables/useCompany'
import { useCompanyStore } from '../../src/stores/companyStore'

describe('useCompany Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    global.fetch.mockClear()

    const storage = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => (key in storage ? storage[key] : null)),
        setItem: vi.fn((key, value) => { storage[key] = String(value) }),
        removeItem: vi.fn((key) => { delete storage[key] }),
        clear: vi.fn(() => {
          Object.keys(storage).forEach((key) => delete storage[key])
        })
      },
      configurable: true
    })
    Object.defineProperty(global, 'localStorage', {
      value: window.localStorage,
      configurable: true
    })
  })

  it('initializes with isLoading false', () => {
    const { isLoading } = useCompany()
    expect(isLoading.value).toBe(false)
  })

  it('initializes with actionLoading null', () => {
    const { actionLoading } = useCompany()
    expect(actionLoading.value).toBeNull()
  })

  it('exports required functions', () => {
    const composable = useCompany()
    expect(typeof composable.fetchProfile).toBe('function')
    expect(typeof composable.updateProfile).toBe('function')
    expect(typeof composable.fetchPostings).toBe('function')
    expect(typeof composable.createPosting).toBe('function')
    expect(typeof composable.fetchApplications).toBe('function')
    expect(typeof composable.updateApplicationStatus).toBe('function')
  })

  it('has access to company store', () => {
    const { fetchProfile } = useCompany()
    const store = useCompanyStore()
    
    expect(typeof store.setProfile).toBe('function')
    expect(typeof store.setPostings).toBe('function')
  })

  it('provides actionLoading for tracking individual app updates', () => {
    const { actionLoading } = useCompany()
    
    // Should start as null
    expect(actionLoading.value).toBeNull()
    
    // Can be set to track which app is loading
    actionLoading.value = 123
    expect(actionLoading.value).toBe(123)
    
    // Can be reset
    actionLoading.value = null
    expect(actionLoading.value).toBeNull()
  })

  it('normalizes wrapped company profile responses to the profile object', () => {
    const profile = { id: 3, company_name: 'Tech Corp' }

    expect(normalizeCompanyProfileResponse({ profile })).toEqual(profile)
    expect(normalizeCompanyProfileResponse({ data: { profile } })).toEqual(profile)
    expect(normalizeCompanyProfileResponse({ data: profile })).toEqual(profile)
  })

  it('normalizes posting status aliases for UI use', () => {
    const postings = normalizePostingsResponse({
      data: [{ id: 1, title: 'Intern', posting_status: 'draft' }]
    })

    expect(postings[0].status).toBe('draft')
    expect(postings[0].posting_status).toBe('draft')
  })

  it('updates an existing posting through the company API', async () => {
    const composable = useCompany()
    const store = useCompanyStore()

    store.setPostings([{ id: 1, title: 'Old title', posting_status: 'draft' }])

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        posting: { id: 1, title: 'Updated title', posting_status: 'draft' }
      })
    })

    await composable.updatePosting(1, { title: 'Updated title' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/company/postings/1'),
      expect.objectContaining({ method: 'PUT' })
    )
    expect(store.postings[0].title).toBe('Updated title')
  })
})
