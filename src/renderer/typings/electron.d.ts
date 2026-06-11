import type { Video, VideoFilters, ScanResult, CrawlResult, VideoInfo, ProxyConfig, TagWithCount } from '../../shared/types'

interface ElectronAPI {
  listVideos: (filters: VideoFilters) => Promise<Video[]>
  getVideo: (id: number) => Promise<Video>
  createVideo: (data: any) => Promise<Video>
  updateVideo: (id: number, data: any) => Promise<Video>
  deleteVideo: (id: number) => Promise<void>
  randomVideo: () => Promise<Video | null>

  // 标签 & 分类统计
  listTagsWithCount: () => Promise<TagWithCount[]>
  getCategoryCounts: () => Promise<Record<string, number>>

  fetchAv: (code: string) => Promise<{ success: boolean; data?: CrawlResult; error?: string }>
  fetchFc2: (code: string) => Promise<{ success: boolean; data?: CrawlResult; error?: string }>
  fetchJavbus: (code: string) => Promise<{ success: boolean; data?: CrawlResult; error?: string }>
  fetchFromUrl: (url: string) => Promise<{ success: boolean; data?: CrawlResult; error?: string }>
  uploadImage: (videoId: number, filePath: string) => Promise<{ success: boolean; path?: string; error?: string }>
  deleteSampleImage: (videoId: number, localPath: string) => Promise<{ success: boolean; error?: string }>
  downloadImages: (videoId: number, coverUrl: string, sampleUrls: string[]) => Promise<{ success: boolean; data?: any; error?: string }>
  scanFolder: (folderPath: string) => Promise<ScanResult[]>
  parseCode: (filename: string) => Promise<string | null>
  play: (filePath: string) => Promise<void>
  randomPlay: () => Promise<Video | null>
  probeVideo: (filePath: string) => Promise<{ success: boolean; data?: VideoInfo; error?: string }>
  getProxy: () => Promise<ProxyConfig>
  setProxy: (config: ProxyConfig) => Promise<void>
  getApiKey: () => Promise<string>
  setApiKey: (key: string) => Promise<void>
  getApiBase: () => Promise<string>
  setApiBase: (base: string) => Promise<void>
  getModel: () => Promise<string>
  setModel: (model: string) => Promise<void>
  openFileDialog: (forImages?: boolean) => Promise<string | null>
  openFolderDialog: () => Promise<string | null>
  openExternal: (url: string) => Promise<void>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
