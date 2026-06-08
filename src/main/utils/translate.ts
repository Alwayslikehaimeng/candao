import axios from 'axios'
import { detectSystemProxy } from './proxy'
import { getSetting } from '../database/schema'

let cachedProxy: { protocol: string; host: string; port: number } | null = null

async function getProxyConfig() {
  if (!cachedProxy) cachedProxy = await detectSystemProxy()
  const config: any = { timeout: 10000 }
  if (cachedProxy) config.proxy = { protocol: cachedProxy.protocol, host: cachedProxy.host, port: cachedProxy.port }
  return config
}

// 微软翻译 API（免费，每月 200 万字符）
async function translateWithMicrosoft(text: string): Promise<string | null> {
  const apiKey = getSetting('ms_translate_key')
  if (!apiKey) return null

  try {
    const config = await getProxyConfig()
    const region = getSetting('ms_translate_region') || 'global'
    const res = await axios.post(
      'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=ja&to=zh',
      [{ Text: text }],
      {
        ...config,
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    )
    if (res.data && res.data[0] && res.data[0].translations && res.data[0].translations[0]) {
      return res.data[0].translations[0].text
    }
    return null
  } catch (e: any) {
    console.error('[微软翻译] 失败:', e.message)
    return null
  }
}

// 翻译优先级：微软翻译 > Google 翻译
export async function translateToChinese(text: string): Promise<string> {
  if (!text || text.length === 0) return text

  // 优先用微软翻译
  const msResult = await translateWithMicrosoft(text)
  if (msResult) {
    console.log('[翻译] 微软翻译成功')
    return msResult
  }

  // 降级 Google 翻译
  console.log('[翻译] 使用 Google 翻译')
  const config = await getProxyConfig()
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // 每次重试增加延迟
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt))
      const res = await axios.get(url, { ...config, timeout: 15000 })
      if (res.data && res.data[0] && Array.isArray(res.data[0])) {
        return res.data[0].map((item: any[]) => item[0]).join('')
      }
      return text
    } catch (e: any) {
      console.error(`[翻译] Google 尝试 ${attempt + 1}/3 失败:`, e.message)
      if (attempt === 2) return text
    }
  }
  return text
}
