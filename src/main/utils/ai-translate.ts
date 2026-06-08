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

  const titlePrompt = `你是一名专业的 FANZA / FC2 日本影视内容本地化编辑。

任务：将日文标题翻译为自然流畅的简体中文标题。

翻译规则：
1. 保留内容：演员姓名保持原文、作品番号保持原样、厂牌名称保持原样、系列名称保持原样、不要删除任何人物名称
2. 优化内容：调整语序符合中文阅读习惯、使用自然中文表达、避免直译和机翻腔、保留作品核心卖点
3. 宣传词可直接删除：【ベストヒッツ】【BEST】【永久保存版】【完全版】【総集編】【4時間】【8時間】【超お得】【大ボリューム】（如果属于系列名则保留）
4. 输出要求：只输出最终中文标题，不输出解释、备注、引号、Markdown

示例：
输入：【ベストヒッツ】お姉ちゃん、大嫌いな弟にパンチラ見せてよ。 明里つむぎ
输出：姐姐，给最讨厌的弟弟看看你的内裤吧。 明里つむぎ

输入：童貞くんに優しく筆おろししてあげる人妻教師
输出：温柔帮助处男完成初体验的人妻教师`

  const descriptionPrompt = `你是一名专业的日本影视内容本地化编辑。将以下日文简介翻译为自然流畅的简体中文。
规则：使用自然中文叙述，保持原有剧情逻辑，不遗漏重要情节，不重复原文内容，不添加原文不存在的信息。跳过广告和促销文字。只返回翻译结果。
术语参考：寝取られ→被夺走恋人 寝取り→横刀夺爱 痴漢→痴汉骚扰 逆ナン→主动搭讪男性 童貞→处男 筆おろし→初体验 爆乳→巨乳 人妻→人妻 女子大生→女大学生 中出し→中出 義母→继母 義姉→姐姐（无血缘）`

  const prompts: Record<string, string> = {
    title: titlePrompt,
    description: descriptionPrompt,
    tags: `将以下日文标签翻译成中文，用逗号分隔。去掉无意义标签。只输出中文。`
  }

  try {
    const proxyConfig = await getProxyConfig()
    const res = await axios.post(`${apiBase}/chat/completions`, {
      model: modelName,
      messages: [
        { role: 'system', content: prompts[type] },
        { role: 'user', content: text }
      ],
      max_tokens: type === 'description' ? 500 : 200,
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
