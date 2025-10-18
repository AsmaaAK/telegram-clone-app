<template>
  <header class="h-14 md:h-16 px-3 md:px-4 flex items-center justify-between text-white shadow-md" style="background-color: #27a2e1;">
    <div class="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
      <!-- Avatar -->
      <div class="relative flex-shrink-0">
        <img :src="getAvatarUrl(avatar)" 
             class="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-white/30" />
        <!-- Online indicator -->
        <span v-if="subtitle === 'online'" 
              class="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-400 rounded-full ring-2 ring-blue-500 dark:ring-blue-600"></span>
      </div>
      
      <!-- User info -->
      <div class="truncate flex-1 min-w-0">
        <div class="text-sm md:text-base font-semibold truncate">
          {{ title }}
        </div>
        <div class="text-xs font-normal truncate opacity-90" 
             :class="subtitle === 'typing…' ? 'italic' : ''">
          {{ subtitle || 'offline' }}
        </div>
      </div>
    </div>
    
    <!-- Action buttons -->
    <div class="flex items-center gap-1 md:gap-2 text-white">
      <!-- Video call button -->
      <button class="p-2 hover:bg-gray-700 rounded-full transition-colors flex" title="Video call">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
      <!-- Voice call button -->
      <button @click="$emit('voiceCall')" class="p-2 hover:bg-gray-700 rounded-full transition-colors flex" title="Voice call">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>
      
      <slot name="actions" />
      
      <!-- More options button with dropdown -->
      <div class="relative">
        <button @click="showMenu = !showMenu" 
                class="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        
        <!-- Backdrop -->
        <div v-if="showMenu" 
             @click="showMenu = false"
             class="fixed inset-0 z-10" />
        
        <!-- Dropdown Menu -->
        <div v-if="showMenu"
             class="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20 overflow-hidden">
          <button @click="handlePin" 
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span class="font-medium">Pin Chat</span>
          </button>
          
          <button @click="handleBlock" 
                  class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span class="font-medium">Block User</span>
          </button>
          
          <button @click="handleUnblockAll" 
                  class="w-full px-4 py-3 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-3 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span class="font-medium">Unblock All Users</span>
          </button>
          
          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          
          <button @click="handleClearChat" 
                  class="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span class="font-medium">Clear Chat</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

defineProps(['title', 'subtitle', 'avatar'])
const emit = defineEmits(['pin', 'block', 'clearChat', 'unblockAll', 'voiceCall'])

const showMenu = ref(false)
const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWM5Y2E2Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5YzljYTYiLz4KPC9zdmc+Cjwvc3ZnPgo='

function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return placeholder
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `http://localhost:4000${avatarUrl}`
}

function handlePin() {
  showMenu.value = false
  emit('pin')
}

function handleBlock() {
  showMenu.value = false
  emit('block')
}

function handleClearChat() {
  showMenu.value = false
  emit('clearChat')
}

function handleUnblockAll() {
  showMenu.value = false
  emit('unblockAll')
}
</script>

<style scoped>
</style>


