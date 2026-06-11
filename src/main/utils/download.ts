import axios from 'axios'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { detectSystemProxy } from './proxy'

let cachedProxy: { protocol: string; host: string; port: number } | null = null

async function getProxy() {
  if (!cachedProxy) {
    cachedProxy = await detectSystemProxy()
  }
  return cachedProxy || undefined
}

export async function downloadImage(url: string, savePath: string): Promise<void> {
  // 根据 URL 域名设置正确的 Referer
  let referer = 'https://www.google.com/'
  if (url.includes('javbus.com')) referer = 'https://www.javbus.com/'
  else if (url.includes('dmm.co.jp')) referer = 'https://www.dmm.co.jp/'

  const proxy = await getProxy()

  const config: any = {
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: referer
    },
    timeout: 30000
  }
  if (proxy) config.proxy = { protocol: proxy.protocol, host: proxy.host, port: proxy.port }

  const response = await axios(config)

  const writer = createWriteStream(savePath)
  await pipeline(response.data, writer)
}
