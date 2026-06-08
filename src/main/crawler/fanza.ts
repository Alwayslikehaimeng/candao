import axios from 'axios'
import * as cheerio from 'cheerio'
import { detectSystemProxy } from '../utils/proxy'
import { translateToChinese } from '../utils/translate'
import { aiTranslate, aiTranslateTags, getApiKey } from '../utils/ai-translate'
import type { CrawlResult, ProxyConfig } from '../../shared/types'

let cachedProxy: { protocol: string; host: string; port: number } | null = null

async function getProxy(userProxy?: ProxyConfig) {
  if (userProxy?.enabled) return userProxy
  if (!cachedProxy) {
    cachedProxy = await detectSystemProxy()
    if (cachedProxy) console.log('[FANZA] 代理:', cachedProxy)
  }
  return cachedProxy || undefined
}

function makeConfig(proxy?: { protocol: string; host: string; port: number }) {
  const config: any = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9',
      'Cookie': 'age_check_done=1'
    },
    timeout: 30000
  }
  if (proxy) config.proxy = { protocol: proxy.protocol, host: proxy.host, port: proxy.port }
  return config
}

// 标签词典（无重复键，按类别组织）
const TAG_DICT: Record<string, string> = {
  // 身体
  '美少女': '美少女', '巨乳': '巨乳', 'スレンダー': '苗条', 'パイパン': '白虎',
  '長身': '高个', '短身': '矮个', '眼鏡': '眼镜', 'ロリ': '萝莉',
  'お姉さん': '姐姐', '若妻': '少妇', '人妻': '人妻', '熟女': '熟女',
  'OL': 'OL', '女子校生': '女学生', 'ギャル': '辣妹', 'ボーイッシュ': '中性',
  // 行为
  '中出し': '中出', '生ハメ': '无套', '潮吹き': '潮吹', '顔射': '颜射',
  'ぶっかけ': '颜射', 'ごっくん': '吞精', '飲精': '吞精', 'アナル': '肛交',
  '浣腸': '灌肠', 'フィスト': '拳交', 'イラマチオ': '深喉', '足コキ': '足交',
  '脚フェチ': '恋足', 'オナニー': '自慰', '電マ': '按摩棒', 'バイブ': '震动棒',
  'おもちゃ': '玩具', '飲尿': '饮尿', '放尿': '放尿', '脱糞': '排便',
  // 场景
  'ナンパ': '搭讪', 'ハメ撮り': '自拍', '盗撮': '偷拍', '露出': '露出',
  '野外': '户外', '羞恥': '羞耻', 'パンチラ': '走光', 'ソープ': '泡泡浴',
  'エステ': '美容', 'マッサージ': '按摩', '風俗': '风俗', '温泉': '温泉',
  '調教': '调教', '緊縛': '捆绑', '拘束': '束缚', '逆レイプ': '逆强奸',
  'レイプ': '强奸', 'SM': 'SM',
  // 关系
  'カップル': '情侣', '親子': '亲子', '嫁': '媳妇', '義母': '继母',
  '義姉': '继姐', '義妹': '继妹', '叔母': '阿姨', '近親': '近亲',
  // 类型
  '本番': '真枪实弹', '淫乱': '淫乱', '痴女': '痴女', 'メイド': '女仆',
  '制服': '制服', 'セックス': '性爱', '3P': '3P', '乱交': '群交',
  'レズ': '女同', 'Futanari': '扶她', 'Cosplay': 'Cosplay', 'アニメ': '动画',
  // 作品属性
  '単体作品': '单体作品', '総集編': '合集', 'ベスト': '精选',
  'ベスト・総集編': '精选合集', 'アイドル': '偶像', '4時間以上': '4小时以上',
  '4時間以上作品': '4小时以上作品', 'ハイビジョン': '高清', 'デビュー': '出道',
  // 商业
  'アウトレット': '特价清仓', 'セール': '促销', '限定': '限定', '独占': '独占',
  '配信': '在线', '新作': '新作', '人気': '人气', 'ランキング': '排行',
  'おすすめ': '推荐', '注目': '关注', '話題': '话题',
  // 其他
  'イメージビデオ': '写真视频', 'コンドーム': '避孕套', '妊娠': '怀孕', '汗だく': '满身大汗', 'デジモ': '数码马赛克',
  '女優': '女优', '男優': '男优', '引退': '退役', '復活': '复出',
  '動画': '视频', 'ヘルス': '保健', '全体': '全部', '素人': '素人',
}

const SKIP_TAGS = new Set(['サンプル動画', 'レビュー', '販売', 'レンタル', 'サンプル', 'アウトレット', 'セール', '限定'])

function translateTagsSync(tags: string[]): string[] {
  return tags
    .filter(t => !SKIP_TAGS.has(t) && t.length > 0)
    .map(t => TAG_DICT[t] || t)
}

