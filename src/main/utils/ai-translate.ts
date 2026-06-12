import axios from 'axios'
import { detectSystemProxy } from './proxy'

let cachedProxy: { protocol: string; host: string; port: number } | null = null
let apiKey = ''
let apiBase = 'https://api.openai.com/v1'
let modelName = 'gpt-4o-mini'

export function setApiKey(key: string) { apiKey = key }
export function setApiBase(base: string) {
  // 如果用户填了完整路径（包含 /chat/completions），自动去掉
  apiBase = base.replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '')
}
export function getApiKey() { return apiKey }
export function setModel(model: string) { modelName = model }

async function getProxyConfig() {
  if (!cachedProxy) cachedProxy = await detectSystemProxy()
  const config: any = { timeout: 30000 }
  if (cachedProxy) config.proxy = { protocol: cachedProxy.protocol, host: cachedProxy.host, port: cachedProxy.port }
  return config
}

export async function aiTranslate(text: string, type: 'title' | 'description' | 'tags'): Promise<string> {
  if (!apiKey || !text) {
    console.log('[AI翻译] 跳过: apiKey=', !!apiKey, 'text=', !!text)
    return text
  }
  console.log('[AI翻译] 调用:', type, '模型:', modelName, 'URL:', apiBase)

  const titlePrompt = `你是一名专业的 FANZA / FC2 中文资源站编辑。

任务：将日文作品标题翻译为自然流畅的简体中文标题。

目标：让标题看起来像中文资源站人工整理后的结果，而不是机器翻译。

保留内容：演员姓名、番号、系列名称（可使用中文圈通用译名）、厂牌名称（可翻译常见中文译名）

系列翻译规则：
- 优先使用中文圈通用译名
- 例如：マジックミラー号→魔镜巴士、ラグジュTV→Luxury TV、街角シロウトナンパ→街头素人搭讪、ナンパTV→搭讪TV
- 如果存在广泛认可的中文译名，优先使用中文译名，不要保留日文，不要使用英文直译

删除规则（仅删除纯宣传词）：
- 超豪華、超人気、話題作、永久保存版、BEST、ベストヒッツ

不要删除以下信息：人数、时间长度、限定、比赛、企划、活动主题、拍摄场景、职业设定、角色设定、系列信息

翻译原则：
- 优先意译，符合中文阅读习惯，调整语序
- 保留核心卖点，不要逐字翻译
- 不要保留明显日语语序，不要写成营销广告

标题风格要求：
- 优先：魔镜巴士：夏日祭特别篇、街头搭讪实录、烟花大会限定企划、浴衣女孩挑战赛
- 避免：Magic Mirror号、夏祭りだよ、超豪华、超震撼、超刺激

后处理规则（翻译完成后检查）：
- 如果标题中仍存在日文或不符合中文习惯的表达，请进行转换
- SP → 特别篇
- 企画 → 企划
- TV → TV（保留）
- 号 → 巴士（仅限魔镜巴士系列）

词汇规则：
- sex → 发生性关系、做爱（不要翻译为"性"单独一个字）
- SEX → 性爱
- セックス → 做爱、性爱

输出要求：仅输出最终中文标题，不要解释、不要备注、不要 Markdown`

  const descriptionPrompt = `你是一名中文影视资源站编辑，而不是小说作者。

任务：将日文简介翻译成自然、简洁、符合中文资源站风格的简介。

翻译原则：
1. 优先忠实表达原文意思
2. 保持客观描述
3. 保持简介风格
4. 优先理解语义后意译，不逐字翻译
5. 保持原文信息完整，保留剧情重点

禁止：
- 过度文学化、过度营销化、网文风格
- 自行扩写、脑补剧情、添加原文不存在的信息
- 不要写成小说、不要写成广告
- 不要自行增强语气、不要添加夸张修饰词

禁止使用以下表达：
性爱盛宴、欲望狂潮、激情碰撞、欲火焚身、销魂蚀骨、疯狂索取、猛烈进攻、彻底征服、欲仙欲死、快感风暴、激情无限、性爱大战、淫靡、放荡、骚浪
狠狠干到、爽翻、爽到飞起、榨干、玩坏、狠狠干、被狠狠干、疯狂抽插

优先使用：
沉浸于快感之中、露出陶醉表情、达到高潮、连续高潮、敏感体质、尽情享受性爱时光、沉浸在性爱之中、体验强烈快感

术语规则：
- イク → 达到高潮（不要翻译为"射精"，除非明确描述男性射精）
- 絶頂 → 高潮
- アヘ顔 → 陶醉表情、痴醉表情（不要音译为"阿黑颜"）
- お潮 → 潮吹
- 連続絶頂 → 连续高潮
- 快感に溺れる → 沉浸于快感
- 悶える → 沉浸快感、情难自已
- 恍惚 → 恍惚陶醉
- 発情 → 情欲高涨
- 敏感体質 → 敏感体质

不要：翻译成射精（除非明确描述男性射精）、音译日语行业术语、保留日文拟声词（じゅぽ、じゅる、ぬぷ、ぐちゅ、じょぼぼ、びゅる等，根据上下文意译）

广告文案删除：超人気、話題沸騰、超大作、必見、永久保存版、絶対おすすめ、超豪華

保留内容：演员名、厂牌名、系列名、品牌名、地名、专有名词

长度要求：翻译后字数控制在原文 ±20% 范围内。禁止扩写、禁止缩写过度、保持与原文信息量一致。

特别规则：当原文存在夸张宣传语时，不必完全保留语气强度。允许适度弱化宣传语，使中文表达更自然。

中文润色规则（翻译完成后再次检查并自动优化）：
- 炮友 → 性伴侣（仅在正式简介中）
- 舒服的性爱就是这样的事 → 这才是真正令人沉醉的性爱体验
- 抖M → 受虐倾向、顺从姿态
- 超爱 → 格外迷恋、情有独钟
- 大脑融化 → 意识仿佛融化般沉浸于快感

核心规则：
- 禁止将一句日文拆解成多个并列关键词
- 禁止出现标签化表达（如：乳首高潮、阴茎痴醉、高潮女孩、潮吹不止）
- 优先翻译为完整自然句子
- 宁可有点口语，也不要变成关键词堆砌
- 真人编辑会写句子，AI 最爱写标签，要写句子不要写标签

中文自然化规则：
- 避免使用 &、+、/（除非原文本身是标题格式）
- 优先使用完整中文句子
- 如果出现明显口语化、网络化或机器翻译痕迹，优先改写为自然的中文影视简介风格
- 保持客观描述，避免网络用语、论坛用语、小说化表达

输出要求：仅输出最终中文简介`

  const prompts: Record<string, string> = {
    title: titlePrompt,
    description: descriptionPrompt,
    tags: `将以下 FANZA / FC2 标签翻译为中文。

规则：
- 仅输出中文标签，使用逗号分隔
- 去重，删除无意义标签，删除营销标签
- 保持统一风格，优先使用行业通用译名

标签规范：
人妻→人妻 熟女→熟女 ギャル→辣妹 美少女→美少女 OL→白领女性
女教師→女教师 女医→女医生 看護師→护士 秘書→秘书 メイド→女仆
女子大生→女大学生 清楚系→清纯系 お嬢様→大小姐 童顔→娃娃脸
巨乳→丰满身材 微乳→小巧身材 美脚→美腿 美尻→美臀
ハイビジョン→高清 4K→4K VR→VR 主観→第一人称视角 ドキュメント→纪录风格

删除：総集編、BEST、超人気、人気作品

输出格式：标签1,标签2,标签3
不要输出解释。`
  }

  try {
    const proxyConfig = await getProxyConfig()
    const res = await axios.post(`${apiBase}/chat/completions`, {
      model: modelName,
      messages: [
        { role: 'system', content: prompts[type] },
        { role: 'user', content: text }
      ],
      max_tokens: type === 'description' ? 1500 : 1000,
      temperature: 0.3
    }, {
      ...proxyConfig,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    // DeepSeek 原始响应调试
    console.log('=== DEEPSEEK RAW RESPONSE ===')
    console.log(JSON.stringify(res.data, null, 2))
    console.log('choices:', res.data?.choices)
    console.log('message:', res.data?.choices?.[0]?.message)
    console.log('content:', JSON.stringify(res.data?.choices?.[0]?.message?.content))
    console.log('reasoning_content:', JSON.stringify(res.data?.choices?.[0]?.message?.reasoning_content))
    console.log('finish_reason:', res.data?.choices?.[0]?.finish_reason)
    console.log('usage:', res.data?.usage)

    const result = res.data.choices?.[0]?.message?.content?.trim()
    console.log('[AI翻译] 原文:', text.substring(0, 50))
    console.log('[AI翻译] 译文:', result?.substring(0, 50) || '无')
    return result || text
  } catch (e: any) {
    console.error('[AI翻译] 失败:', e.message)
    console.error('[AI翻译] URL:', `${apiBase}/chat/completions`)
    console.error('[AI翻译] 模型:', 'gpt-4o-mini')
    if (e.response) {
      console.error('[AI翻译] 状态码:', e.response.status)
      console.error('[AI翻译] 响应:', JSON.stringify(e.response.data).substring(0, 200))
    }
    return text
  }
}

export async function aiTranslateTags(tags: string[]): Promise<string[]> {
  if (!apiKey || tags.length === 0) return tags

  try {
    const proxyConfig = await getProxyConfig()
    const res = await axios.post(`${apiBase}/chat/completions`, {
      model: modelName,
      messages: [
        { role: 'system', content: '你是翻译专家。将以下日文标签逐个翻译成中文。输入是JSON数组，输出也必须是JSON数组，格式完全一致，只翻译内容。去掉"サンプル動画""レビュー"等无意义标签。只输出JSON数组，不要其他文字。' },
        { role: 'user', content: JSON.stringify(tags) }
      ],
      max_tokens: 300,
      temperature: 0.1
    }, {
      ...proxyConfig,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const result = res.data.choices?.[0]?.message?.content?.trim()
    if (result) {
      try {
        const parsed = JSON.parse(result)
        if (Array.isArray(parsed)) return parsed
      } catch {
        // 解析失败，返回原文
      }
    }
    return tags
  } catch (e: any) {
    console.error('[AI翻译标签] 失败:', e.message)
    return tags
  }
}
