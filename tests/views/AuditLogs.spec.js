import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('../../src/utils/apiClient', () => ({
  apiClient: vi.fn()
}))

import { apiClient } from '../../src/utils/apiClient'
import AuditLogs from '../../src/views/Coordinator/AuditLogs.vue'

describe('Coordinator AuditLogs view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders comprehensive event context and expandable values', async () => {
    apiClient.mockResolvedValueOnce({
      data: [{
        id: 9,
        user_id: 7,
        user_role: 'coordinator',
        entity_type: 'Company',
        entity_id: 36,
        action: 'update',
        reason: 'Company accreditation approved',
        severity: 'high',
        status: 'success',
        ip_address: '127.0.0.1',
        user_agent: 'Test Browser',
        old_values: { accreditation_status: 'pending' },
        new_values: { accreditation_status: 'approved' },
        createdAt: '2026-08-06T02:00:00.000Z',
        actor: { id: 7, name: 'Casey Cruz', email: 'casey@example.com', role: 'coordinator' }
      }],
      pagination: {
        total: 1,
        page: 1,
        limit: 25,
        totalPages: 1,
        from: 1,
        to: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    })

    const wrapper = mount(AuditLogs)
    await flushPromises()

    expect(apiClient).toHaveBeenCalledWith('/coordinator/audit-logs?page=1&limit=25', { method: 'GET', retries: 0 })
    expect(wrapper.text()).toContain('Company accreditation approved')
    expect(wrapper.text()).toContain('Casey Cruz')
    expect(wrapper.text()).toContain('127.0.0.1')

    await wrapper.get('button[aria-label="Show details for audit event 9"]').trigger('click')

    expect(wrapper.text()).toContain('Previous values')
    expect(wrapper.text()).toContain('accreditation_status')
    expect(wrapper.text()).toContain('Test Browser')
  })

  it('debounces search and sends selected filters to the backend', async () => {
    vi.useFakeTimers()
    apiClient.mockResolvedValue({
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
        from: 0,
        to: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    })

    const wrapper = mount(AuditLogs)
    await flushPromises()
    apiClient.mockClear()

    await wrapper.get('input[type="search"]').setValue('Casey Cruz')
    await wrapper.get('select').setValue('update')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(apiClient).toHaveBeenCalledTimes(1)
    expect(apiClient.mock.calls[0][0]).toContain('search=Casey+Cruz')
    expect(apiClient.mock.calls[0][0]).toContain('action=update')

    wrapper.unmount()
    vi.useRealTimers()
  })
})
