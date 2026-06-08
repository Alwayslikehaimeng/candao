# UI 设计规范

## 浅色主题

### 色彩
| 名称 | 色值 | 用途 |
|------|------|------|
| Primary Pink | #FF8FB1 | 主按钮、高亮、链接 |
| Pink Hover | #FFE4EC | 悬停背景 |
| Pink Bg | #FFF0F5 | 激活背景 |
| Background | #F8F8FA | 主背景 |
| Sidebar | #FFFFFF | 侧边栏背景 |
| Card | #FFFFFF | 卡片背景 |
| Text Primary | #222222 | 主文字 |
| Text Secondary | #666666 | 次要文字 |
| Text Muted | #999999 | 占位符 |
| Border | #E8E8E8 | 边框 |
| Border Light | #F0F0F0 | 分割线 |

## 深色主题

### 色彩
| 名称 | 色值 | 用途 |
|------|------|------|
| Primary Purple | #9B59B6 | 主按钮、高亮、链接 |
| Purple Hover | #B07CC6 | 悬停背景 |
| Purple Bg | #2D1B4E | 激活背景 |
| Background | #1A1A2E | 主背景 |
| Sidebar | #16213E | 侧边栏背景 |
| Card | #1E2A4A | 卡片背景 |
| Text Primary | #E0E0E0 | 主文字 |
| Text Secondary | #A0A0B8 | 次要文字 |
| Text Muted | #6A6A80 | 占位符 |
| Border | #2A3A5C | 边框 |
| Border Light | #1E2D4A | 分割线 |

## 圆角
| 名称 | 值 | 用途 |
|------|------|------|
| sm | 4px | 输入框、小元素 |
| md | 8px | 按钮、标签 |
| lg | 16px | 卡片、弹窗 |

## 阴影
| 名称 | 值 | 用途 |
|------|------|------|
| sm | 0 2px 8px rgba(0,0,0,0.06) | 卡片默认 |
| md | 0 4px 16px rgba(0,0,0,0.08) | 弹窗 |
| lg | 0 8px 32px rgba(0,0,0,0.12) | 悬浮元素 |
| card-hover | 0 8px 24px rgba(0,0,0,0.1) | 卡片悬停 |

## 字体
- 正文：Noto Sans SC
- 字号：14px（正文）、12px（辅助）、16px（标题）

## 组件规范

### 视频卡片
- 16:9 比例封面
- 圆角 16px
- 悬停：上移 4px + 放大 1.02 + 阴影增强 + 播放按钮浮现
- 标题悬停：变粉色 + 展开两行

### 侧边栏
- 宽度 240px
- 白色背景（浅色）/ 深色背景（深色）
- 分类无图标，工具和设置有图标
- 选中状态：粉色/紫色背景

### 详情页
- 左侧：封面（16:9）+ 缩略图条
- 右侧：查看/编辑模式切换
- 底部：固定保存按钮

### 榜单页面
- 标签页切换（实时/日/周/月）
- 卡片列表：封面 + 标题 + 排名
- 点击跳转浏览器
