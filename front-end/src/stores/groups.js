import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import api from '../utils/api'
import { useAuthStore } from './auth'

export const useGroupsStore = defineStore('groups', {
      state: () => ({
            groups: [],
            messagesByGroup: {},
            activeGroupId: null,
            socket: null
      }),
      actions: {
            async fetchMyGroups() {
                  const auth = useAuthStore()
                  if (!auth.user?.id) return
                  const { data } = await api.get(`/users/${auth.user.id}/groups`)
                  this.groups = data || []
            },
            async fetchMessages(groupId, before) {
                  const params = {}
                  if (before) params.before = before
                  const { data } = await api.get(`/groups/${groupId}/messages`, { params })
                  const existing = this.messagesByGroup[groupId] || []
                  const merged = [...existing, ...data.filter((m) => !existing.find(e => e._id === m._id))]
                  this.messagesByGroup[groupId] = merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            },
            initSocket() {
                  const auth = useAuthStore()
                  if (!auth.token) return
                  if (this.socket?.connected) return
                  const url = import.meta.env?.VITE_SOCKET_URL || 'http://localhost:4000'
                  const socket = io(url, { auth: { token: auth.token } })
                  this.socket = socket

                  socket.on('connect', () => {
                        if (this.activeGroupId) socket.emit('join_group', { groupId: this.activeGroupId })
                  })

                  socket.on('group_message', ({ message }) => {
                        const arr = this.messagesByGroup[message.groupId] || (this.messagesByGroup[message.groupId] = [])
                        if (!arr.find(m => m._id === message._id)) arr.push(message)
                        this.messagesByGroup = { ...this.messagesByGroup }
                        // update list order
                        const g = this.groups.find(g => g._id === message.groupId)
                        if (g) {
                              g.lastMessageAt = message.createdAt
                              g.lastMessagePreview = message.type === 'text' ? message.content.slice(0, 100) : `[${message.type}]`
                              const me = useAuthStore().user?.id
                              const isActive = this.activeGroupId === message.groupId
                              if (me && message.senderId !== me) {
                                    if (!g.unreadCounts) g.unreadCounts = {}
                                    if (isActive) {
                                          // If user is viewing this group, keep unread at 0 and inform server
                                          g.unreadCounts[me] = 0
                                          if (this.socket?.connected) this.socket.emit('group:markRead', { groupId: message.groupId })
                                    } else {
                                          g.unreadCounts[me] = (g.unreadCounts[me] || 0) + 1
                                    }
                              }
                              this.groups = [g, ...this.groups.filter(x => x._id !== g._id)]
                        }
                  })

                  socket.on('group_message_status', (payload) => {
                        // could be used to update ticks
                        console.log('group_message_status', payload)
                  })

                  socket.on('group:unreadUpdate', ({ groupId, unreadCount }) => {
                        const g = this.groups.find(g => g._id === groupId)
                        const me = useAuthStore().user?.id
                        if (g && me) {
                              if (!g.unreadCounts) g.unreadCounts = {}
                              g.unreadCounts[me] = unreadCount
                              this.groups = [...this.groups]
                        }
                  })
            },
            async setActiveGroup(groupId) {
                  if (this.activeGroupId && this.socket?.connected) this.socket.emit('leave_group', { groupId: this.activeGroupId })
                  this.activeGroupId = groupId
                  if (this.socket?.connected) this.socket.emit('join_group', { groupId })
                  if (!this.messagesByGroup[groupId]) await this.fetchMessages(groupId)
                  // clear unread locally immediately
                  const auth = useAuthStore()
                  const me = auth.user?.id
                  const g = this.groups.find(g => g._id === groupId)
                  if (g && me) {
                        if (!g.unreadCounts) g.unreadCounts = {}
                        g.unreadCounts[me] = 0
                        this.groups = [...this.groups]
                  }
                  // ask server to clear unread in realtime for this user
                  if (this.socket?.connected) {
                        this.socket.emit('group:markRead', { groupId })
                  } else {
                        // already cleared locally above; server will sync on next connect
                  }
            },
            async sendText(groupId, content) {
                  if (this.socket?.connected) {
                        this.socket.emit('group_message', { groupId, content, type: 'text' })
                  } else {
                        const { data } = await api.post(`/groups/${groupId}/messages`, { content, type: 'text' })
                        const arr = this.messagesByGroup[groupId] || (this.messagesByGroup[groupId] = [])
                        if (!arr.find(m => m._id === data._id)) arr.push(data)
                        this.messagesByGroup = { ...this.messagesByGroup }
                  }
            }
      }
})

