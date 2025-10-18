import { defineStore } from 'pinia'
import api from '../utils/api'

export const useChannelsStore = defineStore('channels', {
      state: () => ({
            channels: [],
            activeChannelId: null,
            messagesByChannel: {},
            loading: false,
            error: null
      }),

      getters: {
            activeChannel: (state) => {
                  return state.channels.find(c => c._id === state.activeChannelId) || null
            },

            ownedChannels: (state) => {
                  return state.channels.filter(c => c.isOwner)
            },

            subscribedChannels: (state) => {
                  return state.channels.filter(c => c.isSubscriber && !c.isOwner)
            },

            activeChannelMessages: (state) => {
                  if (!state.activeChannelId) return []
                  return state.messagesByChannel[state.activeChannelId] || []
            }
      },

      actions: {
            async fetchChannels() {
                  try {
                        this.loading = true
                        this.error = null

                        const { data } = await api.get('/channels')
                        this.channels = data

                        console.log('📺 Fetched channels:', this.channels.length)
                        console.log('📺 Channels data:', this.channels.map(c => ({
                              id: c._id,
                              name: c.name,
                              isOwner: c.isOwner,
                              isSubscriber: c.isSubscriber,
                              isAvailable: c.isAvailable
                        })))
                  } catch (error) {
                        console.error('❌ Failed to fetch channels:', error)
                        this.error = error?.response?.data?.message || 'Failed to fetch channels'
                        throw error
                  } finally {
                        this.loading = false
                  }
            },

            async createChannel(channelData) {
                  try {
                        this.loading = true
                        this.error = null

                        const formData = new FormData()
                        formData.append('name', channelData.name)
                        if (channelData.description) {
                              formData.append('description', channelData.description)
                        }
                        if (channelData.avatar) {
                              formData.append('avatar', channelData.avatar)
                        }

                        const { data } = await api.post('/channels', formData, {
                              headers: {
                                    'Content-Type': 'multipart/form-data'
                              }
                        })

                        // Add to channels list
                        this.channels.unshift(data)

                        console.log('📺 Created channel:', data.name)
                        return data
                  } catch (error) {
                        console.error('❌ Failed to create channel:', error)
                        this.error = error?.response?.data?.message || 'Failed to create channel'
                        throw error
                  } finally {
                        this.loading = false
                  }
            },

            async updateChannel(channelId, channelData) {
                  try {
                        this.loading = true
                        this.error = null

                        const formData = new FormData()
                        if (channelData.name) {
                              formData.append('name', channelData.name)
                        }
                        if (channelData.description !== undefined) {
                              formData.append('description', channelData.description)
                        }
                        if (channelData.avatar) {
                              formData.append('avatar', channelData.avatar)
                        }

                        const { data } = await api.put(`/channels/${channelId}`, formData, {
                              headers: {
                                    'Content-Type': 'multipart/form-data'
                              }
                        })

                        // Update in channels list
                        const index = this.channels.findIndex(c => c._id === channelId)
                        if (index !== -1) {
                              this.channels[index] = data.channel
                        }

                        console.log('📺 Updated channel:', data.channel.name)
                        return data.channel
                  } catch (error) {
                        console.error('❌ Failed to update channel:', error)
                        this.error = error?.response?.data?.message || 'Failed to update channel'
                        throw error
                  } finally {
                        this.loading = false
                  }
            },

            async deleteChannel(channelId) {
                  try {
                        this.loading = true
                        this.error = null

                        await api.delete(`/channels/${channelId}`)

                        // Remove from channels list
                        this.channels = this.channels.filter(c => c._id !== channelId)

                        // Clear active channel if it was deleted
                        if (this.activeChannelId === channelId) {
                              this.activeChannelId = null
                        }

                        console.log('📺 Deleted channel:', channelId)
                  } catch (error) {
                        console.error('❌ Failed to delete channel:', error)
                        this.error = error?.response?.data?.message || 'Failed to delete channel'
                        throw error
                  } finally {
                        this.loading = false
                  }
            },

            async subscribeToChannel(channelId) {
                  try {
                        const { data } = await api.post(`/channels/${channelId}/subscribe`)

                        // Update channel in list
                        const index = this.channels.findIndex(c => c._id === channelId)
                        if (index !== -1) {
                              this.channels[index] = data.channel
                        } else {
                              this.channels.unshift(data.channel)
                        }
                        return data.channel
                  } catch (error) {
                        console.error('❌ Failed to subscribe to channel:', error)
                        console.error('❌ Error details:', error.response?.data)
                        throw error
                  }
            },

            async unsubscribeFromChannel(channelId) {
                  try {
                        await api.post(`/channels/${channelId}/unsubscribe`)

                        // Remove from channels list
                        this.channels = this.channels.filter(c => c._id !== channelId)

                        // Clear active channel if it was unsubscribed
                        if (this.activeChannelId === channelId) {
                              this.activeChannelId = null
                        }

                        console.log('📺 Unsubscribed from channel:', channelId)
                  } catch (error) {
                        console.error('❌ Failed to unsubscribe from channel:', error)
                        throw error
                  }
            },

            async fetchChannelMessages(channelId) {
                  try {
                        const { data } = await api.get(`/channels/${channelId}/messages`)

                        // Store messages by channel
                        this.messagesByChannel[channelId] = data

                        return data
                  } catch (error) {
                        console.error('❌ Failed to fetch channel messages:', error)
                        console.error('❌ Error details:', error.response?.data)
                        throw error
                  }
            },

            async sendChannelMessage(channelId, messageData) {
                  try {
                        const formData = new FormData()
                        if (messageData.content) {
                              formData.append('content', messageData.content)
                        }
                        if (messageData.type) {
                              formData.append('type', messageData.type)
                        }
                        if (messageData.file) {
                              formData.append('file', messageData.file)
                        }

                        const { data } = await api.post(`/channels/${channelId}/messages`, formData, {
                              headers: {
                                    'Content-Type': 'multipart/form-data'
                              }
                        })

                        // Don't add message to local state here - it will come via Socket.io
                        // This prevents duplicate messages
                        console.log('📺 Sent message to channel:', channelId)
                        return data
                  } catch (error) {
                        console.error('❌ Failed to send channel message:', error)
                        throw error
                  }
            },

            setActiveChannel(channelId) {
                  this.activeChannelId = channelId
            },

            addChannelMessage(channelId, message) {
                  if (!this.messagesByChannel[channelId]) {
                        this.messagesByChannel[channelId] = []
                  }

                  // Check if message already exists
                  const exists = this.messagesByChannel[channelId].find(m => m._id === message._id)

                  if (!exists) {
                        // Use Vue's reactivity system by replacing the entire array
                        this.messagesByChannel[channelId] = [...this.messagesByChannel[channelId], message]

                        // Update channel's latest message
                        this.updateChannelLatestMessage(channelId, message)

                        console.log('📺 Added new message to channel:', channelId, 'Message:', message.content)
                  }
            },

            updateChannelLatestMessage(channelId, message) {
                  const channel = this.channels.find(c => c._id === channelId)
                  if (channel) {
                        channel.latestMessage = message
                  }
            },

            addChannelFromSocket(channelData) {
                  // Check if channel already exists
                  const existingChannel = this.channels.find(c => c._id === channelData._id)
                  if (!existingChannel) {
                        // Add to channels list
                        this.channels.unshift(channelData)
                        console.log('📺 Added channel from socket:', channelData.name)
                  }
            }
      }
})
