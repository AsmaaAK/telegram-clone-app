<template>
  <form class="px-2 md:px-4 py-2 md:py-3 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700" 
        @submit.prevent="handleSend">
    
    <!-- Emoji picker button -->
    <div class="relative flex-shrink-0">
      <button type="button" 
              @click="showEmojiPicker = !showEmojiPicker"
              class="icon-btn" 
              title="Emoji">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      <!-- WhatsApp-style emoji picker -->
      <div v-if="showEmojiPicker" 
           @click.stop
           class="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
           style="width: 320px;">
        <!-- Emoji picker header -->
        <div class="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Emoji</h3>
        </div>
        
        <!-- Emoji grid with scroll -->
        <div class="p-2 max-h-64 overflow-y-auto custom-scrollbar">
          <div class="grid grid-cols-8 gap-0.5">
            <button v-for="emoji in emojis" 
                    :key="emoji"
                    type="button"
                    @click="insertEmoji(emoji)"
                    class="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-110 active:scale-95"
                    :title="emoji">
              {{ emoji }}
            </button>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">Tap to insert</p>
        </div>
      </div>
    </div>
    
    <!-- Message input container -->
    <div class="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-sm">
      <!-- Message input -->
      <input ref="textInput"
             v-model="model" 
             :placeholder="placeholder || 'Message'" 
             @input="$emit('typing')" 
             @keydown.enter.prevent="handleSend"
             class="flex-1 bg-transparent text-sm md:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none" 
             autocomplete="off" />
      
      <!-- Attach file button -->
      <div class="relative flex-shrink-0">
        <input ref="fileInput" 
               type="file" 
               accept="image/*,video/*,application/pdf,.doc,.docx"
               @change="handleFileSelect"
               class="hidden" />
        <button type="button" 
                @click="fileInput?.click()"
                class="icon-btn-sm" 
                title="Attach">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
    </button>
      </div>
    </div>
    
    <!-- Send button -->
    <button type="submit"
            class="btn-send flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" 
            :disabled="!model?.trim()">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    </button>
  </form>
  
  <!-- Click outside to close emoji picker -->
  <div v-if="showEmojiPicker" 
       @click="showEmojiPicker = false"
       class="fixed inset-0 z-10" />
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps(['modelValue', 'placeholder'])
const emit = defineEmits(['update:modelValue', 'send', 'typing', 'fileSelect'])

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const showEmojiPicker = ref(false)
const fileInput = ref(null)
const textInput = ref(null)

// Common emojis
const emojis = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
  '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞',
  '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩',
  '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
  '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏',
  '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💯', '💢', '💥', '💫', '💦', '💨', '🕊️', '🎉',
  '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐',
  '🌟', '✨', '💖', '💝', '🔥', '✅', '❌', '⚡'
]

function insertEmoji(emoji) {
  const current = model.value || ''
  model.value = current + emoji
  showEmojiPicker.value = false
  // Focus back on input
  setTimeout(() => {
    textInput.value?.focus()
  }, 100)
}

function handleFileSelect(event) {
  const target = event.target
  const file = target.files?.[0]
  if (file) {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.')
      return
    }
    
    // Check file type
    const allowedTypes = ['image/', 'video/', 'application/pdf', '.doc', '.docx']
    const isAllowed = allowedTypes.some(type => 
      file.type.startsWith(type) || file.name.toLowerCase().endsWith(type)
    )
    
    if (!isAllowed) {
      alert('File type not supported. Please select an image, video, PDF, or document.')
      return
    }
    
    console.log('📎 File selected:', file.name, file.type, file.size)
    emit('fileSelect', file)
    // Clear input
    if (fileInput.value) fileInput.value.value = ''
  }
}

function handleSend() {
  if (model.value?.trim()) {
    emit('send')
  }
}
</script>

<style scoped>
.icon-btn { 
  @apply w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full 
         text-gray-600 dark:text-gray-400 
         hover:bg-gray-200 dark:hover:bg-gray-700 
         active:scale-95 transition-all; 
}

.icon-btn-sm { 
  @apply w-8 h-8 flex items-center justify-center rounded-full 
         text-gray-500 dark:text-gray-400 
         hover:bg-gray-100 dark:hover:bg-gray-800 
         active:scale-95 transition-all; 
}

.btn-send { 
  @apply w-11 h-11 md:w-12 md:h-12 flex items-center justify-center
         bg-blue-500 hover:bg-blue-600 active:scale-95
         text-white rounded-full transition-all shadow-lg; 
}

/* Custom scrollbar for emoji picker */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>


