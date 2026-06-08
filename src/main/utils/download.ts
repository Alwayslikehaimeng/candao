import axios from 'axios'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

export async function downloadImage(url: string, savePath: string): Promise<void> {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: url
    },
    timeout: 30000
  })

  const writer = createWriteStream(savePath)
  await pipeline(response.data, writer)
}
