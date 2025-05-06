import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      searchQuery: '',
      selectedTags: [],
      showLoginModal: false,
      favourites: {},

      setSearchQuery: (q) => set({ searchQuery: q }),
      toggleTag: (tag) =>
        set((s) => ({
          selectedTags: s.selectedTags.includes(tag)
            ? s.selectedTags.filter((t) => t !== tag)
            : [...s.selectedTags, tag],
        })),
      setLoginModal: (v) => set({ showLoginModal: v }),

      toggleFavourite: (id) =>
        set((s) => ({ favourites: { ...s.favourites, [id]: !s.favourites[id] } })),

      hydrateFavourites: (ids) =>
        set(() => ({ favourites: Object.fromEntries(ids.map((id) => [id, true])) })),
    }),
    {
      name: 'batumi-ui',
      partialize: (s) => ({ favourites: s.favourites }),
    }
  )
);
