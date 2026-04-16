import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

global.fetch = vi.fn()

import { useStudentProfile } from '../../src/composables/useStudentProfile'
import { useStudentStore } from '../../src/stores/studentStore'

describe('useStudentProfile Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  it('initializes with isLoading false', () => {
    const { isLoading } = useStudentProfile()
    expect(isLoading.value).toBe(false)
  })

  it('exports required functions', () => {
    const composable = useStudentProfile()
    expect(typeof composable.fetchProfile).toBe('function')
    expect(typeof composable.updateProfile).toBe('function')
    expect(typeof composable.fetchSkills).toBe('function')
    expect(typeof composable.addSkill).toBe('function')
    expect(typeof composable.deleteSkill).toBe('function')
  })

  it('has access to student store', () => {
    const { fetchProfile } = useStudentProfile()
    const store = useStudentStore()
    
    // Verify store has profile method
    expect(typeof store.setProfile).toBe('function')
  })

  it('returns isLoading ref', () => {
    const { isLoading } = useStudentProfile()
    expect(typeof isLoading.value).toBe('boolean')
  })
})
