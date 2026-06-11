import { create } from 'zustand'
import type { Video, VideoFilters } from '../../shared/types'

interface VideoStore {
  videos: Video[]
  loading: boolean
  filters: VideoFilters

  setFilters: (filters: Partial<VideoFilters>) => void
  refreshVideos: () => Promise<void>
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  videos: [],
  loading: false,
  filters: {
    sortBy: (localStorage.getItem('sortBy') as any) || 'created_at',
    sortOrder: (localStorage.getItem('sortOrder') as any) || 'desc'
  },

  setFilters: (newFilters) =>
    set((state) => {
      const filters = { ...state.filters, ...newFilters }
      if (newFilters.sortBy) localStorage.setItem('sortBy', newFilters.sortBy)
      if (newFilters.sortOrder) localStorage.setItem('sortOrder', newFilters.sortOrder)
      return { filters }
    }),
  refreshVideos: async () => {
    set({ loading: true })
    try {
      const videos = await window.api.listVideos(get().filters)
      set({ videos })
    } finally {
      set({ loading: false })
    }
  }
}))
