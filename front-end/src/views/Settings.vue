<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Telegram-style header -->
    <header class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-3 flex items-center gap-4 shadow-md">
      <router-link to="/" class="p-2 -ml-2 hover:bg-blue-400 dark:hover:bg-blue-500 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <h1 class="text-lg font-semibold">الإعدادات</h1>
    </header>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-xl mx-auto space-y-2 px-4 py-4">
        <!-- Theme -->
        <div class="bg-white dark:bg-gray-800 p-4 border-b border-gray-100 dark:border-gray-700">
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-3">المظهر</label>
          <select v-model="theme" 
                  class="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base focus:outline-none cursor-pointer">
            <option value="light">☀️ الوضع الفاتح</option>
            <option value="dark">🌙 الوضع الداكن</option>
          </select>
        </div>
        
        <!-- Language -->
        <div class="bg-white dark:bg-gray-800 p-4">
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-3">اللغة</label>
          <select v-model="language" 
                  class="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base focus:outline-none cursor-pointer">
            <option value="en">🇬🇧 English</option>
            <option value="ar">🇸🇦 العربية</option>
          </select>
        </div>
        
        <!-- Privacy Section -->
        <div class="mt-6">
          <h2 class="text-xs text-gray-500 dark:text-gray-400 px-4 mb-2 font-semibold">الخصوصية</h2>
          
          <div class="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            <div class="px-4 py-3.5 flex items-center justify-between">
              <label for="lastseen" class="text-sm text-gray-900 dark:text-gray-100 cursor-pointer flex-1">
                إظهار آخر ظهور
              </label>
              <input id="lastseen" 
                     type="checkbox" 
                     v-model="showLastSeen" 
                     class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
            </div>
            
            <div class="px-4 py-3.5 flex items-center justify-between">
              <label for="hideStatus" class="text-sm text-gray-900 dark:text-gray-100 cursor-pointer flex-1">
                إخفاء الحالة
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
                class="w-full mt-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md">
          {{ loading ? 'جاري الحفظ...' : 'حفظ التغييرات' }}
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


