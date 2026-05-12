<script setup>
import GlobalToasts from './components/GlobalToasts.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <router-view />
    <GlobalToasts />
    <ConfirmDialog />
  </div>
</template>
