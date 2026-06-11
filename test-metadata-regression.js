// 元数据回归测试
// 用法: node test-metadata-regression.js

const TEST_CODES = [
  'IPX-473', 'SSNI-864', 'JUQ-500', 'SONE-310', 'MIDE-786',
  'NMGT-010', 'PRED-836', 'MEYD-985', 'WAAA-648', 'STARS-984'
]

const REQUIRED_FIELDS = [
  'title', 'description', 'actors', 'tags', 'series',
  'maker', 'label', 'productCode', 'duration',
  'releaseDate', 'cover', 'sampleImages', 'rating'
]

async function runTest() {
  const { app, BrowserWindow } = require('electron')

  await app.whenReady()

  const win = new BrowserWindow({ show: false, width: 1200, height: 800 })
  const sess = win.webContents.session
  await sess.setProxy({ proxyRules: 'http://127.0.0.1:7897' })
  await sess.cookies.set({
    url: 'https://video.dmm.co.jp',
    name: 'age_check_done',
    value: '1',
    domain: '.dmm.co.jp',
    path: '/'
  })

  // GraphQL 搜索
  const searchQuery = 'query TopSearch($limit: Int!, $offset: Int, $sort: ContentSearchPPVSort!, $queryWord: String, $excludeUndelivered: Boolean!, $facetLimit: Int!) { legacySearchPPV(limit: $limit, offset: $offset, sort: $sort, queryWord: $queryWord, facetLimit: $facetLimit, includeExplicit: true, excludeUndelivered: $excludeUndelivered) { result { contents { id title } pageInfo { totalCount } } } }'

  console.log('=== 元数据回归测试 ===\n')
  console.log('测试番号:', TEST_CODES.join(', '))
  console.log('')

  const results = []

  for (const code of TEST_CODES) {
    const [series, num] = code.split('-')
    const paddedNum = num.padStart(5, '0')
    const seriesLower = series.toLowerCase()

    // GraphQL 分页搜索
    let videoId = null
    let offset = 0
    const limit = 120

    while (true) {
      const vars = JSON.stringify({ limit, offset, sort: 'RECOMMENDED', queryWord: series, excludeUndelivered: false, facetLimit: 4 })
      const r = await win.webContents.executeJavaScript(`
        (async () => {
          const resp = await fetch('https://api.video.dmm.co.jp/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: 'TopSearch', variables: ${vars}, query: '${searchQuery}' })
          });
          return await resp.text();
        })()
      `)

      try {
        const data = JSON.parse(r)
        const contents = data.data?.legacySearchPPV?.result?.contents || []
        const total = data.data?.legacySearchPPV?.result?.pageInfo?.totalCount || 0

        const match = contents.find(c => {
          const id = (c.id || '').toLowerCase()
          const tail = id.match(/(\d+)$/)
          return tail && tail[1] === paddedNum && id.includes(seriesLower)
        })

        if (match) { videoId = match.id; break }
        if (contents.length < limit || offset + limit >= total) break
        offset += limit
      } catch(e) { break }
    }

    if (!videoId) {
      results.push({ code, status: 'SEARCH_FAIL' })
      continue
    }

    // 打开详情页提取元数据
    win.loadURL('https://video.dmm.co.jp/av/content/?id=' + videoId, { userAgent: 'Mozilla/5.0', extraHeaders: 'Cookie: age_check_done=1' })
    await new Promise(r => setTimeout(r, 10000))

    try {
      const data = await win.webContents.executeJavaScript(`
        (() => {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          let product = null;
          scripts.forEach(s => {
            try { const j = JSON.parse(s.textContent); if (j['@type'] === 'Product') product = j; } catch(e) {}
          });

          const getCellText = (label) => {
            for (const th of document.querySelectorAll('th')) {
              if (th.textContent.trim() === label) {
                const next = th.nextElementSibling;
                return next ? next.textContent.trim() : '';
              }
            }
            return '';
          };

          if (!product) return null;

          const v = product.subjectOf || {};
          const dir = getCellText('監督：');
          const ser = getCellText('シリーズ：');
          const mak = getCellText('メーカー：');
          const lab = getCellText('レーベル：');
          const pc = getCellText('メーカー品番：') || getCellText('品番：') || getCellText('配信品番：');
          const dur = getCellText('収録時間：');
          const durM = dur.match(/(\\d+)/);
          const rel = getCellText('配信開始日：') || getCellText('商品発売日：');
          const relM = rel.match(/(\\d{4}\\/\\d{2}\\/\\d{2})/);

          return {
            title: product.name || '',
            description: (product.description || '').length,
            actors: (v.actor || []).map(a => a.name || ''),
            tags: v.genre || [],
            director: (dir && dir !== '----') ? dir : '',
            series: (ser && ser !== '----' && ser !== 'なし') ? ser : '',
            maker: mak || '',
            label: (lab && lab !== '----') ? lab : '',
            productCode: pc || '',
            duration: durM ? parseInt(durM[1]) * 60 : null,
            releaseDate: relM ? relM[1].replace(/\\//g, '-') : '',
            cover: (product.image && product.image[0]) || '',
            sampleImages: (product.image || []).filter(img => img.includes('jp-')).length,
            rating: product.aggregateRating?.ratingValue || null,
            ratingCount: product.aggregateRating?.ratingCount || null
          };
        })()
      `)

      if (data) {
        // 检查字段完整度
        const missing = []
        for (const field of REQUIRED_FIELDS) {
          const v = data[field]
          if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
            missing.push(field)
          }
        }

        // 检查封面
        const coverOk = data.cover && data.cover.includes('pl.jpg')

        results.push({
          code,
          videoId,
          status: 'OK',
          data,
          missing,
          coverOk,
          sampleCount: data.sampleImages
        })
      } else {
        results.push({ code, videoId, status: 'PARSE_FAIL' })
      }
    } catch(e) {
      results.push({ code, videoId, status: 'ERROR', error: e.message?.substring(0, 50) })
    }
  }

  // 输出结果
  console.log('=== 测试结果 ===\n')

  let success = 0, searchFail = 0, parseFail = 0
  let totalFields = 0, filledFields = 0
  let totalSamples = 0, coverOk = 0
  let totalRatingCount = 0

  for (const r of results) {
    if (r.status === 'SEARCH_FAIL') {
      console.log(r.code + ': ❌ 搜索失败')
      searchFail++
      continue
    }
    if (r.status === 'PARSE_FAIL' || r.status === 'ERROR') {
      console.log(r.code + ': ❌ ' + r.status)
      parseFail++
      continue
    }

    success++
    const d = r.data
    const fieldCount = REQUIRED_FIELDS.length
    const filled = fieldCount - r.missing.length
    totalFields += fieldCount
    filledFields += filled
    totalSamples += r.sampleCount || 0
    if (r.coverOk) coverOk++
    if (d.ratingCount) totalRatingCount++

    console.log(r.code + ': ✅ ' + d.title?.substring(0, 40))
    console.log('  番号: ' + r.videoId)
    console.log('  字段: ' + filled + '/' + fieldCount + ' 缺失: ' + (r.missing.length > 0 ? r.missing.join(',') : '无'))
    console.log('  封面: ' + (r.coverOk ? '✅ pl.jpg' : '❌ ' + (d.cover?.substring(d.cover.lastIndexOf('/') + 1) || '无')))
    console.log('  样图: ' + r.sampleCount)
    console.log('  评分: ' + d.rating + ' (' + (d.ratingCount || '?') + '人)')
    console.log('')
  }

  console.log('=== 统计 ===')
  console.log('搜索成功率: ' + success + '/' + TEST_CODES.length + ' (' + Math.round(success / TEST_CODES.length * 100) + '%)')
  console.log('字段完整率: ' + filledFields + '/' + totalFields + ' (' + Math.round(filledFields / totalFields * 100) + '%)')
  console.log('封面正确率: ' + coverOk + '/' + success + ' (' + (success > 0 ? Math.round(coverOk / success * 100) : 0) + '%)')
  console.log('平均样图: ' + (success > 0 ? (totalSamples / success).toFixed(1) : 0))
  console.log('ratingCount 有值: ' + totalRatingCount + '/' + success)

  win.destroy()
  app.quit()
}

runTest().catch(e => { console.error(e); process.exit(1) })