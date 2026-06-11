import { BrowserWindow } from 'electron'
import type { ProxyConfig } from '../../shared/types'

// GraphQL 查询
const SEARCH_QUERY = `query TopSearch($limit: Int!, $offset: Int, $sort: ContentSearchPPVSort!, $queryWord: String, $excludeUndelivered: Boolean!, $facetLimit: Int!) {
  legacySearchPPV(limit: $limit, offset: $offset, sort: $sort, queryWord: $queryWord, facetLimit: $facetLimit, includeExplicit: true, excludeUndelivered: $excludeUndelivered) {
    result {
      contents { id title }
      pageInfo { totalCount hasNext offset limit }
    }
  }
}`

// GraphQL 搜索结果
interface SearchResult {
  id: string
  title: string
}

// 全量分页搜索
async function searchAll(win: BrowserWindow, series: string): Promise<SearchResult[]> {
  const allItems: SearchResult[] = []
  let offset = 0
  const limit = 120
  let page = 0

  while (true) {
    const result = await win.webContents.executeJavaScript(`
      (async () => {
        try {
          const resp = await fetch('https://api.video.dmm.co.jp/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operationName: 'TopSearch',
              variables: {
                limit: ${limit},
                offset: ${offset},
                sort: 'RECOMMENDED',
                queryWord: '${series}',
                excludeUndelivered: false,
                facetLimit: 4
              },
              query: \`${SEARCH_QUERY}\`
            })
          });
          return await resp.text();
        } catch(e) { return JSON.stringify({error: e.message}) }
      })()
    `)

    try {
      const data = JSON.parse(result)
      const r = data.data?.legacySearchPPV?.result
      if (!r) break

      const items = (r.contents || []).map((c: any) => ({ id: c.id, title: c.title }))
      allItems.push(...items)
      page++

      const totalCount = r.pageInfo?.totalCount || 0
      if (items.length < limit || allItems.length >= totalCount) break
      offset += limit
    } catch (e) {
      console.log('[video.dmm] 搜索解析错误:', (e as Error).message)
      break
    }
  }

  console.log(`[video.dmm] 搜索 ${series}: 总结果=${allItems.length}, 分页=${page}`)
  return allItems
}

// 匹配编号（精确匹配尾部 5 位数字）
function matchById(items: SearchResult[], series: string, number: string): SearchResult | null {
  const padded = number.padStart(5, '0')
  const seriesLower = series.toLowerCase()

  // 第一层：精确匹配尾部 5 位
  for (const item of items) {
    const id = (item.id || '').toLowerCase()
    // 提取尾部数字
    const tailMatch = id.match(/(\d+)$/)
    if (tailMatch && tailMatch[1] === padded && id.includes(seriesLower)) {
      return item
    }
  }

  // 第二层：endswith 匹配（兜底）
  for (const item of items) {
    const id = (item.id || '').toLowerCase()
    if (id.endsWith(padded) && id.includes(seriesLower)) {
      return item
    }
  }

  return null
}

// 主搜索函数：番号 → 完整 ID
export async function searchVideoDmmId(
  code: string,
  proxy?: ProxyConfig
): Promise<string | null> {
  // 解析番号：提取系列名和编号
  const match = code.match(/^([a-zA-Z]+)-?(\d+)$/)
  if (!match) {
    console.log('[video.dmm] 番号格式无法解析:', code)
    return null
  }

  const series = match[1].toUpperCase()
  const number = match[2]
  console.log('[video.dmm] 搜索:', code, '→ 系列:', series, '编号:', number)

  return new Promise<string | null>((resolve) => {
    const win = new BrowserWindow({
      show: false,
      width: 1200,
      height: 800,
      webPreferences: { javascript: true }
    })

    const setup = async () => {
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

      win.loadURL('https://video.dmm.co.jp/', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      })
    }

    setup()

    win.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        try {
          // 全量分页搜索
          const allItems = await searchAll(win, series)

          // 匹配编号
          const found = matchById(allItems, series, number)

          if (found) {
            console.log('[video.dmm] 匹配成功:', found.id, found.title)
            win.destroy()
            resolve(found.id)
          } else {
            console.log('[video.dmm] 未找到匹配结果')
            win.destroy()
            resolve(null)
          }
        } catch (e) {
          console.log('[video.dmm] 搜索失败:', (e as Error).message)
          win.destroy()
          resolve(null)
        }
      }, 6000)
    })

    // 超时处理
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.destroy()
        resolve(null)
      }
    }, 60000) // 60秒超时（全量搜索可能较慢）
  })
}
