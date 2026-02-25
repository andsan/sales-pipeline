import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { UserRole } from '@/types'

const TOKEN_KEY = 'pipeline_token'
const USER_KEY = 'pipeline_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const username = ref<string | null>(JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')?.username ?? null)
  const role = ref<UserRole | null>(JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')?.role ?? null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')

  async function login(user: string, password: string): Promise<void> {
    const res = await api.login(user, password)
    token.value = res.token
    username.value = res.username
    role.value = res.role
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify({ username: res.username, role: res.role }))
  }

  async function logout(): Promise<void> {
    if (token.value) {
      await api.logout(token.value).catch(() => {/* best effort */})
    }
    token.value = null
    username.value = null
    role.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, username, role, isAuthenticated, isAdmin, login, logout }
})
