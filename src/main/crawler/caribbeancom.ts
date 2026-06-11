import axios from 'axios'
import * as cheerio from 'cheerio'
import { translateToChinese } from '../utils/translate'
import { aiTranslate, aiTranslateTags, getApiKey } from '../utils/ai-translate'
import type { CrawlResult, ProxyConfig } from '../../shared/types'

// iconv-lite 需要动态引入（Electron 兼容）
let iconv: any = null
async function getIconv() {
  if (!iconv) {
    try { iconv = await import('iconv-lite') } catch { iconv = null }
  }
  return iconv
}

const TAG_DICT: Record<string, string> = {
  '巨乳': '丰满身材', '美少女': '美少女', '人妻': '已婚女性', '中出し': '中出',
  'アナル': '肛交', '潮吹き': '潮吹', '顔射': '颜射', '3P': '3P',
  'スレンダー': '苗条', 'パイパン': '白虎', 'ロリ': '萝莉', '熟女': '熟女',
  '女子校生': '女学生', 'OL': '白领女性', 'メイド': '女仆', '制服': '制服',
  'SM': 'SM', 'レズ': '女同', 'オナニー': '自慰', 'ハメ撮り': '自拍',
  'ナンパ': '搭讪', '露出': '露出', '野外': '户外', 'ソープ': '泡泡浴',
  'エステ': '美容', 'マッサージ': '按摩', '風俗': '风俗', '温泉': '温泉',
  '調教': '调教', '緊縛': '捆绑', '逆レイプ': '逆强奸', 'レイプ': '强奸',
  'ハイビジョン': '高清', '4K': '4K画质', 'VR': 'VR影片', '主観': '第一人称视角',
  'オリジナル動画': '原创视频', '独占': '独占配信',
}

export async function fetchCaribbeancom(code: string, proxy?: ProxyConfig): Promise<CrawlResult> {
  console.log('[Caribbeancom] 抓取:', code)

  const config: any = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9',
      'Referer': 'https://www.caribbeancom.com/',
    },
    timeout: 30000,
    responseType: 'arraybuffer'
  }
  if (proxy) config.proxy = { protocol: proxy.protocol, host: proxy.host, port: proxy.port }

  // URL 格式: /moviepages/{code}/index.html
  const pageUrl = `https://www.caribbeancom.com/moviepages/${code}/index.html`
  console.log('[Caribbeancom] 详情页:', pageUrl)

  let html: string
  try {
    const res = await axios.get(pageUrl, config)
    const ic = await getIconv()
    if (ic) {
      html = ic.decode(Buffer.from(res.data), 'euc-jp')
    } else {
      html = Buffer.from(res.data).toString('utf-8')
    }
  } catch (e: any) {
    throw new Error(`Caribbeancom 访问失败: ${e.message}`)
  }

  if (html.includes('404 NOT FOUND') || html.includes('404 見つかりません')) {
    throw new Error('Caribbeancom 番号不存在')
  }

  const $ = cheerio.load(html)

  // 标题
  let title = $('h1').first().text().trim() ||
    $('title').text().trim().split('---')[0].trim().split('|')[0].trim() || ''

  // 封面
  const coverUrl = `https://www.caribbeancom.com/moviepages/${code}/images/l_l.jpg`

  // 样例图
  const sampleImages: string[] = []
  $(`img[src*="moviepages/${code}/images/s/"]`).each((_, el) => {
    const src = $(el).attr('src') || ''
    const fullUrl = src.startsWith('http') ? src : `https://www.caribbeancom.com${src}`
    if (!sampleImages.includes(fullUrl)) sampleImages.push(fullUrl)
  })

  // 从 li.movie-spec 提取元数据
  const infoItems: Record<string, string> = {}
  $('li.movie-spec').each((_, el) => {
    const label = $(el).find('.spec-title').text().trim()
    const content = $(el).find('.spec-content').text().trim().replace(/\s+/g, ' ')
    if (label) infoItems[label] = content
  })

  console.log('[Caribbeancom] info:', JSON.stringify(infoItems))

  // 演员
  const actors: string[] = []
  const actorRaw = infoItems['出演'] || ''
  if (actorRaw && actorRaw !== '---' && actorRaw !== '----') {
    actorRaw.split(/[,、]/).forEach(a => {
      const name = a.trim()
      if (name && name.length < 25 && name !== '---' && !actors.includes(name)) actors.push(name)
    })
  }

  // 时长
  let duration: number | null = null
  const durationRaw = infoItems['再生時間'] || ''
  const durationMatch = durationRaw.match(/(\d+):(\d+):(\d+)/)
  if (durationMatch) {
    duration = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseInt(durationMatch[3])
  }

  // 系列
  let series: string | null = null
  const seriesRaw = infoItems['シリーズ'] || ''
  if (seriesRaw && seriesRaw !== '---') series = seriesRaw

  // 标签
  const tags: string[] = []
  const tagRaw = infoItems['タグ'] || ''
  if (tagRaw && tagRaw !== '---') {
    tagRaw.split(/\s+/).forEach(t => {
      const tag = t.trim()
      if (tag && !tags.includes(tag)) tags.push(tag)
    })
  }

  // 评分
  const ratingRaw = infoItems['ユーザー評価'] || ''
  const stars = (ratingRaw.match(/★/g) || []).length
  const rating = stars > 0 ? stars : null

  // 词典翻译标签
  let translatedTags = tags.map(t => TAG_DICT[t] || t)

  // AI 翻译剩余日文标签
  const hasKey = !!getApiKey()
  const untranslated = translatedTags.filter(t => /[぀-ゟ゠-ヿ]/.test(t))
  if (untranslated.length > 0 && hasKey) {
    console.log('[Caribbeancom] AI翻译标签:', untranslated)
    const aiTranslated = await aiTranslateTags(untranslated)
    const untranslatedSet = new Set(untranslated)
    let aiIndex = 0
    translatedTags = translatedTags.map(t => {
      if (untranslatedSet.has(t)) return aiTranslated[aiIndex++] || t
      return t
    })
  }

  // 简介（Caribbeancom 通常没有简介）
  let description = ''

  // 翻译标题
  let translatedTitle = title
  if (hasKey) {
    const aiTitle = await aiTranslate(title, 'title')
    if (aiTitle && aiTitle !== title) translatedTitle = aiTitle
    else translatedTitle = await translateToChinese(title) || title
  } else {
    translatedTitle = await translateToChinese(title) || title
  }

  console.log('[Caribbeancom] 结果:', {
    title: translatedTitle.substring(0, 40),
    actors: actors.length,
    tags: translatedTags.length,
    duration,
    series,
    rating
  })

  return {
    title: translatedTitle,
    cover_url: coverUrl,
    sample_image_urls: sampleImages,
    release_date: null,
    duration,
    actors,
    director: null,
    maker: 'Caribbeancom',
    series,
    label: null,
    video_type: null,
    product_code: code,
    tags: translatedTags,
    rating,
    description,
    fanza_url: pageUrl,
    source: 'Caribbeancom'
  }
}
