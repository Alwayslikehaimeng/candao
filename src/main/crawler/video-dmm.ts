import { BrowserWindow } from 'electron'
import { translateToChinese } from '../utils/translate'
import { aiTranslate, aiTranslateTags, getApiKey } from '../utils/ai-translate'
import type { CrawlResult, ProxyConfig } from '../../shared/types'

// 从 fanza.ts 复用标签词典
const TAG_DICT: Record<string, string> = {
  '新人': '新人', '専属': '专属演员', '単体作品': '个人作品', 'デビュー': '出道',
  '復帰': '复出', '初出演': '首次出演', '初撮り': '首次拍摄', '初体験': '初次体验',
  '初公開': '首次公开', '人気': '人气作品', '話題作': '热门作品', 'ベスト': '精选合集',
  '総集編': '总集篇', '完全版': '完整版', '未公開': '未公开内容', '特典映像': '特典影像',
  'メイキング': '幕后花絮',
  '人妻': '已婚女性', '若妻': '年轻妻子', '美人妻': '美人妻', '奥様': '太太',
  '未亡人': '寡妇', '女教師': '女教师', '女医': '女医生', '看護師': '护士',
  'OL': '白领女性', '秘書': '秘书', '店員': '店员', 'メイド': '女仆',
  '家政婦': '家政人员', '学生風': '学生风格', 'ギャル': '辣妹', '清楚系': '清纯系',
  'お嬢様': '大小姐', 'アイドル': '偶像', 'コスプレイヤー': 'Cosplayer',
  '美少女': '美少女', '美人': '美女', '可愛い': '可爱', '色白': '白皙肌肤',
  '黒髪': '黑发', 'ロングヘア': '长发', 'ショートヘア': '短发', 'スレンダー': '苗条',
  'グラマー': '丰满', '巨乳': '丰满身材', '微乳': '小巧身材', '美脚': '美腿',
  '美尻': '美臀', 'モデル体型': '模特身材', '童顔': '娃娃脸',
  '恥ずかしがる': '害羞', '照れる': '羞涩', '積極的': '主动', '大胆': '大胆',
  '甘える': '撒娇', '誘う': '引诱', '無邪気': '天真', '笑顔': '笑容满面',
  '泣き顔': '哭泣表情', '驚く': '惊讶', '興奮': '兴奋', '陶酔': '沉醉',
  '悶える': '沉浸快感', '恍惚': '恍惚',
  '恋人設定': '恋人设定', '同棲': '同居', '新婚': '新婚生活', '出張': '出差',
  '温泉旅行': '温泉旅行', '家庭教師': '家教设定', 'オフィス': '办公室',
  '部活': '社团活动', '学園': '校园题材', '面接': '面试', '研修': '培训',
  '出会い': '邂逅', '再会': '重逢', '秘密': '秘密关系', '浮気': '出轨题材',
  '不倫': '婚外情题材',
  'ハイビジョン': '高清', 'フルHD': '全高清', '4K': '4K画质', 'VR': 'VR影片',
  '主観': '第一人称视角', 'POV': '第一视角', 'ドキュメント': '纪录风格',
  '隠し撮り風': '偷拍风格', '密着': '贴身跟拍', '長尺': '长篇内容',
  '完全収録': '完整收录', 'ダイジェスト': '精华版', 'オムニバス': '合集',
  'パイパン': '白虎', '長身': '高个', '短身': '矮个', '眼鏡': '眼镜', 'ロリ': '萝莉',
  'お姉さん': '姐姐', '熟女': '熟女', '女子校生': '女学生', 'ボーイッシュ': '中性',
  '中出し': '中出', '生ハメ': '无套', '潮吹き': '潮吹', '顔射': '颜射',
  'ぶっかけ': '颜射', 'ごっくん': '吞精', '飲精': '吞精', 'アナル': '肛交',
  '浣腸': '灌肠', 'フィスト': '拳交', 'イラマチオ': '深喉', '足コキ': '足交',
  '脚フェチ': '恋足', 'オナニー': '自慰', '電マ': '按摩棒', 'バイブ': '震动棒',
  'おもちゃ': '玩具', '飲尿': '饮尿', '放尿': '放尿', '脱糞': '排便',
  'ナンパ': '搭讪', 'ハメ撮り': '自拍', '盗撮': '偷拍', '露出': '露出',
  '野外': '户外', '羞恥': '羞耻', 'パンチラ': '走光', 'ソープ': '泡泡浴',
  'エステ': '美容', 'マッサージ': '按摩', '風俗': '风俗', '温泉': '温泉',
  '調教': '调教', '緊縛': '捆绑', '拘束': '束缚', '逆レイプ': '逆强奸',
  'レイプ': '强奸', 'SM': 'SM',
  'カップル': '情侣', '親子': '亲子', '嫁': '媳妇', '義母': '继母',
  '義姉': '继姐', '義妹': '继妹', '叔母': '阿姨', '近親': '近亲',
  '本番': '真枪实弹', '淫乱': '淫乱', '痴女': '痴女',
  '制服': '制服', 'セックス': '性爱', '3P': '3P', '乱交': '群交',
  'レズ': '女同', 'Futanari': '扶她', 'Cosplay': 'Cosplay', 'アニメ': '动画',
  'ベスト・総集編': '精选合集', '4時間以上': '4小时以上',
  '4時間以上作品': '4小时以上作品',
  'アウトレット': '特价清仓', 'セール': '促销', '限定': '限定', '独占': '独占',
  '配信': '在线', '新作': '新作', 'ランキング': '排行',
  'おすすめ': '推荐', '注目': '关注', '話題': '话题',
  'イメージビデオ': '写真视频', 'コンドーム': '避孕套', '妊娠': '怀孕', '汗だく': '满身大汗', 'デジモ': '数码马赛克',
  '女優': '女优', '男優': '男优', '引退': '退役', '復活': '复出',
  '動画': '视频', 'ヘルス': '保健', '全体': '全部', '素人': '素人',
  'ハメ': '做爱', 'ニューハーフ': '变性人', 'ドキュメンタリー': '纪录片',
  'デカチン': '大屌', '巨根': '巨根', 'ビッチ': '荡妇', 'フェラ': '口交',
  'パイズリ': '乳交', '手コキ': '手交', '尻コキ': '臀交',
  'アヘ顔': '阿黑颜', 'イキ顔': '高潮脸', 'アクメ': '高潮',
  'セックスレス': '无性生活', '不貞': '出轨', '裏切り': '背叛',
  '凌辱': '凌辱', '陵辱': '凌辱', '催眠': '催眠', '洗脳': '洗脑',
  '夜這い': '夜袭', '痴漢': '痴汉', '盗撮': '偷拍', '覗き': '偷窥',
  '浮気': '出轨', '寝取り': '被绿', '寝取られ': '被绿',
  'メス堕ち': '雌堕落', '快楽堕ち': '快感堕落',
  'גברים': '猛男', '筋肉': '肌肉', 'マッチョ': '肌肉男',
  '₷': '容易', 'ヤリマン': '公交车', 'ビューティー': '美女',
  'ギャル': '辣妹', 'ヤンキー': '不良少女', 'スケバン': '不良女',
}

