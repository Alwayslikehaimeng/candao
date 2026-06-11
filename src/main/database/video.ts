import { getDb, saveDatabase, getCoversDir } from './schema'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { Video, VideoFilters, Actor, Tag, TagWithCount, SampleImage } from '../../shared/types'

// 辅助函数：将查询结果转为对象数组
function queryAll(sql: string, params: any[] = []): any[] {
  const db = getDb()
  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params)
  return results.length > 0 ? results[0] : null
}

function run(sql: string, params: any[] = []): void {
  const db = getDb()
  db.run(sql, params)
}

function getLastInsertRowId(): number {
  const result = queryOne('SELECT last_insert_rowid() as id')
  return result ? result.id : 0
}

export function listVideos(filters: VideoFilters = {}): Video[] {
  let sql = `
    SELECT DISTINCT v.* FROM videos v
    LEFT JOIN video_actors va ON v.id = va.video_id
    LEFT JOIN actors a ON va.actor_id = a.id
    LEFT JOIN video_tags vt ON v.id = vt.video_id
    LEFT JOIN tags t ON vt.tag_id = t.id
  `
  const conditions: string[] = []
  const params: any[] = []

  if (filters.keyword) {
    conditions.push(`(v.code LIKE ? OR v.title LIKE ? OR a.name LIKE ? OR t.name LIKE ?)`)
    const kw = `%${filters.keyword}%`
    params.push(kw, kw, kw, kw)
  }
  if (filters.category) {
    conditions.push(`v.category = ?`)
    params.push(filters.category)
  }
  if (filters.actor) {
    conditions.push(`a.name LIKE ?`)
    params.push(`%${filters.actor}%`)
  }
  if (filters.tag) {
    conditions.push(`t.name LIKE ?`)
    params.push(`%${filters.tag}%`)
  }
  if (filters.minRating !== undefined) {
    conditions.push(`v.rating >= ?`)
    params.push(filters.minRating)
  }
  if (filters.maxRating !== undefined) {
    conditions.push(`v.rating <= ?`)
    params.push(filters.maxRating)
  }
  if (filters.startDate) {
    conditions.push(`v.release_date >= ?`)
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    conditions.push(`v.release_date <= ?`)
    params.push(filters.endDate)
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`
  }

  const sortBy = filters.sortBy || 'created_at'
  const sortOrder = filters.sortOrder || 'desc'
  sql += ` ORDER BY v.${sortBy} ${sortOrder}`

  const videos = queryAll(sql, params) as Video[]

  return videos.map((v) => ({
    ...v,
    actors: getVideoActors(v.id),
    tags: getVideoTags(v.id),
    sample_images: getVideoSampleImages(v.id)
  }))
}

export function getVideo(id: number): Video | null {
  const video = queryOne('SELECT * FROM videos WHERE id = ?', [id]) as Video | undefined
  if (!video) return null
  return {
    ...video,
    actors: getVideoActors(id),
    tags: getVideoTags(id),
    sample_images: getVideoSampleImages(id)
  }
}

export function getVideoByCode(code: string): Video | null {
  return queryOne('SELECT * FROM videos WHERE code = ?', [code]) as Video | null
}

export function getCategoryCounts(): Record<string, number> {
  const rows = queryAll(`SELECT category, COUNT(*) as count FROM videos GROUP BY category`) as { category: string; count: number }[]
  const result: Record<string, number> = { av: 0, fc2: 0, other: 0 }
  for (const row of rows) {
    result[row.category] = row.count
  }
  result.all = result.av + result.fc2 + result.other
  return result
}

export function getTagsWithCount(): TagWithCount[] {
  return queryAll(`
    SELECT t.id, t.name, COUNT(vt.video_id) as count
    FROM tags t
    JOIN video_tags vt ON t.id = vt.tag_id
    JOIN videos v ON vt.video_id = v.id
    GROUP BY t.id
    HAVING count > 0
    ORDER BY count DESC
  `) as TagWithCount[]
}

export function createVideo(data: {
  code: string
  category: string
  title?: string
  cover_path?: string
  file_path: string
  duration?: number
  resolution?: string
  release_date?: string
  maker?: string
  director?: string
  rating?: number
  description?: string
  fanza_url?: string
  series?: string
  label?: string
  video_type?: string
  product_code?: string
  actors?: string[]
  tags?: string[]
}): Video {
  run(
    `INSERT INTO videos (code, category, title, cover_path, file_path, duration, resolution, release_date, maker, director, rating, description, fanza_url, series, label, video_type, product_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.code,
      data.category,
      data.title || null,
      data.cover_path || null,
      data.file_path,
      data.duration || null,
      data.resolution || null,
      data.release_date || null,
      data.maker || null,
      data.director || null,
      data.rating || null,
      data.description || null,
      data.fanza_url || null,
      data.series || null,
      data.label || null,
      data.video_type || null,
      data.product_code || null
    ]
  )

  const videoId = getLastInsertRowId()

  if (data.actors?.length) {
    setVideoActors(videoId, data.actors)
  }
  if (data.tags?.length) {
    setVideoTags(videoId, data.tags)
  }

  saveDatabase()

  return getVideo(videoId)!
}

