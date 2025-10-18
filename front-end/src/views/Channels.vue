<template>
  <div class="h-full w-full flex bg-white dark:bg-gray-900">
    <!-- Sidebar - Hidden on mobile when channel is open -->
    <div class="w-full md:w-96 lg:w-[400px] h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-800"
         :class="channels.activeChannelId ? 'hidden md:flex' : 'flex'">
      <div class="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-800">
        <!-- Header -->
        <header class="bg-blue-500 dark:bg-blue-600 text-white">
          <div class="px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button @click="sidebarMenuOpen = true" 
                      class="p-2 hover:bg-blue-400 dark:hover:bg-blue-500 rounded-full transition-colors" 
                      title="القائمة">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 class="text-lg font-semibold">القنوات</h2>
            </div>
            <div class="flex items-center gap-1">
              <button @click="showCreateChannel = true" 
                      class="p-2 hover:bg-blue-400 dark:hover:bg-blue-500 rounded-full transition-colors" 
                      title="إنشاء قناة">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Tabs -->
        <div class="px-4 pt-2 pb-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex gap-2">
          <button @click="activeTab = 'owned'" 
                  class="text-xs px-3 py-1 rounded-full transition-colors"
                  :class="activeTab === 'owned' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">
            القنوات الخاصة بي
          </button>
          <button @click="activeTab = 'subscribed'" 
                  class="text-xs px-3 py-1 rounded-full transition-colors"
                  :class="activeTab === 'subscribed' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">
            القنوات المتاحة
          </button>
        </div>

        <!-- Channels List -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="p-4 text-center text-gray-500">
            جاري التحميل...
          </div>
          
          <div v-else-if="filteredChannels.length === 0" class="p-4 text-center text-gray-500">
            <div class="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p class="text-sm">{{ activeTab === 'owned' ? 'لا توجد قنوات خاصة بك أو مشترك بها' : 'لا توجد قنوات متاحة' }}</p>
          </div>

          <div v-else>
            <button v-for="channel in filteredChannels" 
                    :key="channel._id"
                    @click="openChannel(channel._id)"
                    class="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
              
              <!-- Channel Avatar -->
              <div class="relative flex-shrink-0">
                <img :src="getChannelAvatar(channel.avatarUrl)" 
                     class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"/>
                <div v-if="channel.isOwner" 
                     class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <!-- Channel Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {{ channel.name }}
                  </span>
                  <span v-if="channel.isOwner" class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    مالك
                  </span>
                  <span v-else-if="!channel.isSubscriber" class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    متاح للاشتراك
                  </span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ channel.subscriberCount || channel.subscribers?.length || 0 }} مشترك
                </div>
                <div v-if="channel.latestMessage" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                  {{ formatLatestMessage(channel.latestMessage) }}
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                <!-- Subscribe/Unsubscribe Button -->
                <button v-if="!channel.isOwner && !channel.isSubscriber" 
                        @click.stop="subscribeToChannel(channel._id)"
                        class="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                        title="اشتراك">
                  اشتراك
                </button>
                <button v-else-if="!channel.isOwner && channel.isSubscriber" 
                        @click.stop="unsubscribeFromChannel(channel._id)"
                        class="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        title="إلغاء الاشتراك">
                  إلغاء
                </button>
                
                <!-- Chevron -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Channel Details - Full screen on mobile, side-by-side on desktop -->
    <div class="w-full h-full flex flex-col"
         :class="!channels.activeChannelId ? 'hidden md:flex' : 'flex'">
      <div v-if="!channels.activeChannelId" class="flex-1 flex items-center justify-center telegram-background telegram-background-overlay">
        <!-- Empty state with background pattern -->
      </div>

      <div v-else class="flex-1 flex flex-col channel-container">
        <!-- Channel Header -->
        <div class="flex-shrink-0 h-14 md:h-16 px-3 md:px-4 flex items-center justify-between text-white shadow-md" style="background-color: #27a2e1;">
          <div class="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <!-- Back button for mobile -->
            <button @click="backToChannels" 
                    class="md:hidden p-1 hover:bg-gray-700 rounded-full transition-colors mr-2"
                    title="العودة">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <img :src="getChannelAvatar(channels.activeChannel?.avatarUrl)" 
                 class="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-white/30" />
            <div class="truncate flex-1 min-w-0">
              <div class="text-sm md:text-base font-semibold truncate">
                {{ channels.activeChannel?.name }}
              </div>
              <div class="text-xs font-normal truncate opacity-90">
                {{ channels.activeChannel?.subscriberCount || channels.activeChannel?.subscribers?.length || 0 }} مشترك
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-1 md:gap-2">
            <button v-if="!channels.activeChannel?.isOwner && !channels.activeChannel?.isSubscriber"
                    @click="subscribeToChannel(channels.activeChannelId)"
                    class="p-2 hover:bg-blue-400 dark:hover:bg-blue-500 rounded-full transition-colors"
                    title="اشتراك">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            <button v-else-if="!channels.activeChannel?.isOwner"
                    @click="unsubscribeFromChannel(channels.activeChannelId)"
                    class="p-2 hover:bg-blue-400 dark:hover:bg-blue-500 rounded-full transition-colors"
                    title="إلغاء الاشتراك">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Channel Messages -->
        <div ref="channelMessagesContainer"
             class="channel-messages px-3 md:px-4 py-2 space-y-1 telegram-background telegram-background-overlay"
             @wheel="handleWheel">
          
          <div v-if="channels.activeChannelMessages.length === 0" class="h-full flex items-center justify-center">
            <div class="text-center text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p class="text-sm font-medium mb-1">لا توجد رسائل بعد</p>
              <p class="text-xs">ابدأ بإرسال رسالة إلى القناة</p>
            </div>
          </div>
          
          <div v-else>
            <div v-for="message in channels.activeChannelMessages" 
                 :key="`${channels.activeChannelId}-${message._id}`"
                 class="max-w-[85%] md:max-w-[75%] mb-0.5 flex justify-start">
              <div class="px-3 py-2 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm">
                <div class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  {{ message.sender.name || message.sender.username }}
                </div>
                <div class="text-[13.5px] md:text-sm leading-[1.4] whitespace-pre-wrap break-words">
                  {{ message.content }}
                </div>
                <div class="text-[10px] mt-0.5 text-gray-500 dark:text-gray-400">
                  {{ formatTime(message.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Channel Composer (Only for owners) -->
        <div v-if="channels.activeChannel?.isOwner" 
             class="channel-composer px-2 md:px-4 py-2 md:py-3 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div class="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm">
            <input v-model="messageText" 
                   placeholder="اكتب رسالة..." 
                   @keydown.enter.prevent="sendMessage"
                   class="flex-1 bg-transparent text-sm md:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none" />
          </div>
          <button @click="sendMessage"
                  :disabled="!messageText?.trim()"
                  class="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Channel Modal -->
    <div v-if="showCreateChannel" 
         @click="showCreateChannel = false"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div @click.stop
           class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">إنشاء قناة جديدة</h3>
        
        <form @submit.prevent="createChannel">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اسم القناة
              </label>
              <input v-model="newChannel.name" 
                     type="text" 
                     required
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وصف القناة (اختياري)
              </label>
              <textarea v-model="newChannel.description" 
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                صورة القناة (اختياري)
              </label>
              <input @change="handleFileSelect" 
                     type="file" 
                     accept="image/*"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div class="flex items-center gap-3 mt-6">
            <button type="button" 
                    @click="showCreateChannel = false"
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              إلغاء
            </button>
            <button type="submit" 
                    :disabled="!newChannel.name?.trim() || channels.loading"
                    class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ channels.loading ? 'جاري الإنشاء...' : 'إنشاء' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Sidebar Menu -->
    <SidebarMenu :isOpen="sidebarMenuOpen" @close="sidebarMenuOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChannelsStore } from '../stores/channels'
import SidebarMenu from '../components/SidebarMenu.vue'
import { useAuthStore } from '../stores/auth'
import io from 'socket.io-client'

const emit = defineEmits(['openMenu'])

const channels = useChannelsStore()
const auth = useAuthStore()

const activeTab = ref('owned')
let socket = null
const channelMessagesContainer = ref(null)
const showCreateChannel = ref(false)
const messageText = ref('')
const loading = ref(false)
const sidebarMenuOpen = ref(false)

const newChannel = ref({
  name: '',
  description: '',
  avatar: null
})

const filteredChannels = computed(() => {
  if (activeTab.value === 'owned') {
    // Show owned channels AND subscribed channels
    return channels.channels.filter(c => c.isOwner || c.isSubscriber)
  } else {
    // Show all available channels (not just subscribed ones)
    return channels.channels
  }
})

const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTE5IDExSDUmbTE0IDBhMiAyIDAgMDEyIDJ2NmEyIDIgMCAwMS0yIDJINWEyIDIgMCAwMS0yLTJ2LTZhMiAyIDAgMDEyLTJtMTQgMFY5YTIgMiAwIDAwLTItMk01IDExVjljMC0xLjEuOS0yIDItMnYwYTIgMiAwIDAxMiAydjJtMCAwVjVhMiAyIDAgMDEyLTJoNmEyIDIgMCAwMTIgMnYyTTcgN2gxMCIgZmlsbD0iIzljOWNhNiIvPgo8L3N2Zz4KPC9zdmc+Cg=='

onMounted(async () => {
  loading.value = true
  try {
    console.log('📺 Channels.vue: Starting to fetch channels...')
    await channels.fetchChannels()
    console.log('📺 Channels.vue: Channels fetched successfully')
    console.log('📺 Channels.vue: Channels count:', channels.channels.length)
    console.log('📺 Channels.vue: filteredChannels count:', filteredChannels.value.length)
  } catch (error) {
    console.error('Failed to fetch channels:', error)
  } finally {
    loading.value = false
  }

  // Setup Socket.io connection
  if (auth.user) {
    socket = io('http://localhost:4000', {
      auth: {
        token: localStorage.getItem('token')
      }
    })

    // Listen for new channels
    socket.on('channel:created', (channelData) => {
      console.log('📺 Received new channel:', channelData)
      channels.addChannelFromSocket(channelData)
    })

    // Listen for channel updates
    socket.on('channel:updated', (channelData) => {
      console.log('📺 Received channel update:', channelData)
      const index = channels.channels.findIndex(c => c._id === channelData._id)
      if (index !== -1) {
        channels.channels[index] = channelData
      }
    })

    // Listen for channel deletions
    socket.on('channel:deleted', (channelId) => {
      console.log('📺 Received channel deletion:', channelId)
      channels.channels = channels.channels.filter(c => c._id !== channelId)
      if (channels.activeChannelId === channelId) {
        channels.activeChannelId = null
      }
    })

    // Listen for channel messages
    socket.on('channel_message', async (message) => {
      console.log('📺 Received new channel message:', message)
      console.log('📺 Current active channel:', channels.activeChannelId)
      console.log('📺 Message channel ID:', message.channel)
      channels.addChannelMessage(message.channel, message)
      await nextTick()
      console.log('📺 Messages after adding:', channels.activeChannelMessages.length)
    })
  }
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})

function getChannelAvatar(avatarUrl) {
  if (!avatarUrl) return placeholder
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `http://localhost:4000${avatarUrl}`
}

function formatLatestMessage(message) {
  if (message.type === 'text') {
    return message.content
  } else if (message.type === 'image') {
    return '[صورة]'
  } else if (message.type === 'file') {
    return '[ملف]'
  }
  return message.content || ''
}

function formatTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch {
    return ''
  }
}

function handleFileSelect(event) {
  const target = event.target
  const file = target.files?.[0]
  if (file) {
    newChannel.value.avatar = file
  }
}

async function createChannel() {
  if (!newChannel.value.name.trim()) return
  
  try {
    await channels.createChannel({
      name: newChannel.value.name,
      description: newChannel.value.description,
      avatar: newChannel.value.avatar
    })
    
    showCreateChannel.value = false
    newChannel.value = {
      name: '',
      description: '',
      avatar: null
    }
    
    // Switch to owned tab to show the new channel
    activeTab.value = 'owned'
  } catch (error) {
    console.error('Failed to create channel:', error)
  }
}

async function openChannel(channelId) {
  channels.setActiveChannel(channelId)
  
  // Join channel room for real-time messages
  if (socket) {
    socket.emit('channel:join', channelId)
  }
  
  try {
    await channels.fetchChannelMessages(channelId)
    // Scroll to bottom after loading messages
    scrollToBottom()
  } catch (error) {
    console.error('Failed to fetch channel messages:', error)
  }
}

function backToChannels() {
  channels.setActiveChannel(null)
}

// Auto-scroll to bottom when new messages arrive
function scrollToBottom() {
  setTimeout(() => {
    if (channelMessagesContainer.value) {
      channelMessagesContainer.value.scrollTop = channelMessagesContainer.value.scrollHeight
    }
  }, 50)
}

// Handle mouse wheel scrolling
function handleWheel(event) {
  // Allow normal scrolling behavior
  // This function exists to ensure the wheel event is properly handled
  // and doesn't interfere with the container's scrolling
}

// Watch for channel messages changes and auto-scroll
watch(() => channels.activeChannelMessages, () => {
  scrollToBottom()
}, { flush: 'post' })

async function subscribeToChannel(channelId) {
  try {
    await channels.subscribeToChannel(channelId)
    activeTab.value = 'subscribed'
  } catch (error) {
    console.error('Failed to subscribe to channel:', error)
  }
}

async function unsubscribeFromChannel(channelId) {
  try {
    await channels.unsubscribeFromChannel(channelId)
  } catch (error) {
    console.error('Failed to unsubscribe from channel:', error)
  }
}

async function sendMessage() {
  if (!messageText.value.trim() || !channels.activeChannelId) return
  
  try {
    await channels.sendChannelMessage(channels.activeChannelId, {
      content: messageText.value,
      type: 'text'
    })
    
    messageText.value = ''
    // Force scroll to bottom after sending
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
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

/* Ensure smooth scrolling behavior */
.overflow-y-auto {
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch;
}

/* Fix for mouse wheel scrolling */
.overflow-y-auto {
  overscroll-behavior: contain;
}

/* Ensure proper flex layout for channel container */
.channel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.channel-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.channel-composer {
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
}
</style>
