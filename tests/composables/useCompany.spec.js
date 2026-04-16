import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

global.fetch = vi.fn()

import { useCompany } from '../../src/composables/useCompany'
import { useCompanyStore } from '../../src/stores/companyStore'

describe('useCompany Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    global.fetch.mockClear()
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
})
