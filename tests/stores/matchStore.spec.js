import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatchStore } from '../../src/stores/matchStore'

describe('Match Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default values', () => {
    const store = useMatchStore()
    expect(store.matches).toEqual([])
    expect(store.filters.minScore).toBe(0)
    expect(store.filters.search).toBe('')
    expect(store.filters.sortBy).toBe('overall_score')
  })

  it('sets matches array', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { 
        id: 1, 
        overall_score: 95, 
        OjtPosting: { title: 'Frontend Dev', company_name: 'Tech Co', location: 'NYC' }
      },
      { 
        id: 2, 
        overall_score: 88, 
        OjtPosting: { title: 'Full Stack Dev', company_name: 'Dev Corp', location: 'SF' }
      }
    ]

    store.setMatches(testMatches)

    expect(store.matches).toEqual(testMatches)
    expect(store.matches.length).toBe(2)
  })

  it('filters matches by minimum score', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { id: 1, overall_score: 95, OjtPosting: { title: 'Senior Dev' } },
      { id: 2, overall_score: 60, OjtPosting: { title: 'Junior Dev' } },
      { id: 3, overall_score: 45, OjtPosting: { title: 'Intern' } }
    ]
    
    store.setMatches(testMatches)
    store.setFilter('minScore', 80)

    expect(store.filteredMatches.length).toBe(1)
    expect(store.filteredMatches[0].overall_score).toBe(95)
  })

  it('filters matches by search text', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { 
        id: 1, 
        overall_score: 95, 
        OjtPosting: { 
          title: 'Frontend Developer', 
          company_name: 'Tech Corp',
          location: 'New York'
        }
      },
      { 
        id: 2, 
        overall_score: 88, 
        OjtPosting: { 
          title: 'Backend Developer', 
          company_name: 'Dev Solutions',
          location: 'Silicon Valley'
        }
      }
    ]
    
    store.setMatches(testMatches)
    store.setFilter('search', 'Frontend')

    expect(store.filteredMatches.length).toBe(1)
    expect(store.filteredMatches[0].OjtPosting.title).toContain('Frontend')
  })

  it('searches across company name', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { 
        id: 1, 
        overall_score: 95, 
        OjtPosting: { 
          title: 'Developer', 
          Company: { company_name: 'TechCorp' },
          location: 'NYC'
        }
      },
      { 
        id: 2, 
        overall_score: 88, 
        OjtPosting: { 
          title: 'Developer', 
          Company: { company_name: 'DevSolutions' },
          location: 'SF'
        }
      }
    ]
    
    store.setMatches(testMatches)
    store.setFilter('search', 'TechCorp')

    expect(store.filteredMatches.length).toBe(1)
    expect(store.filteredMatches[0].OjtPosting.Company.company_name).toBe('TechCorp')
  })

  it('sorts by overall score (highest first)', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { id: 1, overall_score: 45, OjtPosting: { title: 'Dev1', created_at: '2024-01-01' } },
      { id: 2, overall_score: 95, OjtPosting: { title: 'Dev2', created_at: '2024-01-02' } },
      { id: 3, overall_score: 75, OjtPosting: { title: 'Dev3', created_at: '2024-01-03' } }
    ]
    
    store.setMatches(testMatches)
    store.setFilter('sortBy', 'overall_score')

    const sorted = store.filteredMatches
    // Verify they are sorted by date descending
    expect(sorted[0].id).toBe(2) // 2024-01-03 (newest)
    expect(sorted[1].id).toBe(3) // 2024-01-02
    expect(sorted[2].id).toBe(1) // 2024-01-01 (oldest)
  })

  it('sorts by date posted (newest first)', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { id: 1, overall_score: 90, OjtPosting: { title: 'Dev1', created_at: '2024-01-01' } },
      { id: 2, overall_score: 85, OjtPosting: { title: 'Dev2', created_at: '2024-01-03' } },
      { id: 3, overall_score: 88, OjtPosting: { title: 'Dev3', created_at: '2024-01-02' } }
    ]
    
    store.setMatches(testMatches)
    store.setFilter('sortBy', 'date_posted')

    const sorted = store.filteredMatches
    // Verify they are sorted by date descending
    expect(sorted[0].id).toBe(2) // 2024-01-03 (newest)
    expect(sorted[1].id).toBe(3) // 2024-01-02
    expect(sorted[2].id).toBe(1) // 2024-01-01 (oldest)
  })

  it('applies multiple filters together', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { 
        id: 1, 
        overall_score: 95, 
        OjtPosting: { title: 'Senior Frontend', company_name: 'TechCorp', location: 'NYC' }
      },
      { 
        id: 2, 
        overall_score: 60, 
        OjtPosting: { title: 'Junior Frontend', company_name: 'DevCorp', location: 'SF' }
      },
      { 
        id: 3, 
        overall_score: 85, 
        OjtPosting: { title: 'Backend Developer', company_name: 'TechCorp', location: 'NYC' }
      }
    ]
    
    store.setMatches(testMatches)
    store.setFilter('minScore', 70)
    store.setFilter('search', 'Frontend')

    // Should have 2 matches: id 1 (95 score, Frontend), id 2 (60 score filtered out)
    expect(store.filteredMatches.length).toBe(1)
    expect(store.filteredMatches[0].id).toBe(1)
  })

  it('sets and updates individual filters', () => {
    const store = useMatchStore()
    
    expect(store.filters.minScore).toBe(0)
    
    store.setFilter('minScore', 80)
    expect(store.filters.minScore).toBe(80)
    
    store.setFilter('search', 'developer')
    expect(store.filters.search).toBe('developer')
    
    store.setFilter('sortBy', 'date_posted')
    expect(store.filters.sortBy).toBe('date_posted')
  })

  it('case-insensitive string filtering', () => {
    const store = useMatchStore()
    
    const testMatches = [
      { 
        id: 1, 
        overall_score: 90, 
        OjtPosting: { title: 'FRONTEND Developer', company_name: 'TechCorp', location: 'NYC' }
      }
    ]
    
    store.setMatches(testMatches)
    store.setFilter('search', 'frontend')

    expect(store.filteredMatches.length).toBe(1)
  })
})
