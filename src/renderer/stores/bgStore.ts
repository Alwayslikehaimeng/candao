import { create } from 'zustand'

export type BgMode = 'none' | 'image' | 'video'

export interface WallpaperItem {
  id: string
  path: string
  name: string
}

export interface MediaItem {
  id: string
  src: string
  type: 'image' | 'video'
}

interface BgState {
  mode: BgMode
  blur: number
  brightness: number
  saturation: number

  // 分离的壁纸库
  imageWallpapers: WallpaperItem[]
  videoWallpapers: WallpaperItem[]

  // 当前选中的壁纸 ID
  currentImageId: string | null
  currentVideoId: string | null

  // 轮播
  rotationEnabled: boolean
  rotationInterval: number // 秒

  // 当前显示
  currentSrc: string | null
  currentType: 'image' | 'video' | null

  // 预加载
  preloadedSrc: string | null
  preloadedType: 'image' | 'video' | null
  preloadedNextSrc: string | null
  preloadedNextType: 'image' | 'video' | null

  // 方法
  setMode: (mode: BgMode) => void
  setBlur: (v: number) => void
  setBrightness: (v: number) => void
  setSaturation: (v: number) => void

  addImage: (path: string, name: string) => void
  removeImage: (id: string) => void
  setCurrentImage: (id: string) => void

  addVideo: (path: string, name: string) => void
  removeVideo: (id: string) => void
  setCurrentVideo: (id: string) => void

  nextWallpaper: () => void
  prevWallpaper: () => void

  setRotationEnabled: (v: boolean) => void
  setRotationInterval: (v: number) => void

  setPreloadedResource: (src: string, type: 'image' | 'video') => void
  promotePreloadedToNext: () => void
  getNextMediaItem: () => MediaItem | null
  getNextNextMediaItem: () => MediaItem | null

