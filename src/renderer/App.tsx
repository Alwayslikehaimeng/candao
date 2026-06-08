import { useState, useEffect } from 'react'
import { message } from 'antd'
import { useVideoStore } from './stores/videoStore'
import { useThemeStore } from './stores/themeStore'
import { useBgStore } from './stores/bgStore'
import { useImmersiveStore } from './stores/immersiveStore'
import { useImmersive } from './hooks/useImmersive'
import BackgroundLayer from './components/BackgroundLayer'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import TagWallPage from './pages/TagWallPage'
import TagDetailPage from './pages/TagDetailPage'
import AddVideoModal from './components/AddVideoModal'
import SettingsModal from './components/SettingsModal'
import type { Video } from '../shared/types'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'detail' | 'tagwall' | 'tagdetail'>('home')
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const { filters, setFilters, refreshVideos } = useVideoStore()
  const { initTheme } = useThemeStore()
  const { init: initBg, mode: bgMode } = useBgStore()
  const { init: initImmersive, level, sidebarHover } = useImmersiveStore()

  useImmersive()

  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({ all: 0, av: 0, fc2: 0, other: 0 })

  useEffect(() => {
    initTheme()
    initBg()
    initImmersive()
    loadCategoryCounts()
  }, [])

  const loadCategoryCounts = async () => {
    const counts = await window.api.getCategoryCounts()
    setCategoryCounts(counts)
  }

  const handleViewDetail = (video: Video) => {
    setSelectedVideoId(video.id)
    setCurrentPage('detail')
  }

  const handleBackToHome = () => {
    setSelectedVideoId(null)
    setCurrentPage('home')
    refreshVideos()
    loadCategoryCounts()
  }

  const handleSelectTag = (tagName: string) => {
    setSelectedTag(tagName)
    setCurrentPage('tagdetail')
  }

  const handleBackToTagWall = () => {
    setSelectedTag(null)
    setCurrentPage('tagwall')
  }

  const handleRandomPlay = async () => {
    const video = await window.api.randomPlay()
    if (!video) message.info('媒体库为空')
  }

  const isWallpaper = bgMode !== 'none'
  const sidebarCollapsed = level >= 1 && !sidebarHover

  const categories = [
    { key: undefined, label: '全部视频', icon: '📹', count: categoryCounts.all ?? 0 },
    { key: 'av' as const, label: 'AV', icon: '🎬', count: categoryCounts.av ?? 0 },
    { key: 'fc2' as const, label: 'FC2', icon: '📀', count: categoryCounts.fc2 ?? 0 },
    { key: 'other' as const, label: '其他', icon: '📂', count: categoryCounts.other ?? 0 },
  ]

  return (
    <>
      <BackgroundLayer />

      <div className={`app-layout ${isWallpaper ? 'theme-wallpaper' : 'theme-normal'} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* 侧边栏 */}
        <aside
          className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
          onMouseEnter={() => useImmersiveStore.getState().setSidebarHover(true)}
          onMouseLeave={() => useImmersiveStore.getState().setSidebarHover(false)}
        >
          <div className="sidebar-logo">
            {sidebarCollapsed ? (
              <div className="sidebar-logo-icon">喰</div>
            ) : (
              <div>
                <div className="sidebar-logo-text">喰导</div>
                <div className="sidebar-logo-sub">CANDAO</div>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section">
              {!sidebarCollapsed && <div className="sidebar-section-title">媒体库</div>}
              {categories.map(cat => (
                <div
                  key={cat.key ?? 'all'}
                  className={`sidebar-item ${filters.category === cat.key && currentPage === 'home' ? 'active' : ''}`}
                  onClick={() => { setFilters({ category: cat.key }); setCurrentPage('home') }}
                  title={sidebarCollapsed ? cat.label : undefined}
                >
                  <span className="sidebar-item-icon">{cat.icon}</span>
                  {!sidebarCollapsed && <span className="sidebar-item-label">{cat.label}</span>}
                  {!sidebarCollapsed && <span className="sidebar-item-count">{cat.count}</span>}
                </div>
              ))}
              <div
                className={`sidebar-item ${currentPage === 'tagwall' || currentPage === 'tagdetail' ? 'active' : ''}`}
                onClick={() => setCurrentPage('tagwall')}
                title={sidebarCollapsed ? '标签' : undefined}
              >
                <span className="sidebar-item-icon">🏷️</span>
                {!sidebarCollapsed && <span className="sidebar-item-label">标签</span>}
              </div>
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">
              <div className="sidebar-item" onClick={handleRandomPlay} title={sidebarCollapsed ? '随机播放' : undefined}>
                <span className="sidebar-item-icon">🎲</span>
                {!sidebarCollapsed && <span className="sidebar-item-label">随机播放</span>}
              </div>
              <div className="sidebar-item" onClick={() => setShowSettings(true)} title={sidebarCollapsed ? '设置' : undefined}>
                <span className="sidebar-item-icon">⚙️</span>
                {!sidebarCollapsed && <span className="sidebar-item-label">设置</span>}
              </div>
            </div>
          </nav>

          {/* 快捷链接 */}
          <div className="sidebar-links">
            {[
              { label: 'FANZA', url: 'https://www.dmm.co.jp/mono/', icon: 'https://www.dmm.co.jp/favicon.ico' },
              { label: 'JavBus', url: 'https://www.javbus.com/', icon: 'https://www.javbus.com/favicon.ico' },
              { label: 'XSList', url: 'https://xslist.org/zh', icon: 'https://xslist.org/favicon.ico' },
              { label: '98堂', url: 'https://dmn12.vip/', icon: 'https://dmn12.vip/favicon.ico' },
            ].map((link) => (
              <div
                key={link.label}
                className="sidebar-item"
                onClick={() => window.api.openExternal(link.url)}
                title={sidebarCollapsed ? link.label : undefined}
              >
                <img
                  className="sidebar-link-icon"
                  src={link.icon}
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {!sidebarCollapsed && <span className="sidebar-item-label">{link.label}</span>}
              </div>
            ))}
          </div>

          <button
            className="sidebar-add-btn"
            onClick={() => setShowAdd(true)}
            title={sidebarCollapsed ? '添加视频' : undefined}
          >
            <span>＋</span>
            {!sidebarCollapsed && <span>添加视频</span>}
          </button>
        </aside>

        {/* 主内容区 */}
        <main className={`main-content ${level >= 2 ? 'immersive-l2' : ''} ${level >= 3 ? 'immersive-l3' : ''}`}>
          {currentPage === 'home' && <HomePage onViewDetail={handleViewDetail} />}
          {currentPage === 'detail' && selectedVideoId && (
            <DetailPage videoId={selectedVideoId} onBack={handleBackToHome} />
          )}
          {currentPage === 'tagwall' && <TagWallPage onSelectTag={handleSelectTag} />}
          {currentPage === 'tagdetail' && selectedTag && (
            <TagDetailPage tag={selectedTag} onBack={handleBackToTagWall} onViewDetail={handleViewDetail} />
          )}
        </main>

        <AddVideoModal open={showAdd} onClose={() => setShowAdd(false)} onRefresh={() => { refreshVideos(); loadCategoryCounts() }} />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </>
  )
}
