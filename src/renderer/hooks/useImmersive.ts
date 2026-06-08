import { useEffect, useRef } from 'react'
import { useImmersiveStore } from '../stores/immersiveStore'

export function useImmersive() {
  const { enabled, setLevel, setSidebarHover } = useImmersiveStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const edgeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const resetTimer = () => {
      setLevel(0)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setLevel(1), 10000)
    }

    const handleMouse = (e: MouseEvent) => {
      resetTimer()
      // 左边缘检测
      if (e.clientX <= 20) {
        setSidebarHover(true)
        if (edgeRef.current) clearTimeout(edgeRef.current)
      }
    }

    const handleLeave = (e: MouseEvent) => {
      if (e.clientX > 260) {
        edgeRef.current = setTimeout(() => setSidebarHover(false), 300)
      }
    }

    const handleKey = () => resetTimer()
    const handleWheel = () => resetTimer()
    const handleClick = () => resetTimer()

    // 启动计时
    resetTimer()

    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('keydown', handleKey)
    window.addEventListener('wheel', handleWheel)
    window.addEventListener('click', handleClick)
    document.addEventListener('mouseleave', handleLeave)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (edgeRef.current) clearTimeout(edgeRef.current)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('click', handleClick)
      document.removeEventListener('mouseleave', handleLeave)
    }
  }, [enabled, setLevel, setSidebarHover])
}
