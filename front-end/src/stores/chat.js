import { defineStore } from 'pinia'
import api from '../utils/api'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    messagesByConv: {},
    activeConversationId: null,
    presence: {},
    socket: null,
    users: [],
    webrtc: { 
      pc: null, 
      localStream: null, 
      remoteStream: null, 
      inCallWithUserId: null, 
      incomingFromUserId: null, 
      incomingOffer: null, 
      muted: false, 
      status: 'idle' 
    }
  }),
  actions: {
    async bootstrap() {
      const auth = useAuthStore()
      if (!auth.token) return
      try {
        await Promise.all([this.fetchConversations(), this.fetchContacts()])
        this.initSocket()
      } catch (error) {
        console.error('Bootstrap error:', error)
        // Continue anyway to show UI even if some data fails to load
      }
    },
    async fetchContacts() {
      try {
        const { data } = await api.get('/users')
        this.users = data || []
        console.log('📋 Fetched contacts:', data?.length)
        console.log('📋 Users data:', data?.map(u => ({ 
          id: u._id, 
          name: u.name, 
          username: u.username 
        })))
        // Initialize presence for all users based on their current status
        if (Array.isArray(data)) {
          data.forEach(user => {
            this.presence[user._id] = {
              status: user.status || 'offline',
              lastSeen: user.lastSeen,
              typing: false
            }
            console.log(`👤 User ${user.name} (${user._id}): ${user.status}, lastSeen: ${user.lastSeen}`)
          })
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
        this.users = []
      }
    },
    async fetchConversations() {
      try {
        const { data } = await api.get('/conversations')
        this.conversations = data || []
        console.log('💬 Fetched conversations:', data?.length)
        console.log('💬 Conversations data:', data?.map(c => ({ 
          id: c._id, 
          participants: c.participants 
        })))
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
        this.conversations = []
      }
    },
    async fetchMessages(conversationId) {
      try {
        const { data } = await api.get(`/conversations/${conversationId}/messages`)
        // Only fetch if we don't have messages already
        if (!this.messagesByConv[conversationId] || this.messagesByConv[conversationId].length === 0) {
          this.messagesByConv[conversationId] = data || []
          console.log(`📥 Fetched ${data?.length || 0} messages for conversation ${conversationId}`)
          console.log(`📥 Messages data:`, data?.map(m => ({
            id: m._id,
            from: m.from,
            to: m.to,
            content: m.content?.substring(0, 50),
            conversationId: m.conversationId
          })))
        } else {
          console.log(`📥 Messages already loaded for conversation ${conversationId}, skipping fetch`)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
        if (!this.messagesByConv[conversationId]) {
          this.messagesByConv[conversationId] = []
        }
      }
    },
    async setActiveConversation(id) {
      console.log('🔄 setActiveConversation called with:', id)
      console.log('🔄 Current activeConversationId:', this.activeConversationId)

      // Leave previous conversation room
      if (this.activeConversationId && this.socket?.connected) {
        console.log('🔄 Leaving previous conversation:', this.activeConversationId)
        this.socket.emit('conversation:leave', this.activeConversationId)
      }

      this.activeConversationId = id
      console.log('🔄 New activeConversationId set to:', this.activeConversationId)

      if (id) {
        // Join new conversation room
        if (this.socket?.connected) {
          console.log('🔄 Joining new conversation room:', id)
          this.socket.emit('conversation:join', id)
        }
        if (!this.messagesByConv[id]) {
          console.log('🔄 Fetching messages for conversation:', id)
          await this.fetchMessages(id)
        }
        // Mark conversation as read (clear unread count)
        console.log('🔄 Marking conversation as read:', id)
        await this.markAsRead(id)

        // Force update of conversations to ensure UI updates
        this.conversations = [...this.conversations]
      }
    },
    async openOrCreateConversation(participantId) {
      const auth = useAuthStore()
      const currentUserId = auth.user?.id
      if (!currentUserId) return null

      console.log('🔍 openOrCreateConversation:', {
        participantId,
        currentUserId,
        allConversations: this.conversations.map(c => ({
          id: c._id,
          participants: [...c.participants],
          isMatch: c.participants.length === 2 && 
                   c.participants.includes(participantId) && 
                   c.participants.includes(currentUserId)
        }))
      })

      // Find 1-on-1 conversation that includes ONLY the current user and the target user
      const existing = this.conversations.find(c => {
        // Check if conversation has exactly 2 participants
        if (!c.participants || c.participants.length !== 2) return false

        // Check if both users are participants
        const hasCurrentUser = c.participants.includes(currentUserId)
        const hasTargetUser = c.participants.includes(participantId)

        return hasCurrentUser && hasTargetUser
      })

      if (existing) {
        console.log('✅ Found existing 1-on-1 conversation:', existing._id, 'participants:', [...existing.participants])
        await this.setActiveConversation(existing._id)
        return existing
      }
      console.log('🆕 Creating new conversation with participant:', participantId)
      const { data } = await api.post('/conversations', { participantId })
      console.log('🆕 Created conversation:', data._id, 'participants:', data.participants)
      this.conversations.unshift(data)
      await this.setActiveConversation(data._id)
      return data
    },
    initSocket() {
      const auth = useAuthStore()
      if (this.socket?.connected) {
        console.log('Socket already connected, skipping init')
        return
      }
      if (!auth.token) {
        console.log('No token available, cannot init socket')
        return
      }

      // Clean up existing socket if any
      if (this.socket) {
        console.log('Cleaning up old socket')
        this.socket.disconnect()
        this.socket = null
      }

      try {
        // Use backend URL for Socket.io connection
        const url = import.meta.env?.VITE_SOCKET_URL || 'http://localhost:4000'
        console.log('🔌 Initializing socket to:', url)

        const socket = io(url, {
          auth: { token: auth.token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10
        })
        this.socket = socket

        socket.on('connect', () => {
          console.log('✅ Socket connected! ID:', socket.id)
          console.log('📡 Transport:', socket.io.engine.transport.name)
          console.log('🌐 Socket URL:', socket.io.uri)
          // Re-fetch presence on reconnect
          this.refreshPresence()
        })

        socket.on('disconnect', (reason) => {
          console.log('❌ Socket disconnected:', reason)
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            socket.connect()
          }
        })

        socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
          this.refreshPresence()
        })

        socket.on('connect_error', (err) => {
          console.error('❌ Socket connection error:', err.message)
          console.error('❌ Error details:', err)
          console.error('❌ Attempted URL:', url)
        })

        socket.on('message:new', (msg) => {
          console.log('📩 Received message:new event:', msg)
          const arr = this.messagesByConv[msg.conversationId] || (this.messagesByConv[msg.conversationId] = [])
          // Check if message already exists to avoid duplicates
          const exists = arr.find(m => m._id === msg._id)
          if (!exists) {
            arr.push(msg)
            console.log('✅ Message added to chat')
            // Force reactivity update
            this.messagesByConv = { ...this.messagesByConv }

            // Update conversation lastMessageAt and move to top
            const conv = this.conversations.find(c => c._id === msg.conversationId)
            if (conv) {
              conv.lastMessageAt = new Date(msg.createdAt)
              this.moveConversationToTop(conv._id)

              // Update unread count if message is from someone else
              if (msg.from !== auth.user?.id) {
                if (!conv.unreadCounts) conv.unreadCounts = {}
                const currentUserId = auth.user?.id || ''
                conv.unreadCounts[currentUserId] = (conv.unreadCounts[currentUserId] || 0) + 1
                console.log('📊 Updated unread count locally for conversation:', conv._id, 'count:', conv.unreadCounts[currentUserId])
              }

              // Force reactivity update for conversations
              this.conversations = [...this.conversations]

              console.log('⬆️ User list should be re-sorted due to new message from:', msg.from)
            }
          } else {
            console.log('⚠️ Message already exists, skipped')
          }
        })

        socket.on('conversation:unreadUpdate', ({ conversationId, unreadCount }) => {
          console.log('📊 Received unread count update:', conversationId, unreadCount)
          const conv = this.conversations.find(c => c._id === conversationId)
          if (conv) {
            if (!conv.unreadCounts) conv.unreadCounts = {}
            const currentUserId = auth.user?.id || ''
            conv.unreadCounts[currentUserId] = unreadCount
            console.log('📊 Updated unread count for conversation:', conv._id, 'count:', unreadCount, 'user:', currentUserId)
            // Force reactivity update for conversations
            this.conversations = [...this.conversations]
          } else {
            console.log('⚠️ Conversation not found for unread update:', conversationId)
          }
        })

        socket.on('message:updated', (msg) => {
          const arr = this.messagesByConv[msg.conversationId]
          if (!arr) return
          const idx = arr.findIndex(m => m._id === msg._id)
          if (idx >= 0) arr[idx] = msg
        })

        socket.on('user:online', ({ userId }) => {
          console.log('🟢 User came online:', userId)
          const user = this.users.find(u => u._id === userId)
          console.log('   User name:', user?.name)
          // Clear lastSeen when user comes online
          this.presence[userId] = {
            status: 'online',
            lastSeen: undefined,
            typing: this.presence[userId]?.typing || false
          }
          // Force reactivity update
          this.presence = { ...this.presence }
        })

        socket.on('user:offline', ({ userId, lastSeen }) => {
          console.log('🔴 User went offline:', userId, 'lastSeen:', lastSeen)
          const user = this.users.find(u => u._id === userId)
          console.log('   User name:', user?.name)
          this.presence[userId] = {
            status: 'offline',
            lastSeen: lastSeen || new Date().toISOString(),
            typing: false
          }
          // Force reactivity update
          this.presence = { ...this.presence }
        })

        socket.on('user:typing', ({ from, isTyping }) => {
          console.log('⌨️ User typing:', from, isTyping)
          this.presence[from] = {
            ...(this.presence[from] || { status: 'offline' }),
            typing: isTyping
          }
          // Force reactivity update
          this.presence = { ...this.presence }
        })

        socket.on('message:error', ({ message, code }) => {
          console.error('❌ Message error:', message, code)
          if (code === 'BLOCKED') {
            alert('❌ You are blocked by this user')
          } else {
            alert(`❌ ${message}`)
          }
        })

        // ===== 1-1 Audio Call Signaling (WebRTC) =====
        socket.on('incoming_call', async ({ fromUserId, offer }) => {
          console.log('📞 incoming_call from', fromUserId)
          this.webrtc.incomingFromUserId = fromUserId
          this.webrtc.incomingOffer = offer
          this.webrtc.status = 'incoming'
        })

        socket.on('call_answered', async ({ fromUserId, answer }) => {
          console.log('📞 call_answered from', fromUserId)
          if (this.webrtc.pc && this.webrtc.inCallWithUserId === fromUserId) {
            await this.webrtc.pc.setRemoteDescription(answer)
            this.webrtc.status = 'connected'
          }
        })

        socket.on('ice_candidate', async ({ fromUserId, candidate }) => {
          console.log('📞 ice_candidate from', fromUserId)
          if (this.webrtc.pc && (this.webrtc.inCallWithUserId === fromUserId || this.webrtc.incomingFromUserId === fromUserId)) {
            try { 
              await this.webrtc.pc.addIceCandidate(candidate) 
            } catch (e) { 
              console.error('addIceCandidate error', e) 
            }
          }
        })

        socket.on('call_ended', ({ fromUserId }) => {
          console.log('📞 call_ended from', fromUserId)
          if (this.webrtc.inCallWithUserId === fromUserId || this.webrtc.incomingFromUserId === fromUserId) {
            this.endCall()
          }
        })
      } catch (error) {
        console.error('Socket initialization error:', error)
      }
    },

    async startVoiceCall(toUserId) {
      if (!this.socket?.connected) return alert('Not connected')
      await this.setupPeerConnection(toUserId)
      const offer = await this.webrtc.pc?.createOffer()
      if (offer) {
        await this.webrtc.pc?.setLocalDescription(offer)
        this.socket.emit('call_user', { toUserId, offer })
        this.webrtc.inCallWithUserId = toUserId
        this.webrtc.status = 'calling'
        console.log('📞 call_user sent to', toUserId)
      }
    },

    async setupPeerConnection(peerUserId) {
      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({ 
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
      })
      this.webrtc.pc = pc
      // Local media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      this.webrtc.localStream = stream
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      // Remote media
      const remote = new MediaStream()
      this.webrtc.remoteStream = remote
      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach(t => remote.addTrack(t))
      }
      // ICE
      pc.onicecandidate = (e) => {
        if (e.candidate && this.socket?.connected) {
          this.socket.emit('ice_candidate', { 
            toUserId: peerUserId, 
            candidate: e.candidate 
          })
        }
      }
      pc.onconnectionstatechange = () => {
        console.log('📞 pc state:', pc.connectionState)
        if (pc.connectionState === 'connected') this.webrtc.status = 'connected'
        if (pc.connectionState === 'disconnected' || 
            pc.connectionState === 'failed' || 
            pc.connectionState === 'closed') {
          this.endCall()
        }
      }
    },

    toggleMute() {
      this.webrtc.muted = !this.webrtc.muted
      this.webrtc.localStream?.getAudioTracks().forEach(t => {
        t.enabled = !this.webrtc.muted
      })
    },

    endCall() {
      try { 
        if (this.webrtc.inCallWithUserId) {
          this.socket?.emit('end_call', { 
            toUserId: this.webrtc.inCallWithUserId 
          })
        }
      } catch (e) { 
        console.error('Error ending call:', e)
      }
      
      this.webrtc.pc?.getSenders().forEach(s => { 
        try { s.track?.stop() } catch (e) { console.error(e) } 
      })
      
      this.webrtc.localStream?.getTracks().forEach(t => { 
        try { t.stop() } catch (e) { console.error(e) } 
      })
      
      try { this.webrtc.pc?.close() } catch (e) { console.error(e) }
      
      this.webrtc = { 
        pc: null, 
        localStream: null, 
        remoteStream: null, 
        inCallWithUserId: null, 
        incomingFromUserId: null, 
        incomingOffer: null, 
        muted: false, 
        status: 'idle' 
      }
    },

    async acceptIncomingCall() {
      try {
        const fromUserId = this.webrtc.incomingFromUserId
        const offer = this.webrtc.incomingOffer
        if (!fromUserId || !offer) return
        await this.setupPeerConnection(fromUserId)
        await this.webrtc.pc?.setRemoteDescription(offer)
        const answer = await this.webrtc.pc?.createAnswer()
        if (answer) {
          await this.webrtc.pc?.setLocalDescription(answer)
          this.socket?.emit('answer_call', { 
            toUserId: fromUserId, 
            answer 
          })
          this.webrtc.inCallWithUserId = fromUserId
          this.webrtc.incomingFromUserId = null
          this.webrtc.incomingOffer = null
          this.webrtc.status = 'connected'
        }
      } catch (e) {
        console.error('acceptIncomingCall error', e)
      }
    },

    rejectIncomingCall() {
      try {
        if (this.webrtc.incomingFromUserId) {
          this.socket?.emit('end_call', { 
            toUserId: this.webrtc.incomingFromUserId 
          })
        }
      } finally {
        this.webrtc.incomingFromUserId = null
        this.webrtc.incomingOffer = null
        this.webrtc.status = 'idle'
      }
    },

    // Refresh presence data from server
    async refreshPresence() {
      try {
        console.log('🔄 Refreshing presence data...')
        const { data } = await api.get('/users')
        if (Array.isArray(data)) {
          data.forEach(user => {
            // Only update if we don't have more recent Socket.io data
            if (!this.presence[user._id] || this.presence[user._id].status === 'offline') {
              this.presence[user._id] = {
                status: user.status || 'offline',
                lastSeen: user.lastSeen,
                typing: false
              }
            }
          })
          console.log('✅ Presence refreshed')
        }
      } catch (error) {
        console.error('Failed to refresh presence:', error)
      }
    },

    async sendText(conversationId, to, content) {
      try {
        // Send via Socket.io for real-time delivery
        if (this.socket?.connected) {
          console.log('📤 Sending message via Socket.io:', { 
            conversationId, 
            to, 
            content 
          })
          this.socket.emit('message:send', { 
            conversationId, 
            to, 
            type: 'text', 
            content 
          })
        } else {
          console.log('⚠️ Socket not connected, falling back to HTTP')
          // Fallback to HTTP if Socket.io is not available
          const { data } = await api.post(`/conversations/${conversationId}/messages`, { 
            to, 
            type: 'text', 
            content 
          })

          // Add message to local state
          const arr = this.messagesByConv[conversationId] || (this.messagesByConv[conversationId] = [])
          const exists = arr.find(m => m._id === data._id)
          if (!exists) {
            arr.push(data)
            // Force reactivity update
            this.messagesByConv = { ...this.messagesByConv }

            // Update conversation lastMessageAt and move to top
            const conv = this.conversations.find(c => c._id === conversationId)
            if (conv) {
              conv.lastMessageAt = new Date(data.createdAt)
              this.moveConversationToTop(conv._id)
              // Force reactivity update for conversations
              this.conversations = [...this.conversations]
            }
          }
        }
      } catch (e) {
        console.error('Failed to send message:', e)
        if (e?.response?.data?.code === 'BLOCKED') {
          alert('You are blocked by this user')
        } else {
          alert('Failed to send')
        }
      }
    },

    typing(to, isTyping) {
      this.socket?.emit('typing', { to, isTyping })
    },

    async markAsRead(conversationId) {
      try {
        // Update local conversation to clear unread count immediately
        const conv = this.conversations.find(c => c._id === conversationId)
        if (conv) {
          const auth = useAuthStore()
          if (auth.user?.id) {
            if (!conv.unreadCounts) conv.unreadCounts = {}
            conv.unreadCounts[auth.user.id] = 0
            console.log('📖 Cleared unread count locally for conversation:', conversationId)
            // Force reactivity update
            this.conversations = [...this.conversations]
          }
        }

        // Use socket if available, otherwise fallback to HTTP
        if (this.socket?.connected) {
          this.socket.emit('conversation:markRead', { conversationId })
          console.log('📖 Marked conversation as read via socket')
        } else {
          await api.post(`/conversations/${conversationId}/read`)
          console.log('📖 Marked conversation as read via HTTP')
        }
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    },

    clearMessages(conversationId) {
      if (this.messagesByConv[conversationId]) {
        delete this.messagesByConv[conversationId]
        console.log(`🗑️ Cleared messages for conversation ${conversationId}`)
      }
    },

    moveConversationToTop(conversationId) {
      const convIndex = this.conversations.findIndex(c => c._id === conversationId)
      if (convIndex > 0) {
        const conv = this.conversations.splice(convIndex, 1)[0]
        this.conversations.unshift(conv)
        console.log(`⬆️ Moved conversation ${conversationId} to top of list`)
      }
    },

    // Sort users based on last activity (messages, presence, etc.)
    getSortedUsers() {
      const currentUserId = useAuthStore().user?.id || ''

      return [...this.users].sort((a, b) => {
        const aConv = this.conversations.find(c =>
          c.participants.length === 2 &&
          c.participants.includes(a._id) &&
          c.participants.includes(currentUserId)
        )
        const bConv = this.conversations.find(c =>
          c.participants.length === 2 &&
          c.participants.includes(b._id) &&
          c.participants.includes(currentUserId)
        )

        // First prioritize users with unread messages
        const aUnread = aConv?.unreadCounts?.[currentUserId] || 0
        const bUnread = bConv?.unreadCounts?.[currentUserId] || 0

        if (aUnread > 0 && bUnread === 0) return -1
        if (bUnread > 0 && aUnread === 0) return 1
        if (aUnread > 0 && bUnread > 0) {
          // If both have unread, sort by count (highest first)
          return bUnread - aUnread
        }

        // Then prioritize users with recent messages
        const aLastMessage = aConv?.lastMessageAt
        const bLastMessage = bConv?.lastMessageAt

        if (aLastMessage && bLastMessage) {
          return new Date(bLastMessage).getTime() - new Date(aLastMessage).getTime()
        } else if (aLastMessage) {
          return -1
        } else if (bLastMessage) {
          return 1
        }

        // Then prioritize online users
        const aOnline = this.presence[a._id]?.status === 'online'
        const bOnline = this.presence[b._id]?.status === 'online'

        if (aOnline && !bOnline) return -1
        if (!aOnline && bOnline) return 1

        // Finally sort by name
        return (a.name || a.username || '').localeCompare(b.name || b.username || '')
      })
    }
  }
})