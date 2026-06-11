import axios from 'axios'
import * as cheerio from 'cheerio'
import { detectSystemProxy } from '../utils/proxy'
import { translateToChinese } from '../utils/translate'
import { aiTranslate, getApiKey } from '../utils/ai-translate'
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

  // 从 div.info p 提取元数据（JavBus 的实际结构）
  const infoText = $('div.info p').map((_, el) => $(el).text().trim()).get().join('\n')

  // 发行日期
  let releaseDate = ''
  const dateMatch = infoText.match(/發行日期:\s*(\d{4}[-/]\d{2}[-/]\d{2})/) ||
    infoText.match(/发行日期:\s*(\d{4}[-/]\d{2}[-/]\d{2})/) ||
    infoText.match(/Release:\s*(\d{4}[-/]\d{2}[-/]\d{2})/)
  if (dateMatch) releaseDate = dateMatch[1].replace(/\//g, '-')

  // 时长
  let duration: number | null = null
  const durationMatch = infoText.match(/長度:\s*(\d+)\s*分鐘/) ||
    infoText.match(/时长:\s*(\d+)\s*分钟/) ||
    infoText.match(/Runtime:\s*(\d+)/)
  if (durationMatch) duration = parseInt(durationMatch[1]) * 60

  // 导演（从 a 标签提取）
  let director = ''
  $('span.header:contains("導演"), span.header:contains("导演")').each((_, el) => {
    director = $(el).next('a').text().trim() || $(el).parent().find('a').first().text().trim()
  })
  if (!director) {
    const dirMatch = infoText.match(/導演:\s*(.+?)(?:\n|$)/)
    if (dirMatch) director = dirMatch[1].trim()
  }

  // 制造商
  let maker = ''
  $('span.header:contains("製作商"), span.header:contains("制造商")').each((_, el) => {
    maker = $(el).next('a').text().trim() || $(el).parent().find('a').first().text().trim()
  })
  if (!maker) {
    const makerMatch = infoText.match(/製作商:\s*(.+?)(?:\n|$)/)
    if (makerMatch) maker = makerMatch[1].trim()
  }

  // 演员（多选择器兼容）
  const actors: string[] = []
  $('.star-name a').each((_, el) => {
    const name = $(el).text().trim()
    if (name && name.length < 20 && !actors.includes(name)) {
      actors.push(name)
    }
  })

  // 标签（排除演员名）
  const tags: string[] = []
  const actorSet = new Set(actors)
  $('span.genre a, .genre a').each((_, el) => {
    const tag = $(el).text().trim()
    if (tag && !tags.includes(tag) && !actorSet.has(tag)) {
      tags.push(tag)
    }
  })

  // 翻译标签（词典 + AI）
  const TAG_DICT: Record<string, string> = {
    '人妻': '已婚女性', '若妻': '年轻妻子', '美人妻': '美人妻', '女教師': '女教师',
    '女医': '女医生', '看護師': '护士', '秘書': '秘书', 'メイド': '女仆',
    'ギャル': '辣妹', '美少女': '美少女', '清楚系': '清纯系', 'お嬢様': '大小姐',
    '巨乳': '丰满身材', '微乳': '小巧身材', '美脚': '美腿', '美尻': '美臀',
    '童顔': '娃娃脸', 'スレンダー': '苗条', 'グラマー': '丰满',
    '中出し': '中出', '潮吹き': '潮吹', '顔射': '颜射', 'アナル': '肛交',
    'オナニー': '自慰', 'レズ': '女同', 'SM': 'SM', '3P': '3P',
    'ハイビジョン': '高清', '4K': '4K', 'VR': 'VR', '主観': '第一人称视角',
    '単体作品': '个人作品', 'ベスト': '精选合集', '総集編': '总集篇',
    'デビュー': '出道', '復帰': '复出', '新人': '新人', '専属': '专属演员',
  }

  // 先用词典翻译
  for (let i = 0; i < tags.length; i++) {
    if (TAG_DICT[tags[i]]) {
      tags[i] = TAG_DICT[tags[i]]
    }
  }

  // 剩余日文标签用 AI 翻译
  const hasKey = !!getApiKey()
  const untranslated = tags.filter(t => /[぀-ゟ゠-ヿ]/.test(t))
  if (untranslated.length > 0 && hasKey) {
    console.log('[JavBus] AI翻译标签:', untranslated)
    const { aiTranslateTags } = await import('../utils/ai-translate')
    const translated = await aiTranslateTags(untranslated)
    const untranslatedSet = new Set(untranslated)
    let aiIndex = 0
    for (let i = 0; i < tags.length; i++) {
      if (untranslatedSet.has(tags[i])) {
        tags[i] = translated[aiIndex++] || tags[i]
      }
    }
  }

  // 简介
  let description = ''
  const descEl = $('div.mg-b20.lh4, .txt.introduction, div[class*="summary"], .paragraph').first()
  if (descEl.length) description = descEl.text().trim()
  if (!description || description.length < 20) {
    description = $('meta[property="og:description"]').attr('content') || ''
  }
  // 翻译简介
  if (description && hasKey) {
    console.log('[JavBus] AI翻译简介')
    const aiDesc = await aiTranslate(description, 'description')
    if (aiDesc && aiDesc !== description) description = aiDesc
  }

  // 样例图
  const sampleImages: string[] = []
  $('#sample-waterfall a.sample-box, a.bigImage img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('href') || ''
    if (src && src.includes('.jpg') && !sampleImages.includes(src)) {
      sampleImages.push(src.startsWith('http') ? src : `https://www.javbus.com${src}`)
    }
  })

  if (!title) {
    console.log('[JavBus] HTML 内容长度:', detailHtml.length)
    throw new Error('JavBus 未找到标题（可能页面被墙或番号不存在）')
  }

  // 翻译标题
  console.log('[JavBus] 翻译标题:', title)
  const googleTitle = await translateToChinese(title)
  let aiTitle = ''
  if (hasKey) {
    aiTitle = await aiTranslate(title, 'title')
  }
  const translatedTitle = (googleTitle && googleTitle !== title) ? googleTitle : (aiTitle || title)
  console.log('[JavBus] 翻译结果:', translatedTitle)

  return {
    title: translatedTitle,
    cover_url: coverUrl,
    sample_image_urls: sampleImages,
    release_date: releaseDate || null,
    duration,
    actors,
    director: director || null,
    maker: maker || null,
    tags,
    rating: null,
    description: null,
    source: 'JavBus',
    javbus_url: detailUrl
  }
}
