<script setup lang="ts">
import NotificationContainer from './components/NotificationContainer'
// Router handles navigation now, no need for manual switching
</script>

<template>
  <div>
    <!-- Router View - displays current route component -->
    <RouterView />
    
    <!-- Global Notification Container -->
    <NotificationContainer />
  </div>
</template>