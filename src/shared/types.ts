// 视频分类
export type VideoCategory = 'av' | 'fc2' | 'other'

// 视频基础信息
export interface Video {
  id: number
  code: string
  category: VideoCategory
  title: string
  cover_path: string | null
  file_path: string
  duration: number | null
  resolution: string | null
  release_date: string | null
  maker: string | null
  director: string | null
  rating: number | null
  ratingCount: number | null
  description: string | null
  fanza_url: string | null
  series: string | null
  label: string | null
  video_type: string | null
  product_code: string | null
  source: string | null
  video_dmm_id: string | null
  created_at: string
  updated_at: string
  actors?: Actor[]
  tags?: Tag[]
  sample_images?: SampleImage[]
}

export interface Actor {
  id: number
  name: string
}

export interface Tag {
  id: number
  name: string
}

export interface TagWithCount {
  id: number
  name: string
  count: number
}

export interface SampleImage {
  id: number
  video_id: number
  url: string | null
  local_path: string | null
  sort_order: number
}

// 爬虫结果
export interface CrawlResult {
  title: string
  cover_url: string
  sample_image_urls: string[]
  release_date: string | null
  duration: number | null
  actors: string[]
  director: string | null
  maker: string | null
  series?: string | null
  label?: string | null
  video_type?: string | null
  product_code?: string | null
  tags: string[]
  rating: number | null
  ratingCount?: number | null
  description: string | null
  fanza_url?: string
  javbus_url?: string
  source?: 'FANZA' | 'JavBus' | 'FC2' | 'Caribbeancom' | 'video.dmm'
}

// 文件扫描结果
export interface ScanResult {
  file_path: string
  file_name: string
  code: string | null
  category: VideoCategory | null
}

// 视频技术信息（ffprobe）
export interface VideoInfo {
  duration: number
  resolution: string
  codec: string
  bitrate: number
}

// 代理配置
export interface ProxyConfig {
  enabled: boolean
  protocol: 'http' | 'socks5'
  host: string
  port: number
}

// 筛选条件
export interface VideoFilters {
  keyword?: string
  category?: VideoCategory
  actor?: string
  tag?: string
  minRating?: number
  maxRating?: number
  startDate?: string
  endDate?: string
  sortBy?: 'created_at' | 'release_date' | 'rating' | 'title' | 'duration' | 'series'
  sortOrder?: 'asc' | 'desc'
}
