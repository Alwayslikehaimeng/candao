import { useEffect, useState } from 'react'
import { Spin, Empty } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import VideoGrid from '../components/VideoGrid'
import type { Video, VideoCategory } from '../../shared/types'

interface Props {
  tag: string
  onBack: () => void
  onViewDetail: (video: Video) => void
}

const categoryOptions: { key: VideoCategory | undefined; label: string }[] = [
  { key: undefined, label: '全部' },
  { key: 'av', label: 'AV' },
  { key: 'fc2', label: 'FC2' },
  { key: 'other', label: '其他' },
]

export default function TagDetailPage({ tag, onBack, onViewDetail }: Props) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<VideoCategory | undefined>(undefined)

  useEffect(() => {
    loadVideos()
  }, [tag, category])

  const loadVideos = async () => {
    setLoading(true)
    try {
      const filters: any = { tag }
      if (category) filters.category = category
      const data = await window.api.listVideos(filters)
      setVideos(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tag-detail-page animate-fade-in">
      {/* 顶栏 */}
      <div className="top-bar">
        <button className="detail-back-btn" onClick={onBack}>
          <ArrowLeftOutlined /> 返回
        </button>
        <span className="top-bar-title">{tag}</span>
        <span className="top-bar-count">{videos.length} 部</span>
      </div>

      {/* 分类筛选 */}
      <div className="tag-detail-categories">
        {categoryOptions.map((opt) => (
          <button
            key={opt.label}
            className={`tag-detail-cat ${category === opt.key ? 'active' : ''}`}
            onClick={() => setCategory(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 视频网格 */}
      <div className="video-grid-wrap">
        <Spin spinning={loading}>
          {videos.length > 0 ? (
            <VideoGrid
              videos={videos}
              onViewDetail={onViewDetail}
              onRefresh={loadVideos}
            />
          ) : (
            !loading && (
              <div className="empty-state">
                <div className="empty-state-icon">🎬</div>
                <div className="empty-state-title">该标签下暂无视频</div>
              </div>
            )
          )}
        </Spin>
      </div>
    </div>
  )
}
