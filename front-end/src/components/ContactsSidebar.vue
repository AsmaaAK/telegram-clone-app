<template>
  <aside class="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-800">
    <!-- Telegram-style header -->
    <header class="text-white" style="background-color: #27a2e1;">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="$emit('openMenu')" 
                  class="p-2 hover:bg-gray-700 rounded-full transition-colors" 
                  title="القائمة">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 class="text-lg font-semibold">Telegram</h2>
        </div>
        <div class="flex items-center gap-1">
          <!-- Search button moved to sidebar tabs -->
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="px-4 pt-2 pb-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex gap-2">
        <button @click="switchTab('channels')" 
                class="text-xs px-3 py-1 rounded-full transition-colors"
                :class="activeTab === 'channels' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                :style="activeTab === 'channels' ? 'background-color: #27a2e1;' : ''">
          القنوات
        </button>
        <button @click="switchTab('search')" 
                class="text-xs px-3 py-1 rounded-full transition-colors"
                :class="activeTab === 'search' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                :style="activeTab === 'search' ? 'background-color: #27a2e1;' : ''">
          البحث
        </button>
        <button @click="switchTab('contacts')" 
                class="text-xs px-3 py-1 rounded-full transition-colors"
                :class="activeTab === 'contacts' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                :style="activeTab === 'contacts' ? 'background-color: #27a2e1;' : ''">
          جهات الاتصال
        </button>
      </div>
      
      <!-- Search bar -->
      <div v-if="showSearch" class="px-3 pb-3 pt-2">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" 
                 type="text" 
                 placeholder="البحث في جهات الاتصال..." 
                 class="w-full text-sm pl-10 pr-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" />
        </div>
      </div>
    </header>
    <div class="flex-1 overflow-y-auto">
      <!-- Channels Tab -->
      <div v-if="activeTab === 'channels'">
        <div class="p-4 text-center text-gray-500">
          <div class="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 4h6V3H9v1z" />
            </svg>
          </div>
          <p class="text-sm">لا توجد قنوات متاحة</p>
          <p class="text-xs text-gray-400 mt-1">انتقل إلى الرئيسية لإنشاء قنوات</p>
        </div>
      </div>

      <!-- Search Tab -->
      <div v-else-if="activeTab === 'search'">
        <!-- Default state when no search -->
        <div v-if="!searchQuery.trim()" class="p-4 text-center text-gray-500">
          <div class="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p class="text-sm">ابحث في جهات الاتصال</p>
          <p class="text-xs text-gray-400 mt-1">اكتب في شريط البحث أعلاه</p>
        </div>

        <!-- Search results -->
        <div v-else>
          <div v-if="filtered.length === 0" class="p-4 text-center text-gray-500">
            <div class="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p class="text-sm">لا توجد نتائج للبحث</p>
            <p class="text-xs text-gray-400 mt-1">جرب البحث بكلمات مختلفة</p>
          </div>
          
          <div v-else>
            <button v-for="u in filtered" :key="u._id" 
                    @click="$emit('select', u._id)" 
                    class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
              
              <!-- Avatar with online indicator -->
              <div class="relative flex-shrink-0">
                <img :src="getAvatarUrl(u.avatarUrl)" 
                     class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"/>
                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900" 
                      :class="presenceDot(u._id)"></span>
              </div>
              
              <!-- User info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {{ u.name || u.username || `User ${u._id.slice(-4)}` }}
                  </span>
                  <!-- Unread badge -->
                  <UnreadBadge 
                    :count="unreadCounts[u._id]" 
                    class="ml-auto flex-shrink-0"
                  />
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ presenceSubtitle(u._id) }}
                </div>
              </div>
              
              <!-- Chevron icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Contacts Tab -->
      <div v-else-if="activeTab === 'contacts'">
        <div v-if="filtered.length === 0" class="p-4 text-center text-gray-500">
          <div class="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <p class="text-sm">لا توجد جهات اتصال</p>
          <p class="text-xs text-gray-400 mt-1">تم تسجيل الدخول للعثور على المستخدمين الآخرين</p>
        </div>

        <div v-else>
          <button v-for="u in filtered" :key="u._id" 
                  @click="$emit('select', u._id)" 
                  class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
            
            <!-- Avatar with online indicator -->
            <div class="relative flex-shrink-0">
              <img :src="getAvatarUrl(u.avatarUrl)" 
                   class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"/>
              <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900" 
                    :class="presenceDot(u._id)"></span>
            </div>
            
            <!-- User info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {{ u.name || u.username || `User ${u._id.slice(-4)}` }}
                </span>
                <!-- Unread badge -->
                <UnreadBadge 
                  :count="unreadCounts[u._id]" 
                  class="ml-auto flex-shrink-0"
                />
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ presenceSubtitle(u._id) }}
              </div>
            </div>
            
            <!-- Chevron icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import UnreadBadge from './UnreadBadge.vue'