export async function fetchFanza(code: string, userProxy?: ProxyConfig): Promise<CrawlResult> {
  console.log('[FANZA] 抓取:', code)
  const proxy = await getProxy(userProxy)
  const config = makeConfig(proxy)

  // 搜索
  const searchUrl = `https://www.dmm.co.jp/mono/dvd/-/search/=/searchstr=${encodeURIComponent(code)}/`
  let searchHtml: string
  try {
    const res = await axios.get(searchUrl, config)
    searchHtml = res.data
  } catch (e: any) {
    throw new Error(`搜索失败: ${e.message}`)
  }

  const $s = cheerio.load(searchHtml)
  let detailUrl = ''
  $s('a').each((_, el) => {
    const href = $s(el).attr('href') || ''
    if (href.includes('cid=') && href.includes('detail')) {
      detailUrl = href.startsWith('http') ? href : `https://www.dmm.co.jp${href}`
      return false
    }
  })

  if (!detailUrl) {
    const cid = code.replace('-', '').toLowerCase()
    detailUrl = `https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=${cid}/`
  }

  console.log('[FANZA] 详情页:', detailUrl)

  let detailHtml: string
  try {
    const res = await axios.get(detailUrl, config)
    detailHtml = res.data
  } catch (e: any) {
    throw new Error(`详情页失败: ${e.message}`)
  }

  const $ = cheerio.load(detailHtml)

  // === 标题 ===
  let title = $('h1#title').text().trim() ||
    $('meta[property="og:title"]').attr('content')?.replace(/\s*\|.*$/, '') || ''
  // 去掉标题中的广告标记
  title = title
    .replace(/\s*[\[【][^\]】]*(?:アウトレット|特売|Outlet|SALE|セール|限定|新作)[^\]】]*[\]】]/g, '')
    .replace(/\s*\[特卖场\]/g, '')
    .trim()

  // === 封面 ===
  const coverUrl = $('meta[property="og:image"]').attr('content') || ''

  // === 示例图 ===
  const sampleUrls: string[] = []
  // 从 data-lazy 属性获取示例图
  $('[data-lazy]').each((_, el) => {
    const src = $(el).attr('data-lazy') || ''
    if (src.includes('pics.dmm.co.jp') && !src.includes('dummy') && !src.includes('loading')) {
      if (!sampleUrls.includes(src)) sampleUrls.push(src)
    }
  })
  // 从 a 标签 href 获取
  if (sampleUrls.length === 0) {
    $('a[href*="pics.dmm.co.jp"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (href.includes('.jpg') && !sampleUrls.includes(href)) sampleUrls.push(href)
    })
  }

  // 如果静态解析图片太少，用浏览器方式获取
  if (sampleUrls.length < 3) {
    try {
      const { fetchSampleImagesWithBrowser } = await import('./fanza-browser')
      const browserUrls = await fetchSampleImagesWithBrowser(detailUrl, proxy)
      for (const url of browserUrls) {
        if (!sampleUrls.includes(url)) sampleUrls.push(url)
      }
      console.log('[FANZA] 浏览器方式获取到', browserUrls.length, '张图片')
    } catch (e: any) {
      console.log('[FANZA] 浏览器方式失败:', e.message)
    }
  }

  // 去重，限制最多 30 张
  const largeUrls: string[] = []
  for (const url of sampleUrls) {
    if (!largeUrls.includes(url) && largeUrls.length < 30) largeUrls.push(url)
  }

  // === 元数据 ===
  const getCellText = (label: string): string => {
    const cell = $('td').filter((_, el) => $(el).text().trim() === label)
    return cell.length ? cell.next('td').text().trim() : ''
  }

  const releaseDateRaw = getCellText('発売日：') || getCellText('配信開始日：')
  const releaseDateMatch = releaseDateRaw.match(/(\d{4}\/\d{2}\/\d{2})/)
  const releaseDate = releaseDateMatch ? releaseDateMatch[1].replace(/\//g, '-') : null

  const durationRaw = getCellText('収録時間：')
  const durationMatch = durationRaw.match(/(\d+)/)
  const duration = durationMatch ? parseInt(durationMatch[1]) * 60 : null

  const directorRaw = getCellText('監督：')
  const director = (directorRaw && directorRaw !== '----') ? directorRaw : null

  const makerRaw = getCellText('メーカー：') || null
  const maker = makerRaw || null

  // 演员
  const actors: string[] = []
  $('#performer a').each((_, a) => {
    const href = $(a).attr('href') || ''
    const name = $(a).text().trim()
    if (href.includes('actress') && name && name.length < 20 && !name.includes('サンプル') && !name.includes('すべて') && !name.includes('表示')) {
      if (!actors.includes(name)) actors.push(name)
    }
  })

  // 标签
  const genreRaw = getCellText('ジャンル：')
  const tags = genreRaw.split(/\s+/).filter(t => t.length > 0 && !t.includes('#'))
  let translatedTags = translateTagsSync(tags)

  // 词典未命中的日文标签，用 AI 批量翻译
  const untranslated = translatedTags.filter(t => /[぀-ゟ゠-ヿ]/.test(t))
  if (untranslated.length > 0 && getApiKey()) {
    console.log('[FANZA] AI翻译标签:', untranslated)
    const aiTranslated = await aiTranslateTags(untranslated)
    const untranslatedSet = new Set(untranslated)
    let aiIndex = 0
    translatedTags = translatedTags.map(t => {
      if (untranslatedSet.has(t)) {
        return aiTranslated[aiIndex++] || t
      }
      return t
    })
  }

  // 评分 - 精确匹配 DMM 评分元素
  let rating: number | null = null
  // 方法1：精确匹配 class
  const ratingEl = $('p.dcd-review__average, div.dcd-review__points, div.dcd-review__ratings')
  if (ratingEl.length) {
    const text = ratingEl.text().trim()
    const match = text.match(/([\d.]+)/)
    if (match) {
      const r = parseFloat(match[1])
      if (r > 0 && r <= 5) rating = r
    }
  }
  // 方法2：找"平均評価"附近的数字
  if (!rating) {
    $('*').each((_, el) => {
      const text = $(el).text().trim()
      if (text.startsWith('平均評価') && text.length < 20) {
        const match = text.match(/([\d.]+)/)
        if (match) {
          const r = parseFloat(match[1])
          if (r > 0 && r <= 5) { rating = r; return false }
        }
      }
    })
  }

  // 简介
  let description = ''
  const introEl = $('div.mg-b20.lh4, .txt.introduction, div[class*="summary"]').first()
  if (introEl.length) description = introEl.text().trim()
  if (!description || description.length < 20) {
    description = $('meta[property="og:description"]').attr('content') || ''
  }
  // 清理日文广告：先去掉末尾广告后缀，再按句号分割过滤
  description = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    // 去掉末尾的广告后缀（通常紧跟在剧情后面）
    .replace(/「コンビニ受取」[^。]*。?/g, '')
    .replace(/詳しくは[^。]*。?/g, '')
    .replace(/こちらを[^。]*。?/g, '')
    .replace(/FANZA[^。]*。?/g, '')
    .replace(/◇[^。]*。?/g, '')
    .trim()
  const adKeywords = ['新品', '未開封', '未使用', '購入', '価格', '商品', 'メーカー',
    'コンビニ', '受取', 'サービス', '発送', '梱包', '送料', '注文',
    '写真集', 'クリック', '対象', '販売', '返品', 'アウトレット',
    'FANZA', 'DVD', 'Outlet', '通販', 'お得', 'キャンペーン',
    '詳細', 'こちら', 'ご購入', '返品交換', '弊社', 'お客様']
  const sentences = description.split(/。/)
  description = sentences
    .filter(s => {
      const trimmed = s.trim()
      if (trimmed.length < 5) return false
      if (trimmed.startsWith('*') || trimmed.startsWith('★') || trimmed.startsWith('※')) return false
      if (adKeywords.some(kw => trimmed.includes(kw))) return false
      return true
    })
    .join('。')
    .trim()
  if (description === title || description.startsWith(title.substring(0, 20))) description = ''

  // 翻译
  const hasKey = !!getApiKey()
  console.log('=== TITLE TRANSLATE DEBUG ===')
  console.log('originalTitle:', title)
  console.log('hasApiKey:', hasKey)

  console.log('google start')
  const googleTitle = await translateToChinese(title)
  console.log('google result:', googleTitle)

  let aiTitle = ''
  if (hasKey) {
    console.log('ai start')
    aiTitle = await aiTranslate(title, 'title')
    console.log('ai result:', aiTitle)
  }

  const finalTitle = (googleTitle && googleTitle !== title) ? googleTitle : (aiTitle || title)
  console.log('finalTitle:', finalTitle)
  const translatedTitle = finalTitle

  // 简介：Google 翻译
  let translatedDescription = description
  if (description) {
    const googleDesc = await translateToChinese(description)
    translatedDescription = googleDesc
    // Google 失败则用 AI
    if (googleDesc === description && hasKey) {
      const aiDesc = await aiTranslate(description, 'description')
      if (aiDesc && aiDesc !== description) translatedDescription = aiDesc
      else translatedDescription = aiDesc || description
    }
    console.log('[简介翻译]', JSON.stringify({ original: description?.substring(0, 50), google: googleDesc?.substring(0, 50), final: translatedDescription?.substring(0, 50) }))
  }

  // 翻译后只清理明显的广告残留
  if (translatedDescription) {
    translatedDescription = translatedDescription
      .replace(/点击此处了解更多详情/g, '')
      .replace(/请点击此处/g, '')
      .replace(/详情请点击/g, '')
      .replace(/本产品.*?购买。?/g, '')
      .replace(/便利店.*?自提。?/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  console.log('[FANZA] 结果:', {
    title: translatedTitle.substring(0, 40),
    cover: coverUrl ? '有' : '无',
    samples: largeUrls.length,
    releaseDate,
    duration: duration ? `${Math.floor(duration / 60)}分` : '无',
    actors: actors.length,
    tags: translatedTags.length,
    rating,
    maker
  })

  return {
    title: translatedTitle,
    cover_url: coverUrl,
    sample_image_urls: largeUrls,
    release_date: releaseDate,
    duration,
    actors,
    director,
    maker,
    tags: translatedTags,
    rating,
    description: translatedDescription,
    fanza_url: detailUrl
  }
}
