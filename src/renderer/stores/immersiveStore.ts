import { create } from 'zustand'

interface ImmersiveState {
  enabled: boolean
  level: 0 | 1 | 2 | 3
  sidebarHover: boolean
  setEnabled: (v: boolean) => void
  setLevel: (l: 0 | 1 | 2 | 3) => void
  setSidebarHover: (v: boolean) => void
  init: () => Promise<void>
}

export const useImmersiveStore = create<ImmersiveState>((set) => ({
  enabled: true,
  level: 0,
  sidebarHover: false,

  setEnabled: (v) => { set({ enabled: v }); window.api.setSetting('immersive_enabled', String(v)) },
  setLevel: (l) => set({ level: l }),
  setSidebarHover: (v) => set({ sidebarHover: v }),

  init: async () => {
    const saved = await window.api.getSetting('immersive_enabled')
    set({ enabled: saved !== 'false' })
  }
}))
