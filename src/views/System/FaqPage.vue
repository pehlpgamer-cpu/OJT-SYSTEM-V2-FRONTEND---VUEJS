<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  ClipboardCheck,
  FileSearch,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
  Wrench
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
const roleOrder = ['admin', 'coordinator', 'company', 'student']

const roleGuides = {
  admin: {
    label: 'Admin',
    eyebrow: 'System oversight',
    icon: ShieldCheck,
    description: 'Monitor system activity and oversee every OJT operation available to coordinators.',
    note: 'Dedicated user-account management and system settings are not available in the current version.',
    cards: [
      {
        icon: Activity,
        question: 'How do I monitor system health?',
        summary: 'Use the administrator overview for a quick session and activity check.',
        steps: [
          'Open Admin Dashboard from the sidebar.',
          'Confirm the Session and Role values, then check the Audit Logs count.',
          'Review the latest activity for its action, entity, user, status, severity, and time.'
        ],
        link: { to: '/admin/dashboard', label: 'Open Admin Dashboard' }
      },
      {
        icon: Wrench,
        question: 'How do I manage OJT operations?',
        summary: 'Admins can use the complete coordinator workspace from the same sidebar.',
        steps: [
          'Open Coordinator Dashboard for the overall placement picture.',
          'Use Programs, Company Approvals, and Students to manage day-to-day OJT records.',
          'Use Reports and Audit Logs to review outcomes and trace system changes.'
        ],
        link: { to: '/coordinator/dashboard', label: 'Open Coordinator Dashboard' }
      },
      {
        icon: FileSearch,
        question: 'How do I investigate an activity?',
        summary: 'Filter detailed audit events and inspect what changed.',
        steps: [
          'Open Audit Logs and search by actor, reason, entity, IP address, or ID.',
          'Apply action and status filters, or open advanced filters for entity, severity, role, and dates.',
          'Expand an event to compare previous and new values and inspect actor, source, or error details.'
        ],
        link: { to: '/coordinator/audit-logs', label: 'Open Audit Logs' }
      },
      {
        icon: BarChart3,
        question: 'How do I review placement results?',
        summary: 'Generate a program report and export its placement data.',
        steps: [
          'Open Reports and choose one program or all accessible programs.',
          'Optionally set a start and end date, then select Generate.',
          'Review applications, hiring, placement rate, and match scores, or select CSV to download the rows.'
        ],
        link: { to: '/coordinator/reports', label: 'Open Reports' }
      }
    ]
  },
  coordinator: {
    label: 'Coordinator',
    eyebrow: 'Program management',
    icon: Users,
    description: 'Set up OJT programs, connect participants, approve partners, and track placement outcomes.',
    note: 'The Students page is for search and review. Change a student\'s participation status inside the relevant program.',
    cards: [
      {
        icon: LayoutDashboard,
        question: 'How do I monitor OJT activity?',
        summary: 'Start with a snapshot of programs, partners, applications, and placements.',
        steps: [
          'Open Dashboard from the sidebar.',
          'Review student, approved company, job, application, hiring, and placement metrics.',
          'Open an active program or select Review approvals for the next action.'
        ],
        link: { to: '/coordinator/dashboard', label: 'Open Dashboard' }
      },
      {
        icon: GraduationCap,
        question: 'How do I create an OJT program?',
        summary: 'Define the program period, eligibility, audience, and enrollment state.',
        steps: [
          'Open Programs, then select New Program.',
          'Enter the name, description, dates, optional minimum GPA, and academic programs.',
          'Choose the status and enrollment setting, then select Create Program to open its detail page.'
        ],
        link: { to: '/coordinator/programs/new', label: 'Create a Program' }
      },
      {
        icon: ListChecks,
        question: 'How do I add students, companies, and jobs?',
        summary: 'Connect existing records from a program detail page.',
        steps: [
          'Open Programs and select the program name.',
          'Choose the Students, Companies, or Jobs tab.',
          'Enter comma-separated numeric IDs, then select the matching Add button.'
        ],
        link: { to: '/coordinator/programs', label: 'Open Programs' }
      },
      {
        icon: UserRoundCheck,
        question: 'How do I update student participation?',
        summary: 'Manage each enrollment from the program where it belongs.',
        steps: [
          'Open the program and choose its Students tab.',
          'Select Suspend, Reactivate, or Complete beside the student.',
          'Confirm the change; when suspending a student, also provide a reason.'
        ],
        link: { to: '/coordinator/programs', label: 'Choose a Program' }
      },
      {
        icon: Building2,
        question: 'How do I approve or reject a company?',
        summary: 'Review pending partners before they publish OJT opportunities.',
        steps: [
          'Open Company Approvals and use the status filter to find the company.',
          'Select Approve and confirm, or select Reject and provide a reason.',
          'Check the refreshed status; approved companies can publish postings.'
        ],
        link: { to: '/coordinator/companies', label: 'Review Companies' }
      },
      {
        icon: Search,
        question: 'How do I review student readiness?',
        summary: 'Search student profiles and check their current OJT eligibility.',
        steps: [
          'Open Students and search by name, email, or academic program.',
          'Review GPA, profile completeness, enrollment status, and eligibility.',
          'To change participation, open the relevant program and use its Students tab.'
        ],
        link: { to: '/coordinator/students', label: 'Open Students' }
      },
      {
        icon: BarChart3,
        question: 'How do I create or export a placement report?',
        summary: 'Analyze application and hiring results for a selected period.',
        steps: [
          'Open Reports and select a program or all accessible programs.',
          'Optionally set a date range, then select Generate.',
          'Review the summary and rows, or select CSV to download the report.'
        ],
        link: { to: '/coordinator/reports', label: 'Open Reports' }
      },
      {
        icon: FileSearch,
        question: 'How do I inspect audit activity?',
        summary: 'Find an event, narrow the results, and examine its full context.',
        steps: [
          'Open Audit Logs and search by actor, reason, entity, IP address, or ID.',
          'Filter by action and status, or use advanced filters for entity, severity, role, and dates.',
          'Expand a row for actor, source, error, and before-and-after values; use pagination for older events.'
        ],
        link: { to: '/coordinator/audit-logs', label: 'Open Audit Logs' }
      }
    ]
  },
  company: {
    label: 'Company',
    eyebrow: 'Company partner guide',
    icon: Building2,
    description: 'Complete accreditation details, publish opportunities, and move applicants through review.',
    note: 'Open applications through Review in Dashboard\'s Recent Postings list; the Postings table does not currently show that link.',
    cards: [
      {
        icon: Building2,
        question: 'How do I complete my company profile?',
        summary: 'Keep partner information accurate before publishing opportunities.',
        steps: [
          'Open Profile from the sidebar.',
          'Enter the required company name, industry, and headquarters address, plus optional size, website, and logo details.',
          'Select Save Changes and return to Dashboard to check accreditation status.'
        ],
        link: { to: '/company/profile/edit', label: 'Edit Company Profile' }
      },
      {
        icon: FileText,
        question: 'How do I create and publish a posting?',
        summary: 'Create a complete draft, then publish it when the company is approved.',
        steps: [
          'Open New Posting and enter the title, description, location, positions, and optional salary and duration.',
          'Select Create Job Posting; the new posting is saved as a draft.',
          'Open Postings, select the green publish icon, and confirm. Pending accreditation may prevent publishing.'
        ],
        link: { to: '/company/postings/new', label: 'Create a Posting' }
      },
      {
        icon: BriefcaseBusiness,
        question: 'How do I edit, close, or republish a posting?',
        summary: 'Control listing details and availability from one table.',
        steps: [
          'Open Postings and select Edit to change listing details, then select Save Changes.',
          'For an active posting, select the archive icon and confirm to close it.',
          'For a draft or closed posting, select the green publish icon and confirm to make it active.'
        ],
        link: { to: '/company/postings', label: 'Manage Postings' }
      },
      {
        icon: ClipboardCheck,
        question: 'How do I review applicants?',
        summary: 'Read each application and record the company decision.',
        steps: [
          'From Dashboard\'s Recent Postings section, select Review beside the posting.',
          'Read the student details, cover letter, application date, and current status.',
          'Select Shortlist, Accept, or Reject, then confirm the decision.'
        ],
        link: { to: '/company/dashboard', label: 'Find Recent Postings' }
      },
      {
        icon: LayoutDashboard,
        question: 'What does my Dashboard show?',
        summary: 'Use the landing page as a quick view of company activity.',
        steps: [
          'Review the company accreditation notice, if one appears.',
          'Check total and active posting counts and recent posting statuses.',
          'Use Quick Actions to create a posting, manage postings, or edit the company profile.'
        ],
        link: { to: '/company/dashboard', label: 'Open Dashboard' }
      }
    ]
  },
  student: {
    label: 'Student',
    eyebrow: 'Student guide',
    icon: GraduationCap,
    description: 'Build a complete profile, improve matching data, and apply to suitable OJT roles.',
    note: 'Application history, withdrawal, and status tracking are not available yet. Wait for the success notice after submitting.',
    cards: [
      {
        icon: UserRoundCheck,
        question: 'How do I complete my student profile?',
        summary: 'Add the academic and availability details used for matching.',
        steps: [
          'Open Profile from the sidebar.',
          'Enter your required name and add academic program, phone, GPA, OJT dates, preferred location, and bio.',
          'Select Save; Dashboard then shows your updated profile completeness.'
        ],
        link: { to: '/student/profile/edit', label: 'Edit Student Profile' }
      },
      {
        icon: Sparkles,
        question: 'How do I manage my skills?',
        summary: 'Keep skills current so the system can produce better matches.',
        steps: [
          'Open Profile and go to the Skills section.',
          'Enter a skill name, choose its level, optionally add years of experience, then select Add.',
          'Use Remove and confirm when a skill is outdated or incorrect.'
        ],
        link: { to: '/student/profile/edit', label: 'Manage Skills' }
      },
      {
        icon: Search,
        question: 'How do I find suitable OJT roles?',
        summary: 'Search AI-ranked matches and compare compatibility details.',
        steps: [
          'Open Job Matches from the sidebar.',
          'Search by role, company, or location and choose an optional minimum score filter.',
          'Review overall, skill, location, and availability scores; the highest compatible matches appear first.'
        ],
        link: { to: '/student/matches', label: 'View Job Matches' }
      },
      {
        icon: ClipboardCheck,
        question: 'How do I apply to a matched posting?',
        summary: 'Review the opportunity and submit a focused cover letter.',
        steps: [
          'On a match card, select View & Apply.',
          'Review the posting details and write a cover letter of at least 20 characters.',
          'Select Submit Application and wait for the success notice before leaving the page.'
        ],
        link: { to: '/student/matches', label: 'Find a Posting' }
      },
      {
        icon: LayoutDashboard,
        question: 'What should I do from Dashboard?',
        summary: 'Use profile completeness and next steps to decide what to do next.',
        steps: [
          'Check your Profile Completeness percentage.',
          'Follow the Next Steps guidance and update missing details or skills.',
          'When your profile is ready, select View Job Matches to explore opportunities.'
        ],
        link: { to: '/student/dashboard', label: 'Open Dashboard' }
      }
    ]
  }
}

