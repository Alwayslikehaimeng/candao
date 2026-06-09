import { useEffect, useState, useRef } from 'react'
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const suggestions = searchText.trim()
    ? tags.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase())).slice(0, 5)
    : []

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
        <div className="tag-search-wrap" ref={searchRef}>
          <SearchOutlined className="tag-search-icon" />
          <input
            className="tag-search-input"
            placeholder="搜索"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
          />
          {/* 搜索建议 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="tag-search-suggestions">
              {suggestions.map(tag => (
                <div
                  key={tag.id}
                  className="tag-search-suggestion"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSelectTag(tag.name)
                    setSearchText('')
                    setShowSuggestions(false)
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
