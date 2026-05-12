<script setup>
import { storeToRefs } from 'pinia'
import { AlertTriangle } from 'lucide-vue-next'
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()
const { confirmation } = storeToRefs(uiStore)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="confirmation"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 px-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div class="flex gap-4">
            <div
              :class="[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                confirmation.tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
              ]"
            >
              <AlertTriangle class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-lg font-semibold text-gray-900">{{ confirmation.title }}</h2>
              <p class="mt-2 text-sm leading-6 text-gray-600">{{ confirmation.message }}</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @click="uiStore.resolveConfirmation(false)"
            >
              {{ confirmation.cancelLabel }}
            </button>
            <button
              type="button"
              :class="[
                'rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
                confirmation.tone === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              ]"
              @click="uiStore.resolveConfirmation(true)"
            >
              {{ confirmation.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 140ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
