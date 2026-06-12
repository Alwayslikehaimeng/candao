import { useEffect, useState, useRef } from 'react'
import { message, Rate, Input } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined, SyncOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons'
import StarRating from '../components/StarRating'
import type { Video } from '../../shared/types'

interface Props {
  videoId: number
  onBack: () => void
}

export default function DetailPage({ videoId, onBack }: Props) {
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [editing, setEditing] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [releaseDate, setReleaseDate] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [durationMins, setDurationMins] = useState('')
  const [maker, setMaker] = useState('')
  const [director, setDirector] = useState('')
  const [actors, setActors] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [fanzaUrl, setFanzaUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [series, setSeries] = useState('')
  const [label, setLabel] = useState('')
  const [videoType, setVideoType] = useState('')
  const [productCode, setProductCode] = useState('')
  const [showFallback, setShowFallback] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const thumbBarRef = useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadVideo() }, [videoId])

  const loadVideo = async () => {
    setLoading(true)
    try {
      const v = await window.api.getVideo(videoId)
      setVideo(v)
      setCode(v.code || '')
      setCategory(v.category || '')
      setTitle(v.title || '')
      setRating(v.rating || 0)
      setReleaseDate(v.release_date || '')
      if (v.duration) {
        setDuration(String(v.duration))
        setDurationHours(String(Math.floor(v.duration / 3600)))
        setDurationMins(String(Math.floor((v.duration % 3600) / 60)))
      } else {
        setDuration(''); setDurationHours(''); setDurationMins('')
      }
      setMaker(v.maker || '')
      setDirector(v.director || '')
      setActors(v.actors?.map((a) => a.name).join(', ') || '')
      setTags(v.tags?.map((t) => t.name).join(', ') || '')
      setDescription(v.description || '')
      setFanzaUrl(v.fanza_url || '')
      setSeries(v.series || '')
      setLabel(v.label || '')
      setVideoType(v.video_type || '')
      setProductCode(v.product_code || '')
      if (v.cover_path) {
        setPreviewImg(`file://${v.cover_path}`)
      } else if (v.sample_images && v.sample_images.length > 0) {
        setPreviewImg(`file://${v.sample_images[0].local_path}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateDurationFromHM = (h: string, m: string) => {
    setDuration(String((parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.api.updateVideo(videoId, {
        code, category, title, rating,
        release_date: releaseDate,
        duration: duration ? parseInt(duration) : undefined,
        maker, director, description, fanza_url: fanzaUrl,
        series, label, video_type: videoType, product_code: productCode,
        actors: actors.split(',').map((s) => s.trim()).filter(Boolean),
        tags: tags.split(',').map((s) => s.trim()).filter(Boolean)
      })
      message.success('保存成功')
      setEditing(false)
      await loadVideo()
    } catch { message.error('保存失败') }
    finally { setSaving(false) }
  }

  const applyResult = async (result: { success: boolean; data?: any; error?: string }) => {
    if (result.success && result.data) {
      const d = result.data
      await window.api.updateVideo(videoId, {
        title: d.title || video?.code, rating: d.rating || undefined,
        release_date: d.release_date || undefined, duration: d.duration || undefined,
        maker: d.maker || undefined, director: d.director || undefined,
        description: d.description || undefined, fanza_url: d.fanza_url || undefined,
        series: d.series || undefined, label: d.label || undefined,
        video_type: d.video_type || undefined, product_code: d.product_code || undefined,
        actors: d.actors, tags: d.tags, source: d.source || undefined
      })
      if (d.javbus_url) {
        await window.api.updateVideo(videoId, { fanza_url: d.javbus_url })
      }
      if (d.cover_url) await window.api.downloadImages(videoId, d.cover_url, d.sample_image_urls)
      await loadVideo()
      setShowFallback(false)
      message.success(`抓取成功（${d.source || '未知'}）`)
      return true
    } else {
      message.error(result.error || '抓取失败')
      return false
    }
  }

  const handleFetch = async () => {
    if (!video) return
    setFetching(true)
    setShowFallback(false)
    try {
      const result = video.category === 'fc2'
        ? await window.api.fetchFc2(video.code)
        : await window.api.fetchAv(video.code)
      if (!await applyResult(result)) {
        setShowFallback(true)
      }
    } catch (e: any) { message.error('抓取失败: ' + e.message); setShowFallback(true) }
    finally { setFetching(false) }
  }

  const handleFetchJavbus = async () => {
    if (!video) return
    setFetching(true)
    try {
      const result = await window.api.fetchJavbus(video.code)
      await applyResult(result)
    } catch (e: any) { message.error('JavBus 抓取失败: ' + e.message) }
    finally { setFetching(false) }
  }

  const handleFetchFromUrl = async () => {
    if (!video || !customUrl.trim()) return
    setFetching(true)
    try {
      const result = await window.api.fetchFromUrl(customUrl.trim())
      await applyResult(result)
    } catch (e: any) { message.error('URL 抓取失败: ' + e.message) }
    finally { setFetching(false) }
  }

  // 封面滚轮翻页
  const handleCoverWheel = (e: React.WheelEvent) => {
    if (allImages.length <= 1) return
    e.preventDefault()
    const currentIndex = allImages.findIndex(i => i.src === previewImg)
    const next = e.deltaY > 0
      ? Math.min(currentIndex + 1, allImages.length - 1)
      : Math.max(currentIndex - 1, 0)
    if (next !== currentIndex) {
      setPreviewImg(allImages[next].src)
      const thumbEl = thumbBarRef.current?.children[next] as HTMLElement
      thumbEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }

  // 删除示例图
  const handleDeleteSampleImage = async (src: string) => {
    if (!video) return
    const localPath = src.replace('file://', '')
    if (!confirm('确定删除这张图片？')) return
    try {
      await window.api.deleteSampleImage(videoId, localPath)
      if (previewImg === src) setPreviewImg(null)
      await loadVideo()
      message.success('已删除')
    } catch (e: any) {
      message.error('删除失败: ' + e.message)
    }
  }

  // 上传预览图
  const handleUploadImage = async () => {
    const filePath = await window.api.openFileDialog(true)
    if (!filePath || !video) return
    setUploading(true)
    try {
      const result = await window.api.uploadImage(videoId, filePath)
      if (result.success) {
        await loadVideo()
        message.success('上传成功')
      } else {
        message.error(result.error || '上传失败')
      }
    } catch (e: any) {
      message.error('上传失败: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定删除此记录？')) return
    await window.api.deleteVideo(videoId)
    message.success('已删除')
    onBack()
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="skeleton" style={{ height: 36, width: 120, marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 32 }}>
          <div className="skeleton" style={{ width: 480, height: 270, borderRadius: 16 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 36, width: '100%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 36, width: '100%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 36, width: '100%', marginBottom: 12 }} />
          </div>
        </div>
      </div>
    )
  }

  if (!video) return <div className="empty-state">视频不存在</div>

  const categoryColors: Record<string, string> = { av: '#FF8FB1', fc2: '#9B59B6', other: '#4ECDC4' }

  const allImages = [
    ...(video.cover_path ? [{ src: `file://${video.cover_path}`, type: 'cover' as const }] : []),
    ...(video.sample_images?.map(img => ({ src: `file://${img.local_path}`, type: 'sample' as const })) || [])
  ]

  return (
    <div className="detail-page animate-fade-in">
      {/* 顶部栏 */}
      <div className="detail-topbar">
        <button className="detail-back-btn" onClick={onBack}>
          <ArrowLeftOutlined /> 返回
        </button>
        <span style={{
          padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: categoryColors[video.category] + '20', color: categoryColors[video.category]
        }}>
          {video.category.toUpperCase()}
        </span>
        <span className="detail-topbar-code">{video.code}</span>
        <div className="detail-topbar-spacer" />
        <button className="detail-action-btn primary" onClick={() => window.api.play(video.file_path)}>
          <PlayCircleOutlined /> 播放
        </button>
        <button className="detail-action-btn" onClick={handleFetch} disabled={fetching}>
          <SyncOutlined spin={fetching} /> {fetching ? '抓取中...' : '抓取'}
        </button>
        {fanzaUrl && (
          <button className="detail-action-btn" onClick={() => window.api.openExternal(fanzaUrl!)}>
            <GlobalOutlined /> {video.source === 'JavBus' ? 'JavBus' : video.source === 'Caribbeancom' ? 'Caribbean' : 'FANZA'}
          </button>
        )}
        <button className="detail-action-btn" onClick={() => setEditing(!editing)}>
          {editing ? '取消' : '✏️ 编辑'}
        </button>
        <button className="detail-action-btn danger" onClick={handleDelete}>
          <DeleteOutlined />
        </button>
      </div>

      {/* 抓取失败时的备选方案 */}
      {showFallback && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', padding: '12px 24px',
          background: 'rgba(255,150,50,0.08)', borderRadius: 12, margin: '0 24px 12px',
          border: '1px solid rgba(255,150,50,0.2)', flexWrap: 'wrap'
        }}>
          <span style={{ color: '#ff9800', fontSize: 13 }}>自动抓取失败，试试：</span>
          <button className="detail-action-btn" onClick={handleFetchJavbus} disabled={fetching} style={{ fontSize: 13 }}>
            <SearchOutlined /> JavBus 抓取
          </button>
          <span style={{ color: '#888', fontSize: 12 }}>或</span>
          <Input
            size="small"
            placeholder="粘贴 FANZA / JavBus / DMM 网址"
            value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            onPressEnter={handleFetchFromUrl}
            style={{ width: 320, fontSize: 13 }}
            prefix={<LinkOutlined style={{ color: '#888' }} />}
            suffix={
              <SyncOutlined
                onClick={handleFetchFromUrl}
                spin={fetching}
                style={{ cursor: 'pointer', color: fetching ? '#ccc' : '#1890ff' }}
              />
            }
          />
        </div>
      )}

      {/* 主体 */}
      <div className="detail-body">
        {/* 左侧图片 */}
        <div className="detail-left">
          <div className="detail-cover" onWheel={handleCoverWheel}>
            {previewImg ? (
              <img src={previewImg} alt={video.title || video.code} />
            ) : (
              <div className="detail-cover-empty">🎬</div>
            )}
          </div>
          <div
            className="detail-thumbs"
            ref={thumbBarRef}
            onWheel={(e) => {
              const el = e.currentTarget
              el.scrollLeft += e.deltaY > 0 ? 100 : -100
            }}
          >
            {allImages.map((img, i) => (
              <div
                key={i}
                className={`detail-thumb ${previewImg === img.src ? 'active' : ''}`}
                onClick={() => setPreviewImg(img.src)}
              >
                <img src={img.src} alt="" />
                {editing && img.type === 'sample' && (
                  <div className="detail-thumb-delete" onClick={(e) => { e.stopPropagation(); handleDeleteSampleImage(img.src) }}>✕</div>
                )}
              </div>
            ))}
            {editing && (
              <div
                className="detail-thumb detail-thumb-upload"
                onClick={handleUploadImage}
                title="上传预览图"
              >
                {uploading ? '⏳' : '＋'}
              </div>
            )}
          </div>
          {/* 完整标题在预览图下方 */}
          <div className="detail-title-below">
            {title || video.code}
          </div>

          {/* 文件信息 */}
          {!editing && (
            <div className="detail-file-info">
              {[
                { label: '格式', value: video.file_path?.split('.').pop()?.toUpperCase() || '—' },
                { label: '分辨率', value: video.resolution || '—' },
                { label: '时长', value: duration ? `${Math.floor(parseInt(duration) / 3600).toString().padStart(2, '0')}:${Math.floor((parseInt(duration) % 3600) / 60).toString().padStart(2, '0')}:${(parseInt(duration) % 60).toString().padStart(2, '0')}` : '—' },
                { label: '导入时间', value: video.created_at?.split('T')[0] || video.created_at?.split(' ')[0] || '—' },
              ].map((item, i) => (
                <div key={i} className="detail-file-info-row">
                  <span className="detail-file-info-label">{item.label}</span>
                  <span className="detail-file-info-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧信息 */}
        <div className="detail-right">
          {/* 标题只读显示 */}
          <div style={{
            fontSize: 18, fontWeight: 600, color: 'var(--candao-text)',
            marginBottom: 16, lineHeight: 1.5
          }}>
            {editing ? (
              <input
                className="detail-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入标题..."
              />
            ) : (
              title || video.code
            )}
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <span className="detail-meta-label">评分</span>
              {editing ? (
                <Rate allowHalf allowClear value={rating} onChange={setRating} />
              ) : (
                <StarRating score={rating} size="md" />
              )}
            </div>


            <div className="detail-meta-item">
              <span className="detail-meta-label">发行日期</span>
              {editing ? (
                <input className="detail-meta-input" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} placeholder="YYYY-MM-DD" />
              ) : (
                <span style={{ fontSize: 14 }}>{releaseDate || '-'}</span>
              )}
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">片长</span>
              {editing ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input className="detail-meta-input" type="number" style={{ width: 70 }} value={durationHours}
                    onChange={(e) => { setDurationHours(e.target.value); updateDurationFromHM(e.target.value, durationMins) }} />
                  <span style={{ color: '#999', fontSize: 12 }}>时</span>
                  <input className="detail-meta-input" type="number" style={{ width: 70 }} value={durationMins}
                    onChange={(e) => { setDurationMins(e.target.value); updateDurationFromHM(durationHours, e.target.value) }} />
                  <span style={{ color: '#999', fontSize: 12 }}>分</span>
                </div>
              ) : (
                <span style={{ fontSize: 14 }}>{duration ? `${Math.floor(parseInt(duration) / 3600)}h${Math.floor((parseInt(duration) % 3600) / 60)}m` : '-'}</span>
              )}
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">制造商</span>
              {editing ? (
                <input className="detail-meta-input" value={maker} onChange={(e) => setMaker(e.target.value)} />
              ) : (
                <span style={{ fontSize: 14 }}>{maker || '-'}</span>
              )}
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">导演</span>
              {editing ? (
                <input className="detail-meta-input" value={director} onChange={(e) => setDirector(e.target.value)} />
              ) : (
                <span style={{ fontSize: 14 }}>{director || '-'}</span>
              )}
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">系列</span>
              {editing ? (
                <input className="detail-meta-input" value={series} onChange={(e) => setSeries(e.target.value)} />
              ) : (
                <span style={{ fontSize: 14 }}>{series || '-'}</span>
              )}
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">唱片公司</span>
              {editing ? (
                <input className="detail-meta-input" value={label} onChange={(e) => setLabel(e.target.value)} />
              ) : (
                <span style={{ fontSize: 14 }}>{label || '-'}</span>
              )}
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">类型</span>
              {editing ? (
                <input className="detail-meta-input" value={videoType} onChange={(e) => setVideoType(e.target.value)} />
              ) : (
                <span style={{ fontSize: 14 }}>{videoType || '-'}</span>
              )}
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">产品编号</span>
              {editing ? (
                <input className="detail-meta-input" value={productCode} onChange={(e) => setProductCode(e.target.value)} />
              ) : (
                <span style={{ fontSize: 14 }}>{productCode || '-'}</span>
              )}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-label">演员</div>
            {editing ? (
              <input className="detail-section-input" value={actors} onChange={(e) => setActors(e.target.value)} placeholder="逗号分隔" />
            ) : (
              <span style={{ fontSize: 14 }}>{actors || '-'}</span>
            )}
          </div>

          <div className="detail-section">
            <div className="detail-section-label">标签</div>
            {editing ? (
              <input className="detail-section-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="逗号分隔" />
            ) : (
              <span style={{ fontSize: 14 }}>{tags || '-'}</span>
            )}
          </div>

          <div className="detail-section" style={{ flex: 1 }}>
            <div className="detail-section-label">简介</div>
            {editing ? (
              <textarea className="detail-section-textarea" style={{ minHeight: 120 }} value={description} onChange={(e) => setDescription(e.target.value)} />
            ) : (
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{description || '-'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 底部保存栏 - 仅编辑模式显示 */}
      {editing && (
        <div className="detail-save-bar">
          <button className="detail-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '💾 保存修改'}
          </button>
        </div>
      )}
    </div>
  )
}
