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
  // 基础状态
  '新人': '新人', '専属': '专属演员', '単体作品': '个人作品', 'デビュー': '出道',
  '復帰': '复出', '初出演': '首次出演', '初撮り': '首次拍摄', '初体験': '初次体验',
  '初公開': '首次公开', '人気': '人气作品', '話題作': '热门作品', 'ベスト': '精选合集',
  '総集編': '总集篇', '完全版': '完整版', '未公開': '未公开内容', '特典映像': '特典影像',
  'メイキング': '幕后花絮',
  // 角色属性
  '人妻': '已婚女性', '若妻': '年轻妻子', '美人妻': '美人妻', '奥様': '太太',
  '未亡人': '寡妇', '女教師': '女教师', '女医': '女医生', '看護師': '护士',
  'OL': '白领女性', '秘書': '秘书', '店員': '店员', 'メイド': '女仆',
  '家政婦': '家政人员', '学生風': '学生风格', 'ギャル': '辣妹', '清楚系': '清纯系',
  'お嬢様': '大小姐', 'アイドル': '偶像', 'コスプレイヤー': 'Cosplayer',
  // 外貌描述
  '美少女': '美少女', '美人': '美女', '可愛い': '可爱', '色白': '白皙肌肤',
  '黒髪': '黑发', 'ロングヘア': '长发', 'ショートヘア': '短发', 'スレンダー': '苗条',
  'グラマー': '丰满', '巨乳': '丰满身材', '微乳': '小巧身材', '美脚': '美腿',
  '美尻': '美臀', 'モデル体型': '模特身材', '童顔': '娃娃脸',
  // 情绪与表现
  '恥ずかしがる': '害羞', '照れる': '羞涩', '積極的': '主动', '大胆': '大胆',
  '甘える': '撒娇', '誘う': '引诱', '無邪気': '天真', '笑顔': '笑容满面',
  '泣き顔': '哭泣表情', '驚く': '惊讶', '興奮': '兴奋', '陶酔': '沉醉',
  '悶える': '沉浸快感', '恍惚': '恍惚',
  // 常见剧情标签
  '恋人設定': '恋人设定', '同棲': '同居', '新婚': '新婚生活', '出張': '出差',
  '温泉旅行': '温泉旅行', '家庭教師': '家教设定', 'オフィス': '办公室',
  '部活': '社团活动', '学園': '校园题材', '面接': '面试', '研修': '培训',
  '出会い': '邂逅', '再会': '重逢', '秘密': '秘密关系', '浮気': '出轨题材',
  '不倫': '婚外情题材',
  // 摄影与制作
  'ハイビジョン': '高清', 'フルHD': '全高清', '4K': '4K画质', 'VR': 'VR影片',
  '主観': '第一人称视角', 'POV': '第一视角', 'ドキュメント': '纪录风格',
  '隠し撮り風': '偷拍风格', '密着': '贴身跟拍', '長尺': '长篇内容',
  '完全収録': '完整收录', 'ダイジェスト': '精华版', 'オムニバス': '合集',
  // 身体
  'パイパン': '白虎', '長身': '高个', '短身': '矮个', '眼鏡': '眼镜', 'ロリ': '萝莉',
  'お姉さん': '姐姐', '熟女': '熟女', '女子校生': '女学生', 'ボーイッシュ': '中性',
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
  '本番': '真枪实弹', '淫乱': '淫乱', '痴女': '痴女',
  '制服': '制服', 'セックス': '性爱', '3P': '3P', '乱交': '群交',
  'レズ': '女同', 'Futanari': '扶她', 'Cosplay': 'Cosplay', 'アニメ': '动画',
  // 作品属性
  'ベスト・総集編': '精选合集', '4時間以上': '4小时以上',
  '4時間以上作品': '4小时以上作品',
  // 商业
  'アウトレット': '特价清仓', 'セール': '促销', '限定': '限定', '独占': '独占',
  '配信': '在线', '新作': '新作', 'ランキング': '排行',
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

  // 系列
  const seriesRaw = getCellText('シリーズ：') || getCellText('series：')
  const series = (seriesRaw && seriesRaw !== '----' && seriesRaw !== 'なし') ? seriesRaw : null

  // 唱片公司
  const labelRaw = getCellText('レーベル：')
  const label = (labelRaw && labelRaw !== '----') ? labelRaw : null

  // 类型
  const videoTypeRaw = getCellText('ジャンル：') || getCellText('形式：')
  const videoType = (videoTypeRaw && videoTypeRaw !== '----') ? videoTypeRaw.split(/\s+/)[0] : null

  // 产品编号
  const productCodeRaw = getCellText('品番：') || getCellText('商品番号：')
  const productCode = (productCodeRaw && productCodeRaw !== '----')
    ? productCodeRaw.replace(/^[0-9]+/, '').trim() || productCodeRaw.trim()
    : null

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

  // 简介（多个选择器兼容）
  let description = ''
  const introSelectors = [
    'div.mg-b20.lh4',
    '.txt.introduction',
    'div[class*="summary"]',
    'div[class*="intro"]',
    'div[class*="description"]',
    'div[class*="story"]',
    'p[class*="text"]',
    '.mg-b20'
  ]
  for (const sel of introSelectors) {
    const el = $(sel).first()
    if (el.length && el.text().trim().length > 30) {
      description = el.text().trim()
      console.log('[FANZA] 简介匹配选择器:', sel, '长度:', description.length)
      break
    }
  }
  // 备用：og:description
  if (!description || description.length < 20) {
    description = $('meta[property="og:description"]').attr('content') || ''
    if (description) console.log('[FANZA] 简介来自 og:description，长度:', description.length)
  }
  // 备用：从页面中找包含剧情关键词的段落
  if (!description || description.length < 20) {
    $('p, div').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 50 && text.length < 2000 &&
          (text.includes('彼女') || text.includes('初めて') || text.includes('ある日') ||
           text.includes('男') || text.includes('女') || text.includes('人妻'))) {
        description = text
        console.log('[FANZA] 简介来自关键词匹配，长度:', description.length)
        return false
      }
    })
  }
  if (!description) console.log('[FANZA] 未找到简介')
  console.log('[FANZA] 清理前简介长度:', description.length)
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
  // 只删除明确的广告句（句子开头是广告关键词，或整句都是广告）
  const adPatterns = [
    /^コンビニ受取/, /^詳しくは/, /^こちらを/, /^◇/, /^[※＊★]/,
    /^販売/, /^返品/, /^送料/, /^注文/, /^キャンペーン/, /^お得/,
    /^アウトレット/, /^セール/, /^限定/, /^新品未開封/, /^レンタル/
  ]
  const sentences = description.split(/。/)
  description = sentences
    .filter(s => {
      const trimmed = s.trim()
      if (trimmed.length < 3) return false
      // 只删除匹配广告模式的句子
      if (adPatterns.some(p => p.test(trimmed))) return false
      return true
    })
    .join('。')
    .trim()
  console.log('[FANZA] 清理后简介长度:', description.length)
  if (description === title || description.startsWith(title.substring(0, 20))) {
    console.log('[FANZA] 简介与标题重复，清空')
    description = ''
  }

  // 翻译
  const hasKey = !!getApiKey()
  console.log('=== TITLE TRANSLATE DEBUG ===')
  console.log('originalTitle:', title)
  console.log('hasApiKey:', hasKey)

  // 翻译标题：有 AI 用 AI，没 AI 用 Google
  let translatedTitle = title
  if (hasKey) {
    console.log('[翻译] AI 标题翻译开始')
    const aiTitle = await aiTranslate(title, 'title')
    console.log('[翻译] AI 标题结果:', aiTitle?.substring(0, 50))
    if (aiTitle && aiTitle !== title) {
      translatedTitle = aiTitle
      console.log('[翻译] 使用 AI 标题')
    } else {
      console.log('[翻译] AI 标题失败，使用 Google')
      translatedTitle = await translateToChinese(title) || title
    }
  } else {
    console.log('[翻译] 无 API Key，使用 Google 标题')
    translatedTitle = await translateToChinese(title) || title
  }
  console.log('[翻译] 最终标题:', translatedTitle?.substring(0, 50))

  // 翻译唱片公司
  let translatedLabel = label
  if (label && /[぀-ゟ゠-ヿ]/.test(label)) {
    const googleLabel = await translateToChinese(label)
    if (googleLabel && googleLabel !== label) translatedLabel = googleLabel
  }

  // 翻译系列（用 AI 翻译，更自然）
  let translatedSeries = series
  if (series && /[぀-ゟ゠-ヿ]/.test(series) && hasKey) {
    const aiSeries = await aiTranslate(series, 'title')
    if (aiSeries && aiSeries !== series) translatedSeries = aiSeries
  } else if (series && /[぀-ゟ゠-ヿ]/.test(series)) {
    const googleSeries = await translateToChinese(series)
    if (googleSeries && googleSeries !== series) translatedSeries = googleSeries
  }

  // 简介翻译：AI 优先，Google 备用
  let translatedDescription = description
  if (description) {
    if (hasKey) {
      console.log('[翻译] AI 简介翻译开始')
      const aiDesc = await aiTranslate(description, 'description')
      console.log('[翻译] AI 简介结果:', aiDesc?.substring(0, 80))
      console.log('[翻译] AI 简介与原文相同:', aiDesc === description)
      if (aiDesc && aiDesc !== description) {
        translatedDescription = aiDesc
        console.log('[翻译] 使用 AI 简介')
      } else {
        console.log('[翻译] AI 简介失败，使用 Google')
        const googleDesc = await translateToChinese(description)
        translatedDescription = googleDesc || description
      }
    } else {
      console.log('[翻译] 无 API Key，使用 Google 简介')
      const googleDesc = await translateToChinese(description)
      translatedDescription = googleDesc || description
    }
    console.log('[翻译] 最终简介:', translatedDescription?.substring(0, 80))
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
    series: translatedSeries,
    label: translatedLabel,
    video_type: videoType,
    product_code: productCode,
    tags: translatedTags,
    rating,
    description: translatedDescription,
    fanza_url: detailUrl,
    source: 'FANZA'
  }
}
