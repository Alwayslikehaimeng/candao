import { useState } from 'react'
import { message, Input } from 'antd'
import { SearchOutlined, LinkOutlined, SyncOutlined } from '@ant-design/icons'

interface Props {
  open: boolean
  onClose: () => void
  onRefresh: () => void
}

export default function AddVideoModal({ open, onClose, onRefresh }: Props) {
  const [category, setCategory] = useState<string>('av')
  const [code, setCode] = useState('')
  const [filePath, setFilePath] = useState('')
  const [loading, setLoading] = useState(false)

  // 手动编辑字段
  const [title, setTitle] = useState('')
  const [actors, setActors] = useState('')
  const [tags, setTags] = useState('')

  // 是否跳过自动抓取
  const [skipFetch, setSkipFetch] = useState(false)
  // 备选方案
  const [showFallback, setShowFallback] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [fetchingFallback, setFetchingFallback] = useState(false)
  // 用户自定义抓取网址
  const [sourceUrl, setSourceUrl] = useState('')

  if (!open) return null

  const handleSelectFile = async () => {
    const path = await window.api.openFileDialog()
    if (path) {
      setFilePath(path)
      const fileName = path.split(/[/\\]/).pop() || ''
      const parsed = await window.api.parseCode(fileName)
      if (parsed && !code) {
        setCode(parsed)
      }
    }
  }

  const handleFetchJavbus = async () => {
    if (!code.trim()) return
    setFetchingFallback(true)
    try {
      message.loading({ content: '正在用 JavBus 抓取...', key: 'crawl' })
      const result = await window.api.fetchJavbus(code.trim())
      if (result.success && result.data) {
        const d = result.data
        setTitle(d.title || '')
        setActors(d.actors?.join(', ') || '')
        setTags(d.tags?.join(', ') || '')
        setSkipFetch(true)
        setShowFallback(false)
        message.success({ content: 'JavBus 抓取成功，请继续填写文件并添加', key: 'crawl' })
      } else {
        message.error({ content: result.error || 'JavBus 抓取失败', key: 'crawl' })
      }
    } catch (e: any) {
      message.error({ content: 'JavBus 抓取失败: ' + e.message, key: 'crawl' })
    } finally {
      setFetchingFallback(false)
    }
  }

  const handleFetchFromUrl = async () => {
    if (!customUrl.trim()) return
    setFetchingFallback(true)
    try {
      message.loading({ content: '正在从 URL 抓取...', key: 'crawl' })
      const result = await window.api.fetchFromUrl(customUrl.trim())
      if (result.success && result.data) {
        const d = result.data
        setTitle(d.title || '')
        setActors(d.actors?.join(', ') || '')
        setTags(d.tags?.join(', ') || '')
        setSkipFetch(true)
        setShowFallback(false)
        message.success({ content: 'URL 抓取成功，请继续填写文件并添加', key: 'crawl' })
      } else {
        message.error({ content: result.error || 'URL 抓取失败', key: 'crawl' })
      }
    } catch (e: any) {
      message.error({ content: 'URL 抓取失败: ' + e.message, key: 'crawl' })
    } finally {
      setFetchingFallback(false)
    }
  }

  const handleOk = async () => {
    if (!code.trim()) {
      message.warning('请输入番号')
      return
    }
    if (!filePath.trim()) {
      message.warning('请选择视频文件')
      return
    }

    setLoading(true)
    try {
      // 提取视频基础信息
      let videoInfo: any = {}
      try {
        const probe = await window.api.probeVideo(filePath)
        if (probe.success && probe.data) videoInfo = probe.data
      } catch { /* 忽略 */ }

      // 如果不是"其他"分类且未跳过抓取，尝试爬取
      if (category !== 'other' && !skipFetch) {
        message.loading({ content: '正在抓取信息...', key: 'crawl' })
        let result: any
        if (sourceUrl.trim()) {
          // 用户提供了网址，按网址爬取
          result = await window.api.fetchFromUrl(sourceUrl.trim())
        } else {
          result = category === 'fc2'
            ? await window.api.fetchFc2(code)
            : await window.api.fetchAv(code)
        }

        if (result.success && result.data) {
          const d = result.data
          const video = await window.api.createVideo({
            code, category, file_path: filePath,
            title: d.title || title || code,
            rating: d.rating,
            release_date: d.release_date,
            duration: d.duration || videoInfo.duration,
            resolution: videoInfo.resolution,
            maker: d.maker,
            director: d.director,
            description: d.description,
            fanza_url: d.fanza_url,
            actors: d.actors.length > 0 ? d.actors : splitStr(actors),
            tags: d.tags.length > 0 ? d.tags : splitStr(tags)
          })
          if (d.cover_url) {
            message.loading({ content: '正在下载封面...', key: 'crawl' })
            await window.api.downloadImages(video.id, d.cover_url, d.sample_image_urls)
          }
          message.success({ content: '添加成功', key: 'crawl' })
          resetAndClose()
          return
        } else {
          // 抓取失败，显示备选方案
          message.warning({ content: '自动抓取失败，请选择备选方案', key: 'crawl' })
          setShowFallback(true)
          setSkipFetch(true)
          setLoading(false)
          return
        }
      }

      // 手动模式或其他分类
      await window.api.createVideo({
        code, category, file_path: filePath,
        title: title || code,
        duration: videoInfo.duration,
        resolution: videoInfo.resolution,
        actors: splitStr(actors),
        tags: splitStr(tags)
      })

      message.success('添加成功')
      resetAndClose()
    } catch (e: any) {
      message.error('添加失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const splitStr = (s: string) => s ? s.split(',').map(i => i.trim()).filter(Boolean) : []

  const resetAndClose = () => {
    setCode(''); setFilePath(''); setTitle(''); setActors(''); setTags(''); setSourceUrl('')
    setSkipFetch(false); setLoading(false); setShowFallback(false); setCustomUrl('')
    onRefresh(); onClose()
  }

  const handleClose = () => {
    setCode(''); setFilePath(''); setTitle(''); setActors(''); setTags(''); setSourceUrl('')
    setSkipFetch(false); setLoading(false); setShowFallback(false); setCustomUrl('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">添加视频</div>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* 分类选择 */}
          <div className="form-group">
            <label className="form-label">分类</label>
            <div className="filter-chips" style={{ padding: 0 }}>
              <span className={`filter-chip ${category === 'av' ? 'active' : ''}`} onClick={() => { setCategory('av'); setSkipFetch(false) }}>AV</span>
              <span className={`filter-chip ${category === 'fc2' ? 'active' : ''}`} onClick={() => { setCategory('fc2'); setSkipFetch(false) }}>FC2</span>
              <span className={`filter-chip ${category === 'other' ? 'active' : ''}`} onClick={() => { setCategory('other'); setSkipFetch(false) }}>其他</span>
            </div>
          </div>

          {/* 番号 */}
          <div className="form-group">
            <label className="form-label">番号</label>
            <input
              className="form-input"
              placeholder={category === 'fc2' ? '如 FC2-PPV-1234567' : '如 JUR-258'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {/* 抓取网址（可选） */}
          <div className="form-group">
            <label className="form-label">抓取网址 <span style={{ color: '#888', fontWeight: 400 }}>(可选)</span></label>
            <input
              className="form-input"
              placeholder="粘贴 FANZA / JavBus / DMM 网址，留空则自动抓取"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>

          {/* 视频文件 */}
          <div className="form-group">
            <label className="form-label">视频文件</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="点击右侧按钮选择文件" value={filePath} readOnly style={{ flex: 1 }} />
              <button className="btn-succubus btn-succubus-secondary" onClick={handleSelectFile}>📂 选择</button>
            </div>
          </div>

          {/* 抓取失败备选方案 */}
          {showFallback && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
              background: 'rgba(255,150,50,0.08)', borderRadius: 8, marginTop: 8,
              border: '1px solid rgba(255,150,50,0.2)', flexWrap: 'wrap'
            }}>
              <span style={{ color: '#ff9800', fontSize: 12 }}>试试：</span>
              <button
                className="btn-succubus btn-succubus-secondary"
                onClick={handleFetchJavbus}
                disabled={fetchingFallback}
                style={{ fontSize: 12, padding: '4px 12px' }}
              >
                <SearchOutlined /> JavBus 抓取
              </button>
              <span style={{ color: '#888', fontSize: 11 }}>或</span>
              <Input
                size="small"
                placeholder="粘贴 FANZA / JavBus / DMM 网址"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                onPressEnter={handleFetchFromUrl}
                style={{ flex: 1, minWidth: 200, fontSize: 12 }}
                prefix={<LinkOutlined style={{ color: '#888' }} />}
                suffix={
                  <SyncOutlined
                    onClick={handleFetchFromUrl}
                    spin={fetchingFallback}
                    style={{ cursor: 'pointer', color: fetchingFallback ? '#ccc' : '#1890ff' }}
                  />
                }
              />
            </div>
          )}

          {/* 手动填写区域（抓取失败后显示，或其他分类） */}
          {(skipFetch || category === 'other') && (
            <>
              <div className="succubus-divider" style={{ margin: '16px 0' }}></div>
              <div className="form-group">
                <label className="form-label">标题</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">演员（逗号分隔）</label>
                <input className="form-input" placeholder="演员A, 演员B" value={actors} onChange={(e) => setActors(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">标签（逗号分隔）</label>
                <input className="form-input" placeholder="标签1, 标签2" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-succubus btn-succubus-ghost" onClick={handleClose}>取消</button>
          <button className="btn-succubus btn-succubus-primary" onClick={handleOk} disabled={loading}>
            {loading ? '处理中...' : (skipFetch ? '跳过抓取，直接添加' : '添加')}
          </button>
        </div>
      </div>
    </div>
  )
}
