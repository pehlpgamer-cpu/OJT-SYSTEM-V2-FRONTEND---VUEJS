import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

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
    meta: { requiresGuest: true }  // Logged-in users redirected away
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Auth/RegisterPage.vue'),
    meta: { requiresGuest: true }  // Logged-in users redirected away
  },
  
  // STUDENT ROUTES
  {
    path: '/student',
    meta: { requiresAuth: true, role: 'student' },  // Only accessible if role === 'student'
    children: [
      {
        path: 'dashboard',
        name: 'StudentDashboard',
        component: () => import('../views/Student/StudentDashboard.vue')
      },
      {
        path: 'profile/edit',
        name: 'ProfileEdit',
        component: () => import('../views/Student/ProfileEdit.vue')
      },
      {
        path: 'matches',
        name: 'Matches',
        component: () => import('../views/Student/MatchesPage.vue')
      }
    ]
  },
  
  // COMPANY ROUTES
  {
    path: '/company',
    meta: { requiresAuth: true, role: 'company' },  // Only accessible if role === 'company'
    children: [
      {
        path: 'dashboard',
        name: 'CompanyDashboard',
        component: () => import('../views/Company/CompanyDashboard.vue')
      },
      {
        path: 'profile/edit',
        name: 'CompanyProfileEdit',
        component: () => import('../views/Company/ProfileEdit.vue')
      },
      {
        path: 'postings',
        name: 'CompanyPostings',
        component: () => import('../views/Company/PostingsList.vue')
      },
      {
        path: 'postings/new',
        name: 'PostingCreate',
        component: () => import('../views/Company/PostingCreate.vue')
      },
      {
        path: 'postings/:id/applications',
        name: 'ApplicationsReview',
        component: () => import('../views/Company/ApplicationsReview.vue')
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
    meta: { requiresAuth: true, role: 'coordinator' },
    children: [
      {
        path: 'dashboard',
        name: 'CoordinatorDashboard',
        // TODO: Create coordinator dashboard component
        component: () => import('../views/Auth/LoginPage.vue')  // Placeholder
      }
    ]
  },
  
  // 404 - Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/Auth/LoginPage.vue')  // Redirect to login
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

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
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  
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
  
  // CASE 2: Route requires guest but user is logged in
  // Redirect to appropriate dashboard based on role
  if (to.meta.requiresGuest && isAuthenticated) {
    console.debug('[Router] Route requires guest, user authenticated, redirecting based on role')
    
    if (authStore.role === 'student') {
      console.debug('[Router] Redirecting student to dashboard')
      next('/student/dashboard')
    } else if (authStore.role === 'company') {
      console.debug('[Router] Redirecting company to dashboard')
      next('/company/dashboard')
    } else if (authStore.role === 'coordinator') {
      // FIX: Coordinator now has a route
      console.debug('[Router] Redirecting coordinator to dashboard')
      next('/coordinator/dashboard')
    } else {
      // Unknown role, logout to be safe
      console.warn('[Router] Unknown role, redirecting to login', { role: authStore.role })
      next('/login')
    }
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
    // Unauthorized: redirect to appropriate dashboard
    if (authStore.role === 'student') next('/student/dashboard')
    else if (authStore.role === 'company') next('/company/dashboard')
    else if (authStore.role === 'coordinator') next('/coordinator/dashboard')
    else next('/login')  // Fallback
    return
  }
  
  // CASE 4: All checks passed, allow navigation
  console.debug('[Router] Authorization passed, allowing navigation')
  next()
})

export default router
