import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextToastId = 1

export const useUiStore = defineStore('ui', () => {
  const notifications = ref([])
  const confirmation = ref(null)

  const dismissToast = (id) => {
    notifications.value = notifications.value.filter(toast => toast.id !== id)
  }

  const showToast = ({ type = 'info', title = '', message = '', timeout = 4500 } = {}) => {
    const id = nextToastId++
    notifications.value.push({ id, type, title, message })

    if (timeout > 0) {
      globalThis.setTimeout(() => dismissToast(id), timeout)
    }

    return id
  }

  const showSuccess = (message, title = 'Success') => showToast({ type: 'success', title, message })
  const showError = (message, title = 'Error') => showToast({ type: 'error', title, message, timeout: 7000 })
  const showInfo = (message, title = 'Info') => showToast({ type: 'info', title, message })

  const confirmAction = ({
    title = 'Confirm action',
    message = 'Are you sure you want to continue?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'default'
  } = {}) => new Promise(resolve => {
    confirmation.value = {
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
      resolve
    }
  })

  const resolveConfirmation = (confirmed) => {
    const pending = confirmation.value
    confirmation.value = null

    if (pending?.resolve) {
      pending.resolve(confirmed)
    }
  }

  return {
    notifications,
    confirmation,
    showToast,
    showSuccess,
    showError,
    showInfo,
    dismissToast,
    confirmAction,
    resolveConfirmation
  }
})
