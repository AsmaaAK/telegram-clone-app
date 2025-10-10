<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Telegram-style header -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-4">
      <router-link to="/" class="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
    </header>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-xl mx-auto space-y-4 px-4 py-6">
        <!-- Theme -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
          <select v-model="theme" 
                  class="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base focus:outline-none cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <option value="light">☀️ Light Mode</option>
            <option value="dark">🌙 Dark Mode</option>
          </select>
        </div>
        
        <!-- Language -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Language</label>
          <select v-model="language" 
                  class="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base focus:outline-none cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <option value="en">🇬🇧 English</option>
            <option value="ar">🇸🇦 العربية</option>
          </select>
        </div>
        
        <!-- Privacy Section -->
        <div class="mt-6">
          <h2 class="text-sm font-medium text-gray-700 dark:text-gray-300 px-2 mb-3">Privacy</h2>
          
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <div class="px-4 py-3.5 flex items-center justify-between">
              <label for="lastseen" class="text-sm text-gray-900 dark:text-gray-100 cursor-pointer flex-1">
                Show last seen
              </label>
              <input id="lastseen" 
                     type="checkbox" 
                     v-model="showLastSeen" 
                     class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
            </div>
            
            <div class="px-4 py-3.5 flex items-center justify-between">
              <label for="hideStatus" class="text-sm text-gray-900 dark:text-gray-100 cursor-pointer flex-1">
                Hide status
              </label>
              <input id="hideStatus" 
                     type="checkbox" 
                     v-model="hideStatus" 
                     class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
            </div>
          </div>
        </div>
        
        <!-- Save button -->
        <button @click="save" 
                :disabled="loading"
                class="w-full mt-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white px-6 py-3.5 rounded-lg font-medium transition-colors shadow-md">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'

const auth = useAuthStore()
const theme = ref('light')
const language = ref('en')
const showLastSeen = ref(true)
const hideStatus = ref(false)
const loading = ref(false)

// Load settings from backend on mount
onMounted(async () => {
  if (!auth.user?.id) return
  try {
    loading.value = true
    const { data } = await api.get(`/users/${auth.user.id}`)
    if (data.settings) {
      theme.value = data.settings.theme || 'light'
      language.value = data.settings.language || 'en'
      showLastSeen.value = data.settings.showLastSeen ?? true
      hideStatus.value = data.settings.hideStatus ?? false
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
  } finally {
    loading.value = false
  }
})

async function save() {
  try {
    loading.value = true
    await auth.updateSettings({ 
      theme: theme.value, 
      language: language.value, 
      showLastSeen: showLastSeen.value, 
      hideStatus: hideStatus.value 
    })
    alert('Settings saved successfully!')
  } catch (err) {
    console.error('Failed to save settings:', err)
    alert('Failed to save settings')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* No additional styles needed - using Tailwind utilities */
</style>