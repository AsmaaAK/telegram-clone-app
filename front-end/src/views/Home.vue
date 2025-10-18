<template>
  <div class="h-full w-full flex bg-white dark:bg-gray-900">
    <!-- Sidebar - Hidden on mobile when channel is open -->
    <div class="w-full md:w-96 lg:w-[400px] h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-800"
         :class="channels.activeChannelId ? 'hidden md:flex' : 'flex'">
      <div class="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-800">
        <!-- Header -->
        <header class="text-white" style="background-color: #27a2e1;">
          <div class="px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button @click="sidebarMenuOpen = true" 
                      class="p-2 hover:bg-gray-700 rounded-full transition-colors" 
                      title="القائمة">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 class="text-lg font-semibold">Telegram</h2>
            </div>
            <div class="flex items-center gap-1">
              <!-- Search button moved to sidebar tabs -->
            </div>
          </div>

          <!-- Tabs -->
          <div class="px-4 pt-2 pb-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex gap-2">
            <button @click="switchTab('channels')" 
                    class="text-xs px-3 py-1 rounded-full transition-colors"
                    :class="activeTab === 'channels' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                    :style="activeTab === 'channels' ? 'background-color: #27a2e1;' : ''">
              جميع القنوات
            </button>
            <button @click="switchTab('subscribed')" 
                    class="text-xs px-3 py-1 rounded-full transition-colors"
                    :class="activeTab === 'subscribed' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                    :style="activeTab === 'subscribed' ? 'background-color: #27a2e1;' : ''">
              قنواتي
            </button>
            <button @click="switchTab('search')" 
                    class="text-xs px-3 py-1 rounded-full transition-colors"
                    :class="activeTab === 'search' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                    :style="activeTab === 'search' ? 'background-color: #27a2e1;' : ''">
              البحث
            </button>
            <button @click="switchTab('contacts')" 
                    class="text-xs px-3 py-1 rounded-full transition-colors"
                    :class="activeTab === 'contacts' ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                    :style="activeTab === 'contacts' ? 'background-color: #27a2e1;' : ''">
              جهات الاتصال
            </button>
          </div>
          
          <!-- Search bar -->
          <div v-if="showSearch" class="px-3 pb-3">
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="searchQuery" 
                     type="text" 
                     placeholder="البحث في القنوات وجهات الاتصال..." 
                     class="w-full text-sm pl-10 pr-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all" />
            </div>
          </div>
        </header>

        <!-- Content List -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="p-4 text-center text-gray-500">
            جاري التحميل...
          </div>
          
          <!-- Channels Tab -->
          <div v-else-if="activeTab === 'channels'">
            <div v-if="filteredChannels.length === 0" class="p-4 text-center text-gray-500">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p class="text-sm">لا توجد قنوات متاحة</p>
              <p class="text-xs text-gray-400 mt-1">لا توجد قنوات منشأة حالياً</p>
            </div>

            <div v-else>
              <button v-for="channel in filteredChannels" 
                      :key="channel._id"
                      @click="openChannel(channel._id)"
                      class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
              
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

          <!-- Subscribed Channels Tab -->
          <div v-else-if="activeTab === 'subscribed'">
            <div v-if="filteredChannels.length === 0" class="p-4 text-center text-gray-500">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p class="text-sm">لا توجد قنوات مشترك بها</p>
              <p class="text-xs text-gray-400 mt-1">انتقل إلى "جميع القنوات" للاشتراك في القنوات</p>
            </div>

            <div v-else>
              <button v-for="channel in filteredChannels" 
                      :key="channel._id"
                      @click="openChannel(channel._id)"
                      class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
              
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
                    <span v-else-if="channel.isSubscriber" class="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                      مشترك
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ channel.subscriberCount || channel.subscribers?.length || 0 }} مشترك
                  </div>
                  <div v-if="channel.latestMessage" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                    {{ formatLatestMessage(channel.latestMessage) }}
                  </div>
                </div>
                
                <!-- Chevron -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Contacts Tab -->
          <div v-else-if="activeTab === 'contacts'">
            <div v-if="filteredContacts.length === 0" class="p-4 text-center text-gray-500">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p class="text-sm">لا توجد جهات اتصال</p>
              <p class="text-xs text-gray-400 mt-1">تم تسجيل الدخول للعثور على المستخدمين الآخرين</p>
            </div>

            <div v-else>
              <button v-for="contact in filteredContacts" 
                      :key="contact._id"
                      @click="startChat(contact._id)"
                      class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
                
                <!-- Contact Avatar -->
                <div class="relative flex-shrink-0">
                  <img :src="getAvatarUrl(contact.avatarUrl)" 
                       class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"/>
                  <div v-if="chat.presence[contact._id]?.status === 'online'" 
                       class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                </div>
                
                <!-- Contact Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {{ contact.name || contact.username }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{{ contact.username }}
                  </div>
                  <div v-if="chat.presence[contact._id]" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                    {{ chat.presence[contact._id].status === 'online' ? 'متصل' : 'غير متصل' }}
                  </div>
                </div>
                
                <!-- Chevron -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Search Tab -->
          <div v-else-if="activeTab === 'search'">
            <!-- Default state when no search -->
            <div v-if="!searchQuery.trim()" class="p-4 text-center text-gray-500">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p class="text-sm">ابحث في القنوات وجهات الاتصال</p>
              <p class="text-xs text-gray-400 mt-1">اكتب في شريط البحث أعلاه</p>
            </div>

            <!-- Search results -->
            <div v-else class="p-4">
              <div v-if="filteredChannels.length === 0 && filteredContacts.length === 0" class="text-center text-gray-500">
                <div class="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p class="text-sm">لا توجد نتائج للبحث</p>
                <p class="text-xs text-gray-400 mt-1">جرب البحث بكلمات مختلفة</p>
              </div>
              
              <!-- Search Results -->
              <div v-else>
                <!-- Channel Results -->
                <div v-if="filteredChannels.length > 0">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">القنوات</h4>
                  <button v-for="channel in filteredChannels" 
                          :key="channel._id"
                          @click="openChannel(channel._id)"
                          class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
                    
                    <!-- Channel Avatar -->
                    <div class="relative flex-shrink-0">
                      <img :src="getChannelAvatar(channel.avatarUrl)" 
                           class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"/>
                    </div>
                    
                    <!-- Channel Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-0.5">
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {{ channel.name }}
                        </span>
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {{ channel.subscriberCount || channel.subscribers?.length || 0 }} مشترك
                      </div>
                    </div>
                  </button>
                </div>

                <!-- Contact Results -->
                <div v-if="filteredContacts.length > 0">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2 mt-4">جهات الاتصال</h4>
                  <button v-for="contact in filteredContacts" 
                          :key="contact._id"
                          @click="startChat(contact._id)"
                          class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 relative group">
                    
                    <!-- Contact Avatar -->
                    <div class="relative flex-shrink-0">
                      <img :src="getAvatarUrl(contact.avatarUrl)" 
                           class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"/>
                    </div>
                    
                    <!-- Contact Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-0.5">
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {{ contact.name || contact.username }}
                        </span>
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{{ contact.username }}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
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
        <div class="flex-shrink-0 h-14 md:h-16 px-3 md:px-4 flex items-center justify-between bg-blue-500 dark:bg-blue-600 text-white shadow-md">
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
                    class="p-2 hover:bg-gray-700 rounded-full transition-colors"
                    title="اشتراك">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            <button v-else-if="!channels.activeChannel?.isOwner"
                    @click="unsubscribeFromChannel(channels.activeChannelId)"
                    class="p-2 hover:bg-gray-700 rounded-full transition-colors"
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
                  class="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center text-white rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background-color: #27a2e1;">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Action Buttons -->
    <div v-if="!channels.activeChannelId" class="fixed bottom-6 left-6 flex flex-col gap-3 z-40">
      <!-- Camera Button -->
      <button @click="openCamera" 
              class="w-14 h-14 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      <!-- Pen Button -->
      <button @click="showContactsMenu = !showContactsMenu" 
              class="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
              style="background-color: #27a2e1;">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>

    <!-- Contacts Menu -->
    <div v-if="showContactsMenu" 
         @click="showContactsMenu = false"
         class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div @click.stop
           class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm max-h-96 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">جهات الاتصال</h3>
        </div>
        
        <div class="max-h-80 overflow-y-auto">
          <div v-if="contacts.length === 0" class="p-4 text-center text-gray-500">
            <p class="text-sm">لا توجد جهات اتصال</p>
          </div>
          
          <button v-for="contact in contacts" 
                  :key="contact._id"
                  @click="startChat(contact._id); showContactsMenu = false"
                  class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700">
            <img :src="getAvatarUrl(contact.avatarUrl)" 
                 class="w-10 h-10 rounded-full object-cover" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ contact.name || contact.username }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ contact.username }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar Menu -->
    <SidebarMenu :isOpen="sidebarMenuOpen" @close="sidebarMenuOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChannelsStore } from '../stores/channels'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import SidebarMenu from '../components/SidebarMenu.vue'
