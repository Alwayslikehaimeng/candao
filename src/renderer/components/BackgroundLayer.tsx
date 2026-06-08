import { useEffect, useRef } from 'react'
import { useBgStore, type MediaItem } from '../stores/bgStore'

const requestIdle = (cb: () => void, timeout = 2000) => {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb, { timeout })
  }
  return setTimeout(cb, 50) as unknown as number
}

const cancelIdle = (id: number) => {
  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

async function loadMediaItem(item: MediaItem): Promise<void> {
  const fileUrl = item.src.startsWith('file://') ? item.src : `file:///${item.src.replace(/\\/g, '/')}`
  if (item.type === 'image') {
    const img = new Image()
    img.src = fileUrl
    await img.decode()
  } else if (item.type === 'video') {
    const v = document.createElement('video')
    v.src = fileUrl
    v.muted = true
    v.preload = 'auto'
    await new Promise<void>((resolve, reject) => {
      v.oncanplaythrough = () => { v.pause(); v.src = ''; resolve() }
      v.onerror = () => reject(new Error('video load failed'))
      v.load()
      setTimeout(() => reject(new Error('timeout')), 15000)
    })
  }
}

function toFileUrl(src: string): string {
  return src.startsWith('file://') ? src : `file:///${src.replace(/\\/g, '/')}`
}

// 等待 video 满足 readyState + currentTime 条件
function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (video.readyState >= 3 && video.currentTime > 0.1) {
      resolve(true)
      return
    }
    const check = () => {
      if (video.readyState >= 3 && video.currentTime > 0.1) {
        video.removeEventListener('timeupdate', check)
        resolve(true)
      }
    }
    video.addEventListener('timeupdate', check)
    video.play().catch(() => {})
    setTimeout(() => {
      video.removeEventListener('timeupdate', check)
      resolve(false)
    }, timeoutMs)
  })
}

