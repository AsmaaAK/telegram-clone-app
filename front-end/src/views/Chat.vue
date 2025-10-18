<template>
  <div class="h-full w-full flex bg-white dark:bg-gray-900">
    <!-- Sidebar - Hidden on mobile when chat is open -->
    <div class="w-full md:w-96 lg:w-[400px] h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-800"
         :class="chat.activeConversationId ? 'hidden md:flex' : 'flex'">
      <ContactsSidebar :users="sortedUsers" @select="openChat" @openMenu="sidebarMenuOpen = true" />
    </div>
    
    <!-- Chat area - Full screen on mobile, side-by-side on desktop -->
    <div class="w-full h-full flex flex-col"
         :class="!chat.activeConversationId ? 'hidden md:flex' : 'flex'">
      
      <!-- Empty state - No conversation selected -->
      <div v-if="!chat.activeConversationId && chat.users.length === 0" 
           class="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="text-center px-4">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading contacts…</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Please wait</p>
        </div>
      </div>
      
      <div v-else-if="!chat.activeConversationId && chat.users.length > 0" 
           class="flex-1 flex items-center justify-center telegram-background telegram-background-overlay">
        <!-- Empty state with background pattern -->
      </div>
      
      <!-- Active conversation -->
      <template v-else>
        <!-- Mobile back button + Header -->
        <div class="relative">
          <!-- Back button for mobile -->
          <button @click="closeChat" 
                  class="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <ChatHeader :title="currentName" 
                      :subtitle="currentSubtitle" 
                      :avatar="currentAvatar"
                      @voiceCall="onVoiceCall"
                      @pin="handlePin"
                      @block="handleBlock"
                      @clearChat="handleClearChat"
                      @unblockAll="handleUnblockAll" />
        </div>
        
        <!-- Messages area with Telegram-style background -->
        <div ref="messagesContainer"
             class="flex-1 overflow-y-auto px-3 md:px-4 py-2 space-y-1 telegram-background telegram-background-overlay scroll-smooth relative"
             style="height: calc(100vh - 120px); max-height: calc(100vh - 120px);"
             @scroll="handleScroll">
          
          <!-- Scroll to top button -->
          <button v-if="!isNearBottom && !isScrolling"
                  @click="scrollToTop"
                  class="fixed top-20 right-4 z-10 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200"
                  title="Scroll to top">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
          
          <!-- Scroll to bottom button -->
          <button v-if="!isNearBottom"
                  @click="scrollToBottom(true)"
                  class="fixed bottom-20 right-4 z-10 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200"
                  title="Scroll to bottom">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          <!-- Empty state -->
          <div v-if="messages.length === 0" class="h-full flex items-center justify-center">
            <div class="text-center text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p class="text-sm font-medium mb-1">No messages yet</p>
              <p class="text-xs">Send a message to start the conversation</p>
            </div>
          </div>
          
          <!-- Messages -->
          <MessageBubble v-for="m in messages" 
                        :key="m._id" 
                        :from-me="m.from===auth.user?.id" 
                        :type="m.type" 
                        :content="m.content" 
                        :time="formatTime(m.createdAt)"
                        :is-read="m.isRead || false" />
        </div>
        
        <Composer v-model="text" 
                  @send="send" 
                  @typing="onTyping"
                  @fileSelect="handleFileSelect" />

        <!-- Voice Call UI -->
        <div v-if="chat.webrtc?.status === 'incoming'" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50"></div>
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-[90%] max-w-sm p-6 text-center">
            <img :src="currentAvatar || placeholder" class="w-16 h-16 rounded-full mx-auto mb-3 object-cover"/>
            <div class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{{ currentName }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">Incoming voice call…</div>
            <div class="flex items-center justify-center gap-3">
              <button @click="acceptCall" class="text-white px-4 py-2 rounded-full" style="background-color: #27a2e1;">Accept</button>
              <button @click="rejectCall" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full">Decline</button>
            </div>
          </div>
        </div>

        <div v-if="chat.webrtc?.status === 'calling' || chat.webrtc?.status === 'connected'" class="fixed bottom-3 right-3 z-40">
          <div class="text-white rounded-full shadow-lg flex items-center gap-2 px-4 py-2" style="background-color: #27a2e1;">
            <span class="text-sm">{{ chat.webrtc.status === 'calling' ? 'Calling…' : 'In call' }}</span>
            <button @click="toggleMute" class="p-1 rounded-full hover:bg-white/20" :title="chat.webrtc.muted ? 'Unmute' : 'Mute'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path v-if="!chat.webrtc.muted" d="M9 4.804A3.001 3.001 0 0011 7v3a3 3 0 11-6 0V7a3.001 3.001 0 002-2.196V3a1 1 0 112 0v1.804z" />
                <path v-else fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l10 10a1 1 0 11-1.414 1.414l-2.121-2.121A6.002 6.002 0 0110 17a6 6 0 01-6-6 1 1 0 112 0 4 4 0 008 0v-.586l-2-2V10a6 6 0 01-1.293 3.707L4.293 4.293z" clip-rule="evenodd" />
              </svg>
            </button>
            <button @click="endCall" class="p-1 rounded-full hover:bg-white/20" title="End call">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884l2 2A8 8 0 0110 6c2.21 0 4.21.896 5.997 2.346l2-2A10 10 0 0010 4C6.686 4 3.686 5.343 2.003 5.884zM2 14a1 1 0 011-1h2.586l2-2H4a3 3 0 00-3 3 1 1 0 001 1h3.586l2-2H3a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>
          <!-- Hidden audio to play remote stream -->
          <audio ref="remoteAudio" autoplay></audio>
        </div>
      </template>
    </div>
    
    <!-- Sidebar Menu -->
    <SidebarMenu :isOpen="sidebarMenuOpen" @close="sidebarMenuOpen = false" />
  </div>
  
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import api from '../utils/api'
import ContactsSidebar from '../components/ContactsSidebar.vue'
import ChatHeader from '../components/ChatHeader.vue'
import SidebarMenu from '../components/SidebarMenu.vue'
import { useGroupsStore } from '../stores/groups'

function onVoiceCall() {
  // Only for 1-1 chats
  if (!otherId.value) return
  chat.startVoiceCall(otherId.value)
}
import Composer from '../components/Composer.vue'
import MessageBubble from '../components/MessageBubble.vue'
import { onBeforeUnmount, watch } from 'vue'

const auth = useAuthStore()
const chat = useChatStore()
const text = ref('')
const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWM5Y2E2Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDE0IDcgMTUuMzMgNyAxOFYyMEgxN1YxOEMxNyAxNS4zMyAxNC42NyAxNCAxMiAxNFoiIGZpbGw9IiM5YzljYTYiLz4KPC9zdmc+Cjwvc3ZnPgo='
const messagesContainer = ref(null)
const isDark = ref(false)
let typingTimeout = null
const remoteAudio = ref(null)
const sidebarMenuOpen = ref(false)

onMounted(() => { 
  chat.bootstrap()
  // Check dark mode
  isDark.value = document.documentElement.classList.contains('dark')
  // Scroll to bottom when messages change
  scrollToBottom()
  // bind remote audio stream
  watch(() => chat.webrtc?.remoteStream, (s) => {
    if (remoteAudio.value && s) {
      try { remoteAudio.value.srcObject = s } catch {}
    }
  })
})

onBeforeUnmount(() => {
  if (chat.webrtc?.status === 'connected' || chat.webrtc?.status === 'calling') {
    chat.endCall()
  }
})

// Scroll state management
const isNearBottom = ref(true)
const isScrolling = ref(false)
let scrollTimeout = null

function scrollToBottom(force = false) {
  if (!messagesContainer.value) return
  
  // If user is manually scrolling and not near bottom, don't auto-scroll
  if (!force && !isNearBottom.value) return
  
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      isNearBottom.value = true
    }
  }, 50)
}