const props = defineProps({ users: Array })

// Debug: Log users prop changes
watch(() => props.users, (newUsers) => {
  console.log('👥 ContactsSidebar users updated:', newUsers?.length, newUsers?.map(u => ({ id: u._id, name: u.name })))
}, { immediate: true })
const chat = useChatStore()
const auth = useAuthStore()
const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWM5Y2E2Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5YzljYTYiLz4KPC9zdmc+Cjwvc3ZnPgo='

// Tab management
const activeTab = ref('contacts')
const showSearch = ref(false)
const searchQuery = ref('')
const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.users
  
  // Filter users based on search query
  const filteredUsers = props.users.filter(u => (u.name || u.username).toLowerCase().includes(q))
  
  // Sort filtered results by unread count first, then by name
  return filteredUsers.sort((a, b) => {
    const aUnread = unread(a._id)
    const bUnread = unread(b._id)
    
    // Prioritize users with unread messages
    if (aUnread > 0 && bUnread === 0) return -1
    if (bUnread > 0 && aUnread === 0) return 1
    if (aUnread > 0 && bUnread > 0) {
      // If both have unread, sort by count (highest first)
      return bUnread - aUnread
    }
    
    // If no unread messages, sort by name
    return (a.name || a.username || '').localeCompare(b.name || b.username || '')
  })
})

// Force reactivity for unread counts
const unreadCounts = computed(() => {
  const counts = {}
  props.users.forEach(user => {
    counts[user._id] = unread(user._id)
  })
  console.log('🔢 unreadCounts computed:', counts)
  return counts
})

// Watch for changes in conversations to update unread counts
watch(() => chat.conversations, () => {
  // Conversations changed, unread counts will update automatically
}, { deep: true })

function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return placeholder
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `http://localhost:4000${avatarUrl}`
}

function presenceDot(id) {
  const status = chat.presence[id]?.status
  return status === 'online' ? 'bg-blue-500' : 'bg-gray-400'
}

function presenceSubtitle(id) {
  const p = chat.presence[id]
  if (!p) {
    // If no presence data, check if user is in our users list and show offline
    const user = props.users.find(u => u._id === id)
    return user ? 'offline' : 'unknown'
  }
  if (p.typing) return 'typing…'
  if (p.status === 'online') return 'online'
  // Show "last seen at [time]" for offline users
  if (p.lastSeen) {
    const lastSeenDate = new Date(p.lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - lastSeenDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'last seen just now'
    if (diffMins < 60) return `last seen ${diffMins}m ago`
    if (diffHours < 24) return `last seen ${diffHours}h ago`
    if (diffDays < 7) return `last seen ${diffDays}d ago`
    return `last seen ${lastSeenDate.toLocaleDateString()}`
  }
  return 'offline'
}

function unread(userId) {
  const me = auth.user?.id
  if (!me) return 0
  
  // Find conversation that includes ONLY the current user and the target user (1-on-1 chat)
  const conv = chat.conversations.find(c => {
    // Check if conversation has exactly 2 participants
    if (!c.participants || c.participants.length !== 2) return false
    
    // Check if both users are participants
    const hasCurrentUser = c.participants.includes(me)
    const hasTargetUser = c.participants.includes(userId)
    
    return hasCurrentUser && hasTargetUser
  })
  
  if (!conv) return 0
  const count = conv.unreadCounts?.[me] || 0
  const result = count > 0 ? count : 0
  
  // Only log if there are unread messages to reduce console spam
  if (result > 0) {
    console.log('🔢 Unread count for user:', userId, 'count:', result, 'conversation:', conv._id)
  }
  
  return result
}

function switchTab(tab) {
  activeTab.value = tab
  showSearch.value = tab === 'search'
  if (tab !== 'search') {
    searchQuery.value = ''
  }
}

</script>

<style scoped>
</style>


