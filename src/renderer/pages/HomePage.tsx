import { useEffect, useState } from 'react'
import { Spin, message, Modal } from 'antd'
import { CheckSquareOutlined, DeleteOutlined } from '@ant-design/icons'
import { useVideoStore } from '../stores/videoStore'
import VideoGrid from '../components/VideoGrid'
import type { Video } from '../../shared/types'

interface Props {
  onViewDetail: (video: Video) => void
}

export default function HomePage({ onViewDetail }: Props) {
  const { videos, loading, filters, setFilters, refreshVideos } = useVideoStore()
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    refreshVideos()
  }, [filters])

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(videos.map(v => v.id)))
    }
  }

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) {
      message.warning('请先选择要删除的视频')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIds.size} 个视频吗？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        for (const id of selectedIds) {
          await window.api.deleteVideo(id)
        }
        message.success(`已删除 ${selectedIds.size} 个视频`)
        setSelectedIds(new Set())
        setBatchMode(false)
        refreshVideos()
      }
    })
  }

  return (
    <>
      {/* 顶部栏 */}
      <div className="top-bar">
        <div>
          <span className="top-bar-title">全部视频</span>
          <span className="top-bar-count">{videos.length} 部</span>
        </div>
        <div className="top-bar-spacer" />
        <button
          className={`top-bar-btn ${batchMode ? 'active' : ''}`}
          onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()) }}
          title="批量管理"
        >
          <CheckSquareOutlined />
        </button>
      </div>

      {/* 批量操作栏 */}
      {batchMode && (
        <div className="batch-bar">
          <span className="batch-bar-info">已选 {selectedIds.size} / {videos.length}</span>
          <button className="batch-bar-btn" onClick={handleSelectAll}>
            {selectedIds.size === videos.length ? '取消全选' : '全选'}
          </button>
          <button className="batch-bar-btn danger" onClick={handleBatchDelete} disabled={selectedIds.size === 0}>
            <DeleteOutlined /> 删除选中
          </button>
          <div style={{ flex: 1 }} />
          <button className="batch-bar-btn" onClick={() => { setBatchMode(false); setSelectedIds(new Set()) }}>
            取消
          </button>
        </div>
      )}

      {/* 视频网格 */}
      <div className="video-grid-wrap">
        <Spin spinning={loading}>
          {videos.length > 0 ? (
            <VideoGrid
              videos={videos}
              onViewDetail={onViewDetail}
              onRefresh={refreshVideos}
              selectable={batchMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          ) : (
            !loading && (
              <div className="empty-state">
                <div className="empty-state-icon">🎬</div>
                <div className="empty-state-title">暂无视频</div>
                <div className="empty-state-desc">点击左侧"添加视频"开始构建你的媒体库</div>
              </div>
            )
          )}
        </Spin>
      </div>
    </>
  )
}
