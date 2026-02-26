import { create } from 'zustand'
import { authService } from '@/services/auth'
import type { AuthUser, LoginCredentials, RegisterCredentials } from '@/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: null,
  get isAuthenticated() {
    return !!get().token
  },

  async login(credentials) {
    const res = await authService.login(credentials)
    localStorage.setItem('auth_token', res.token)
    set({ token: res.token, user: res.user })
  },

  async register(credentials) {
    const res = await authService.register(credentials)
    localStorage.setItem('auth_token', res.token)
    set({ token: res.token, user: res.user })
  },

  logout() {
    localStorage.removeItem('auth_token')
    set({ token: null, user: null })
  },
}))
