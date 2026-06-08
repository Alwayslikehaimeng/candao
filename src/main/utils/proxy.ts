import { createConnection } from 'net'

// 常见代理端口（Clash、V2Ray、Clash Verge 等）
const COMMON_PROXY_PORTS = [7890, 7897, 7891, 1080, 10808, 33210]

async function checkPort(host: string, port: number, timeout = 300): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port }, () => {
      socket.destroy()
      resolve(true)
    })
    socket.setTimeout(timeout)
    socket.on('timeout', () => { socket.destroy(); resolve(false) })
    socket.on('error', () => { socket.destroy(); resolve(false) })
  })
}

export async function detectSystemProxy(): Promise<{ protocol: string; host: string; port: number } | null> {
  // 1. 检查环境变量
  const envProxy = process.env.HTTPS_PROXY || process.env.https_proxy ||
                   process.env.HTTP_PROXY || process.env.http_proxy ||
                   process.env.ALL_PROXY || process.env.all_proxy

  if (envProxy) {
    const match = envProxy.match(/^(socks5|http|https):\/\/([^:]+):(\d+)/i)
    if (match) return { protocol: match[1].toLowerCase(), host: match[2], port: parseInt(match[3]) }
  }

  // 2. 检查常见本地代理端口
  for (const port of COMMON_PROXY_PORTS) {
    if (await checkPort('127.0.0.1', port)) {
      const protocol = port === 7891 ? 'socks5' : 'http'
      return { protocol, host: '127.0.0.1', port }
    }
  }

  return null
}
