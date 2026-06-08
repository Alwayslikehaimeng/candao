import { useRef } from 'react'
import { Dropdown, message } from 'antd'
import { PlayCircleOutlined, MoreOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import StarRating from './StarRating'
import type { Video } from '../../shared/types'

interface Props {
  video: Video
  onViewDetail: (video: Video) => void
  onRefresh: () => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (id: number) => void
}

export default function VideoCard({ video, onViewDetail, onRefresh, selectable, selected, onToggleSelect }: Props) {
  const clickTimer = useRef<number | null>(null)

  const handleClick = () => {
    if (selectable && onToggleSelect) {
      onToggleSelect(video.id)
      return
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    clickTimer.current = window.setTimeout(() => {
      onViewDetail(video)
    }, 250)
  }

  const handleDoubleClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    window.api.play(video.file_path)
  }

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    await window.api.deleteVideo(video.id)
    message.success('已删除')
    onRefresh()
  }

  const categoryLabels: Record<string, string> = { av: 'AV', fc2: 'FC2', other: '其他' }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h${m}m` : `${m}m`
  }

  return (
    <div
      className={`video-card ${selected ? 'video-card-selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* 选择框 */}
      {selectable && (
        <div className="video-card-checkbox" onClick={(e) => { e.stopPropagation(); onToggleSelect?.(video.id) }}>
          <input type="checkbox" checked={selected} readOnly />
        </div>
      )}

      {/* 海报 */}
      <div className="video-card-poster">
        {video.cover_path ? (
          <img src={`file://${video.cover_path}`} alt={video.title || video.code} loading="lazy" />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #F0F0F2, #E8E8EA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: 48, opacity: 0.2 }}>🎬</span>
          </div>
        )}

        <div className="video-card-badge">{categoryLabels[video.category]}</div>

        <div className="video-card-poster-overlay">
          <button
            className="video-card-play-btn"
            onClick={(e) => { e.stopPropagation(); window.api.play(video.file_path) }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 信息 */}
      <div className="video-card-info">
        <div className="video-card-title">{video.title || video.code}</div>
        <div className="video-card-code">{video.code}</div>
        <div className="video-card-meta">
          <StarRating score={video.rating} size="sm" />
          {video.duration && (
            <span className="video-card-meta-item">
              <span>⏱</span>
              <span>{formatDuration(video.duration)}</span>
            </span>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {!selectable && (
        <Dropdown
          menu={{
            items: [
              { key: 'play', label: '播放', icon: <PlayCircleOutlined /> },
              { key: 'edit', label: '编辑', icon: <EditOutlined /> },
              { type: 'divider' },
              { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true }
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation()
              if (key === 'play') window.api.play(video.file_path)
              if (key === 'edit') onViewDetail(video)
              if (key === 'delete') handleDelete()
            }
          }}
          trigger={['contextMenu']}
        >
          <MoreOutlined
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 8, right: 8,
              color: 'rgba(255,255,255,0.7)', fontSize: 16,
              cursor: 'pointer', zIndex: 10, opacity: 0,
              transition: 'opacity 0.2s'
            }}
            className="video-card-more"
          />
        </Dropdown>
      )}
    </div>
  )
}
