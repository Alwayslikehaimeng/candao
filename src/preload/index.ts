import { contextBridge, ipcRenderer } from 'electron'
import type { VideoFilters, Video, ScanResult, CrawlResult, VideoInfo, ProxyConfig, TagWithCount } from '../shared/types'

const api = {
  // 视频 CRUD
  listVideos: (filters: VideoFilters): Promise<Video[]> => ipcRenderer.invoke('video:list', filters),
  getVideo: (id: number): Promise<Video> => ipcRenderer.invoke('video:get', id),
  createVideo: (data: any): Promise<Video> => ipcRenderer.invoke('video:create', data),
  updateVideo: (id: number, data: any): Promise<Video> => ipcRenderer.invoke('video:update', id, data),
  deleteVideo: (id: number): Promise<void> => ipcRenderer.invoke('video:delete', id),
  randomVideo: (): Promise<Video | null> => ipcRenderer.invoke('video:random'),

  // 标签 & 分类统计
  listTagsWithCount: (): Promise<TagWithCount[]> => ipcRenderer.invoke('tag:listWithCount'),
  getCategoryCounts: (): Promise<Record<string, number>> => ipcRenderer.invoke('video:categoryCounts'),

  // 爬虫
  fetchAv: (code: string): Promise<{ success: boolean; data?: CrawlResult; error?: string }> =>
    ipcRenderer.invoke('crawler:fetchAv', code),
  fetchFc2: (code: string): Promise<{ success: boolean; data?: CrawlResult; error?: string }> =>
    ipcRenderer.invoke('crawler:fetchFc2', code),
  fetchJavbus: (code: string): Promise<{ success: boolean; data?: CrawlResult; error?: string }> =>
    ipcRenderer.invoke('crawler:fetchJavbus', code),
  fetchFromUrl: (url: string): Promise<{ success: boolean; data?: CrawlResult; error?: string }> =>
    ipcRenderer.invoke('crawler:fetchFromUrl', url),
  uploadImage: (videoId: number, filePath: string): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('crawler:uploadImage', videoId, filePath),
  deleteSampleImage: (videoId: number, localPath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('crawler:deleteSampleImage', videoId, localPath),
  reCrawlAll: (videoIds?: number[]): Promise<{ success: number; failed: number; skipped: number }> =>
    ipcRenderer.invoke('crawler:reCrawlAll', videoIds),
  downloadImages: (
    videoId: number,
    coverUrl: string,
    sampleUrls: string[]
  ): Promise<{ success: boolean; data?: any; error?: string }> =>
    ipcRenderer.invoke('crawler:downloadImages', videoId, coverUrl, sampleUrls),

  // 文件扫描
  scanFolder: (folderPath: string): Promise<ScanResult[]> =>
    ipcRenderer.invoke('scanner:scanFolder', folderPath),
  parseCode: (filename: string): Promise<string | null> =>
    ipcRenderer.invoke('scanner:parseCode', filename),

  // 播放
  play: (filePath: string): Promise<void> => ipcRenderer.invoke('player:play', filePath),
  randomPlay: (): Promise<Video | null> => ipcRenderer.invoke('player:randomPlay'),

  // 视频信息
  probeVideo: (filePath: string): Promise<{ success: boolean; data?: VideoInfo; error?: string }> =>
    ipcRenderer.invoke('ffprobe:probe', filePath),

  // 设置
  getProxy: (): Promise<ProxyConfig> => ipcRenderer.invoke('settings:getProxy'),
  setProxy: (config: ProxyConfig): Promise<void> => ipcRenderer.invoke('settings:setProxy', config),
  getApiKey: (): Promise<string> => ipcRenderer.invoke('settings:getApiKey'),
  setApiKey: (key: string): Promise<void> => ipcRenderer.invoke('settings:setApiKey', key),
  getApiBase: (): Promise<string> => ipcRenderer.invoke('settings:getApiBase'),
  setApiBase: (base: string): Promise<void> => ipcRenderer.invoke('settings:setApiBase', base),
  getModel: (): Promise<string> => ipcRenderer.invoke('settings:getModel'),
  setModel: (model: string): Promise<void> => ipcRenderer.invoke('settings:setModel', model),

  // 文件对话框
  openFileDialog: (forImages?: boolean): Promise<string | null> => ipcRenderer.invoke('dialog:openFile', { forImages }),
  openFolderDialog: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),

  // 外部链接
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),

  // 通用设置
  getSetting: (key: string): Promise<string | null> => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string): Promise<void> => ipcRenderer.invoke('settings:set', key, value)
}

contextBridge.exposeInMainWorld('api', api)
