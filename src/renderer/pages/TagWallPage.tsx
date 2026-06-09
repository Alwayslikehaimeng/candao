import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { TagWithCount } from '../../shared/types'

interface Props {
  onSelectTag: (tagName: string) => void
}

export default function TagWallPage({ onSelectTag }: Props) {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<TagWithCount[]>([])

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    if (searchText.trim()) {
      const filtered = tags
        .filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()))
        .slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [searchText, tags])

  const loadTags = async () => {
    setLoading(true)
    try {
      const data = await window.api.listTagsWithCount()
      setTags(data)
    } finally {
      setLoading(false)
    }
  }

  const filteredTags = searchText.trim()
    ? tags.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()))
    : tags

  return (
    <div className="tag-wall-page animate-fade-in">
      {/* 顶栏 */}
      <div className="top-bar">
        <div>
          <span className="top-bar-title">标签</span>
          <span className="top-bar-count">{tags.length} 个</span>
        </div>
        <div className="top-bar-spacer" />
        <div className="top-bar-search-wrap">
          <SearchOutlined className="top-bar-search-icon" />
          <input
            className="top-bar-search"
            placeholder="搜索标签..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div className="tag-search-suggestions">
              {suggestions.map(tag => (
                <div
                  key={tag.id}
                  className="tag-search-suggestion"
                  onClick={() => {
                    onSelectTag(tag.name)
                    setSearchText('')
                  }}
                >
                  <span>{tag.name}</span>
                  <span className="tag-search-suggestion-count">{tag.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 标签墙 */}
      <div className="video-grid-wrap">
        <Spin spinning={loading}>
          {filteredTags.length > 0 ? (
            <div className="tag-wall-grid">
              {filteredTags.map((tag, index) => (
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
                <div className="empty-state-title">{searchText ? '未找到匹配标签' : '暂无标签'}</div>
                <div className="empty-state-desc">{searchText ? '尝试其他关键词' : '添加带标签的视频后，标签会自动出现在这里'}</div>
              </div>
            )
          )}
        </Spin>
      </div>
    </div>
  )
}
