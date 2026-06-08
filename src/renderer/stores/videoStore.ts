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
    sortBy: 'created_at',
    sortOrder: 'desc'
  },

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
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
