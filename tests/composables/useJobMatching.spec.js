import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

global.fetch = vi.fn()

import { useJobMatching } from '../../src/composables/useJobMatching'
import { useMatchStore } from '../../src/stores/matchStore'

describe('useJobMatching Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  it('initializes with default values', () => {
    const { isLoading } = useJobMatching()
    expect(isLoading.value).toBe(false)
  })

  it('exports required functions', () => {
    const composable = useJobMatching()
    expect(typeof composable.fetchMatches).toBe('function')
    expect(typeof composable.applyToMatch).toBe('function')
    expect(typeof composable.isLoading).toBe('object')
  })

  it('has access to match store', () => {
    const { fetchMatches } = useJobMatching()
    const store = useMatchStore()
    
    expect(typeof store.setMatches).toBe('function')
    expect(typeof store.setFilter).toBe('function')
  })

  it('provides isLoading ref for UI feedback', () => {
    const { isLoading } = useJobMatching()
    
    expect(typeof isLoading.value).toBe('boolean')
    // Should be reactive
    isLoading.value = true
    expect(isLoading.value).toBe(true)
    isLoading.value = false
    expect(isLoading.value).toBe(false)
  })
})
