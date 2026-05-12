<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-vue-next'
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()
const { notifications } = storeToRefs(uiStore)

const toastStyles = {
  success: {
    icon: CheckCircle2,
    shell: 'border-green-200 bg-green-50 text-green-900',
    iconClass: 'text-green-600'
  },
  error: {
    icon: AlertTriangle,
    shell: 'border-red-200 bg-red-50 text-red-900',
    iconClass: 'text-red-600'
  },
  info: {
    icon: Info,
    shell: 'border-blue-200 bg-blue-50 text-blue-900',
    iconClass: 'text-blue-600'
  }
}

const visibleToasts = computed(() => notifications.value.slice(-4))
</script>

<template>
  <div class="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
    <TransitionGroup name="toast">
      <div
        v-for="toast in visibleToasts"
        :key="toast.id"
        :class="[
          'rounded-lg border p-4 shadow-lg backdrop-blur',
          toastStyles[toast.type]?.shell || toastStyles.info.shell
        ]"
        role="status"
      >
        <div class="flex gap-3">
          <component
            :is="toastStyles[toast.type]?.icon || toastStyles.info.icon"
            :class="['mt-0.5 h-5 w-5 shrink-0', toastStyles[toast.type]?.iconClass || toastStyles.info.iconClass]"
          />
          <div class="min-w-0 flex-1">
            <p v-if="toast.title" class="text-sm font-semibold">{{ toast.title }}</p>
            <p class="text-sm leading-5">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="rounded-md p-1 text-current opacity-70 hover:bg-white/60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Dismiss notification"
            @click="uiStore.dismissToast(toast.id)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 160ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
