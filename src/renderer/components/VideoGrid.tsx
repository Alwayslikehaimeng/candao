import VideoCard from './VideoCard'
import type { Video } from '../../shared/types'

interface Props {
  videos: Video[]
  onViewDetail: (video: Video) => void
  onRefresh: () => void
  selectable?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  sortBy?: string
}

// 分组：按系列名聚合，不依赖后端排序顺序
function groupBySeries(videos: Video[]): { series: string; videos: Video[] }[] {
  const map = new Map<string, Video[]>()
  for (const v of videos) {
    const name = v.series?.trim() || ''
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(v)
  }
  // 转成数组，有名字的排在前面，空的排最后
  const named: { series: string; videos: Video[] }[] = []
  const unnamed: { series: string; videos: Video[] }[] = []
  for (const [series, vs] of map) {
    ;(series ? named : unnamed).push({ series, videos: vs })
  }
  return [...named, ...unnamed]
}

export default function VideoGrid({ videos, onViewDetail, onRefresh, selectable, selectedIds, onToggleSelect, sortBy }: Props) {
  // 非系列排序 → 平铺（默认）
  if (sortBy !== 'series') {
    return (
      <div className="video-grid" key="flat">
        {videos.map((video, index) => (
          <div
            key={video.id}
            style={{ animation: `slideUp 0.3s ease-out ${index * 0.03}s both` }}
          >
            <VideoCard
              video={video}
              onViewDetail={onViewDetail}
              onRefresh={onRefresh}
              selectable={selectable}
              selected={selectedIds?.has(video.id)}
              onToggleSelect={onToggleSelect}
            />
          </div>
        ))}
      </div>
    )
  }

  // 系列排序 → 分组展示
  const sections = groupBySeries(videos)
  const hasNamed = sections.some(s => s.series)
  let animIndex = 0

  return (
    <div className="video-grid-grouped" key="grouped">
      {sections.map((section, i) => (
        <div key={section.series || '__unnamed__'} className="series-section">
          {section.series && (
            <div
              className="series-header"
              style={{ animation: `slideUp 0.3s ease-out ${animIndex++ * 0.03}s both` }}
            >
              <span className="series-header-name">{section.series}</span>
              <span className="series-header-count">{section.videos.length}</span>
            </div>
          )}
          {!section.series && hasNamed && <div className="series-divider" />}
          <div className="video-grid">
            {section.videos.map(video => (
              <div
                key={video.id}
                style={{ animation: `slideUp 0.3s ease-out ${animIndex++ * 0.03}s both` }}
              >
                <VideoCard
                  video={video}
                  onViewDetail={onViewDetail}
                  onRefresh={onRefresh}
                  selectable={selectable}
                  selected={selectedIds?.has(video.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
