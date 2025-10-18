<template>
  <div class="min-h-screen w-full flex items-center justify-center px-4 bg-white dark:bg-gray-900">
    <div class="w-full max-w-sm">
      <!-- Telegram Logo and Title -->
      <div class="text-center mb-8">
        <div class="mx-auto mb-4 w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 text-white">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join Telegram</h1>
        <p class="text-gray-500 dark:text-gray-400">Please enter your details to create an account.</p>
      </div>

      <!-- Registration Form -->
      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
          <input 
            id="name" 
            v-model="form.name" 
            type="text" 
            autocomplete="name" 
            placeholder="Enter your full name" 
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors" 
          />
        </div>
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
          <input 
            id="username" 
            v-model="form.username" 
            type="text" 
            autocomplete="username" 
            placeholder="Choose a username" 
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors" 
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
          <input 
            id="password" 
            v-model="form.password" 
            type="password" 
            autocomplete="new-password" 
            placeholder="Create a password" 
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors" 
          />
        </div>
        
        <button 
          type="submit"
          :disabled="loading"
          class="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
        
        <p v-if="error" class="text-sm text-red-600 dark:text-red-400 mt-2 text-center">{{ error }}</p>
      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Already have an account? 
          <router-link 
            :to="{ name: 'login' }" 
            class="text-blue-500 hover:text-blue-600 font-medium"
          >
            Sign in
          </router-link>
        </p>
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
    router.push({ name: 'home' })
  } catch (e) {
    error.value = e?.response?.data?.message || 'Registration failed'
  } finally { loading.value = false }
}
</script>

<style scoped>
/* Telegram-like styling */
.telegram-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Custom focus styles */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>


