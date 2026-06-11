const { app, BrowserWindow } = require('electron')

app.whenReady().then(async () => {
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

  win.loadURL('https://video.dmm.co.jp/', {
    userAgent: 'Mozilla/5.0',
    extraHeaders: 'Cookie: age_check_done=1'
  })
  await new Promise(r => win.webContents.on('did-finish-load', () => setTimeout(r, 5000)))

  const searchQuery = 'query TopSearch($limit: Int!, $offset: Int, $sort: ContentSearchPPVSort!, $queryWord: String, $excludeUndelivered: Boolean!, $facetLimit: Int!) { legacySearchPPV(limit: $limit, offset: $offset, sort: $sort, queryWord: $queryWord, facetLimit: $facetLimit, includeExplicit: true, excludeUndelivered: $excludeUndelivered) { result { contents { id title } pageInfo { totalCount } } } }'

  const codes = [
    'NMGT-010', 'IPX-473', 'SSNI-864', 'SONE-310', 'JUQ-500',
    'MIDE-800', 'PRED-836', 'MEYD-985', 'WAAA-648', 'STARS-984'
  ]

  const results = []

  for (const code of codes) {
    const parts = code.split('-')
    const series = parts[0]
    const num = parts[1]
    const paddedNum = num.padStart(5, '0')

    let videoId = null
    let offset = 0
    const limit = 120

    while (true) {
      const vars = JSON.stringify({
        limit, offset,
        sort: 'RECOMMENDED',
        queryWord: series,
        excludeUndelivered: false,
        facetLimit: 4
      })

      const r = await win.webContents.executeJavaScript(`
        (async () => {
          try {
            const resp = await fetch('https://api.video.dmm.co.jp/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                operationName: 'TopSearch',
                variables: ${vars},
                query: '${searchQuery}'
              })
            });
            return await resp.text();
          } catch(e) { return JSON.stringify({error: e.message}) }
        })()
      `)

      try {
        const data = JSON.parse(r)
        const contents = data.data?.legacySearchPPV?.result?.contents || []
        const total = data.data?.legacySearchPPV?.result?.pageInfo?.totalCount || 0

        const match = contents.find(c => {
          const id = (c.id || '').toLowerCase()
          const tail = id.match(/(\d+)$/)
          return tail && tail[1] === paddedNum && id.includes(series.toLowerCase())
        })

        if (match) { videoId = match.id; break }
        if (contents.length < limit || offset + limit >= total) break
        offset += limit
      } catch(e) { break }
    }

    if (!videoId) {
      results.push({ code, status: 'NOT_FOUND' })
      continue
    }

    const detailUrl = 'https://video.dmm.co.jp/av/content/?id=' + videoId
    win.loadURL(detailUrl, {
      userAgent: 'Mozilla/5.0',
      extraHeaders: 'Cookie: age_check_done=1'
    })

    await new Promise(r => win.webContents.on('did-finish-load', () => setTimeout(r, 8000)))

    const data = await win.webContents.executeJavaScript(`
      (() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        let product = null;
        scripts.forEach(s => {
          try { const j = JSON.parse(s.textContent); if (j['@type'] === 'Product') product = j; } catch(e) {}
        });

        const getCell = (label) => {
          for (const c of document.querySelectorAll('td')) {
            if (c.textContent.trim() === label) {
              const n = c.nextElementSibling;
              return n ? n.textContent.trim() : '';
            }
          }
          return '';
        };

        if (!product) return null;
        const v = product.subjectOf || {};

        const dir = getCell('監督：');
        const ser = getCell('シリーズ：');
        const mak = getCell('メーカー：');
        const lab = getCell('レーベル：');
        const pc = getCell('品番：') || getCell('商品番号：');
        const dur = getCell('収録時間：');
        const durM = dur.match(/(\d+)/);
        const rel = getCell('発売日：') || getCell('配信開始日：');
        const relM = rel.match(/(\d{4}\/\d{2}\/\d{2})/);
        const genre = getCell('ジャンル：');

        return {
          title: product.name || '',
          descLen: (product.description || '').length,
          actors: (v.actor || []).map(a => a.name || ''),
          tags: genre ? genre.split(/\s+/).filter(t => t.length > 0) : [],
          cover: (product.image && product.image[0]) || '',
          samples: (product.image || []).filter(i => i.includes('jp-')).length,
          rating: product.aggregateRating?.ratingValue || null,
          director: (dir && dir !== '----') ? dir : '',
          series: (ser && ser !== '----' && ser !== 'なし') ? ser : '',
          maker: mak || '',
          label: (lab && lab !== '----') ? lab : '',
          productCode: pc || '',
          duration: durM ? parseInt(durM[1]) * 60 : null,
          releaseDate: relM ? relM[1].replace(/\//g, '-') : ''
        };
      })()
    `)

    results.push(data ? { code, status: 'OK', ...data } : { code, status: 'PARSE_FAIL' })
  }

  console.log('\n=== TEST RESULTS ===\n')
  let success = 0, fail = 0, totalFields = 0, filledFields = 0
  let totalSamples = 0, totalTags = 0

  for (const r of results) {
    if (r.status !== 'OK') {
      console.log(r.code + ': ' + r.status)
      fail++
      continue
    }

    success++
    const checks = ['title', 'descLen', 'actors', 'tags', 'director', 'series', 'maker', 'label', 'productCode', 'duration', 'releaseDate', 'cover', 'samples']
    let filled = 0
    for (const f of checks) {
      const v = r[f]
      if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) filled++
    }
    totalFields += checks.length
    filledFields += filled
    totalSamples += r.samples || 0
    totalTags += (r.tags || []).length

    console.log('\n' + r.code)
    console.log('  title: ' + (r.title || '').substring(0, 50))
    console.log('  desc: ' + r.descLen + ' chars')
    console.log('  actors: ' + r.actors.length)
    console.log('  tags: ' + r.tags.length + ' [' + r.tags.slice(0, 3).join(',') + ']')
    console.log('  director: ' + (r.director || '-'))
    console.log('  series: ' + (r.series || '-'))
    console.log('  maker: ' + (r.maker || '-'))
    console.log('  label: ' + (r.label || '-'))
    console.log('  code: ' + (r.productCode || '-'))
    console.log('  duration: ' + (r.duration ? Math.floor(r.duration / 60) + 'min' : '-'))
    console.log('  date: ' + (r.releaseDate || '-'))
    console.log('  samples: ' + r.samples)
  }

  console.log('\n=== SUMMARY ===')
  console.log('success: ' + success + '/' + codes.length)
  console.log('fields: ' + filledFields + '/' + totalFields + ' (' + (totalFields > 0 ? (filledFields/totalFields*100).toFixed(1) : 0) + '%)')
  console.log('avg samples: ' + (success > 0 ? (totalSamples / success).toFixed(1) : 0))
  console.log('avg tags: ' + (success > 0 ? (totalTags / success).toFixed(1) : 0))

  win.destroy()
  app.quit()
})