<template>
  <aside class="w-full h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
    <!-- Telegram-style header -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Telegram</h2>
        <div class="flex items-center gap-2">
          <!-- Search button -->
          <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Search">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <!-- New chat button -->
          <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="New chat">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <!-- Menu button -->
          <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Search bar -->
      <div class="px-4 pb-3">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="query" 
                 type="text" 
                 placeholder="Search" 
                 class="w-full text-sm pl-10 pr-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-700 transition-all" />
        </div>
      </div>
    </header>

    <!-- Chats list -->
    <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
      <button v-for="u in filtered" :key="u._id" 
              @click="$emit('select', u._id)" 
              class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-800/50 relative group">
        
        <!-- Avatar with online indicator -->
        <div class="relative flex-shrink-0">
          <img :src="getAvatarUrl(u.avatarUrl)" 
               class="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600"/>
          <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900" 
                :class="presenceDot(u._id)"></span>
        </div>
        
        <!-- User info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {{ u.name || u.username || `User ${u._id.slice(-4)}` }}
            </span>
            <!-- Unread badge -->
            <UnreadBadge 
              :count="unreadCounts[u._id]" 
              class="ml-auto flex-shrink-0"
            />
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            <span>{{ presenceSubtitle(u._id) }}</span>
          </div>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import UnreadBadge from './UnreadBadge.vue'

const props = defineProps({ users: Array })
const chat = useChatStore()
const auth = useAuthStore()
const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWM5Y2E2Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5YzljYTYiLz4KPC9zdmc+Cjwvc3ZnPgo='
const query = ref('')
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
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
  return status === 'online' ? 'bg-green-500' : 'bg-gray-400'
}

function presenceSubtitle(id) {
  const p = chat.presence[id]
  if (!p) {
    // If no presence data, check if user is in our users list and show offline
    const user = props.users.find(u => u._id === id)
    return user ? 'last seen recently' : 'unknown'
  }
  if (p.typing) return 'typing...'
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
  return 'last seen recently'
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
</script>

<style scoped>
</style>