<template>
  <div class="h-full w-full flex bg-white dark:bg-gray-900">
    <div class="w-full md:w-80 lg:w-96 h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-800"
         :class="groups.activeGroupId ? 'hidden md:flex' : 'flex'">
      <aside class="w-full h-full flex flex-col">
        <!-- Telegram-style header -->
        <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div class="px-4 py-4 flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Telegram</h2>
            <div class="flex items-center gap-2">
              <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Search">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button @click="openCreate" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="New group">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
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
                     placeholder="Search groups" 
                     class="w-full text-sm pl-10 pr-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-700 transition-all" />
            </div>
          </div>
        </header>

        <!-- Groups list -->
        <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          <button v-for="g in filteredGroups" :key="g._id"
                  @click="groups.setActiveGroup(g._id)"
                  class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-800/50">
            <img :src="avatar(g.avatarUrl)" class="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600"/>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ g.name }}</span>
                <span v-if="unread(g)" class="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{{ unread(g) }}</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ g.lastMessagePreview || 'No messages yet' }}</div>
            </div>
          </button>
        </div>
      </aside>
    </div>
    <div class="w-full h-full flex flex-col" :class="!groups.activeGroupId ? 'hidden md:flex' : 'flex'">
      <div v-if="!groups.activeGroupId" class="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="text-center px-4">
          <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Telegram Groups</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Select a group to start messaging</p>
        </div>
      </div>
      <template v-else>
        <!-- Mobile back button + Header -->
        <div class="relative">
          <button @click="closeActive" class="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <ChatHeader :title="currentGroup?.name || ''" :subtitle="groupSubtitle" :avatar="currentGroupAvatar" />
        </div>
        <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          <MessageBubble v-for="m in currentMessages" :key="m._id" :from-me="m.senderId===me" :type="m.type" :content="m.content" :time="time(m.createdAt)" />
        </div>
        <Composer v-model="text" @send="send" @fileSelect="handleFileSelect" />
      </template>
    </div>

    <!-- Create Group Modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeCreate"></div>
      <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div class="font-semibold text-lg">Create Group</div>
          <button @click="closeCreate" class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Group name</label>
            <input v-model="createName" class="w-full input" placeholder="My Group" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Select members</label>
            <div class="relative mb-2">
              <input v-model="createQuery" class="w-full input" placeholder="Search contacts" />
            </div>
            <div class="max-h-60 overflow-y-auto border rounded-lg border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
              <label v-for="u in filteredContacts" :key="u._id" class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input type="checkbox" :value="u._id" v-model="selectedMembers" />
                <img :src="avatar(u.avatarUrl)" class="w-8 h-8 rounded-full object-cover"/>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-900 dark:text-gray-100 truncate">{{ u.name || u.username }}</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button @click="closeCreate" class="btn-secondary">Cancel</button>
          <button @click="confirmCreate" class="btn-primary" :disabled="!createName.trim()">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useGroupsStore } from '../stores/groups'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import ChatHeader from '../components/ChatHeader.vue'
import MessageBubble from '../components/MessageBubble.vue'
import Composer from '../components/Composer.vue'

const groups = useGroupsStore()
const auth = useAuthStore()
const chat = useChatStore()
const text = ref('')
const messagesContainer = ref(null)
const isDark = ref(false)
const query = ref('')

// Create group state
const showCreate = ref(false)
const createName = ref('')
const createQuery = ref('')
const selectedMembers = ref([])

onMounted(async () => {
  await groups.fetchMyGroups()
  groups.initSocket()
  isDark.value = document.documentElement.classList.contains('dark')
  // Ensure contacts loaded for selector
  await chat.fetchContacts()
})

const me = computed(() => auth.user?.id || '')
const currentGroup = computed(() => groups.groups.find(g => g._id === groups.activeGroupId))
const currentMessages = computed(() => groups.activeGroupId ? (groups.messagesByGroup[groups.activeGroupId] || []) : [])
const currentGroupAvatar = computed(() => avatar(currentGroup.value?.avatarUrl))
const groupSubtitle = computed(() => `${currentGroup.value?.members.length || 0} members`)
const filteredGroups = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return groups.groups
  return groups.groups.filter(g => g.name.toLowerCase().includes(q))
})
const filteredContacts = computed(() => {
  const q = createQuery.value.trim().toLowerCase()
  return chat.users.filter(u => (u.name || u.username || '').toLowerCase().includes(q))
})

function avatar(url) {
  if (!url) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPC9zdmc+'
  if (url.startsWith('http')) return url
  return `http://localhost:4000${url}`
}

function unread(g) {
  const id = auth.user?.id
  if (!id) return 0
  return g.unreadCounts?.[id] || 0
}

function time(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString() } catch { return '' }
}

async function send() {
  if (!groups.activeGroupId || !text.value.trim()) return
  await groups.sendText(groups.activeGroupId, text.value)
  text.value = ''
}

function closeActive() {
  groups.activeGroupId = null
}

async function handleFileSelect(_file) {
  alert('File sending in groups via HTTP fallback can be added similarly')
}

function openCreate() {
  showCreate.value = true
  createName.value = ''
  createQuery.value = ''
  selectedMembers.value = []
}

function closeCreate() {
  showCreate.value = false
}

async function confirmCreate() {
  if (!createName.value.trim()) return
  // include self implicitly on server; we send selected members only
  const payload = { name: createName.value.trim(), members: selectedMembers.value }
  const { data } = await api.post('/groups', payload)
  groups.groups.unshift(data)
  await groups.setActiveGroup(data._id)
  showCreate.value = false
}

import api from '../utils/api'
</script>

<style scoped>
.input { @apply border rounded-lg px-4 py-2.5 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition; }
.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg transition-colors; }
.btn-secondary { @apply bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700; }
</style>