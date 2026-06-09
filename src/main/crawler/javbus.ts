import axios from 'axios'
import * as cheerio from 'cheerio'
import { detectSystemProxy } from '../utils/proxy'
import type { CrawlResult, ProxyConfig } from '../../shared/types'

let cachedProxy: { protocol: string; host: string; port: number } | null = null

async function getProxy(userProxy?: ProxyConfig) {
  if (userProxy?.enabled) return userProxy
  if (!cachedProxy) {
    cachedProxy = await detectSystemProxy()
    if (cachedProxy) console.log('[JavBus] 代理:', cachedProxy)
  }
  return cachedProxy || undefined
}

function makeConfig(proxy?: { protocol: string; host: string; port: number }) {
  const config: any = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8',
    },
    timeout: 30000
  }
  if (proxy) config.proxy = { protocol: proxy.protocol, host: proxy.host, port: proxy.port }
  return config
}

export async function fetchJavbus(code: string, userProxy?: ProxyConfig): Promise<CrawlResult> {
  const proxy = await getProxy(userProxy)
  const config = makeConfig(proxy)

  // 直接访问详情页（JavBus URL 格式：https://www.javbus.com/CODE）
  const detailUrl = `https://www.javbus.com/${code}`
  console.log('[JavBus] 详情页:', detailUrl)

  let detailHtml: string
  try {
    const res = await axios.get(detailUrl, config)
    detailHtml = res.data
  } catch (e: any) {
    throw new Error(`JavBus 访问失败: ${e.message} (可能需要代理)`)
  }

  const $ = cheerio.load(detailHtml)

  // 标题（多选择器兼容）
  let title = $('h3').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.replace(/\s*\|.*$/, '') ||
    $('title').text().trim().split('-')[0].trim() || ''

  // 清理标题中的番号前缀
  if (title.toUpperCase().startsWith(code.toUpperCase())) {
    title = title.substring(code.length).trim()
  }

  // 封面
  let coverUrl = $('a.bigImage img, .screencap img, #video_jacket_img').attr('src') || ''
  if (coverUrl && !coverUrl.startsWith('http')) {
    coverUrl = `https://www.javbus.com${coverUrl}`
  }

  // 发行日期
  let releaseDate = ''
  $('span.header:contains("發行日期"), span.header:contains("发行日期"), span.header:contains("Release")').each((_, el) => {
    const text = $(el).next('span').text().trim() || $(el).parent().text().trim()
    const match = text.match(/(\d{4}[-/]\d{2}[-/]\d{2})/)
    if (match) releaseDate = match[1].replace(/\//g, '-')
  })

  // 时长
  let duration: number | null = null
  $('span.header:contains("長度"), span.header:contains("时长"), span.header:contains("Runtime")').each((_, el) => {
    const text = $(el).next('span').text().trim() || $(el).parent().text().trim()
    const match = text.match(/(\d+)/)
    if (match) duration = parseInt(match[1]) * 60
  })

  // 导演
  let director = ''
  $('span.header:contains("導演"), span.header:contains("导演"), span.header:contains("Director")').each((_, el) => {
    director = $(el).next('a').text().trim() || $(el).next('span').text().trim()
  })

  // 制造商
  let maker = ''
  $('span.header:contains("片商"), span.header:contains("制造商"), span.header:contains("Studio")').each((_, el) => {
    maker = $(el).next('a').text().trim() || $(el).next('span').text().trim()
  })

  // 演员
  const actors: string[] = []
  $('#star-list .star-name a, .star-name a, a[href*="star"]').each((_, el) => {
    const name = $(el).text().trim()
    if (name && name.length < 20 && !actors.includes(name)) {
      actors.push(name)
    }
  })

  // 标签
  const tags: string[] = []
  $('span.genre a[href*="genre"], .genre a').each((_, el) => {
    const tag = $(el).text().trim()
    if (tag && !tags.includes(tag)) {
      tags.push(tag)
    }
  })

  // 样例图
  const sampleImages: string[] = []
  $('a.bigImage img, .screencap img, #sample-waterfall a img').each((_, el) => {
    const src = $(el).attr('src') || ''
    if (src && !sampleImages.includes(src)) {
      sampleImages.push(src.startsWith('http') ? src : `https://www.javbus.com${src}`)
    }
  })

  if (!title) {
    console.log('[JavBus] HTML 内容长度:', detailHtml.length)
    throw new Error('JavBus 未找到标题（可能页面被墙或番号不存在）')
  }

  return {
    title,
    cover_url: coverUrl,
    sample_image_urls: sampleImages,
    release_date: releaseDate || null,
    duration,
    actors,
    director: director || null,
    maker: maker || null,
    tags,
    rating: null,
    description: null
  }
}
