<template>
  <div class="max-w-[85%] md:max-w-[75%] mb-0.5 flex" :class="fromMe ? 'ml-auto justify-end' : 'justify-start'">
    <div class="relative inline-block max-w-full">
      <!-- Message bubble -->
      <div class="px-3 py-2 rounded-lg shadow-sm" 
           :class="fromMe 
             ? 'bg-green-400 text-white rounded-tr-sm' 
             : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'">
        
        <!-- Text Message -->
        <div v-if="type==='text'" class="text-[13.5px] md:text-sm leading-[1.4] whitespace-pre-wrap break-words">
          {{ content }}
        </div>
        
        <!-- Image Message -->
        <div v-else-if="type==='image'" class="rounded-md overflow-hidden">
          <img v-if="!imageError"
               :src="getImageUrl(content)" 
               class="max-h-80 max-w-full w-auto cursor-pointer hover:opacity-90 transition-opacity" 
               loading="lazy"
               @click="openImageModal"
               @error="handleImageError"
               alt="Sent image" />
          <div v-else class="max-h-80 max-w-full w-auto bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center p-4">
            <div class="text-center text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm">Failed to load image</p>
            </div>
          </div>
        </div>
        
        <!-- File Message -->
        <a v-else 
           :href="getFileUrl(content)" 
           target="_blank" 
           class="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ getFileName(content) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Click to download</p>
          </div>
        </a>
        
        <!-- Timestamp with status icon -->
        <div class="text-[10px] mt-0.5 flex items-center gap-1 justify-end" 
             :class="fromMe ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'">
          <span>{{ time }}</span>
          <!-- Read receipt for sent messages -->
          <div v-if="fromMe" class="flex items-center">
            <!-- Single check for sent -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <!-- Double check for read -->
            <svg v-if="isRead" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-green-100 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Tail/pointer for bubble -->
      <div v-if="type === 'text'" class="absolute top-0 w-0 h-0" 
           :class="fromMe ? '-right-1.5' : '-left-1.5'"
           :style="fromMe 
             ? 'border-top: 8px solid transparent; border-left: 10px solid #4ade80; border-bottom: 8px solid transparent;' 
             : 'border-top: 8px solid transparent; border-right: 10px solid #f3f4f6; border-bottom: 8px solid transparent;'" />
    </div>
  </div>
  
  <!-- Image Modal -->
  <div v-if="showImageModal" 
       @click="closeImageModal"
       class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div class="relative max-w-4xl max-h-full">
      <img :src="getImageUrl(content)" 
           class="max-w-full max-h-full object-contain rounded-lg"
           @click.stop
           alt="Full size image" />
      <button @click="closeImageModal"
              class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps(['fromMe', 'type', 'content', 'time', 'isRead'])

const showImageModal = ref(false)
const imageError = ref(false)

function getImageUrl(content) {
  // If it's already a full URL, return as is
  if (content.startsWith('http')) {
    return content
  }
  // If it's a relative path, prepend the server URL
  return `http://localhost:4000${content}`
}

function getFileUrl(content) {
  // If it's already a full URL, return as is
  if (content.startsWith('http')) {
    return content
  }
  // If it's a relative path, prepend the server URL
  return `http://localhost:4000${content}`
}

function getFileName(content) {
  // Extract filename from path
  const pathParts = content.split('/')
  const fileName = pathParts[pathParts.length - 1]
  
  // If no extension or it's a hash, show generic name
  if (!fileName.includes('.') || fileName.length < 10) {
    return 'Document'
  }
  
  return fileName
}

function openImageModal() {
  if (props.type === 'image') {
    showImageModal.value = true
  }
}

function handleImageError() {
  console.error('Failed to load image:', props.content)
  imageError.value = true
}

function closeImageModal() {
  showImageModal.value = false
}
</script>

<style scoped>
</style>


