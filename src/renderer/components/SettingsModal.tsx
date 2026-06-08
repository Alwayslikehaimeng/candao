import { useEffect, useState } from 'react'
import { message } from 'antd'
import { useThemeStore } from '../stores/themeStore'
import { useBgStore, type WallpaperItem } from '../stores/bgStore'
import { useImmersiveStore } from '../stores/immersiveStore'
import type { ProxyConfig } from '../../shared/types'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: Props) {
  const { mode: themeMode, setMode: setThemeMode, darkStart, darkEnd, setDarkTime } = useThemeStore()
  const bg = useBgStore()
  const { enabled: immersiveEnabled, setEnabled: setImmersiveEnabled } = useImmersiveStore()
  const [config, setConfig] = useState<ProxyConfig>({ enabled: false, protocol: 'http', host: '', port: 0 })
  const [apiKey, setApiKey] = useState('')
  const [apiBase, setApiBase] = useState('https://api.openai.com/v1')
  const [modelName, setModelName] = useState('gpt-4o-mini')
  const [msTranslateKey, setMsTranslateKey] = useState('')
  const [msTranslateRegion, setMsTranslateRegion] = useState('global')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      window.api.getProxy().then(setConfig)
      window.api.getApiKey().then(setApiKey)
      window.api.getApiBase().then(setApiBase)
      window.api.getModel().then(setModelName)
      window.api.getSetting('ms_translate_key').then(v => setMsTranslateKey(v || ''))
      window.api.getSetting('ms_translate_region').then(v => setMsTranslateRegion(v || 'global'))
    }
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.api.setProxy(config)
      await window.api.setApiKey(apiKey)
      await window.api.setApiBase(apiBase)
      await window.api.setModel(modelName)
      await window.api.setSetting('ms_translate_key', msTranslateKey)
      await window.api.setSetting('ms_translate_region', msTranslateRegion)
      message.success('设置已保存')
      onClose()
    } catch { message.error('保存失败') }
    finally { setSaving(false) }
  }

  const handleAddWallpaper = async (type: 'image' | 'video') => {
    const path = await window.api.openFileDialog(type === 'image')
    if (!path) return
    const name = path.split(/[/\\]/).pop() || path
    if (type === 'image') bg.addImage(path, name)
    else bg.addVideo(path, name)
    message.success('已添加')
  }

  const currentList: WallpaperItem[] = bg.mode === 'image' ? bg.imageWallpapers : bg.mode === 'video' ? bg.videoWallpapers : []
  const currentId = bg.mode === 'image' ? bg.currentImageId : bg.mode === 'video' ? bg.currentVideoId : null
  const setCurrent = bg.mode === 'image' ? bg.setCurrentImage : bg.setCurrentVideo
  const removeItem = bg.mode === 'image' ? bg.removeImage : bg.removeVideo

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-container" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">设置</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          {/* === 壁纸库 === */}
          <div className="settings-section-title">壁纸库</div>

          {/* 模式选择 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {([
              { key: 'none' as const, label: '无背景' },
              { key: 'image' as const, label: '图片壁纸' },
              { key: 'video' as const, label: '视频壁纸' },
            ]).map(m => (
              <div key={m.key} onClick={() => bg.setMode(m.key)}
                className={`settings-card ${bg.mode === m.key ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: bg.mode === m.key ? 'var(--candao-pink)' : 'var(--candao-text)' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* 壁纸列表（仅非 none 模式显示） */}
          {bg.mode !== 'none' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button className="btn-succubus btn-succubus-secondary" onClick={() => handleAddWallpaper(bg.mode)}>
                  + 添加{bg.mode === 'image' ? '图片' : '视频'}
                </button>
                {currentList.length > 1 && (
                  <>
                    <button className="btn-succubus btn-succubus-ghost" onClick={bg.prevWallpaper}>◀ 上一张</button>
                    <button className="btn-succubus btn-succubus-ghost" onClick={bg.nextWallpaper}>下一张 ▶</button>
                  </>
                )}
              </div>

              {currentList.length > 0 ? (
                <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                  {currentList.map((wp) => (
                    <div
                      key={wp.id}
                      onClick={() => setCurrent(wp.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', marginBottom: 4, borderRadius: 8,
                        cursor: 'pointer',
                        background: currentId === wp.id ? 'rgba(255,143,177,0.1)' : 'transparent',
                        border: `1px solid ${currentId === wp.id ? 'var(--candao-pink)' : 'rgba(255,255,255,0.05)'}`,
                      }}
                    >
                      <div style={{ width: 48, height: 32, borderRadius: 4, overflow: 'hidden', background: 'var(--candao-bg)', flexShrink: 0 }}>
                        {bg.mode === 'image' ? (
                          <img src={`file://${wp.path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎬</div>
                        )}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--candao-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {wp.name}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(wp.id) }}
                        style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--candao-text-muted)', cursor: 'pointer', fontSize: 14 }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--candao-text-muted)', fontSize: 13, marginBottom: 16 }}>
                  暂无{bg.mode === 'image' ? '图片' : '视频'}壁纸
                </div>
              )}

              {/* 自动轮播 */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
                  <input type="checkbox" checked={bg.rotationEnabled}
                    onChange={(e) => bg.setRotationEnabled(e.target.checked)}
                    style={{ accentColor: 'var(--candao-pink)' }} />
                  <span style={{ color: 'var(--candao-text)', fontSize: 13 }}>自动轮播</span>
                </label>
                {bg.rotationEnabled && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--candao-text-muted)' }}>间隔</span>
                    <input type="number" className="form-input" style={{ width: 80, height: 30, fontSize: 12 }}
                      value={bg.rotationInterval} onChange={(e) => bg.setRotationInterval(parseInt(e.target.value) || 300)} />
                    <span style={{ fontSize: 12, color: 'var(--candao-text-muted)' }}>秒</span>
                  </div>
                )}
              </div>

              {/* 效果调节 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="form-label" style={{ margin: 0 }}>模糊</span>
                    <span style={{ fontSize: 12, color: 'var(--candao-text-muted)' }}>{bg.blur}px</span>
                  </div>
                  <input type="range" min="0" max="50" value={bg.blur} onChange={(e) => bg.setBlur(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--candao-pink)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="form-label" style={{ margin: 0 }}>亮度</span>
                    <span style={{ fontSize: 12, color: 'var(--candao-text-muted)' }}>{bg.brightness}%</span>
                  </div>
                  <input type="range" min="10" max="100" value={bg.brightness} onChange={(e) => bg.setBrightness(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--candao-pink)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="form-label" style={{ margin: 0 }}>饱和度</span>
                    <span style={{ fontSize: 12, color: 'var(--candao-text-muted)' }}>{bg.saturation}%</span>
                  </div>
                  <input type="range" min="50" max="150" value={bg.saturation} onChange={(e) => bg.setSaturation(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--candao-pink)' }} />
                </div>
              </div>
            </>
          )}

          <div className="settings-divider" />

          {/* === 沉浸模式 === */}
          <div className="settings-section-title">沉浸模式</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={immersiveEnabled}
              onChange={(e) => setImmersiveEnabled(e.target.checked)}
              style={{ accentColor: 'var(--candao-pink)', width: 16, height: 16 }} />
            <div>
              <span style={{ color: 'var(--candao-text)', fontSize: 13 }}>启用沉浸模式</span>
              <div style={{ fontSize: 11, color: 'var(--candao-text-muted)', marginTop: 2 }}>无操作时自动收缩侧边栏</div>
            </div>
          </label>

          <div className="settings-divider" />

          {/* === 主题 === */}
          <div className="settings-section-title">外观主题</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {(['light', 'dark', 'auto'] as const).map(m => (
              <div key={m} onClick={() => setThemeMode(m)}
                className={`settings-card ${themeMode === m ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: themeMode === m ? 'var(--candao-pink)' : 'var(--candao-text)' }}>
                  {m === 'light' ? '浅色' : m === 'dark' ? '深色' : '定时'}
                </div>
              </div>
            ))}
          </div>
          {themeMode === 'auto' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--candao-text-muted)' }}>深色时间：</span>
              <select className="form-input" style={{ width: 70, height: 30, fontSize: 12 }} value={darkStart}
                onChange={(e) => setDarkTime(parseInt(e.target.value), darkEnd)}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
              </select>
              <span style={{ color: 'var(--candao-text-muted)', fontSize: 12 }}>至</span>
              <select className="form-input" style={{ width: 70, height: 30, fontSize: 12 }} value={darkEnd}
                onChange={(e) => setDarkTime(darkStart, parseInt(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
              </select>
            </div>
          )}

          <div className="settings-divider" />

          {/* === AI 翻译 === */}
          <div className="settings-section-title">AI 翻译</div>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input className="form-input" type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">API 地址</label>
              <input className="form-input" placeholder="https://api.openai.com/v1" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">模型</label>
              <input className="form-input" placeholder="gpt-4o-mini" value={modelName} onChange={(e) => setModelName(e.target.value)} />
            </div>
          </div>

          {/* === 微软翻译 === */}
          <div className="settings-section-title">微软翻译（免费备选）</div>
          <p style={{ color: 'var(--candao-text-muted)', fontSize: 12, marginBottom: 12 }}>
            当 AI 翻译不可用时自动使用。免费额度每月 200 万字符。
            <a href="https://learn.microsoft.com/azure/ai-services/translator/create-translator-resource" target="_blank" rel="noreferrer" style={{ color: 'var(--candao-pink)', marginLeft: 4 }}>获取 Key</a>
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input className="form-input" type="password" placeholder="Azure Translator Key" value={msTranslateKey} onChange={(e) => setMsTranslateKey(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">区域</label>
              <input className="form-input" placeholder="global" value={msTranslateRegion} onChange={(e) => setMsTranslateRegion(e.target.value)} />
            </div>
          </div>

          <div className="settings-divider" />

          {/* === 代理 === */}
          <div className="settings-section-title">代理设置</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
            <input type="checkbox" checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              style={{ accentColor: 'var(--candao-pink)', width: 16, height: 16 }} />
            <span style={{ color: 'var(--candao-text)', fontSize: 13 }}>启用代理</span>
          </label>
          {config.enabled && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">协议</label>
                <select className="form-input" value={config.protocol} onChange={(e) => setConfig({ ...config, protocol: e.target.value as 'http' | 'socks5' })}>
                  <option value="http">HTTP</option><option value="socks5">SOCKS5</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">主机</label>
                <input className="form-input" placeholder="127.0.0.1" value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">端口</label>
                <input className="form-input" type="number" placeholder="7897" value={config.port || ''} onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-succubus btn-succubus-ghost" onClick={onClose}>取消</button>
          <button className="btn-succubus btn-succubus-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
