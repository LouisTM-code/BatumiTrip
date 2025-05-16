import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      /* ---------- состояние ---------- */
      // --- Navigation & Directions ---
      /** UUID активного направления или null, когда пользователь находится в Hub */
      activeDirectionId: null,
      /** Временный черновик формы DestinationModal (create/edit) */
      directionFormDraft: null,

      // --- Search & Filters ---
      searchQuery: '',
      selectedTags: [],
      showLoginModal: false,

      /** Флаг «показывать только избранное» */
      showOnlyFavourites: false,
      /** Map {id: boolean} локально отмеченных избранных */
      favourites: {},

      /* ---------- actions ---------- */
      /** Установить активное направление; null — для Hub */
      setActiveDirection: (id) => set({ activeDirectionId: id }),

      /** Обновить / очистить черновик формы направления */
      setDirectionDraft: (draft) => set({ directionFormDraft: draft }),

      setSearchQuery: (q) => set({ searchQuery: q }),

      toggleTag: (tag) =>
        set((s) => ({
          selectedTags: s.selectedTags.includes(tag)
            ? s.selectedTags.filter((t) => t !== tag)
            : [...s.selectedTags, tag],
        })),

      setLoginModal: (v) => set({ showLoginModal: v }),
      /** Локальный optimistic-тоггл для одной локации */
      toggleFavourite: (id) =>
        set((s) => ({
          favourites: { ...s.favourites, [id]: !s.favourites[id] },
        })),
      /** Гидратация списка избранных из Supabase */
      hydrateFavourites: (ids) =>
        set(() => ({
          favourites: Object.fromEntries(ids.map((id) => [id, true])),
        })),
      /** Переключатель глобального фильтра «только избранное» */
      toggleShowOnlyFavourites: () =>
        set((s) => ({ showOnlyFavourites: !s.showOnlyFavourites })),
    }),
    {
      name: 'batumi-ui',
      version: 2, // bump after adding directions fields
      /** В localStorage храним только actual избранные,
          остальные UI-флаги не нужно персистить */
      partialize: (s) => ({ favourites: s.favourites }),
    }
  )
);
