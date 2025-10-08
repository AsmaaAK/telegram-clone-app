<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Telegram-style header -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-4">
      <router-link to="/groups" class="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Group Info</h1>
    </header>
    
    <!-- Content -->
    <div v-if="!group" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-3 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
    <div v-else class="flex-1 overflow-y-auto">
      <div class="max-w-xl mx-auto space-y-6 px-4 py-6">
        <!-- Group header -->
        <div class="flex flex-col items-center text-center">
          <img :src="avatar(group.avatarUrl)" class="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-600 mb-4"/>
          <div class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{{ group.name }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">{{ group.description || 'No description' }}</div>
        </div>

        <!-- Members section -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">Members ({{ group.members.length }})</h3>
          </div>
          <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            <li v-for="m in group.members" :key="m.userId" class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                  {{ userName(m.userId).charAt(0).toUpperCase() }}
                </div>
                <span class="text-gray-900 dark:text-gray-100">{{ userName(m.userId) }}</span>
              </div>
              <span class="text-xs px-2 py-1 rounded-full font-medium" :class="roleClass(m.role)">{{ m.role }}</span>
            </li>
          </ul>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3">
          <button @click="addMember" class="btn-primary flex-1">Add Member</button>
          <button @click="removeMember" class="btn-secondary flex-1">Remove Member</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../utils/api'
import { useGroupsStore } from '../stores/groups'
import { useChatStore } from '../stores/chat'

const route = useRoute()
const router = useRouter()
const groups = useGroupsStore()
const chat = useChatStore()
const id = computed(() => route.params.groupId)
const group = ref(null)

onMounted(async () => {
  const { data } = await api.get(`/groups/${id.value}`)
  group.value = data
})

function avatar(url) {
  if (!url) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPC9zdmc+'
  if (url.startsWith('http')) return url
  return `http://localhost:4000${url}`
}

function roleClass(role) {
  return role === 'owner' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
         role === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
         'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

function userName(userId) {
  const u = chat.users.find(u => u._id === userId)
  return u?.name || u?.username || `User ${userId.slice(-4)}`
}

async function addMember() {
  const uid = prompt('User ID to add')
  if (!uid) return
  await api.put(`/groups/${id.value}`, { addMembers: [uid] })
  const { data } = await api.get(`/groups/${id.value}`)
  group.value = data
  groups.fetchMyGroups()
}

async function removeMember() {
  const uid = prompt('User ID to remove')
  if (!uid) return
  await api.put(`/groups/${id.value}`, { removeMembers: [uid] })
  const { data } = await api.get(`/groups/${id.value}`)
  group.value = data
  groups.fetchMyGroups()
}
</script>

<style scoped>
.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg transition-colors font-medium; }
.btn-secondary { @apply bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg transition-colors font-medium dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700; }
</style>