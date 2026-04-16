import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

import { useStudentStore } from '../../src/stores/studentStore'

describe('Student Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const store = useStudentStore()
    expect(store.profile).toBeNull()
    expect(store.skills).toEqual([])
    expect(store.applications).toEqual([])
    expect(store.profileCompleteness).toBe(0)
  })

  it('sets student profile correctly', () => {
    const store = useStudentStore()
    
    const testProfile = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      academic_program: 'Computer Science',
      gpa: 3.8
    }

    store.setProfile(testProfile)

    expect(store.profile).toEqual(testProfile)
    expect(store.profile.first_name).toBe('John')
    expect(store.profile.id).toBe(1)
  })

  it('clears profile by setting null', () => {
    const store = useStudentStore()
    
    store.setProfile({ id: 1, first_name: 'John' })
    expect(store.profile).not.toBeNull()
    
    store.setProfile(null)
    expect(store.profile).toBeNull()
  })

  it('sets skills array', () => {
    const store = useStudentStore()
    
    const testSkills = [
      { id: 1, name: 'Vue.js', proficiency: 'expert' },
      { id: 2, name: 'JavaScript', proficiency: 'advanced' }
    ]

    store.setSkills(testSkills)

    expect(store.skills).toEqual(testSkills)
    expect(store.skills.length).toBe(2)
  })

  it('adds a single skill', () => {
    const store = useStudentStore()
    
    const skill1 = { id: 1, name: 'Vue.js' }
    const skill2 = { id: 2, name: 'JavaScript' }

    store.addSkill(skill1)
    expect(store.skills.length).toBe(1)
    expect(store.skills[0].name).toBe('Vue.js')

    store.addSkill(skill2)
    expect(store.skills.length).toBe(2)
  })

  it('updates an existing skill', () => {
    const store = useStudentStore()
    
    const skill = { id: 1, name: 'Vue.js', proficiency: 'beginner' }
    store.addSkill(skill)

    const updatedSkill = { id: 1, name: 'Vue.js', proficiency: 'expert' }
    store.updateSkill(updatedSkill)

    expect(store.skills[0].proficiency).toBe('expert')
  })

  it('removes a skill by id', () => {
    const store = useStudentStore()
    
    store.addSkill({ id: 1, name: 'Vue.js' })
    store.addSkill({ id: 2, name: 'JavaScript' })
    expect(store.skills.length).toBe(2)

    store.removeSkill(1)
    expect(store.skills.length).toBe(1)
    expect(store.skills[0].id).toBe(2)
  })

  it('sets applications array', () => {
    const store = useStudentStore()
    
    const testApps = [
      { id: 1, posting_id: 101, status: 'pending' },
      { id: 2, posting_id: 102, status: 'accepted' }
    ]

    store.setApplications(testApps)

    expect(store.applications).toEqual(testApps)
    expect(store.applications.length).toBe(2)
  })

  it('calculates profile completeness correctly', () => {
    const store = useStudentStore()
    
    // Empty profile = 0
    expect(store.profileCompleteness).toBe(0)

    // Partial profile
    store.setProfile({
      first_name: 'John',
      last_name: 'Doe'
    })
    store.setSkills([{ id: 1, name: 'Vue.js' }])
    
    // Should have some completeness (basic info + skills)
    expect(store.profileCompleteness).toBeGreaterThan(0)
  })

  it('marks profile as complete when all fields set', () => {
    const store = useStudentStore()
    
    store.setProfile({
      first_name: 'John',
      last_name: 'Doe', 
      bio: 'Developer',
      preferred_location: 'Remote',
      availability_start: '2026-05-01',
      availability_end: '2026-08-31',
      gpa: 3.8,
      academic_program: 'CS'
    })
    store.setSkills([{ id: 1, name: 'Vue.js' }])

    expect(store.isProfileComplete).toBe(true)
  })
})
