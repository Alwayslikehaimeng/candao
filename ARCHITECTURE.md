# 喰导 (CanDao) — 技术架构文档

## 技术栈

| 层 | 选型 | 版本 |
|---|---|---|
| 桌面框架 | Electron | ^28.x |
| 前端框架 | React | ^18.x |
| 语言 | TypeScript | ^5.x |
| UI 组件库 | Ant Design | ^5.x |
| 状态管理 | Zustand | ^4.x |
| 数据库 | SQLite (better-sqlite3) | ^9.x |
| 爬虫 | axios + cheerio | - |
| 视频信息 | ffprobe (fluent-ffmpeg) | - |
| 构建工具 | electron-vite | ^2.x |
| 打包 | electron-builder | ^24.x |

## 项目结构

```
candao/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 主入口
│   │   ├── database/            # SQLite 数据库
│   │   │   ├── schema.ts        # 表结构定义
│   │   │   └── video.ts         # Video CRUD 操作
│   │   ├── crawler/             # 爬虫模块
│   │   │   ├── fanza.ts         # FANZA 爬虫
│   │   │   ├── fc2.ts           # FC2 爬虫
│   │   │   ├── javbus.ts        # JavBus 备用爬虫
│   │   │   └── proxy.ts         # 代理配置
│   │   ├── scanner/             # 文件扫描
│   │   │   ├── scanner.ts       # 文件夹扫描
│   │   │   └── parser.ts        # 番号解析
│   │   ├── player/              # 播放器
│   │   │   └── player.ts        # 调用系统播放器
│   │   ├── ffprobe/             # 视频信息提取
│   │   │   └── probe.ts         # ffprobe 封装
│   │   └── ipc/                 # IPC 通信
│   │       └── handlers.ts      # 所有 IPC handler
│   ├── renderer/                # React 前端
│   │   ├── index.html           # HTML 入口
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── components/          # 通用组件
│   │   │   ├── VideoCard.tsx    # 视频卡片
│   │   │   ├── VideoGrid.tsx    # 海报墙网格
│   │   │   ├── SearchBar.tsx    # 搜索框
│   │   │   ├── FilterPanel.tsx  # 筛选面板
│   │   │   ├── StarRating.tsx   # 评分星星
│   │   │   └── Succubus纹.tsx   # 魅魔纹装饰
│   │   ├── pages/               # 页面
│   │   │   ├── HomePage.tsx     # 主页（媒体库）
│   │   │   └── DetailPage.tsx   # 详情/编辑页
│   │   ├── stores/              # Zustand 状态
│   │   │   └── videoStore.ts
│   │   ├── api/                 # IPC 调用封装
│   │   │   └── video.ts
│   │   ├── styles/              # 样式
│   │   │   ├── global.css       # 全局样式
│   │   │   ├── theme.ts         # Ant Design 主题配置
│   │   │   └── succubus.css     # 魅魔纹样式
│   │   └── types/               # 类型定义
│   │       └── video.ts
│   └── shared/                  # 前后端共享
│       └── types.ts             # 共享类型
├── resources/                   # 静态资源
│   └── icon.png                 # 应用图标
├── covers/                      # 封面存储目录（运行时生成）
├── package.json
├── tsconfig.json
├── electron-builder.yml
└── ARCHITECTURE.md
```

## 数据库设计 (SQLite)

### videos 表
```sql
CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,           -- 番号/FC2代码
  category TEXT NOT NULL,              -- av / fc2 / other
  title TEXT,                          -- 标题
  cover_path TEXT,                     -- 本地封面路径
  file_path TEXT NOT NULL,             -- 视频文件路径
  duration INTEGER,                    -- 时长（秒）
  resolution TEXT,                     -- 分辨率 (1920x1080)
  release_date TEXT,                   -- 发行日期
  maker TEXT,                          -- 制造商
  director TEXT,                       -- 导演
  rating REAL,                         -- 评分 (0-5)
  description TEXT,                    -- 简介
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### actors 表
```sql
CREATE TABLE actors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);
```

### tags 表
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);
```

### video_actors 关联表
```sql
CREATE TABLE video_actors (
  video_id INTEGER REFERENCES videos(id),
  actor_id INTEGER REFERENCES actors(id),
  PRIMARY KEY (video_id, actor_id)
);
```

### video_tags 关联表
```sql
CREATE TABLE video_tags (
  video_id INTEGER REFERENCES videos(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (video_id, tag_id)
);
```

### sample_images 表
```sql
CREATE TABLE sample_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER REFERENCES videos(id),
  url TEXT,                            -- 原始URL
  local_path TEXT,                     -- 本地路径
  sort_order INTEGER DEFAULT 0
);
```

## IPC 通信设计

主进程暴露给渲染进程的 API：

```typescript
// 视频 CRUD
video:list(filters) → Video[]
video:get(id) → Video
video:create(data) → Video
video:update(id, data) → Video
video:delete(id) → void

// 爬虫
crawler:fetchAv(code) → CrawlResult
crawler:fetchFc2(code) → CrawlResult

// 文件扫描
scanner:scanFolder(path) → ScanResult[]
scanner:parseCode(filename) → string | null

// 播放
player:play(filePath) → void
player:randomPlay() → Video

// 视频信息
ffprobe:probe(filePath) → VideoInfo

// 代理设置
settings:getProxy() → ProxyConfig
settings:setProxy(config) → void
```

## 爬虫策略

### FANZA (AV 分类)
1. 构造搜索 URL: `https://www.dmm.co.jp/mono/dvd/-/search/=/searchstr={code}/`
2. 解析搜索结果页，找到匹配的作品页面
3. 从作品页面提取：标题、封面、示例图、发行日期、片长、演员、导演、制造商、标签、评分
4. 下载封面和示例图到本地

### FC2 (FC2 分类)
1. 构造 URL: `https://adult.contents.fc2.com/article/{id}/`
2. 解析页面提取：标题、封面、卖家信息、价格、标签
3. 备用：从 JavBus 搜索补充信息

### 番号解析
正则匹配常见番号格式：
- AV: `[A-Z]{2,5}-\d{3,5}` (如 JUR-258, ABP-123)
- FC2: `FC2-PPV-\d{5,8}`
- 无码: `n\d{4}`, `carib-\d{6}` 等

## UI 主题配置

```typescript
const theme = {
  token: {
    colorPrimary: '#FF6B9D',      // 粉色
    colorBgBase: '#1A1A2E',       // 深色背景
    colorBgContainer: '#16213E',  // 卡片背景
    colorText: '#E0E0E0',         // 文字颜色
    colorTextSecondary: '#A0A0A0',
    borderRadius: 8,
    fontFamily: "'Microsoft YaHei', sans-serif",
  },
  components: {
    Button: {
      colorPrimary: '#FF6B9D',
      colorPrimaryHover: '#FF8DB5',
    },
    Input: {
      colorBgContainer: '#0F3460',
      colorBorder: '#FF6B9D33',
    },
  },
};
```