const SKIP_TAGS = new Set(['サンプル動画', 'レビュー', '販売', 'レンタル', 'サンプル', 'アウトレット', 'セール', '限定'])

function translateTagsSync(tags: string[]): string[] {
  return tags
    .filter(t => !SKIP_TAGS.has(t) && t.length > 0)
    .map(t => TAG_DICT[t] || t)
}

// 用浏览器方式抓取 video.dmm.co.jp 页面
export async function fetchVideoDmm(url: string, proxy?: ProxyConfig): Promise<CrawlResult> {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      show: false,
      width: 1200,
      height: 800,
      webPreferences: {
        javascript: true,
        images: true
      }
    })

    // 设置代理和 Cookie
    const setupAndLoad = async () => {
      const sess = win.webContents.session

      if (proxy?.enabled) {
        await sess.setProxy({
          proxyRules: `${proxy.protocol}://${proxy.host}:${proxy.port}`
        })
      }

      await sess.cookies.set({
        url: 'https://video.dmm.co.jp',
        name: 'age_check_done',
        value: '1',
        domain: '.dmm.co.jp',
        path: '/'
      })

      win.loadURL(url, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      })
    }

    setupAndLoad()

    win.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        try {
          // 验证页面
          const pageInfo = await win.webContents.executeJavaScript(`
            ({ title: document.title, url: window.location.href })
          `)

          if (pageInfo.url.includes('age_check') || pageInfo.title.includes('年齢認証')) {
            win.destroy()
            reject(new Error('video.dmm.co.jp 年龄验证拦截'))
            return
          }

          // 等待渲染
          await new Promise(r => setTimeout(r, 5000))

          // 提取数据：JSON-LD + HTML 元数据表
          const data = await win.webContents.executeJavaScript(`
            // === JSON-LD 提取 ===
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            let product = null;
            jsonLdScripts.forEach(script => {
              try {
                const json = JSON.parse(script.textContent);
                if (json['@type'] === 'Product') product = json;
              } catch(e) {}
            });

            let title = '', description = '', coverUrl = '', sampleImages = [], actors = [], maker = '', rating = null, ratingCount = null;
            if (product) {
              title = product.name || '';
              description = product.description || '';
              coverUrl = (product.image && product.image[0]) || '';
              sampleImages = (product.image || []).filter(img => img.includes('jp-'));
              actors = (product.subjectOf?.actor || []).map(a => a.name || '');
              maker = product.brand?.name || '';
              rating = product.aggregateRating?.ratingValue || null;
              ratingCount = product.aggregateRating?.ratingCount || null;
            }

            // === HTML 元数据表提取（原版 FANZA 逻辑）===
            const getCellText = (label) => {
              // 先在 th 中查找标签
              for (const th of document.querySelectorAll('th')) {
                if (th.textContent.trim() === label) {
                  const next = th.nextElementSibling;
                  return next ? next.textContent.trim() : '';
                }
              }
              // 再在 td 中查找（兼容不同页面结构）
              for (const td of document.querySelectorAll('td')) {
                if (td.textContent.trim() === label) {
                  const next = td.nextElementSibling;
                  return next ? next.textContent.trim() : '';
                }
              }
              return '';
            };

            const releaseDateRaw = getCellText('発売日：') || getCellText('配信開始日：') || getCellText('商品発売日：');
            const releaseDateMatch = releaseDateRaw.match(/(\\d{4}\\/\\d{2}\\/\\d{2})/);
            const releaseDate = releaseDateMatch ? releaseDateMatch[1].replace(/\\//g, '-') : '';

            const durationRaw = getCellText('収録時間：');
            const durationMatch = durationRaw.match(/(\\d+)/);
            const duration = durationMatch ? parseInt(durationMatch[1]) * 60 : null;

            const directorRaw = getCellText('監督：');
            const director = (directorRaw && directorRaw !== '----') ? directorRaw : '';

            // 优先用 JSON-LD 的 maker，th 作为备用
            if (!maker) {
              const makerRaw = getCellText('メーカー：') || '';
              maker = makerRaw || '';
            }

            const seriesRaw = getCellText('シリーズ：') || '';
            const series = (seriesRaw && seriesRaw !== '----' && seriesRaw !== 'なし') ? seriesRaw : '';

            const labelRaw = getCellText('レーベル：') || '';
            const label = (labelRaw && labelRaw !== '----') ? labelRaw : '';

            const productCodeRaw = getCellText('メーカー品番：') || getCellText('品番：') || getCellText('作品番号：') || getCellText('配信品番：') || '';
            const productCode = productCodeRaw || '';

            // 类型
            const videoTypeRaw = getCellText('ジャンル：') || getCellText('形式：') || '';
            const videoType = (videoTypeRaw && videoTypeRaw !== '----') ? videoTypeRaw.split(/\\s+/)[0] : '';

            // 演员：JSON-LD 优先，th 备用
            if (actors.length === 0) {
              const actorRaw = getCellText('出演者：') || '';
              if (actorRaw && actorRaw !== '----') {
                actors = actorRaw.split(/[,、]/).map(a => a.trim()).filter(a => a.length > 0 && a.length < 25);
              }
            }

            // 标签提取：优先 a[href*="genre"] 链接，其次 JSON-LD，最后 th
            let tags = [];
            // 方法1：从 genre 链接提取（最准确，每个标签独立）
            const genreLinks = document.querySelectorAll('a[href*="genre"]');
            genreLinks.forEach(a => {
              const tag = a.textContent.trim();
              if (tag && tag.length > 1 && tag !== 'ジャンル一覧へ' && !tags.includes(tag)) {
                tags.push(tag);
              }
            });
            // 方法2：JSON-LD genre 数组
            if (tags.length === 0 && product && product.genre && product.genre.length > 0) {
              tags = product.genre;
            }
            // 方法3：th 元素（连在一起，无法分割，作为最后手段）
            if (tags.length === 0) {
              const genreRaw = getCellText('ジャンル：') || getCellText('関連タグ：') || '';
              tags = genreRaw.split(/\\s+/).filter(t => t.length > 0 && !t.includes('#'));
            }

            ({
              title,
              description,
              coverUrl,
              sampleImages,
              actors,
              tags,
              releaseDate,
              duration,
              director,
              maker,
              series,
              label,
              videoType,
              productCode,
              rating,
              ratingCount
            });
          `)

          win.destroy()

          if (!data.title) {
            reject(new Error('video.dmm.co.jp 未找到标题'))
            return
          }

          // 标签翻译（词典 + AI）
          let translatedTags = translateTagsSync(data.tags || [])
          const hasKey = !!getApiKey()
          const untranslated = translatedTags.filter(t => /[぀-ゟ゠-ヿ]/.test(t))
          if (untranslated.length > 0 && hasKey) {
            console.log('[video.dmm] AI翻译标签:', untranslated)
            const aiTranslated = await aiTranslateTags(untranslated)
            const untranslatedSet = new Set(untranslated)
            let aiIndex = 0
            translatedTags = translatedTags.map(t => {
              if (untranslatedSet.has(t)) return aiTranslated[aiIndex++] || t
              return t
            })
          }

          // 标题翻译
          let translatedTitle = data.title
          if (hasKey) {
            const aiTitle = await aiTranslate(data.title, 'title')
            if (aiTitle && aiTitle !== data.title) translatedTitle = aiTitle
            else translatedTitle = await translateToChinese(data.title) || data.title
          } else {
            translatedTitle = await translateToChinese(data.title) || data.title
          }

          // 系列翻译
          let translatedSeries = data.series || null
          if (translatedSeries && /[぀-ゟ゠-ヿ]/.test(translatedSeries)) {
            if (hasKey) {
              const aiSeries = await aiTranslate(translatedSeries, 'title')
              if (aiSeries && aiSeries !== translatedSeries) translatedSeries = aiSeries
            } else {
              const googleSeries = await translateToChinese(translatedSeries)
              if (googleSeries && googleSeries !== translatedSeries) translatedSeries = googleSeries
            }
          }

          // 类型翻译
          let translatedVideoType = data.videoType || null
          if (translatedVideoType && /[぀-ゟ゠-ヿ]/.test(translatedVideoType)) {
            // 先用词典翻译
            translatedVideoType = translateTagsSync([translatedVideoType])[0]
            // 词典没命中用 AI
            if (/[぀-ゟ゠-ヿ]/.test(translatedVideoType) && hasKey) {
              const aiType = await aiTranslate(translatedVideoType, 'title')
              if (aiType && aiType !== translatedVideoType) translatedVideoType = aiType
            }
          }

          // 简介翻译
          let translatedDesc = data.description || ''
          if (translatedDesc) {
            if (hasKey) {
              const aiDesc = await aiTranslate(translatedDesc, 'description')
              if (aiDesc && aiDesc !== translatedDesc) translatedDesc = aiDesc
              else translatedDesc = await translateToChinese(translatedDesc) || translatedDesc
            } else {
              translatedDesc = await translateToChinese(translatedDesc) || translatedDesc
            }
          }

          console.log('[video.dmm] 提取成功:', translatedTitle)

          resolve({
            title: translatedTitle,
            cover_url: data.coverUrl || '',
            sample_image_urls: data.sampleImages || [],
            release_date: data.releaseDate || null,
            duration: data.duration || null,
            actors: data.actors || [],
            director: data.director || null,
            maker: data.maker || null,
            series: translatedSeries || null,
            label: data.label || null,
            video_type: translatedVideoType || null,
            product_code: data.productCode || null,
            tags: translatedTags,
            rating: data.rating || null,
            ratingCount: data.ratingCount || null,
            description: translatedDesc || null,
            fanza_url: url,
            source: 'video.dmm'
          })
        } catch (e: any) {
          win.destroy()
          reject(new Error(`video.dmm.co.jp 抓取失败: ${e.message}`))
        }
      }, 3000)
    })

    win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
      if (!win.isDestroyed()) {
        win.destroy()
        reject(new Error(`video.dmm.co.jp 加载失败: ${errorDescription}`))
      }
    })

    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.destroy()
        reject(new Error('video.dmm.co.jp 抓取超时'))
      }
    }, 20000)
  })
}
