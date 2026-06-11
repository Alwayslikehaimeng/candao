import { BrowserWindow } from 'electron'
import type { CrawlResult, ProxyConfig } from '../../shared/types'

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

    // 设置代理和 Cookie（异步，需要等待完成）
    const setupAndLoad = async () => {
      const sess = win.webContents.session

      // 设置代理
      if (proxy?.enabled) {
        await sess.setProxy({
          proxyRules: `${proxy.protocol}://${proxy.host}:${proxy.port}`
        })
        console.log('[video.dmm] 代理已设置:', proxy)
      }

      // 注入 FANZA 年龄验证 Cookie
      await sess.cookies.set({
        url: 'https://video.dmm.co.jp',
        name: 'age_check_done',
        value: '1',
        domain: '.dmm.co.jp',
        path: '/'
      })

      // 验证 Cookie
      const cookies = await sess.cookies.get({ domain: '.dmm.co.jp' })
      console.log('[video.dmm] Cookie 已设置:', cookies.map(c => c.name).join(', '))

      // 加载页面
      win.loadURL(url, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      })
    }

    setupAndLoad()

    // 等页面加载完
    win.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        try {
          // 验证页面是否正常加载
          const pageInfo = await win.webContents.executeJavaScript(`
            ({ title: document.title, url: window.location.href })
          `)
          console.log('[video.dmm] 页面标题:', pageInfo.title)
          console.log('[video.dmm] 页面 URL:', pageInfo.url)

          if (pageInfo.url.includes('age_check') || pageInfo.title.includes('年齢認証')) {
            console.log('[video.dmm] ❌ 被年龄验证拦截！')
            win.destroy()
            reject(new Error('video.dmm.co.jp 年龄验证拦截'))
            return
          }

          // 等待页面渲染
          await new Promise(r => setTimeout(r, 5000))

          // 从 JSON-LD 结构化数据提取元数据
          const data = await win.webContents.executeJavaScript(`
            // 提取 JSON-LD 数据
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            let product = null;
            let breadcrumb = null;

            jsonLdScripts.forEach(script => {
              try {
                const json = JSON.parse(script.textContent);
                if (json['@type'] === 'Product') product = json;
                if (json['@type'] === 'BreadcrumbList') breadcrumb = json;
              } catch(e) {}
            });

            // 从面包屑提取 maker 和 label
            let maker = '';
            let label = '';
            if (breadcrumb && breadcrumb.itemListElement) {
              breadcrumb.itemListElement.forEach(item => {
                if (item.position === 3 && item.name) maker = item.name;
                if (item.position === 4 && item.name) label = item.name;
              });
            }

            // 从 JSON-LD Product 提取数据
            if (product) {
              const videoObj = product.subjectOf || {};
              ({
                title: product.name || '',
                description: product.description || '',
                coverUrl: (product.image && product.image[0]) || '',
                sampleImages: (product.image || []).filter(img => img.includes('jp-')),
                actors: (videoObj.actor || []).map(a => a.name || a.alternateName || ''),
                tags: videoObj.genre || [],
                releaseDate: videoObj.uploadDate || '',
                duration: null,
                maker: maker,
                series: '',
                label: label,
                productCode: product.sku || '',
                review: product.aggregateRating || {}
              });
            } else {
              // 兜底：从 og:meta 提取
              ({
                title: document.querySelector('meta[property="og:title"]')?.content || document.title || '',
                description: document.querySelector('meta[property="og:description"]')?.content || '',
                coverUrl: document.querySelector('meta[property="og:image"]')?.content || '',
                sampleImages: [],
                actors: [],
                tags: [],
                releaseDate: '',
                duration: null,
                maker: maker,
                series: '',
                label: label,
                productCode: '',
                review: {}
              });
            }
          `)

          win.destroy()

          if (!data.title) {
            console.log('[video.dmm] 提取失败')
            reject(new Error('video.dmm.co.jp 未找到标题'))
            return
          }

          console.log('[video.dmm] 提取成功:', data.title)
          console.log('[video.dmm] 封面:', data.coverUrl?.substring(0, 80))
          console.log('[video.dmm] 演员:', data.actors?.join(', '))
          console.log('[video.dmm] 标签:', data.tags?.join(', '))

          resolve({
            title: data.title,
            cover_url: data.coverUrl || '',
            sample_image_urls: data.sampleImages || [],
            release_date: data.releaseDate || null,
            duration: data.duration || null,
            actors: data.actors || [],
            director: null,
            maker: data.maker || null,
            series: data.series || null,
            label: data.label || null,
            video_type: null,
            product_code: data.productCode || null,
            tags: data.tags || [],
            rating: data.review?.average || null,
            description: data.description || null,
            fanza_url: url,
            source: 'FANZA'
          })
        } catch (e: any) {
          win.destroy()
          reject(new Error(`video.dmm.co.jp 抓取失败: ${e.message}`))
        }
      }, 3000)
    })

    // 错误处理
    win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
      if (!win.isDestroyed()) {
        win.destroy()
        reject(new Error(`video.dmm.co.jp 加载失败: ${errorDescription}`))
      }
    })

    // 超时处理
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.destroy()
        reject(new Error('video.dmm.co.jp 抓取超时'))
      }
    }, 20000)
  })
}
