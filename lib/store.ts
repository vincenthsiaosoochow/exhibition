import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Language } from './i18n/translations';

interface AppState {
  isOffline: boolean;
  setOffline: (status: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOffline: false,
      setOffline: (status) => set({ isOffline: status }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'global-art-finder-storage',
      partialize: (state) => ({ searchQuery: state.searchQuery }),
    }
  )
);
