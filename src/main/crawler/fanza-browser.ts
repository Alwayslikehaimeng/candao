import { BrowserWindow } from 'electron'

// 用浏览器方式加载 FANZA 页面，提取所有示例图
export async function fetchSampleImagesWithBrowser(url: string, proxy?: { protocol: string; host: string; port: number }): Promise<string[]> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      show: false,
      width: 1200,
      height: 800,
      webPreferences: {
        javascript: true,
        images: true
      }
    })

    // 设置代理
    if (proxy) {
      const session = win.webContents.session
      session.setProxy({
        proxyRules: `${proxy.protocol}://${proxy.host}:${proxy.port}`
      })
    }

    // 加载页面
    win.loadURL(url, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' })

    // 等页面加载完
    win.webContents.on('did-finish-load', () => {
      // 等待图片懒加载
      setTimeout(async () => {
        try {
          // 滚动页面触发懒加载
          await win.webContents.executeJavaScript(`
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 1000));
            window.scrollTo(0, 0);
          `)

          // 等待图片加载
          await new Promise(r => setTimeout(r, 2000))

          // 提取所有示例图 URL
          const images = await win.webContents.executeJavaScript(`
            const urls = new Set();

            // 从 data-lazy 属性获取
            document.querySelectorAll('[data-lazy]').forEach(el => {
              const src = el.getAttribute('data-lazy');
              if (src && src.includes('pics.dmm.co.jp') && !src.includes('dummy') && !src.includes('loading')) {
                urls.add(src);
              }
            });

            // 从 img src 获取
            document.querySelectorAll('img').forEach(el => {
              const src = el.src;
              if (src && src.includes('pics.dmm.co.jp') && !src.includes('dummy') && !src.includes('loading')) {
                urls.add(src);
              }
            });

            Array.from(urls);
          `)

          win.destroy()
          resolve(images as string[])
        } catch (e) {
          win.destroy()
          resolve([])
        }
      }, 3000)
    })

    // 超时处理
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.destroy()
        resolve([])
      }
    }, 15000)
  })
}
