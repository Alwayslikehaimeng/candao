# 技术栈规范

## 核心框架
| 组件 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | ^32.x |
| 前端框架 | React | ^18.x |
| 语言 | TypeScript | ^5.x |
| 构建工具 | electron-vite | ^2.x |
| UI 组件库 | Ant Design | ^5.x |

## 数据层
| 组件 | 技术 | 说明 |
|------|------|------|
| 数据库 | sql.js | 纯 JS SQLite，无需编译 |
| 状态管理 | Zustand | 轻量级状态管理 |

## 爬虫
| 组件 | 技术 | 说明 |
|------|------|------|
| HTTP 客户端 | axios | 发送请求 |
| HTML 解析 | cheerio@1.0.0-rc.12 | 解析页面 |

## 重要约束

### Electron 兼容性
- Electron 32 使用 Node.js 20
- `require('electron')` 在 Electron 运行时返回内置模块
- **关键**：终端中 `ELECTRON_RUN_AS_NODE=1` 会导致 Electron 当作纯 Node 运行
- 运行前必须 `unset ELECTRON_RUN_AS_NODE`

### sql.js 特性
- 纯 JS 实现，无需 native 编译
- 异步初始化：`await initSqlJs()`
- 查询：`db.exec()` 返回结果数组
- 写入：`db.run()` 后需 `saveDatabase()` 持久化

### cheerio 版本
- 必须使用 `1.0.0-rc.12`
- 新版与 Electron Node 版本不兼容

### 代理检测
- 自动检测系统代理（环境变量 + 常见端口）
- FANZA 需要日本 IP

## 项目结构
```
candao/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── database/      # SQLite 数据库
│   │   ├── crawler/       # 爬虫模块
│   │   ├── scanner/       # 文件扫描
│   │   ├── ffprobe/       # 视频信息提取
│   │   ├── utils/         # 工具函数
│   │   └── ipc/           # IPC 通信
│   ├── renderer/          # React 前端
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── stores/        # 状态管理
│   │   └── styles/        # 样式
│   └── shared/            # 共享类型
├── docs/                  # 项目文档
├── dev-logs/              # 开发日志
└── out/                   # 构建输出
```
