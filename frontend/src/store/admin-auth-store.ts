import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AdminUser } from '@/lib/api/admin/auth'

interface AdminAuthState {
  user: AdminUser | null
  accessToken: string | null
  refreshToken: string | null
  tempToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setUser: (user: AdminUser) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setTempToken: (token: string) => void
  clearTempToken: () => void
  logout: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tempToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setTempToken: (token) => set({ tempToken: token }),

      clearTempToken: () => set({ tempToken: null }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tempToken: null,
          isAuthenticated: false,
        }),

      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
