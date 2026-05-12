import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

global.fetch = vi.fn()

import { useJobMatching } from '../../src/composables/useJobMatching'
import { useMatchStore } from '../../src/stores/matchStore'

describe('useJobMatching Composable', () => {
  beforeEach(() => {
    const storage = new Map()

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => storage.get(key) ?? null),
        setItem: vi.fn((key, value) => storage.set(key, String(value))),
        removeItem: vi.fn((key) => storage.delete(key)),
        clear: vi.fn(() => storage.clear())
      },
      configurable: true
    })

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

  it('sends posting_id when applying to a match', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({ data: { id: 10 } })
    })

    const { applyToMatch } = useJobMatching()
    await applyToMatch(42, { cover_letter: 'This role fits my Vue experience.' })

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/applications',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          posting_id: 42,
          cover_letter: 'This role fits my Vue experience.'
        })
      })
    )
  })
})
