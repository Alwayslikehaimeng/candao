import initSqlJs, { Database } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'

let db: Database
let dbPath: string

export function getDb(): Database {
  return db
}

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()

  const dbDir = join(app.getPath('userData'))
  dbPath = join(dbDir, 'candao.db')

  // 确保目录存在
  mkdirSync(dbDir, { recursive: true })

  // 如果数据库文件存在，加载它
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON')

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('av', 'fc2', 'other')),
      title TEXT,
      cover_path TEXT,
      file_path TEXT NOT NULL,
      duration INTEGER,
      resolution TEXT,
      release_date TEXT,
      maker TEXT,
      director TEXT,
      rating REAL,
      description TEXT,
      fanza_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 创建设置表
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // 自动迁移：给旧表添加新列
  const addColumnIfNotExists = (table: string, column: string, type: string) => {
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
      console.log(`[DB] 添加列: ${table}.${column}`)
    } catch {
      // 列已存在，忽略
    }
  }
  addColumnIfNotExists('videos', 'fanza_url', 'TEXT')
  addColumnIfNotExists('videos', 'source', 'TEXT')
  addColumnIfNotExists('videos', 'video_dmm_id', 'TEXT')

  db.run(`
    CREATE TABLE IF NOT EXISTS actors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS video_actors (
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      actor_id INTEGER NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
      PRIMARY KEY (video_id, actor_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS video_tags (
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (video_id, tag_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sample_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      url TEXT,
      local_path TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `)

  // 创建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_videos_code ON videos(code)')
  db.run('CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category)')
  db.run('CREATE INDEX IF NOT EXISTS idx_videos_rating ON videos(rating)')
  db.run('CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at)')

  // 数据库迁移：添加新列
  addColumnIfNotExists('videos', 'series', 'TEXT')
  addColumnIfNotExists('videos', 'label', 'TEXT')
  addColumnIfNotExists('videos', 'video_type', 'TEXT')
  addColumnIfNotExists('videos', 'product_code', 'TEXT')

  // 保存数据库
  saveDatabase()

  // 确保 covers 目录存在
  const coversDir = join(app.getPath('userData'), 'covers')
  mkdirSync(coversDir, { recursive: true })
}

export function saveDatabase(): void {
  if (db && dbPath) {
    const data = db.export()
    writeFileSync(dbPath, Buffer.from(data))
  }
}

export function getCoversDir(): string {
  return join(app.getPath('userData'), 'covers')
}

// 设置读写
export function getSetting(key: string): string | null {
  try {
    const row = db.exec(`SELECT value FROM settings WHERE key = '${key}'`)
    if (row.length > 0 && row[0].values.length > 0) {
      return row[0].values[0][0] as string
    }
  } catch {}
  return null
}

export function setSetting(key: string, value: string): void {
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  saveDatabase()
}