const initialRole = roleOrder.includes(authStore.role) ? authStore.role : 'student'
const activeRole = ref(initialRole)
const tabElements = ref([])

const portalRoleFromPath = path => path.split('/').filter(Boolean)[0] || ''

const canOpenPath = path => {
  const portalRole = portalRoleFromPath(path)
  if (authStore.role === 'admin') return ['admin', 'coordinator'].includes(portalRole)
  return authStore.role === portalRole
}

const portalLabelFromPath = path => {
  const portalRole = portalRoleFromPath(path)
  return roleGuides[portalRole]?.label || 'authorized'
}

const setTabElement = (element, index) => {
  if (element) tabElements.value[index] = element
}

const selectRole = role => {
  activeRole.value = role
}

const handleTabKeydown = async (event, index) => {
  let nextIndex = null

  if (event.key === 'ArrowRight') nextIndex = (index + 1) % roleOrder.length
  if (event.key === 'ArrowLeft') nextIndex = (index - 1 + roleOrder.length) % roleOrder.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = roleOrder.length - 1

  if (nextIndex === null) return

  event.preventDefault()
  activeRole.value = roleOrder[nextIndex]
  await nextTick()
  tabElements.value[nextIndex]?.focus()
}

onMounted(async () => {
  await nextTick()
  const activeIndex = roleOrder.indexOf(activeRole.value)
  tabElements.value[activeIndex]?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <header class="overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 py-8 text-white shadow-sm sm:px-8">
        <div class="flex max-w-3xl items-start gap-4">
          <span class="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/20">
            <CircleHelp class="h-6 w-6" />
          </span>
          <div>
            <p class="text-sm font-semibold text-indigo-100">Help center</p>
            <h1 class="mt-1 text-3xl font-bold tracking-tight">How to use OJT Match</h1>
            <p class="mt-3 text-sm leading-6 text-indigo-100 sm:text-base">
              Choose a role to follow practical, step-by-step instructions based on the tools available in that portal.
            </p>
          </div>
        </div>
      </header>

      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-3 pt-3 sm:px-5">
          <div
            class="flex gap-1 overflow-x-auto"
            role="tablist"
            aria-label="FAQ guides by user role"
          >
            <button
              v-for="(role, index) in roleOrder"
              :id="`faq-tab-${role}`"
              :key="role"
              :ref="element => setTabElement(element, index)"
              type="button"
              role="tab"
              :aria-selected="activeRole === role"
              :aria-controls="`faq-panel-${role}`"
              :tabindex="activeRole === role ? 0 : -1"
              :class="[
                'inline-flex min-w-max items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                activeRole === role
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
              ]"
              @click="selectRole(role)"
              @keydown="handleTabKeydown($event, index)"
            >
              <component :is="roleGuides[role].icon" class="h-4 w-4" />
              {{ roleGuides[role].label }}
              <span
                v-if="authStore.role === role"
                class="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700"
              >
                Your role
              </span>
            </button>
          </div>
        </div>

        <div
          v-for="role in roleOrder"
          :id="`faq-panel-${role}`"
          :key="role"
          role="tabpanel"
          :aria-labelledby="`faq-tab-${role}`"
          :hidden="activeRole !== role"
          :tabindex="activeRole === role ? 0 : -1"
          class="p-5 focus:outline-none sm:p-6"
        >
          <div class="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm font-semibold text-indigo-700">{{ roleGuides[role].eyebrow }}</p>
              <h2 class="mt-1 text-2xl font-bold text-gray-950">{{ roleGuides[role].label }} guide</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{{ roleGuides[role].description }}</p>
            </div>
            <span class="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
              {{ roleGuides[role].cards.length }} topics
            </span>
          </div>

          <div class="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <CircleHelp class="mt-0.5 h-4 w-4 shrink-0" />
            <p><span class="font-semibold">Good to know:</span> {{ roleGuides[role].note }}</p>
          </div>

          <div class="mt-6 grid gap-5 lg:grid-cols-2">
            <article
              v-for="(card, cardIndex) in roleGuides[role].cards"
              :key="card.question"
              data-testid="faq-card"
              class="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div class="flex items-start gap-3">
                <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <component :is="card.icon" class="h-5 w-5" />
                </span>
                <div>
                  <p class="text-xs font-bold uppercase tracking-wider text-indigo-600">Topic {{ cardIndex + 1 }}</p>
                  <h3 class="mt-1 text-lg font-semibold leading-6 text-gray-950">{{ card.question }}</h3>
                </div>
              </div>

              <p class="mt-4 text-sm leading-6 text-gray-600">{{ card.summary }}</p>

              <ol class="mt-5 flex-1 space-y-4" :aria-label="`Steps for ${card.question}`">
                <li
                  v-for="(step, stepIndex) in card.steps"
                  :key="step"
                  class="flex gap-3 text-sm leading-6 text-gray-700"
                >
                  <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
                    {{ stepIndex + 1 }}
                  </span>
                  <span>{{ step }}</span>
                </li>
              </ol>

              <RouterLink
                v-if="canOpenPath(card.link.to)"
                :to="card.link.to"
                class="mt-6 inline-flex w-fit items-center rounded-md text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {{ card.link.label }}
                <span class="ml-1" aria-hidden="true">&rarr;</span>
              </RouterLink>
              <p
                v-else
                data-testid="restricted-link"
                class="mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500"
              >
                <LockKeyhole class="h-4 w-4" />
                Available in the {{ portalLabelFromPath(card.link.to) }} portal
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
