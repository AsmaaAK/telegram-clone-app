<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Telegram-style header -->
    <header class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-3 flex items-center gap-4 shadow-md">
      <router-link to="/" class="p-2 -ml-2 hover:bg-blue-400 dark:hover:bg-blue-500 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <h1 class="text-lg font-semibold">الملف الشخصي</h1>
    </header>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-xl mx-auto">
        <!-- Avatar section -->
        <div class="bg-white dark:bg-gray-800 py-8 mb-2">
          <div class="flex flex-col items-center">
            <div class="relative">
              <img :src="getAvatarUrl(auth.user?.avatarUrl)" 
                   class="w-32 h-32 rounded-full object-cover ring-4 ring-blue-500/20 shadow-lg" />
              <button @click="fileEl?.click()" 
                      class="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input ref="fileEl" 
                     type="file" 
                     accept="image/*" 
                     @change="upload"
                     class="hidden" />
            </div>
            <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">اضغط على أيقونة الكاميرا لتغيير الصورة</p>
          </div>
        </div>
        
        <!-- Form section -->
        <form @submit.prevent="save" class="space-y-1 px-4">
          <!-- Name field -->
          <div class="bg-white dark:bg-gray-800 p-4 border-b border-gray-100 dark:border-gray-700">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">الاسم</label>
            <input v-model="name" 
                   class="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base focus:outline-none" 
                   placeholder="أدخل اسمك" />
          </div>
          
          <!-- About field -->
          <div class="bg-white dark:bg-gray-800 p-4">
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">حولي</label>
            <textarea v-model="about" 
                      class="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base focus:outline-none resize-none" 
                      placeholder="أخبرنا عن نفسك" 
                      rows="2"></textarea>
          </div>
          
          <!-- Save button -->
          <button type="submit"
                  :disabled="loading"
                  class="w-full mt-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md">
            {{ loading ? 'جاري الحفظ...' : 'حفظ التغييرات' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'

const auth = useAuthStore()
const name = ref(auth.user?.name || '')
const about = ref('')
const fileEl = ref(null)
const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWM5Y2E2Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5YzljYTYiLz4KPC9zdmc+Cjwvc3ZnPgo='
const loading = ref(false)

function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return placeholder
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `http://localhost:4000${avatarUrl}`
}

// Load user profile data from backend on mount
onMounted(async () => {
  if (!auth.user?.id) return
  try {
    loading.value = true
    const { data } = await api.get(`/users/${auth.user.id}`)
    name.value = data.name || ''
    about.value = data.about || ''
  } catch (err) {
    console.error('Failed to load profile:', err)
  } finally {
    loading.value = false
  }
})

async function upload(event) {
  const target = event.target
  const file = target.files?.[0]
  if (!file) return
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }
  
  // Check file size (max 2MB)
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    alert('Image too large. Maximum size is 2MB.')
    return
  }
  
  try {
    loading.value = true
  const form = new FormData()
    form.append('avatar', file)
    
    console.log('Uploading avatar:', file.name, file.type, file.size)
    
    // Upload - Let axios set Content-Type with proper boundary
  const { data } = await api.post('/users/me/avatar', form)
    
    console.log('Avatar uploaded:', data)
    
    // Update user in store
    if (auth.user) {
      auth.user = { ...auth.user, avatarUrl: data.avatarUrl }
      localStorage.setItem('user', JSON.stringify(auth.user))
    }
    
    // Force reactivity update
    auth.user = { ...auth.user }
    
    alert('✅ Avatar updated successfully!')
    // Clear file input
    if (fileEl.value) fileEl.value.value = ''
  } catch (err) {
    console.error('Failed to upload avatar:', err)
    console.error('Error response:', err?.response?.data)
    const message = err?.response?.data?.message || 'Failed to upload avatar. Please try again.'
    alert('❌ ' + message)
  } finally {
    loading.value = false
  }
}

async function save() {
  try {
    loading.value = true
  await api.put('/users/me', { name: name.value, about: about.value })
  await auth.loadMe()
    alert('Profile updated successfully!')
  } catch (err) {
    console.error('Failed to save profile:', err)
    alert('Failed to save profile')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* No additional styles needed - using Tailwind utilities */
</style>


