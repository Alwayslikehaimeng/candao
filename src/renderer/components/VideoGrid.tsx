import VideoCard from './VideoCard'
import type { Video } from '../../shared/types'

interface Props {
  videos: Video[]
  onViewDetail: (video: Video) => void
  onRefresh: () => void
  selectable?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
}

export default function VideoGrid({ videos, onViewDetail, onRefresh, selectable, selectedIds, onToggleSelect }: Props) {
  return (
    <div className="video-grid">
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