import { useRouter } from 'vue-router'
import io from 'socket.io-client'

const emit = defineEmits(['openMenu'])

const channels = useChannelsStore()
const chat = useChatStore()
const auth = useAuthStore()
const router = useRouter()

const activeTab = ref('channels')
const showSearch = ref(false)
const searchQuery = ref('')
const messageText = ref('')
const loading = ref(false)
const showContactsMenu = ref(false)
const sidebarMenuOpen = ref(false)
let socket = null
const channelMessagesContainer = ref(null)

const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTE5IDExSDUmbTE0IDBhMiAyIDAgMDEyIDJ2NmEyIDIgMCAwMS0yIDJINWEyIDIgMCAwMS0yLTJ2LTZhMiAyIDAgMDEyLTJtMTQgMFY5YTIgMiAwIDAwLTItMk01IDExVjljMC0xLjEuOS0yIDItMnYwYTIgMiAwIDAxMiAydjJtMCAwVjVhMiAyIDAgMDEyLTJoNmEyIDIgMCAwMTIgMnYyTTcgN2gxMCIgZmlsbD0iIzljOWNhNiIvPgo8L3N2Zz4KPC9zdmc+Cg=='

const contacts = computed(() => chat.users)

const filteredChannels = computed(() => {
  if (activeTab.value === 'search') {
    if (!searchQuery.value.trim()) {
      return []
    }
    
    const query = searchQuery.value.toLowerCase()
    return channels.channels.filter(c => 
      (c.name.toLowerCase().includes(query) || 
       c.description?.toLowerCase().includes(query))
    )
  }
  
  if (activeTab.value === 'subscribed') {
    // Show only subscribed channels (including owned)
    return channels.channels.filter(c => c.isSubscriber || c.isOwner)
  }
  
  // Show all available channels (default tab)
  return channels.channels
})