export function updateVideo(
  id: number,
  data: Partial<{
    code: string
    category: string
    title: string
    cover_path: string
    file_path: string
    duration: number
    resolution: string
    release_date: string
    maker: string
    director: string
    rating: number
    description: string
    fanza_url: string
    series: string
    label: string
    video_type: string
    product_code: string
    actors: string[]
    tags: string[]
  }>
): Video {
  const fields: string[] = []
  const values: any[] = []

  for (const [key, value] of Object.entries(data)) {
    if (key === 'actors' || key === 'tags') continue
    if (value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (fields.length > 0) {
    fields.push(`updated_at = datetime('now', 'localtime')`)
    values.push(id)
    const sql = `UPDATE videos SET ${fields.join(', ')} WHERE id = ?`
    console.log('[DB] updateVideo:', sql)
    console.log('[DB] values:', values)
    run(sql, values)
  }

  if (data.actors !== undefined) {
    setVideoActors(id, data.actors)
  }
  if (data.tags !== undefined) {
    setVideoTags(id, data.tags)
  }

  saveDatabase()

  return getVideo(id)!
}

export function deleteVideo(id: number): void {
  // 先获取关联的图片路径
  const video = queryOne('SELECT cover_path FROM videos WHERE id = ?', [id]) as { cover_path: string | null } | undefined
  const samples = queryAll('SELECT local_path FROM sample_images WHERE video_id = ?', [id]) as { local_path: string | null }[]

  // 删除封面文件
  if (video?.cover_path && existsSync(video.cover_path)) {
    try { unlinkSync(video.cover_path) } catch {}
  }

  // 删除示例图文件
  for (const sample of samples) {
    if (sample.local_path && existsSync(sample.local_path)) {
      try { unlinkSync(sample.local_path) } catch {}
    }
  }

  // 删除数据库记录（CASCADE 会自动删除关联表）
  run('DELETE FROM videos WHERE id = ?', [id])
  saveDatabase()
}

export function getRandomVideo(): Video | null {
  // 先获取总数，再随机选偏移量（比 ORDER BY RANDOM 更均匀）
  const countResult = queryOne('SELECT COUNT(*) as cnt FROM videos') as { cnt: number } | undefined
  if (!countResult || countResult.cnt === 0) return null
  const offset = Math.floor(Math.random() * countResult.cnt)
  const video = queryOne('SELECT * FROM videos LIMIT 1 OFFSET ?', [offset]) as Video | undefined
  if (!video) return null
  return {
    ...video,
    actors: getVideoActors(video.id),
    tags: getVideoTags(video.id),
    sample_images: getVideoSampleImages(video.id)
  }
}

function getVideoActors(videoId: number): Actor[] {
  return queryAll(
    'SELECT a.* FROM actors a JOIN video_actors va ON a.id = va.actor_id WHERE va.video_id = ?',
    [videoId]
  ) as Actor[]
}

function getVideoTags(videoId: number): Tag[] {
  return queryAll(
    'SELECT t.* FROM tags t JOIN video_tags vt ON t.id = vt.tag_id WHERE vt.video_id = ?',
    [videoId]
  ) as Tag[]
}

function getVideoSampleImages(videoId: number): SampleImage[] {
  return queryAll(
    'SELECT * FROM sample_images WHERE video_id = ? ORDER BY sort_order',
    [videoId]
  ) as SampleImage[]
}

function setVideoActors(videoId: number, actorNames: string[]): void {
  run('DELETE FROM video_actors WHERE video_id = ?', [videoId])

  for (const name of actorNames) {
    run('INSERT OR IGNORE INTO actors (name) VALUES (?)', [name])
    const actor = queryOne('SELECT id FROM actors WHERE name = ?', [name])
    if (actor) {
      run('INSERT OR IGNORE INTO video_actors (video_id, actor_id) VALUES (?, ?)', [videoId, actor.id])
    }
  }
}

function setVideoTags(videoId: number, tagNames: string[]): void {
  run('DELETE FROM video_tags WHERE video_id = ?', [videoId])

  for (const name of tagNames) {
    run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name])
    const tag = queryOne('SELECT id FROM tags WHERE name = ?', [name])
    if (tag) {
      run('INSERT OR IGNORE INTO video_tags (video_id, tag_id) VALUES (?, ?)', [videoId, tag.id])
    }
  }
}

export function addSampleImages(videoId: number, images: { url?: string; local_path?: string }[]): void {
  for (let i = 0; i < images.length; i++) {
    run(
      'INSERT INTO sample_images (video_id, url, local_path, sort_order) VALUES (?, ?, ?, ?)',
      [videoId, images[i].url || null, images[i].local_path || null, i]
    )
  }
  saveDatabase()
}
