# 喰导 (CanDao) — 项目指引

## 项目概述
本地视频归档和管理软件，自动抓取网络信息建立媒体库。

## 重要文件路径

### 项目文档
- [产品需求文档](docs/01-requirements.md) — 功能需求和页面设计
- [技术栈规范](docs/02-tech-stack.md) — 技术选型和约束
- [UI 设计规范](docs/03-design-spec.md) — 色彩、字体、组件规范
- [开发路线图](docs/04-dev-roadmap.md) — 开发阶段和任务清单

### 开发日志
- [dev-logs/](dev-logs/) — 每日完成事项和待办（按日期命名）

### 核心代码
- [主进程入口](src/main/index.ts) — Electron 主进程
- [数据库 Schema](src/main/database/schema.ts) — 表结构定义
- [视频 CRUD](src/main/database/video.ts) — 数据库操作
- [IPC 处理器](src/main/ipc/handlers.ts) — 主进程 API
- [预加载脚本](src/preload/index.ts) — 渲染进程 API
- [FANZA 爬虫](src/main/crawler/fanza.ts) — AV 信息抓取
- [FC2 爬虫](src/main/crawler/fc2.ts) — FC2 信息抓取
- [代理检测](src/main/utils/proxy.ts) — 自动检测系统代理

### 前端
- [根组件](src/renderer/App.tsx) — 侧边栏 + 页面路由
- [主页](src/renderer/pages/HomePage.tsx) — 海报墙
- [详情页](src/renderer/pages/DetailPage.tsx) — 信息编辑
- [视频卡片](src/renderer/components/VideoCard.tsx) — 卡片组件
- [主题 CSS](src/renderer/styles/candao.css) — 主样式
- [主题配置](src/renderer/styles/theme.ts) — Ant Design 主题

## 工作规范

### 开发流程
1. 查看 [开发路线图](docs/04-dev-roadmap.md) 确认当前任务
2. 每次只做一个功能，做完构建测试
3. 测试通过后更新开发日志
4. 遇到问题先记录，不要绕过

### 构建和运行
```bash
# 安装依赖
npm install

# 开发模式
unset ELECTRON_RUN_AS_NODE && npm run dev

# 构建
npx electron-vite build

# 运行
unset ELECTRON_RUN_AS_NODE && node_modules/electron/dist/electron.exe .

# 打包发布
npm run release
```

### 路径别名
```typescript
@main/*      → src/main/*
@renderer/*  → src/renderer/*
@shared/*    → src/shared/*
```

### 详细架构
数据库 Schema、IPC 接口、爬虫策略等详见 [ARCHITECTURE.md](ARCHITECTURE.md)

### 关键约束
- **ELECTRON_RUN_AS_NODE**：终端中可能被设置为 1，必须 unset 否则 Electron 无法正常工作
- **sql.js**：纯 JS SQLite，无需编译，异步初始化
- **cheerio**：必须用 1.0.0-rc.12，新版与 Electron 不兼容
- **代理**：FANZA 需要日本 IP，爬虫会自动检测系统代理

### 代码风格
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- CSS 使用 candao.css 统一管理
- 数据库操作封装在 video.ts 中
- IPC 通信封装在 handlers.ts 中

### Git 规范
- 提交信息格式：`类型: 描述`
- 类型：feat / fix / refactor / docs / style / test / chore
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
