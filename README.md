# Web to Markdown

> 一键将网页提取为 Markdown 的浏览器扩展

A browser extension that extracts web pages to clean Markdown with one click.

---

[English](#english) | [中文](#中文)

---

## 中文

### 简介

Web to Markdown 是一个 Edge/Chrome 浏览器扩展，能将任意网页的内容提取为干净的 Markdown 格式。融合了 [MD This Page](https://github.com/Ademking/MD-This-Page) 的一键体验和 [PullMD](https://github.com/AeternaLabsHQ/pullmd) 的内容提取思路。

### 功能

- **一键下载** — 点击图标或按 `Alt+M`，自动提取并下载 `.md` 文件
- **预览编辑** — 右键菜单选择"预览模式"，打开分栏编辑器
- **实时渲染** — 左侧编辑 Markdown，右侧实时预览渲染效果
- **图片提取** — 支持懒加载图片（知乎、掘金等），保持原文位置
- **导出工具** — 复制 Markdown / 复制为 LLM Prompt / 下载 `.md`
- **内容控制** — Toggle 开关：去除图片、去除链接、添加元数据
- **Token 估算** — 显示大概的 Token 数量，方便控制 LLM 上下文长度
- **YAML Frontmatter** — 自动添加标题、作者、来源 URL、提取时间等元数据

### 安装

1. 下载或克隆本仓库
2. 打开 Edge 浏览器，访问 `edge://extensions/`
3. 开启左下角"开发人员模式"
4. 点击"加载已解压的扩展"
5. 选择 `webtomd-extension` 文件夹

Chrome 用户访问 `chrome://extensions/`，其余步骤相同。

### 使用

| 操作 | 说明 |
|------|------|
| 点击工具栏图标 | 弹出菜单：一键下载 / 预览编辑 |
| `Alt + M` | 一键提取并下载 `.md` 文件 |
| 右键菜单 | "提取为 Markdown" 或"预览编辑" |

### 技术栈

- **Manifest V3** — 原生 JS/HTML/CSS，零构建工具
- **Mozilla Readability** — 文章内容提取（回退方案）
- **Turndown** — HTML 转 Markdown
- **marked.js** — 预览页 Markdown 实时渲染

### 项目结构

```
webtomd-extension/
├── manifest.json          # 扩展配置
├── background.js          # 后台服务：快捷键、右键菜单
├── content.js             # 内容脚本：提取、转换、下载
├── popup.html / popup.js  # 工具栏弹窗
├── lib/
│   ├── readability.js     # Mozilla Readability
│   ├── turndown.js        # Turndown HTML→Markdown
│   └── marked.min.js      # marked Markdown 渲染
├── preview/
│   ├── preview.html       # 预览页
│   ├── preview.js         # 预览逻辑
│   └── preview.css        # 暗色主题样式
└── icons/                 # 扩展图标
```

### 致谢

- [MD This Page](https://github.com/Ademking/MD-This-Page) — 浏览器扩展的一键体验设计
- [PullMD](https://github.com/AeternaLabsHQ/pullmd) — 内容提取管线和质量评分思路
- [Mozilla Readability](https://github.com/nickolay/readability) — 文章提取算法
- [Turndown](https://github.com/mixmark-io/turndown) — HTML 转 Markdown

### 许可证

MIT License

---

## English

### Introduction

Web to Markdown is an Edge/Chrome browser extension that extracts any web page into clean Markdown format. It combines the one-click experience of [MD This Page](https://github.com/Ademking/MD-This-Page) with the content extraction approach of [PullMD](https://github.com/AeternaLabsHQ/pullmd).

### Features

- **One-click download** — Click the toolbar icon or press `Alt+M` to extract and download a `.md` file
- **Preview & edit** — Right-click and select "Preview mode" to open a split-pane editor
- **Live rendering** — Edit Markdown on the left, see rendered preview on the right
- **Image extraction** — Handles lazy-loaded images (Zhihu, Juejin, etc.) and preserves their original positions
- **Export tools** — Copy Markdown / Copy as LLM Prompt / Download `.md`
- **Content control** — Toggle switches: remove images, remove links, add metadata
- **Token estimation** — Displays approximate token count for LLM context budgeting
- **YAML Frontmatter** — Auto-adds title, author, source URL, extraction timestamp

### Installation

1. Download or clone this repository
2. Open Edge and go to `edge://extensions/`
3. Enable "Developer mode" in the bottom left
4. Click "Load unpacked"
5. Select the `webtomd-extension` folder

For Chrome users, go to `chrome://extensions/` instead.

### Usage

| Action | Description |
|--------|-------------|
| Click toolbar icon | Popup menu: one-click download / preview & edit |
| `Alt + M` | Extract and download `.md` file |
| Right-click menu | "Extract to Markdown" or "Preview & edit" |

### Tech Stack

- **Manifest V3** — Vanilla JS/HTML/CSS, zero build tools
- **Mozilla Readability** — Article content extraction (fallback)
- **Turndown** — HTML to Markdown conversion
- **marked.js** — Markdown preview rendering

### Project Structure

```
webtomd-extension/
├── manifest.json          # Extension config
├── background.js          # Service worker: shortcuts, context menus
├── content.js             # Content script: extract, convert, download
├── popup.html / popup.js  # Toolbar popup
├── lib/
│   ├── readability.js     # Mozilla Readability
│   ├── turndown.js        # Turndown HTML→Markdown
│   └── marked.min.js      # marked Markdown renderer
├── preview/
│   ├── preview.html       # Preview page
│   ├── preview.js         # Preview logic
│   └── preview.css        # Dark theme styles
└── icons/                 # Extension icons
```

### Credits

- [MD This Page](https://github.com/Ademking/MD-This-Page) — One-click browser extension UX design
- [PullMD](https://github.com/AeternaLabsHQ/pullmd) — Content extraction pipeline and quality scoring
- [Mozilla Readability](https://github.com/nickolay/readability) — Article extraction algorithm
- [Turndown](https://github.com/mixmark-io/turndown) — HTML to Markdown conversion

### License

MIT License
