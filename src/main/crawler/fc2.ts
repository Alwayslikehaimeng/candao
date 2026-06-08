import axios from 'axios'
import * as cheerio from 'cheerio'
import { detectSystemProxy } from '../utils/proxy'
import type { CrawlResult, ProxyConfig } from '../../shared/types'

let cachedProxy: { protocol: string; host: string; port: number } | null = null

async function getProxy(userProxy?: ProxyConfig): Promise<{ protocol: string; host: string; port: number } | undefined> {
  if (userProxy?.enabled) return userProxy
  if (!cachedProxy) cachedProxy = await detectSystemProxy()
  return cachedProxy || undefined
}

function createAxiosConfig(proxy?: { protocol: string; host: string; port: number }) {
  const config: any = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout: 30000
  }
  if (proxy) {
    config.proxy = { protocol: proxy.protocol, host: proxy.host, port: proxy.port }
  }
  return config
}

export async function fetchFc2(code: string, userProxy?: ProxyConfig): Promise<CrawlResult> {
  const proxy = await getProxy(userProxy)
  const config = createAxiosConfig(proxy)

  const idMatch = code.match(/FC2[-_\s]?PPV[-_\s]?(\d+)/i)
  if (!idMatch) throw new Error(`无效的 FC2 代码格式: ${code}`)
  const fc2Id = idMatch[1]
  const detailUrl = `https://adult.contents.fc2.com/article/${fc2Id}/`

  const detailRes = await axios.get(detailUrl, config)
  const $ = cheerio.load(detailRes.data)

  const title = $('h1').text().trim() ||
    $('meta[property="og:title"]').attr('content')?.replace(' - FC2', '') || ''

  const coverUrl = $('meta[property="og:image"]').attr('content') ||
    $('img[class*="main"], .item_image img').attr('src') || ''

  const sampleUrls: string[] = []
  $('img[src*="contents.fc2.com"], .sample_images img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src')
    if (src && !src.includes('icon') && !src.includes('logo')) sampleUrls.push(src)
  })

  const maker = $('a[href*="seller"], .seller_name').text().trim() || null

  const tags: string[] = []
  $('a[href*="tag"], .tag a').each((_, el) => {
    const tag = $(el).text().trim()
    if (tag) tags.push(tag)
  })

  const description = $('meta[name="description"]').attr('content') ||
    $('div[class*="detail"], .item_detail').first().text().trim() || null

  return { title, cover_url: coverUrl, sample_image_urls: sampleUrls, release_date: null, duration: null, actors: [], director: null, maker, tags, rating: null, description }
}
