<template>
  <div class="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-8">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-8 w-8">
              <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Account</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Join Telegram today</p>
        </div>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" for="name">Name</label>
            <input id="name" v-model="form.name" type="text" autocomplete="name" 
                   class="w-full input" placeholder="Enter your name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" for="username">Username</label>
            <input id="username" v-model="form.username" type="text" inputmode="text" autocomplete="username" 
                   class="w-full input" placeholder="Choose a username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" for="password">Password</label>
            <input id="password" v-model="form.password" type="password" autocomplete="new-password" 
                   class="w-full input" placeholder="Create a password" />
          </div>
          <button class="btn-primary w-full py-3 text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed" :disabled="loading">
            {{ loading ? 'Creating Account…' : 'Create Account' }}
          </button>
          <p v-if="error" class="text-sm text-red-600 dark:text-red-400 text-center mt-2">{{ error }}</p>
        </form>
        <div class="mt-6 text-center">
          <router-link class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium" :to="{ name: 'login' }">
            Already have an account? Sign in
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({ name: '', username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.register(form)
    router.push({ name: 'chat' })
  } catch (e) {
    error.value = e?.response?.data?.message || 'Registration failed'
  } finally { loading.value = false }
}
</script>

<style scoped>
@reference "tailwindcss";
.input { @apply border rounded-lg px-4 py-3 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition; }
.btn-primary { @apply bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-3 rounded-lg transition shadow-sm; }
</style>