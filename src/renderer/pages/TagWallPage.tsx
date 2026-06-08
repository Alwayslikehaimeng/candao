import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import type { TagWithCount } from '../../shared/types'

interface Props {
  onSelectTag: (tagName: string) => void
}

export default function TagWallPage({ onSelectTag }: Props) {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    setLoading(true)
    try {
      const data = await window.api.listTagsWithCount()
      setTags(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tag-wall-page animate-fade-in">
      {/* 顶栏 */}
      <div className="top-bar">
        <div>
          <span className="top-bar-title">标签</span>
          <span className="top-bar-count">{tags.length} 个</span>
        </div>
      </div>

      {/* 标签墙 */}
      <div className="video-grid-wrap">
        <Spin spinning={loading}>
          {tags.length > 0 ? (
            <div className="tag-wall-grid">
              {tags.map((tag, index) => (
                <div
                  key={tag.id}
                  className="tag-capsule"
                  style={{ animation: `slideUp 0.3s ease-out ${index * 0.03}s both` }}
                  onClick={() => onSelectTag(tag.name)}
                >
                  <span className="tag-capsule-name">{tag.name}</span>
                  <span className="tag-capsule-count">{tag.count}</span>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="empty-state">
                <div className="empty-state-icon">🏷️</div>
                <div className="empty-state-title">暂无标签</div>
                <div className="empty-state-desc">添加带标签的视频后，标签会自动出现在这里</div>
              </div>
            )
          )}
        </Spin>
      </div>
    </div>
  )
}
