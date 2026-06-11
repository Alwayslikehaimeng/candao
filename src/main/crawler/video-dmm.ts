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

          // 等待 React 渲染（Next.js 需要更长时间）
          await new Promise(r => setTimeout(r, 5000))

          // 提取页面数据
          const data = await win.webContents.executeJavaScript(`
            // 调试信息
            const debug = {
              url: window.location.href,
              title: document.title,
              bodyLength: document.body.innerHTML.length,
              h1Count: document.querySelectorAll('h1').length,
              imgCount: document.querySelectorAll('img').length
            };
            console.log('[video.dmm] 页面信息:', JSON.stringify(debug));

            // 标题（多选择器兼容）
            const title = document.querySelector('h1')?.textContent?.trim() ||
                          document.querySelector('[class*="title"]')?.textContent?.trim() ||
                          document.querySelector('[data-testid="title"]')?.textContent?.trim() ||
                          document.querySelector('meta[property="og:title"]')?.content ||
                          document.title || '';

            // 封面图
            const coverImg = document.querySelector('img[src*="pics.dmm.co.jp"]')?.src ||
                            document.querySelector('img[src*="awsimgsrc"]')?.src ||
                            document.querySelector('meta[property="og:image"]')?.content || '';

            // 简介
            const desc = document.querySelector('[class*="description"], [class*="summary"], [class*="intro"], p[class*="text"]')?.textContent?.trim() || '';

            // 标签
            const tags = [];
            document.querySelectorAll('a[href*="genre"], a[href*="keyword"], [class*="genre"] a, [class*="tag"] a').forEach(el => {
              const t = el.textContent?.trim();
              if (t && t.length < 30 && !tags.includes(t)) tags.push(t);
            });

            // 演员
            const actors = [];
            document.querySelectorAll('a[href*="actress"], a[href*="idol"], [class*="actress"] a, [class*="idol"] a').forEach(el => {
              const name = el.textContent?.trim();
              if (name && name.length < 20 && !actors.includes(name)) actors.push(name);
            });

            // 元数据
            const meta = {};
            document.querySelectorAll('dt, th').forEach(el => {
              const label = el.textContent?.trim();
              const value = el.nextElementSibling?.textContent?.trim();
              if (label && value) meta[label] = value;
            });

            // 发行日期
            const releaseDate = meta['発売日'] || meta['配信開始日'] || meta['Release'] || '';

            // 时长
            const durationText = meta['収録時間'] || meta['Runtime'] || '';
            const durationMatch = durationText.match(/(\\d+)/);
            const duration = durationMatch ? parseInt(durationMatch[1]) * 60 : null;

            // 制造商
            const maker = meta['メーカー'] || meta['Studio'] || '';

            // 系列
            const series = meta['シリーズ'] || meta['Series'] || '';

            // 唱片公司
            const label = meta['レーベル'] || meta['Label'] || '';

            // 产品编号
            const productCode = meta['品番'] || meta['商品番号'] || '';

            // 样例图
            const sampleImages = [];
            document.querySelectorAll('img[src*="pics.dmm.co.jp"]').forEach(el => {
              const src = el.src;
              if (src && !src.includes('dummy') && !src.includes('loading') && !sampleImages.includes(src)) {
                sampleImages.push(src);
              }
            });

            ({
              title,
              coverUrl: coverImg,
              description: desc,
              tags,
              actors,
              releaseDate,
              duration,
              maker,
              series,
              label,
              productCode,
              sampleImages,
              debug
            });
          `)

          win.destroy()

          if (!data.title) {
            console.log('[video.dmm] 提取失败，页面内容:', data.debug)
            reject(new Error('video.dmm.co.jp 未找到标题'))
            return
          }

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
            rating: null,
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