  init: () => Promise<void>
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function saveToDisk() {
  const s = useBgStore.getState()
  window.api.setSetting('bg_images', JSON.stringify(s.imageWallpapers))
  window.api.setSetting('bg_videos', JSON.stringify(s.videoWallpapers))
}

export const useBgStore = create<BgState>((set, get) => ({
  mode: 'none',
  blur: 40,
  brightness: 35,
  saturation: 110,
  imageWallpapers: [],
  videoWallpapers: [],
  currentImageId: null,
  currentVideoId: null,
  rotationEnabled: false,
  rotationInterval: 300,
  currentSrc: null,
  currentType: null,
  preloadedSrc: null,
  preloadedType: null,
  preloadedNextSrc: null,
  preloadedNextType: null,

  setMode: (mode) => {
    set({ mode })
    window.api.setSetting('bg_mode', mode)
    const s = get()
    if (mode === 'none') {
      set({ currentSrc: null, currentType: null })
    } else if (mode === 'image' && s.imageWallpapers.length > 0) {
      const wp = s.imageWallpapers.find(w => w.id === s.currentImageId) || s.imageWallpapers[0]
      set({ currentImageId: wp.id, currentSrc: wp.path, currentType: 'image' })
      window.api.setSetting('bg_current_image_id', wp.id)
    } else if (mode === 'video' && s.videoWallpapers.length > 0) {
      const wp = s.videoWallpapers.find(w => w.id === s.currentVideoId) || s.videoWallpapers[0]
      set({ currentVideoId: wp.id, currentSrc: wp.path, currentType: 'video' })
      window.api.setSetting('bg_current_video_id', wp.id)
    }
  },

  setBlur: (v) => { set({ blur: v }); window.api.setSetting('bg_blur', String(v)) },
  setBrightness: (v) => { set({ brightness: v }); window.api.setSetting('bg_brightness', String(v)) },
  setSaturation: (v) => { set({ saturation: v }); window.api.setSetting('bg_saturation', String(v)) },

  addImage: (path, name) => {
    const item: WallpaperItem = { id: genId(), path, name }
    const wallpapers = [...get().imageWallpapers, item]
    set({ imageWallpapers: wallpapers })
    saveToDisk()
    if (wallpapers.length === 1 && get().mode === 'image') {
      set({ currentImageId: item.id, currentSrc: path, currentType: 'image' })
      window.api.setSetting('bg_current_image_id', item.id)
    }
  },

  removeImage: (id) => {
    const s = get()
    const wallpapers = s.imageWallpapers.filter(w => w.id !== id)
    set({ imageWallpapers: wallpapers })
    saveToDisk()
    if (s.currentImageId === id) {
      if (wallpapers.length > 0) {
        const wp = wallpapers[0]
        set({ currentImageId: wp.id, currentSrc: wp.path, currentType: 'image' })
        window.api.setSetting('bg_current_image_id', wp.id)
      } else {
        set({ currentImageId: null, currentSrc: null, currentType: null })
      }
    }
  },

  setCurrentImage: (id) => {
    const wp = get().imageWallpapers.find(w => w.id === id)
    if (wp) {
      set({ currentImageId: id, currentSrc: wp.path, currentType: 'image' })
      window.api.setSetting('bg_current_image_id', id)
    }
  },

  addVideo: (path, name) => {
    const item: WallpaperItem = { id: genId(), path, name }
    const wallpapers = [...get().videoWallpapers, item]
    set({ videoWallpapers: wallpapers })
    saveToDisk()
    if (wallpapers.length === 1 && get().mode === 'video') {
      set({ currentVideoId: item.id, currentSrc: path, currentType: 'video' })
      window.api.setSetting('bg_current_video_id', item.id)
    }
  },

  removeVideo: (id) => {
    const s = get()
    const wallpapers = s.videoWallpapers.filter(w => w.id !== id)
    set({ videoWallpapers: wallpapers })
    saveToDisk()
    if (s.currentVideoId === id) {
      if (wallpapers.length > 0) {
        const wp = wallpapers[0]
        set({ currentVideoId: wp.id, currentSrc: wp.path, currentType: 'video' })
        window.api.setSetting('bg_current_video_id', wp.id)
      } else {
        set({ currentVideoId: null, currentSrc: null, currentType: null })
      }
    }
  },

  setCurrentVideo: (id) => {
    const wp = get().videoWallpapers.find(w => w.id === id)
    if (wp) {
      set({ currentVideoId: id, currentSrc: wp.path, currentType: 'video' })
      window.api.setSetting('bg_current_video_id', id)
    }
  },

  nextWallpaper: () => {
    const s = get()
    if (s.mode === 'image') {
      const list = s.imageWallpapers
      if (list.length === 0) return
      const idx = list.findIndex(w => w.id === s.currentImageId)
      const next = list[(idx + 1) % list.length]
      set({ currentImageId: next.id, currentSrc: next.path, currentType: 'image' })
      window.api.setSetting('bg_current_image_id', next.id)
    } else if (s.mode === 'video') {
      const list = s.videoWallpapers
      if (list.length === 0) return
      const idx = list.findIndex(w => w.id === s.currentVideoId)
      const next = list[(idx + 1) % list.length]
      set({ currentVideoId: next.id, currentSrc: next.path, currentType: 'video' })
      window.api.setSetting('bg_current_video_id', next.id)
    }
  },

  prevWallpaper: () => {
    const s = get()
    if (s.mode === 'image') {
      const list = s.imageWallpapers
      if (list.length === 0) return
      const idx = list.findIndex(w => w.id === s.currentImageId)
      const prev = list[(idx - 1 + list.length) % list.length]
      set({ currentImageId: prev.id, currentSrc: prev.path, currentType: 'image' })
      window.api.setSetting('bg_current_image_id', prev.id)
    } else if (s.mode === 'video') {
      const list = s.videoWallpapers
      if (list.length === 0) return
      const idx = list.findIndex(w => w.id === s.currentVideoId)
      const prev = list[(idx - 1 + list.length) % list.length]
      set({ currentVideoId: prev.id, currentSrc: prev.path, currentType: 'video' })
      window.api.setSetting('bg_current_video_id', prev.id)
    }
  },

  setRotationEnabled: (v) => { set({ rotationEnabled: v }); window.api.setSetting('bg_rotation_enabled', String(v)) },
  setRotationInterval: (v) => { set({ rotationInterval: v }); window.api.setSetting('bg_rotation_interval', String(v)) },

  setPreloadedResource: (src, type) => {
    // 存入 next 槽位
    set({ preloadedSrc: src, preloadedType: type })
  },
  promotePreloadedToNext: () => {
    // 把当前 preloaded 升级为 next，清空 preloaded
    const s = get()
    set({
      preloadedSrc: s.preloadedNextSrc,
      preloadedType: s.preloadedNextType,
      preloadedNextSrc: null,
      preloadedNextType: null
    })
  },
  getNextMediaItem: (): MediaItem | null => {
    const s = useBgStore.getState()
    if (s.mode === 'image') {
      const list = s.imageWallpapers
      if (list.length === 0) return null
      const idx = list.findIndex(w => w.id === s.currentImageId)
      const next = list[(idx + 1) % list.length]
      return { id: next.id, src: next.path, type: 'image' }
    } else if (s.mode === 'video') {
      const list = s.videoWallpapers
      if (list.length === 0) return null
      const idx = list.findIndex(w => w.id === s.currentVideoId)
      const next = list[(idx + 1) % list.length]
      return { id: next.id, src: next.path, type: 'video' }
    }
    return null
  },

  getNextNextMediaItem: (): MediaItem | null => {
    const s = useBgStore.getState()
    if (s.mode === 'image') {
      const list = s.imageWallpapers
      if (list.length < 2) return null
      const idx = list.findIndex(w => w.id === s.currentImageId)
      const nextNext = list[(idx + 2) % list.length]
      return { id: nextNext.id, src: nextNext.path, type: 'image' }
    } else if (s.mode === 'video') {
      const list = s.videoWallpapers
      if (list.length < 2) return null
      const idx = list.findIndex(w => w.id === s.currentVideoId)
      const nextNext = list[(idx + 2) % list.length]
      return { id: nextNext.id, src: nextNext.path, type: 'video' }
    }
    return null
  },

  init: async () => {
    const mode = (await window.api.getSetting('bg_mode') as BgMode) || 'none'
    const blur = parseInt(await window.api.getSetting('bg_blur') || '40')
    const brightness = parseInt(await window.api.getSetting('bg_brightness') || '35')
    const saturation = parseInt(await window.api.getSetting('bg_saturation') || '110')
    const rotationEnabled = (await window.api.getSetting('bg_rotation_enabled')) === 'true'
    const rotationInterval = parseInt(await window.api.getSetting('bg_rotation_interval') || '300')
    const savedImageId = await window.api.getSetting('bg_current_image_id') || null
    const savedVideoId = await window.api.getSetting('bg_current_video_id') || null

    let imageWallpapers: WallpaperItem[] = []
    let videoWallpapers: WallpaperItem[] = []
    try {
      const si = await window.api.getSetting('bg_images')
      if (si) imageWallpapers = JSON.parse(si)
    } catch {}
    try {
      const sv = await window.api.getSetting('bg_videos')
      if (sv) videoWallpapers = JSON.parse(sv)
    } catch {}

    console.log('[BG] 初始化:', { mode, savedImageId, savedVideoId, images: imageWallpapers.length, videos: videoWallpapers.length })

    set({
      mode, blur, brightness, saturation,
      imageWallpapers, videoWallpapers,
      rotationEnabled, rotationInterval,
      currentImageId: savedImageId,
      currentVideoId: savedVideoId
    })

    if (mode === 'image' && imageWallpapers.length > 0) {
      const wp = imageWallpapers.find(w => w.id === savedImageId) || imageWallpapers[0]
      console.log('[BG] 恢复图片壁纸:', wp.name)
      set({ currentImageId: wp.id, currentSrc: wp.path, currentType: 'image' })
    } else if (mode === 'video' && videoWallpapers.length > 0) {
      const wp = videoWallpapers.find(w => w.id === savedVideoId) || videoWallpapers[0]
      console.log('[BG] 恢复视频壁纸:', wp.name)
      set({ currentVideoId: wp.id, currentSrc: wp.path, currentType: 'video' })
    }
  }
}))
