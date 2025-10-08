<template>
  <div id="app" class="h-full w-full bg-white dark:bg-gray-900">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* Global app styles */
#app {
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

/* Ensure proper mobile viewport */
@media (max-width: 768px) {
  #app {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>