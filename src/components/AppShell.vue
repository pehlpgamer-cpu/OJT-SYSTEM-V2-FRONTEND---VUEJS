<script setup>
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  User,
  X
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const isMobileNavOpen = ref(false)

const navByRole = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard', icon: Home },
    { label: 'Job Matches', to: '/student/matches', icon: Search },
    { label: 'Profile', to: '/student/profile/edit', icon: User }
  ],
  company: [
    { label: 'Dashboard', to: '/company/dashboard', icon: Home },
    { label: 'Postings', to: '/company/postings', icon: BriefcaseBusiness },
    { label: 'New Posting', to: '/company/postings/new', icon: FileText },
    { label: 'Profile', to: '/company/profile/edit', icon: Building2 }
  ],
  coordinator: [
    { label: 'Dashboard', to: '/coordinator/dashboard', icon: ShieldCheck }
  ]
}

const navItems = computed(() => navByRole[authStore.role] || [])

const accountName = computed(() => {
  const user = authStore.user || {}
  return user.name || user.full_name || user.company_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Account'
})

const roleLabel = computed(() => {
  if (!authStore.role) return 'User'
  return authStore.role.charAt(0).toUpperCase() + authStore.role.slice(1)
})

const pageTitle = computed(() => route.meta.title || navItems.value.find(item => item.to === route.path)?.label || 'OJT Matching')

const dashboardRoute = computed(() => {
  if (authStore.role === 'company') return '/company/dashboard'
  if (authStore.role === 'coordinator') return '/coordinator/dashboard'
  return '/student/dashboard'
})

const closeMobileNav = () => {
  isMobileNavOpen.value = false
}

const handleLogout = async () => {
  authStore.logout()
  closeMobileNav()
  uiStore.showSuccess('You have been signed out.')
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <div
      v-if="isMobileNavOpen"
      class="fixed inset-0 z-30 bg-gray-950/40 lg:hidden"
      @click="closeMobileNav"
    ></div>

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0',
        isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="flex h-16 items-center justify-between border-b border-gray-200 px-5">
        <RouterLink :to="dashboardRoute" class="flex items-center gap-3" @click="closeMobileNav">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">OJT Match</p>
            <p class="text-xs text-gray-500">{{ roleLabel }} Portal</p>
          </div>
        </RouterLink>
        <button
          type="button"
          class="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Close navigation"
          @click="closeMobileNav"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-4">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            route.path === item.to
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
          ]"
          @click="closeMobileNav"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-gray-200 p-4">
        <div class="mb-3 rounded-lg bg-gray-50 p-3">
          <p class="truncate text-sm font-semibold text-gray-900">{{ accountName }}</p>
          <p class="text-xs text-gray-500">{{ roleLabel }}</p>
        </div>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @click="handleLogout"
        >
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>

    <div class="lg:pl-72">
      <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Open navigation"
              @click="isMobileNavOpen = true"
            >
              <Menu class="h-5 w-5" />
            </button>
            <div>
              <h1 class="text-base font-semibold text-gray-950 sm:text-lg">{{ pageTitle }}</h1>
              <p class="hidden text-xs text-gray-500 sm:block">{{ accountName }}</p>
            </div>
          </div>

          <button
            type="button"
            class="hidden items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:flex"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main>
        <RouterView />
      </main>
    </div>
  </div>
</template>