const filteredContacts = computed(() => {
  if (activeTab.value === 'search') {
    if (!searchQuery.value.trim()) {
      return []
    }
    
    const query = searchQuery.value.toLowerCase()
    return contacts.value.filter(c => 
      (c.name?.toLowerCase().includes(query) || 
       c.username?.toLowerCase().includes(query))
    )
  }
  
  // Sort contacts by last message timestamp
  const sortedContacts = contacts.value.map(user => {
    // Find conversation with this user
    const conversation = chat.conversations.find(conv => {
      if (!conv.participants || conv.participants.length !== 2) return false
      const hasCurrentUser = conv.participants.includes(auth.user?.id)
      const hasTargetUser = conv.participants.includes(user._id)
      return hasCurrentUser && hasTargetUser
    })
    
    // Get latest message timestamp
    let latestMessageTime = 0
    if (conversation) {
      const messages = chat.messagesByConv[conversation._id] || []
      if (messages.length > 0) {
        // Sort messages by creation time and get the latest
        const sortedMessages = messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        latestMessageTime = new Date(sortedMessages[0].createdAt).getTime()
      }
    }
    
    return {
      ...user,
      latestMessageTime
    }
  })
  
  // Sort by latest message time (most recent first)
  return sortedContacts.sort((a, b) => b.latestMessageTime - a.latestMessageTime)
})

onMounted(async () => {
  loading.value = true
  try {
    console.log('🏠 Home.vue: Starting to load data...')
    await Promise.all([
      channels.fetchChannels(),
      chat.bootstrap()
    ])
    console.log('🏠 Home.vue: Data loaded successfully')
    console.log('🏠 Home.vue: Channels count:', channels.channels.length)
    console.log('🏠 Home.vue: filteredChannels count:', filteredChannels.value.length)
    
    // Setup Socket.io connection
    if (auth.user) {
      socket = io('http://localhost:4000', {
        auth: {
          token: localStorage.getItem('token')
        }
      })

      // Listen for channel messages
      socket.on('channel_message', async (message) => {
        console.log('🏠 Received new channel message:', message)
        console.log('🏠 Current active channel:', channels.activeChannelId)
        console.log('🏠 Message channel ID:', message.channel)
        channels.addChannelMessage(message.channel, message)
        await nextTick()
        console.log('🏠 Messages after adding:', channels.activeChannelMessages.length)
      })

      // Listen for new channels
      socket.on('channel:created', (channelData) => {
        console.log('🏠 Received new channel:', channelData)
        channels.addChannelFromSocket(channelData)
      })
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
})

function getChannelAvatar(avatarUrl) {
  if (!avatarUrl) return placeholder
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `http://localhost:4000${avatarUrl}`
}

function getAvatarUrl(avatarUrl) {
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
    console.error('🏠 Failed to fetch channel messages:', error)
  }
}

async function subscribeToChannel(channelId) {
  try {
    await channels.subscribeToChannel(channelId)
  } catch (error) {
    console.error('🏠 Failed to subscribe to channel:', error)
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

function openCamera() {
  // TODO: Implement camera functionality
  console.log('Opening camera...')
}

async function startChat(userId) {
  try {
    await chat.openOrCreateConversation(userId)
    // Navigate to chat view
    router.push('/chat')
  } catch (error) {
    console.error('Failed to start chat:', error)
  }
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'search') {
    showSearch.value = true
  } else {
    showSearch.value = false
    searchQuery.value = ''
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

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})
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
