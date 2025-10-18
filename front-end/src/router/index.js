import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Home = () => import('../views/Home.vue')
const Chat = () => import('../views/Chat.vue')
const Groups = () => import('../views/Groups.vue')
const GroupSettings = () => import('../views/GroupSettings.vue')
const Channels = () => import('../views/Channels.vue')
const Profile = () => import('../views/Profile.vue')
const Settings = () => import('../views/Settings.vue')

const router = createRouter({
      history: createWebHistory(),
      routes: [
            { path: '/login', name: 'login', component: Login, meta: { guest: true } },
            { path: '/register', name: 'register', component: Register, meta: { guest: true } },
            { path: '/', name: 'home', component: Home, meta: { requiresAuth: true } },
            { path: '/chat', name: 'chat', component: Chat, meta: { requiresAuth: true } },
            { path: '/groups', name: 'groups', component: Groups, meta: { requiresAuth: true } },
            { path: '/groups/:groupId/settings', name: 'group-settings', component: GroupSettings, meta: { requiresAuth: true } },
            { path: '/channels', name: 'channels', component: Channels, meta: { requiresAuth: true } },
            { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
            { path: '/settings', name: 'settings', component: Settings, meta: { requiresAuth: true } },
      ]
})

router.beforeEach((to) => {
      const auth = useAuthStore()
      if (to.meta.requiresAuth && !auth.isAuthenticated) {
            return { name: 'login' }
      }
      if (to.meta.guest && auth.isAuthenticated) {
            return { name: 'home' }
      }
})

export default router