// 双 rAF 原子 swap
function doubleRAF(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

export default function BackgroundLayer() {
  const {
    mode, blur, brightness, saturation,
    currentSrc, currentType,
    preloadedSrc, preloadedType,
    rotationEnabled, rotationInterval, nextWallpaper,
    setPreloadedResource, promotePreloadedToNext
  } = useBgStore()

  // 图片双层
  const imgBackRef = useRef<HTMLDivElement>(null)
  const imgFrontRef = useRef<HTMLDivElement>(null)

  // 视频双层（永久在线，GPU 加速）
  const videoARef = useRef<HTMLVideoElement>(null)
  const videoALayerRef = useRef<HTMLDivElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)
  const videoBLayerRef = useRef<HTMLDivElement>(null)

  // 角色追踪
  const activeVideoLayer = useRef<'A' | 'B'>('A')
  const currentDisplaySrc = useRef<string | null>(null)
  const transitioning = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleRef = useRef<number | null>(null)
  const preloadingRef = useRef(false)

  // 轮播
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (rotationEnabled && rotationInterval > 0 && currentSrc) {
      timerRef.current = setInterval(() => nextWallpaper(), rotationInterval * 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [rotationEnabled, rotationInterval, currentSrc, nextWallpaper])

  // Scheduler
  const schedulePreload = () => {
    if (idleRef.current) cancelIdle(idleRef.current)
    idleRef.current = requestIdle(() => {
      idleRef.current = null
      runPreload()
    })
  }

  const runPreload = async () => {
    if (preloadingRef.current) return
    if (mode === 'none' || !currentSrc) return
    preloadingRef.current = true
    try {
      const store = useBgStore.getState()
      const next = store.getNextMediaItem()
      const nextNext = store.getNextNextMediaItem()

      if (next && next.src !== store.preloadedSrc) {
        try {
          await loadMediaItem(next)
          setPreloadedResource(next.src, next.type)
        } catch {}
      }
      const updated = useBgStore.getState()
      if (nextNext && nextNext.src !== updated.preloadedNextSrc && nextNext.src !== updated.preloadedSrc) {
        try {
          await loadMediaItem(nextNext)
          useBgStore.setState({ preloadedNextSrc: nextNext.src, preloadedNextType: nextNext.type })
        } catch {}
      }
    } finally {
      preloadingRef.current = false
    }
  }

  // 壁纸切换
  useEffect(() => {
    if (!currentSrc || mode === 'none') return
    if (transitioning.current) return
    if (currentDisplaySrc.current === currentSrc) return

    transitioning.current = true
    const src = currentSrc
    const type = currentType
    const fileUrl = toFileUrl(src)

    const finish = () => {
      currentDisplaySrc.current = src
      transitioning.current = false
      promotePreloadedToNext()
      schedulePreload()
    }

    if (type === 'image') {
      // ===== 图片切换 =====
      const front = imgFrontRef.current
      const back = imgBackRef.current
      if (!front || !back) { transitioning.current = false; return }

      const doImageTransition = () => {
        front.style.backgroundImage = `url("${encodeURI(fileUrl)}")`
        front.style.backgroundSize = 'cover'
        front.style.backgroundPosition = 'center'
        void front.offsetWidth
        front.style.transition = 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)'
        front.style.opacity = '1'

        const onDone = () => {
          front.removeEventListener('transitionend', onDone)
          back.style.backgroundImage = front.style.backgroundImage
          back.style.backgroundSize = 'cover'
          back.style.backgroundPosition = 'center'
          front.style.transition = 'none'
          front.style.opacity = '0'
          front.style.backgroundImage = 'none'
          finish()
        }
        front.addEventListener('transitionend', onDone)
        setTimeout(() => { if (transitioning.current) { front.removeEventListener('transitionend', onDone); onDone() } }, 1000)
      }

      if (preloadedSrc === src && preloadedType === 'image') {
        doImageTransition()
      } else {
        const img = new Image()
        img.src = fileUrl
        img.decode().then(doImageTransition).catch(() => { transitioning.current = false })
      }

    } else if (type === 'video') {
      // ===== 视频切换：双 rAF 原子 swap =====
      const activeLayer = activeVideoLayer.current === 'A' ? videoALayerRef.current : videoBLayerRef.current
      const standbyLayer = activeVideoLayer.current === 'A' ? videoBLayerRef.current : videoALayerRef.current
      const activeVideo = activeVideoLayer.current === 'A' ? videoARef.current : videoBRef.current
      const standbyVideo = activeVideoLayer.current === 'A' ? videoBRef.current : videoARef.current

      if (!activeLayer || !standbyLayer || !activeVideo || !standbyVideo) {
        transitioning.current = false
        return
      }

      // 设置 standby 源
      standbyVideo.src = fileUrl

      standbyVideo.oncanplaythrough = () => {
        standbyVideo.oncanplaythrough = null
        standbyVideo.play().catch(() => {})

        // 等待 readyState >= 3 且 currentTime > 0.1
        waitForVideoReady(standbyVideo).then((ready) => {
          if (!ready || !transitioning.current) {
            transitioning.current = false
            return
          }

          // 双 rAF 确保 GPU commit 完成
          doubleRAF().then(() => {
            if (!transitioning.current) return

            // 原子 swap：同一帧内完成 opacity 切换
            standbyLayer.style.transition = 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)'
            activeLayer.style.transition = 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)'
            standbyLayer.style.opacity = '1'
            activeLayer.style.opacity = '0'

            // 等待 transition 完成
            const onDone = () => {
              standbyLayer.removeEventListener('transitionend', onDone)
              // 在新层完全可见后才 pause 旧视频
              activeVideo.pause()
              // 交换角色
              activeVideoLayer.current = activeVideoLayer.current === 'A' ? 'B' : 'A'
              finish()
            }

            standbyLayer.addEventListener('transitionend', onDone)
            setTimeout(() => {
              if (transitioning.current) {
                standbyLayer.removeEventListener('transitionend', onDone)
                onDone()
              }
            }, 1000)
          })
        })
      }

      standbyVideo.onerror = () => {
        standbyVideo.onerror = null
        transitioning.current = false
      }
    }
  }, [currentSrc, currentType, mode, preloadedSrc, preloadedType])

  // 首次启动预加载
  useEffect(() => {
    if (currentSrc && mode !== 'none') schedulePreload()
    return () => { if (idleRef.current) cancelIdle(idleRef.current) }
  }, [currentSrc, mode])

  if (mode === 'none' || !currentSrc) return null

  const filterStr = `blur(${blur}px) brightness(${brightness / 100}) saturate(${saturation / 100})`
  const videoBaseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'translateZ(0)',
    willChange: 'opacity',
    backfaceVisibility: 'hidden',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* 图片 Back */}
      <div ref={imgBackRef} style={{ position: 'absolute', inset: 0, opacity: 1, filter: filterStr, backgroundSize: 'cover', backgroundPosition: 'center', backfaceVisibility: 'hidden' }} />
      {/* 图片 Front */}
      <div ref={imgFrontRef} style={{ position: 'absolute', inset: 0, opacity: 0, filter: filterStr, backfaceVisibility: 'hidden' }} />

      {/* 视频 A */}
      <div ref={videoALayerRef} style={{ position: 'absolute', inset: 0, opacity: 0, filter: filterStr, willChange: 'opacity', backfaceVisibility: 'hidden' }}>
        <video ref={videoARef} muted loop playsInline preload="auto" style={videoBaseStyle} />
      </div>
      {/* 视频 B */}
      <div ref={videoBLayerRef} style={{ position: 'absolute', inset: 0, opacity: 0, filter: filterStr, willChange: 'opacity', backfaceVisibility: 'hidden' }}>
        <video ref={videoBRef} muted loop playsInline preload="auto" style={videoBaseStyle} />
      </div>

      {/* 暗色遮罩 */}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(100 - brightness) / 200})` }} />
    </div>
  )
}
