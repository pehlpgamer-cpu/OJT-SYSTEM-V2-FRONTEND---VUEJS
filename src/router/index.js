import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useErrorStore } from '../stores/errorStore'
import { apiClient } from '../utils/apiClient'
import AppShell from '../components/AppShell.vue'

/**
 * Vue Router Configuration
 * 
 * ARCHITECTURE:
 * - Guest routes: login, register (requiresGuest = true, redirects authenticated users)
 * - Authenticated routes: student, company, coordinator (requiresAuth = true, requires login)
 * - Public routes: 404, redirects
 * 
 * SECURITY:
 * - beforeEach guard checks authentication && authorization
 * - Role-based access control (RBAC)
 * - Prevents users from accessing routes they don't have permission for
 * 
 * FLOW:
 * 1. Route requested
 * 2. beforeEach checks meta.requiresAuth, meta.require-Guest, meta.role
 * 3. If authorized, allow. Otherwise redirect.
 */

const routes = [
  {
    path: '/',
    redirect: '/login'  // Redirect root to login
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Auth/LoginPage.vue'),
    meta: { requiresGuest: true, title: 'Sign in' }  // Logged-in users redirected away
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Auth/RegisterPage.vue'),
    meta: { requiresGuest: true, title: 'Register' }  // Logged-in users redirected away
  },
  
  // STUDENT ROUTES
  {
    path: '/student',
    component: AppShell,
    meta: { requiresAuth: true, role: 'student' },  // Only accessible if role === 'student'
    children: [
      {
        path: '',
        redirect: '/student/dashboard'
      },
      {
        path: 'dashboard',
        name: 'StudentDashboard',
        component: () => import('../views/Student/StudentDashboard.vue'),
        meta: { title: 'Student Dashboard' }
      },
      {
        path: 'profile/edit',
        name: 'ProfileEdit',
        component: () => import('../views/Student/ProfileEdit.vue'),
        meta: { title: 'Student Profile' }
      },
      {
        path: 'matches',
        name: 'Matches',
        component: () => import('../views/Student/MatchesPage.vue'),
        meta: { title: 'Job Matches' }
      }
    ]
  },
  
  // COMPANY ROUTES
  {
    path: '/company',
    component: AppShell,
    meta: { requiresAuth: true, role: 'company' },  // Only accessible if role === 'company'
    children: [
      {
        path: '',
        redirect: '/company/dashboard'
      },
      {
        path: 'dashboard',
        name: 'CompanyDashboard',
        component: () => import('../views/Company/CompanyDashboard.vue'),
        meta: { title: 'Company Dashboard' }
      },
      {
        path: 'profile/edit',
        name: 'CompanyProfileEdit',
        component: () => import('../views/Company/ProfileEdit.vue'),
        meta: { title: 'Company Profile' }
      },
      {
        path: 'postings',
        name: 'CompanyPostings',
        component: () => import('../views/Company/PostingsList.vue'),
        meta: { title: 'Job Postings' }
      },
      {
        path: 'postings/new',
        name: 'PostingCreate',
        component: () => import('../views/Company/PostingCreate.vue'),
        meta: { title: 'New Posting' }
      },
      {
        path: 'postings/:id/applications',
        name: 'ApplicationsReview',
        component: () => import('../views/Company/ApplicationsReview.vue'),
        meta: { title: 'Review Applications' }
      }
    ]
  },
  
  /**
   * FIX: COORDINATOR ROUTES ADDED
   * Previous bug: RegisterPage allowed 'coordinator' role in registration
   * But router had no routes for coordinator, causing login to fail
   * 
   * TODO: Implement coordinator views when backend is ready
   * For now, placeholder route that might redirect to admin dashboard
   */
  {
    path: '/coordinator',
    component: AppShell,
    meta: { requiresAuth: true, role: 'coordinator' },
    children: [
      {
        path: '',
        redirect: '/coordinator/dashboard'
      },
      {
        path: 'dashboard',
        name: 'CoordinatorDashboard',
        component: () => import('../views/Coordinator/Dashboard.vue'),
        meta: { title: 'Coordinator Dashboard' }
      }
    ]
  },
  {
    path: '/admin',
    component: AppShell,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/Admin/Dashboard.vue'),
        meta: { title: 'Admin Dashboard' }
      }
    ]
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('../views/System/Unauthorized.vue'),
    meta: { requiresAuth: true, title: 'Access Denied' }
  },
  
  // 404 - Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/System/NotFound.vue'),
    meta: { title: 'Page Not Found' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

const ROLE_ROUTE_MAP = {
  student: '/student/dashboard',
  company: '/company/dashboard',
  coordinator: '/coordinator/dashboard',
  admin: '/admin/dashboard'
}

const routeForRole = (role) => ROLE_ROUTE_MAP[role] || null

async function refreshCurrentUser(authStore) {
  const payload = await apiClient('/user', {
    method: 'GET',
    retries: 0,
  })
  const currentUser = payload?.data?.user || payload?.user

  if (!currentUser) {
    throw new Error('Current user payload missing')
  }

  authStore.setFreshUser(currentUser)
}

function redirectForRole(authStore, errorStore, next) {
  const target = routeForRole(authStore.role)

  if (!target) {
    console.warn('[Router] Unknown role, logging out', { role: authStore.role })
    authStore.logout()
    errorStore.setError('Unsupported account role. Please contact support.', null, 403)
    next('/login')
    return
  }

  next(target)
}

/**
 * NAVIGATION GUARD: Enforce authentication and authorization
 * 
 * Runs before every route change to check:
 * 1. requiresAuth: Is user logged in?
 * 2. requiresGuest: Redirect logged-in users away from auth pages
 * 3. role: Does user have permission for this route?
 * 
 * ERROR HANDLING STRATEGY:
 * - Missing auth: Redirect to login
 * - Unauthorized role: Redirect to login
 * - Missing role: Allow (for now), should maybe 404
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const errorStore = useErrorStore()
  let isAuthenticated = authStore.isAuthenticated
  
  console.debug('[Router] beforeEach guard', { 
    toPath: to.path, 
    isAuthenticated, 
    role: authStore.role,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest,
    requiredRole: to.meta.role 
  })

  // CASE 1: Route requires authentication but user not logged in
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.debug('[Router] Route requires auth, user not authenticated, redirecting to login')
    next('/login')
    return
  }

  if (to.meta.requiresAuth && isAuthenticated && !authStore.hasFreshUser) {
    try {
      await refreshCurrentUser(authStore)
      isAuthenticated = authStore.isAuthenticated
    } catch (error) {
      console.warn('[Router] Failed to refresh current user', { error: error.message })
      authStore.logout()
      errorStore.setError('Your session has expired. Please sign in again.', null, 401)
      next('/login')
      return
    }
  }
  
  // CASE 2: Route requires guest but user is logged in
  // Redirect to appropriate dashboard based on role
  if (to.meta.requiresGuest && isAuthenticated) {
    console.debug('[Router] Route requires guest, user authenticated, redirecting based on role')
    
    redirectForRole(authStore, errorStore, next)
    return
  }
  
  // CASE 3: Route requires specific role but user has different role
  // RBAC: Role-Based Access Control
  if (to.meta.role && to.meta.role !== authStore.role) {
    console.warn('[Router] User role mismatch', { 
      requiredRole: to.meta.role, 
      userRole: authStore.role,
      path: to.path 
    })
    errorStore.setError('You do not have access to that account area.', null, 403)
    next('/unauthorized')
    return
  }
  
  // CASE 4: All checks passed, allow navigation
  console.debug('[Router] Authorization passed, allowing navigation')
  next()
})

export default router
