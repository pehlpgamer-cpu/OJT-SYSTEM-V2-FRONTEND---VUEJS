import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOKEN_KEY = 'ojt_jwt_token'
const ROLE_KEY = 'ojt_user_role'
const USER_KEY = 'ojt_user'
const ALLOWED_ROLES = ['student', 'company', 'coordinator']

const isClient = typeof window !== 'undefined'

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')

  if (typeof atob === 'function') {
    return atob(padded)
  }

  return Buffer.from(padded, 'base64').toString('utf8')
}

export function decodeTokenPayload(rawToken) {
  if (typeof rawToken !== 'string') {
    return null
  }

  const parts = rawToken.split('.')
  if (parts.length !== 3 || parts.some(part => !part)) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]))
  } catch {
    return null
  }
}

export function isTokenUsable(rawToken) {
  const payload = decodeTokenPayload(rawToken)
  if (!payload) {
    return false
  }

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false
  }

  return true
}

function isAllowedRole(value) {
  return ALLOWED_ROLES.includes(value)
}

function readJson(key) {
  if (!isClient) {
    return null
  }

  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function clearStoredAuth() {
  if (!isClient) {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(USER_KEY)
}

function getInitialAuth() {
  if (!isClient) {
    return {
      token: null,
      user: null,
      role: null
    }
  }

  const storedToken = localStorage.getItem(TOKEN_KEY)
  const storedUser = readJson(USER_KEY)
  const storedRole = localStorage.getItem(ROLE_KEY) || storedUser?.role
  const tokenPayload = decodeTokenPayload(storedToken)
  const resolvedRole = storedUser?.role || storedRole || tokenPayload?.role

  if (!isTokenUsable(storedToken) || !isAllowedRole(resolvedRole)) {
    clearStoredAuth()
    return {
      token: null,
      user: null,
      role: null
    }
  }

  return {
    token: storedToken,
    user: storedUser,
    role: resolvedRole
  }
}

/**
 * Authentication Store (Pinia)
 *
 * Keeps local auth state aligned with a usable JWT, an allowed public app role,
 * and the latest user payload fetched from the backend when route guards boot.
 */
export const useAuthStore = defineStore('auth', () => {
  const initialAuth = getInitialAuth()

  const user = ref(initialAuth.user)
  const token = ref(initialAuth.token)
  const isLoading = ref(false)
  const isAuthenticated = ref(!!initialAuth.token)
  const role = ref(initialAuth.role)
  const hasFreshUser = ref(false)

  const setAuth = (newToken, newUser, newRole = newUser?.role) => {
    const tokenPayload = decodeTokenPayload(newToken)
    const resolvedRole = newUser?.role || newRole || tokenPayload?.role

    console.debug('[AuthStore] setAuth called', {
      userId: newUser?.id,
      role: resolvedRole,
      tokenLength: newToken?.length
    })

    if (!isTokenUsable(newToken) || !isAllowedRole(resolvedRole)) {
      logout()
      throw new Error('Invalid authentication session')
    }

    token.value = newToken
    user.value = newUser || null
    role.value = resolvedRole
    isAuthenticated.value = true
    hasFreshUser.value = !!newUser

    if (isClient) {
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(ROLE_KEY, resolvedRole)
      if (newUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(newUser))
      } else {
        localStorage.removeItem(USER_KEY)
      }
      console.debug('[AuthStore] Auth data persisted to localStorage', { role: resolvedRole })
    }
  }

  const setFreshUser = (newUser) => {
    if (!token.value) {
      throw new Error('Cannot set user without token')
    }

    setAuth(token.value, newUser, newUser?.role)
  }

  const markUserStale = () => {
    hasFreshUser.value = false
  }

  const logout = () => {
    console.debug('[AuthStore] logout called')

    token.value = null
    user.value = null
    role.value = null
    isAuthenticated.value = false
    hasFreshUser.value = false
    clearStoredAuth()
    console.debug('[AuthStore] Auth data removed from localStorage')
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    role,
    hasFreshUser,
    setAuth,
    setFreshUser,
    markUserStale,
    logout
  }
})
