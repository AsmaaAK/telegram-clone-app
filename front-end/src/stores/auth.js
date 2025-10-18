import { defineStore } from 'pinia'
import api from '../utils/api'
import { useChatStore } from './chat'

export const useAuthStore = defineStore('auth', {
      state: () => ({
            token: localStorage.getItem('token'),
            user: JSON.parse(localStorage.getItem('user') || 'null')
      }),
      getters: {
            isAuthenticated: (s) => !!s.token
      },
      actions: {
            async register(payload) {
                  const { data } = await api.post('/auth/register', payload)
                  this.setSession(data.token, data.user)
                  await this.loadMe()
                  const chat = useChatStore()
                  await chat.bootstrap()
            },
            async login(payload) {
                  const { data } = await api.post('/auth/login', payload)
                  this.setSession(data.token, data.user)
                  await this.loadMe()
                  const chat = useChatStore()
                  await chat.bootstrap()
            },
            async loadMe() {
                  if (!this.user) return
                  const { data } = await api.get(`/users/${this.user.id}`)
                  this.user = { id: data._id, name: data.name, username: data.username, avatarUrl: data.avatarUrl }
                  console.log('👤 Loaded user data:', { id: this.user.id, name: this.user.name, username: this.user.username })
                  localStorage.setItem('user', JSON.stringify(this.user))
                  const theme = data.settings?.theme || 'light'
                  document.documentElement.classList.toggle('dark', theme === 'dark')
            },
            async updateSettings(partial) {
                  const { data } = await api.post('/account/settings', partial)
                  const theme = data.theme || 'light'
                  document.documentElement.classList.toggle('dark', theme === 'dark')
            },
            setSession(token, user) {
                  this.token = token
                  this.user = user
                  console.log('🔐 Set session for user:', { id: user.id, name: user.name, username: user.username })
                  localStorage.setItem('token', token)
                  localStorage.setItem('user', JSON.stringify(user))
            },
            logout() {
                  this.token = null
                  this.user = null
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
            }
      }
})

