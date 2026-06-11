import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import {
  listVideos,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  getRandomVideo,
  addSampleImages,
  getTagsWithCount,
  getCategoryCounts,
  getVideoByCode
} from '../database/video'
import { scanFolder, parseCode } from '../scanner/scanner'
import { probeVideo } from '../ffprobe/probe'
import { fetchFanza } from '../crawler/fanza'
import { fetchFc2 } from '../crawler/fc2'
import { fetchJavbus } from '../crawler/javbus'
import { fetchVideoDmm } from '../crawler/video-dmm'
import { searchVideoDmmId } from '../crawler/video-dmm-search'
import { downloadImage } from '../utils/download'
import { getCoversDir, getSetting, setSetting } from '../database/schema'
import { setApiKey, setApiBase, getApiKey, setModel } from '../utils/ai-translate'
import { join } from 'path'
import type { VideoFilters, CrawlResult } from '../../shared/types'

let proxyConfig = { enabled: false, protocol: 'http' as const, host: '', port: 0 }

export function registerIpcHandlers(): void {
  // 视频 CRUD
  ipcMain.handle('video:list', (_, filters: VideoFilters) => {
    return listVideos(filters)
  })

  ipcMain.handle('video:get', (_, id: number) => {
    return getVideo(id)
  })

  ipcMain.handle('video:create', (_, data) => {
    return createVideo(data)
  })

  ipcMain.handle('video:update', (_, id: number, data) => {
    return updateVideo(id, data)
  })

  ipcMain.handle('video:delete', (_, id: number) => {
    return deleteVideo(id)
  })

  ipcMain.handle('video:random', () => {
    return getRandomVideo()
  })

  // 标签 & 分类统计
  ipcMain.handle('tag:listWithCount', () => {
    return getTagsWithCount()
  })

  ipcMain.handle('video:categoryCounts', () => {
    return getCategoryCounts()
  })

  // 爬虫（FANZA → video.dmm GraphQL → JavBus）
  ipcMain.handle('crawler:fetchAv', async (_, code: string) => {
    const proxy = proxyConfig.enabled ? proxyConfig : undefined

    // 先尝试 FANZA（cheerio）
    try {
      const result = await fetchFanza(code, proxy)
      return { success: true, data: result }
    } catch (fanzaError: any) {
      console.log('[抓取] FANZA 失败:', fanzaError.message)
    }

    // FANZA 失败，尝试 video.dmm GraphQL 搜索
    try {
      console.log('[抓取] 尝试 video.dmm GraphQL 搜索:', code)

      // 检查数据库中是否已有缓存的 video_dmm_id
      const existingVideo = await getVideoByCode(code)
      let videoDmmId = existingVideo?.video_dmm_id || null

      if (videoDmmId) {
        console.log('[抓取] 使用缓存的 video_dmm_id:', videoDmmId)
      } else {
        // 全量分页搜索
        videoDmmId = await searchVideoDmmId(code, proxy)
        if (videoDmmId) {
          console.log('[抓取] 搜索到 video_dmm_id:', videoDmmId)
          // 保存到数据库
          if (existingVideo) {
            await updateVideo(existingVideo.id, { video_dmm_id: videoDmmId })
            console.log('[抓取] 已缓存 video_dmm_id 到数据库')
          }
        }
      }

      if (!videoDmmId) {
        throw new Error('video.dmm 未找到匹配结果')
      }

      // 用完整 ID 构造详情页 URL
      const detailUrl = `https://video.dmm.co.jp/av/content/?id=${videoDmmId}`
      console.log('[抓取] 详情页:', detailUrl)
      const result = await fetchVideoDmm(detailUrl, proxy)
      return { success: true, data: result }
    } catch (videoDmmError: any) {
      console.log('[抓取] video.dmm 失败:', videoDmmError.message)
    }

    // 都失败，尝试 JavBus
    try {
      const result = await fetchJavbus(code, proxy)
      return { success: true, data: result }
    } catch (javbusError: any) {
      return { success: false, error: `FANZA + video.dmm + JavBus 均失败` }
    }
  })

  ipcMain.handle('crawler:fetchFc2', async (_, code: string) => {
    try {
      const result = await fetchFc2(code, proxyConfig.enabled ? proxyConfig : undefined)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 下载封面和示例图
  ipcMain.handle('crawler:downloadImages', async (_, videoId: number, coverUrl: string, sampleUrls: string[]) => {
    try {
      const coversDir = getCoversDir()
      const results: { cover_path: string; sample_paths: string[] } = {
        cover_path: '',
        sample_paths: []
      }

      console.log('[下载] 开始下载, coverUrl:', coverUrl ? '有' : '无', 'sampleUrls:', sampleUrls.length)
      const coverFileName = `${videoId}_cover.jpg`
      const coverPath = join(coversDir, coverFileName)
      await downloadImage(coverUrl, coverPath)
      results.cover_path = coverPath

      // 下载示例图，跳过 404，限制 30 张，去重
      const maxImages = 30
      const downloadedHashes = new Set<string>()
      console.log('[下载] 开始下载示例图, 共', sampleUrls.length, '个URL')
      for (let i = 0; i < sampleUrls.length && results.sample_paths.length < maxImages; i++) {
        try {
          const sampleFileName = `${videoId}_sample_${results.sample_paths.length}.jpg`
          const samplePath = join(coversDir, sampleFileName)
          await downloadImage(sampleUrls[i], samplePath)
          const stat = require('fs').statSync(samplePath)
          if (stat.size < 2048) { // 小于 2KB 的删掉
            require('fs').unlinkSync(samplePath)
            continue
          }
          // 用文件大小+前1024字节做简单哈希去重
          const fd = require('fs').openSync(samplePath, 'r')
          const buf = Buffer.alloc(1024)
          require('fs').readSync(fd, buf, 0, 1024, 0)
          require('fs').closeSync(fd)
          const hash = `${stat.size}_${buf.toString('hex').substring(0, 64)}`
          if (downloadedHashes.has(hash)) {
            require('fs').unlinkSync(samplePath)
            console.log('[下载] 跳过重复:', sampleUrls[i].substring(0, 60))
          } else {
            downloadedHashes.add(hash)
            results.sample_paths.push(samplePath)
          }
        } catch (e: any) {
          console.log('[下载] 失败:', sampleUrls[i].substring(0, 60), e.message)
        }
      }
      console.log('[下载] 完成, 共下载', results.sample_paths.length, '张示例图')

      updateVideo(videoId, { cover_path: results.cover_path })
      if (results.sample_paths.length > 0) {
        addSampleImages(
          videoId,
          results.sample_paths.map((p) => ({ local_path: p }))
        )
      }

      return { success: true, data: results }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 文件扫描
  ipcMain.handle('scanner:scanFolder', (_, folderPath: string) => {
    return scanFolder(folderPath)
  })

  ipcMain.handle('scanner:parseCode', (_, filename: string) => {
    return parseCode(filename)
  })

  // 播放
  ipcMain.handle('player:play', (_, filePath: string) => {
    shell.openPath(filePath)
  })

  ipcMain.handle('player:randomPlay', () => {
    const video = getRandomVideo()
    if (video) {
      shell.openPath(video.file_path)
    }
    return video
  })

  // 视频信息提取
  ipcMain.handle('ffprobe:probe', async (_, filePath: string) => {
    try {
      const info = await probeVideo(filePath)
      return { success: true, data: info }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 设置
  ipcMain.handle('settings:getProxy', () => {
    return proxyConfig
  })

  ipcMain.handle('settings:setProxy', (_, config) => {
    proxyConfig = config
  })

  // AI 翻译设置（从数据库加载/保存）
  const savedKey = getSetting('api_key') || ''
  const savedBase = getSetting('api_base') || 'https://api.openai.com/v1'
  const savedModel = getSetting('model_name') || 'gpt-4o-mini'
  if (savedKey) setApiKey(savedKey)
  if (savedBase) setApiBase(savedBase)
  if (savedModel) setModel(savedModel)
  console.log('[设置] API Key:', savedKey ? '已加载' : '未设置', 'Base:', savedBase, 'Model:', savedModel)

  ipcMain.handle('settings:getApiKey', () => {
    return getApiKey()
  })

  ipcMain.handle('settings:setApiKey', (_, key: string) => {
    setApiKey(key)
    setSetting('api_key', key)
  })

  ipcMain.handle('settings:getApiBase', () => {
    return getSetting('api_base') || 'https://api.openai.com/v1'
  })

  ipcMain.handle('settings:setApiBase', (_, base: string) => {
    setApiBase(base)
    setSetting('api_base', base)
  })

  ipcMain.handle('settings:getModel', () => {
    return getSetting('model_name') || 'gpt-4o-mini'
  })

  ipcMain.handle('settings:setModel', (_, model: string) => {
    setModel(model)
    setSetting('model_name', model)
  })

  // 文件对话框
  ipcMain.handle('dialog:openFile', async (_, options?: { forImages?: boolean }) => {
    const win = BrowserWindow.getFocusedWindow()
    const filters = options?.forImages
      ? [
          { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
          { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'wmv', 'flv', 'mov', 'm4v'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      : [
          { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'wmv', 'flv', 'mov', 'm4v', 'ts', 'rmvb', 'rm'] },
          { name: '所有文件', extensions: ['*'] }
        ]
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:openFolder', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // 外部链接
  ipcMain.handle('shell:openExternal', (_, url: string) => {
    shell.openExternal(url)
  })

  // 通用设置
  ipcMain.handle('settings:get', (_, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle('settings:set', (_, key: string, value: string) => {
    setSetting(key, value)
  })
}
