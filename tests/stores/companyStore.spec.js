import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompanyStore } from '../../src/stores/companyStore'

describe('Company Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default values', () => {
    const store = useCompanyStore()
    expect(store.profile).toBeNull()
    expect(store.postings).toEqual([])
    expect(store.applications).toEqual({})
  })

  it('sets company profile correctly', () => {
    const store = useCompanyStore()
    
    const testProfile = {
      id: 1,
      company_name: 'Tech Corp',
      industry: 'Software Development',
      about: 'A leading tech company'
    }

    store.setProfile(testProfile)

    expect(store.profile).toEqual(testProfile)
    expect(store.profile.company_name).toBe('Tech Corp')
    expect(store.profile.id).toBe(1)
  })

  it('clears profile by setting null', () => {
    const store = useCompanyStore()
    
    store.setProfile({ id: 1, company_name: 'Tech Corp' })
    expect(store.profile).not.toBeNull()
    
    store.setProfile(null)
    expect(store.profile).toBeNull()
  })

  it('sets postings array', () => {
    const store = useCompanyStore()
    
    const testPostings = [
      { id: 101, title: 'Frontend Dev', status: 'active' },
      { id: 102, title: 'Backend Dev', status: 'active' }
    ]

    store.setPostings(testPostings)

    expect(store.postings).toEqual(testPostings)
    expect(store.postings.length).toBe(2)
  })

  it('replaces entire postings array on setPostings', () => {
    const store = useCompanyStore()
    
    const firstPostings = [{ id: 101, title: 'Frontend' }]
    const secondPostings = [
      { id: 102, title: 'Backend' },
      { id: 103, title: 'DevOps' }
    ]

    store.setPostings(firstPostings)
    expect(store.postings.length).toBe(1)

    store.setPostings(secondPostings)
    expect(store.postings.length).toBe(2)
    expect(store.postings[0].id).toBe(102)
  })

  it('sets applications for a specific posting', () => {
    const store = useCompanyStore()
    
    const testApps = [
      { id: 1, posting_id: 101, student_id: 1, status: 'pending' },
      { id: 2, posting_id: 101, student_id: 2, status: 'accepted' }
    ]

    store.setApplications(101, testApps)

    expect(store.applications[101]).toEqual(testApps)
    expect(store.applications[101].length).toBe(2)
  })

  it('handles multiple postings with different applications', () => {
    const store = useCompanyStore()
    
    const appsForPosting101 = [
      { id: 1, posting_id: 101, status: 'pending' }
    ]
    const appsForPosting102 = [
      { id: 2, posting_id: 102, status: 'accepted' },
      { id: 3, posting_id: 102, status: 'rejected' }
    ]

    store.setApplications(101, appsForPosting101)
    store.setApplications(102, appsForPosting102)

    expect(store.applications[101].length).toBe(1)
    expect(store.applications[102].length).toBe(2)
  })

  it('overwrites applications for a posting', () => {
    const store = useCompanyStore()
    
    const oldApps = [{ id: 1, status: 'pending' }]
    const newApps = [
      { id: 2, status: 'accepted' },
      { id: 3, status: 'rejected' }
    ]

    store.setApplications(101, oldApps)
    expect(store.applications[101].length).toBe(1)

    store.setApplications(101, newApps)
    expect(store.applications[101].length).toBe(2)
    expect(store.applications[101][0].id).toBe(2)
  })

  it('maintains independent application states for different postings', () => {
    const store = useCompanyStore()
    
    store.setApplications(101, [{ id: 1, status: 'pending' }])
    store.setApplications(102, [{ id: 2, status: 'accepted' }])

    // Updating one posting doesn't affect the other
    store.setApplications(101, [{ id: 1, status: 'accepted' }])

    expect(store.applications[101][0].status).toBe('accepted')
    expect(store.applications[102][0].status).toBe('accepted')
  })

  it('allows empty applications array', () => {
    const store = useCompanyStore()
    
    store.setApplications(101, [])
    
    expect(store.applications[101]).toEqual([])
    expect(store.applications[101].length).toBe(0)
  })

  it('updates profile without affecting postings or applications', () => {
    const store = useCompanyStore()
    
    store.setProfile({ id: 1, company_name: 'Tech' })
    store.setPostings([{ id: 101, title: 'Dev' }])
    store.setApplications(101, [{ id: 1, status: 'pending' }])

    const newProfile = { id: 1, company_name: 'Tech Updated' }
    store.setProfile(newProfile)

    expect(store.profile.company_name).toBe('Tech Updated')
    expect(store.postings).toEqual([{ id: 101, title: 'Dev' }])
    expect(store.applications[101]).toEqual([{ id: 1, status: 'pending' }])
  })
})
