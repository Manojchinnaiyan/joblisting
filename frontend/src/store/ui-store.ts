import { create } from 'zustand'

interface UIState {
  isMobileMenuOpen: boolean
  isSearchOpen: boolean

  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  toggleSearch: () => void
  closeSearch: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  closeSearch: () => set({ isSearchOpen: false }),
}))