function handleScroll() {
  if (!messagesContainer.value) return
  
  const container = messagesContainer.value
  const threshold = 100 // pixels from bottom
  
  // Check if user is near bottom
  const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
  isNearBottom.value = isAtBottom
  
  // Set scrolling state
  isScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
  }, 150)
}

function scrollToTop() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = 0
  }
}

function scrollToMessage(messageIndex) {
  if (!messagesContainer.value) return
  
  const messages = messagesContainer.value.children
  if (messages[messageIndex]) {
    messages[messageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function closeChat() {
  chat.activeConversationId = null
}

const messages = computed(() => {
  const convId = chat.activeConversationId
  const msgs = convId ? (chat.messagesByConv[convId] || []) : []
  console.log('🔍 messages computed:', {
    activeConversationId: convId,
    messageCount: msgs.length,
    messages: msgs.map(m => ({ id: m._id, from: m.from, to: m.to, content: m.content?.substring(0, 50) }))
  })
  return msgs
})

// Watch for messages changes and auto-scroll (only if near bottom)
watch(messages, () => {
  // Only auto-scroll if user is near bottom or just sent a message
  if (isNearBottom.value) {
    scrollToBottom()
  }
}, { flush: 'post' })

// Computed property for sorted users
const sortedUsers = computed(() => {
  const users = chat.getSortedUsers()
  console.log('👥 Sorted users:', users.map(u => ({ 
    id: u._id, 
    name: u.name, 
    lastMessage: chat.conversations.find(c => 
      c.participants.length === 2 && 
      c.participants.includes(u._id) && 
      c.participants.includes(auth.user?.id || '')
    )?.lastMessageAt 
  })))
  return users
})
const currentConv = computed(() => {
  const conv = chat.conversations.find(c => c._id === chat.activeConversationId)
  console.log('🔍 currentConv computed:', {
    activeConversationId: chat.activeConversationId,
    foundConversation: conv,
    allConversations: chat.conversations.map(c => ({ id: c._id, participants: c.participants }))
  })
  return conv
})
const currentName = computed(() => currentConv.value ? otherParticipantName(currentConv.value) : '')
const currentAvatar = computed(() => {
  const id = otherId.value
  if (!id) return placeholder
  const u = chat.users.find(u => u._id === id)
  return u?.avatarUrl || placeholder
})
const otherId = computed(() => {
  if (!currentConv.value?.participants || !auth.user?.id) return null
  // Find the participant that is NOT the current user
  const otherId = currentConv.value.participants.find((p) => p !== auth.user.id) || null
  console.log('🔍 otherId computed:', {
    currentConvId: currentConv.value._id,
    participants: currentConv.value.participants,
    currentUserId: auth.user.id,
    otherId
  })
  return otherId
})
const typingFromOther = computed(() => !!(otherId.value && chat.presence[otherId.value]?.typing))

// Compute subtitle to show online/last seen/typing status
const currentSubtitle = computed(() => {
  const id = otherId.value
  if (!id) return ''
  const p = chat.presence[id]
  if (!p) {
    // If no presence data, check if user is in our users list and show offline
    const user = chat.users.find(u => u._id === id)
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
})

function otherParticipantName(c) {
  if (!c?.participants || !auth.user?.id) return 'Chat'
  
  // For 1-on-1 chats, find the participant that is NOT the current user
  const otherId = c.participants.find((p) => p !== auth.user.id)
  if (!otherId) return 'Chat'
  
  // Find the user in the users list by matching the ID exactly
  const user = chat.users.find(u => u._id === otherId)
  console.log(' otherParticipantName:', {
    conversationId: c._id,
    participants: [...c.participants],
    currentUserId: auth.user.id,
    otherId,
    foundUser: user,
    allUsers: chat.users.map(u => ({ id: u._id, name: u.name })),
    isDirectChat: c.participants.length === 2
  })
  
  // Return the user's name, username, or a fallback
  return user?.name || user?.username || `User ${otherId.slice(-4)}`
}

async function send() {
  if (!chat.activeConversationId || !text.value.trim()) return
  if (!otherId.value) return
  await chat.sendText(chat.activeConversationId, otherId.value, text.value)
  text.value = ''
  // Force scroll to bottom when sending a message
  scrollToBottom(true)
}
 
function onTyping() {
  if (!otherId.value) return
  
  // Send typing indicator
  chat.typing(otherId.value, true)
  
  // Clear previous timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
  
  // Stop typing after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    if (otherId.value) {
      chat.typing(otherId.value, false)
    }
  }, 3000)
}

function acceptCall() { chat.acceptIncomingCall() }
function rejectCall() { chat.rejectIncomingCall() }
function toggleMute() { chat.toggleMute() }
function endCall() { chat.endCall() }

function handlePin() {
  alert('Pin chat feature - Coming soon!')
  console.log('Pin conversation:', chat.activeConversationId)
}

async function handleBlock() {
  if (!otherId.value) return
  const userName = currentName.value
  if (!confirm(`Are you sure you want to block ${userName}?`)) return
  try {
    console.log('Attempting to block user:', otherId.value)
    const response = await api.post(`/users/${otherId.value}/block`)
    console.log('Block response:', response.data)
    alert(`${userName} has been blocked successfully`)
    // Optionally close the conversation
    // chat.activeConversationId = null
  } catch (err) {
    console.error('Failed to block user:', err)
    console.error('Error details:', err?.response?.data)
    console.error('Error status:', err?.response?.status)
    const message = err?.response?.data?.message || 'Failed to block user'
    alert(` ${message}`)
  }
}

async function handleUnblockAll() {
  if (!confirm('Are you sure you want to unblock all users? This will clear all blocking relationships.')) return
  try {
    console.log('Attempting to unblock all users...')
    
    // Get all users and unblock them
    const users = chat.users
    for (const user of users) {
      try {
        await api.post(`/users/${user._id}/block`)
        console.log(`Unblocked user: ${user.name || user.username}`)
      } catch (err) {
        console.error(`Failed to unblock user ${user.name}:`, err)
      }
    }
    
    alert('All users have been unblocked successfully!')
  } catch (err) {
    console.error('Failed to unblock users:', err)
    alert(` Failed to unblock users: ${err?.response?.data?.message || err.message}`)
  }
}

async function handleClearChat() {
  if (!chat.activeConversationId) return
  if (!confirm('Are you sure you want to clear all messages in this chat?')) return
  try {
    // Clear local messages using the store method
    chat.clearMessages(chat.activeConversationId)
    alert('Chat cleared successfully')
  } catch (err) {
    console.error('Failed to clear chat:', err)
    alert('Failed to clear chat')
  }
}

async function handleFileSelect(file) {
  if (!chat.activeConversationId || !otherId.value) {
    console.error(' Cannot upload file: missing conversation ID or recipient ID')
    return
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    alert('File too large. Maximum size is 10MB.')
    return
  }
  
  try {
    console.log('📎 Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      conversationId: chat.activeConversationId,
      recipientId: otherId.value
    })
    
    const formData = new FormData()
    formData.append('file', file)  // Backend expects 'file'
    formData.append('to', otherId.value)
    
    // Upload file - Let browser set Content-Type header with boundary automatically
    const { data } = await api.post(`/conversations/${chat.activeConversationId}/messages`, formData)
    
    console.log('File uploaded successfully:', data)
    
    // Add message to local state
    const arr = chat.messagesByConv[chat.activeConversationId] || (chat.messagesByConv[chat.activeConversationId] = [])
    const exists = arr.find(m => m._id === data._id)
    if (!exists) {
      arr.push(data)
      // Force reactivity update
      chat.messagesByConv = { ...chat.messagesByConv }
      
      // Update conversation lastMessageAt and move to top
      const conv = chat.conversations.find(c => c._id === chat.activeConversationId)
      if (conv) {
        conv.lastMessageAt = new Date(data.createdAt)
        chat.moveConversationToTop(conv._id)
        // Force reactivity update for conversations
        chat.conversations = [...chat.conversations]
      }
    }
    
    console.log('📎 File sent successfully:', data)
  } catch (err) {
    console.error(' Failed to send file:', err)
    console.error(' Error response:', err?.response?.data)
    console.error(' Error status:', err?.response?.status)
    
    let message = 'Failed to send file. Please try again.'
    
    if (err?.response?.data?.message) {
      message = err.response.data.message
    } else if (err?.response?.data?.errors) {
      // Handle validation errors
      const errors = err.response.data.errors
      message = `Validation error: ${errors.map((e) => e.msg).join(', ')}`
    } else if (err?.code === 'NETWORK_ERROR') {
      message = 'Network error. Please check your connection.'
    }
    
    alert(` ${message}`)
  }
}
 
  function presenceClass(c) {
    const id = c.participants ? c.participants.find((p) => p !== auth.user?.id) : otherId.value
    const status = id ? chat.presence[id]?.status : 'offline'
    return status === 'online' ? 'bg-blue-500' : 'bg-gray-400'
  }

  function presenceDot(id) {
    const status = chat.presence[id]?.status
    return status === 'online' ? 'bg-blue-500' : 'bg-gray-400'
  }

  function presenceSubtitle(id) {
    const p = chat.presence[id]
    if (!p) return 'offline'
    if (p.typing) return 'typing…'
    return p.status === 'online' ? 'online' : 'offline'
  }

  async function openChat(userId) {
    try {
      console.log('🔍 Opening chat for user:', userId)
      console.log('🔍 Current chat state:', {
        activeConversationId: chat.activeConversationId,
        conversationsCount: chat.conversations.length,
        usersCount: chat.users.length,
        users: chat.users.map(u => ({ id: u._id, name: u.name }))
      })
      
      await chat.openOrCreateConversation(userId)
      
      console.log('Chat opened for user:', userId)
      console.log('New chat state:', {
        activeConversationId: chat.activeConversationId,
        currentConv: currentConv.value,
        otherId: otherId.value,
        currentName: currentName.value
      })
    } catch (error) {
      console.error(' Failed to open chat:', error)
    }
  }

  function formatTime(iso) {
    if (!iso) return ''
    try { return new Date(iso).toLocaleTimeString() } catch { return '' }
  }

</script>

<style scoped>
.input { @apply border rounded px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700; }
.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded; }
</style>


