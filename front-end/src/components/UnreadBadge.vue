<template>
  <span 
    v-if="count > 0" 
    class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-green-400 text-white shadow-sm transition-all duration-200 hover:bg-green-500"
    :class="sizeClass"
    :title="`${count} unread messages`"
  >
    {{ displayCount }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: 'md'
  },
  maxDisplay: {
    type: Number,
    default: 99
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'min-w-[16px] h-4 px-1 text-[10px]'
    case 'lg':
      return 'min-w-[24px] h-6 px-2 text-xs'
    default:
      return 'min-w-[20px] h-5 px-1.5 text-[11px]'
  }
})

const displayCount = computed(() => {
  const result = props.count > props.maxDisplay ? `${props.maxDisplay}+` : props.count.toString()
  // Only log if there are unread messages to reduce console spam
  if (props.count > 0) {
    console.log('🔢 UnreadBadge display:', result, 'original count:', props.count)
  }
  return result
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
