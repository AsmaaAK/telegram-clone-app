<template>
  <div class="h-full w-full flex flex-col">
    <div class="relative">
      <router-link to="/groups" class="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center">
        <h2 class="font-semibold">Group Info</h2>
      </div>
    </div>
    <div v-if="!group" class="p-4">Loading…</div>
    <div v-else class="p-4 space-y-6">
      <div class="flex items-center gap-4">
        <img :src="avatar(group.avatarUrl)" class="w-16 h-16 rounded-full object-cover"/>
        <div class="flex-1">
          <div class="text-lg font-semibold">{{ group.name }}</div>
          <div class="text-sm text-gray-500">{{ group.description }}</div>
        </div>
      </div>

      <div>
        <div class="text-sm font-medium mb-2">Members ({{ group.members.length }})</div>
        <ul class="divide-y divide-gray-200 dark:divide-gray-800 rounded border border-gray-200 dark:border-gray-800">
          <li v-for="m in group.members" :key="m.userId" class="px-3 py-2 flex items-center justify-between">
            <span>{{ userName(m.userId) }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full" :class="roleClass(m.role)">{{ m.role }}</span>
          </li>
        </ul>
      </div>

      <div class="flex gap-2">
        <button @click="addMember" class="btn-primary">Add Member</button>
        <button @click="removeMember" class="btn-secondary">Remove Member</button>
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
const id = computed(() => route.params.groupId as string)
const group = ref<any>(null)

onMounted(async () => {
  const { data } = await api.get(`/groups/${id.value}`)
  group.value = data
})

function avatar(url?: string) {
  if (!url) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPC9zdmc+'
  if (url.startsWith('http')) return url
  return `http://localhost:4000${url}`
}

function roleClass(role: string) {
  return role === 'owner' ? 'bg-emerald-600 text-white' : role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
}

function userName(userId: string) {
  const u = chat.users.find(u => u._id === userId)
  return u?.name || u?.username || userId.slice(-4)
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
.btn-primary { @apply bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded; }
.btn-secondary { @apply bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700; }
</style>


