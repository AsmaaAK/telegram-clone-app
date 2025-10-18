<template>
  <!-- Sidebar Menu Overlay -->
  <div v-if="isOpen" 
       @click="closeMenu"
       class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"></div>
  
  <!-- Sidebar Menu -->
  <div class="fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50"
       :class="isOpen ? 'translate-x-0' : '-translate-x-full'">
    
    <!-- Header with user info -->
    <div class="bg-blue-500 dark:bg-blue-600 text-white p-6">
      <div class="flex items-center gap-4">
        <img :src="userAvatar" 
             class="w-16 h-16 rounded-full object-cover ring-4 ring-white/30" />
        <div>
          <h3 class="text-lg font-semibold">{{ userName }}</h3>
          <p class="text-blue-100 text-sm">{{ userStatus }}</p>
        </div>
      </div>
    </div>
    
    <!-- Menu Items -->
    <div class="flex-1 overflow-y-auto py-4">
      <nav class="space-y-1">
        <!-- Home -->
        <router-link to="/" 
                     @click="closeMenu"
                     class="flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="font-medium">الرئيسية</span>
        </router-link>
        
        <!-- Profile -->
        <router-link to="/profile" 
                     @click="closeMenu"
                     class="flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="font-medium">الملف الشخصي</span>
        </router-link>
        
        <!-- Saved Messages -->
        <button @click="openSavedMessages" 
                class="w-full flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span class="font-medium">الرسائل المحفوظة</span>
        </button>
        
        <!-- Channels -->
        <router-link to="/channels" 
                     @click="closeMenu"
                     class="flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="font-medium">القنوات</span>
        </router-link>
        
        <!-- Settings -->
        <router-link to="/settings" 
                     @click="closeMenu"
                     class="flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="font-medium">الإعدادات</span>
        </router-link>
        
        <!-- Divider -->
        <div class="border-t border-gray-200 dark:border-gray-600 my-4"></div>
        
        <!-- Logout -->
        <button @click="handleLogout" 
                class="w-full flex items-center gap-3 px-6 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="font-medium">تسجيل الخروج</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const auth = useAuthStore()
const router = useRouter()

const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWM5Y2E2Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5YzljYTYiLz4KPC9zdmc+Cjwvc3ZnPgo='

const userName = computed(() => {
  return auth.user?.name || auth.user?.username || 'المستخدم'
})

const userAvatar = computed(() => {
  if (auth.user?.avatarUrl) {
    if (auth.user.avatarUrl.startsWith('http')) {
      return auth.user.avatarUrl
    }
    return `http://localhost:4000${auth.user.avatarUrl}`
  }
  return placeholder
})

const userStatus = computed(() => {
  return auth.user ? 'متصل' : 'غير متصل'
})

function closeMenu() {
  emit('close')
}

function openSavedMessages() {
  // TODO: Implement saved messages functionality
  console.log('Opening saved messages...')
  closeMenu()
}

async function handleLogout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    await auth.logout()
    closeMenu()
    router.push('/login')
  }
}
</script>

<style scoped>
/* Custom scrollbar for menu items */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
