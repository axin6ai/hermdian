# Hermdian

<div align="center">

🧠 **基于 Hermes Agent 的 Obsidian AI 助手插件**

[English](./README_EN.md) | [中文](./README_CN.md)

</div>

---

## 什么是 Hermdian？

**Hermdian** 是一个 Obsidian 插件，将 AI 能力带入你的知识库。名字来源于 **Hermes**（AI Agent）+ **Obsidian** = **Hermdian**。

它不仅仅是一个聊天窗口，更是你的 **AI 知识协作伙伴** —— 能够阅读、理解、搜索和创建 Obsidian 笔记内容。

### 核心特性

- 💬 **聊天气泡界面** — 美观的对话式 UI（类似微信/iMessage）
- 🤖 **双模式支持** — 支持 Hermes CLI 和直连 API
- 🔧 **自定义提供商** — 可添加任意 OpenAI 兼容 API（讯飞、DeepSeek 等）
- 📖 **文件上下文** — 自动将当前笔记作为上下文
- ✏️ **文件交互** — AI 可读取、创建、编辑笔记
- 📋 **一键复制** — 悬浮显示复制按钮
- 🧠 **Markdown 渲染** — 完整支持代码块、表格、列表
- 🎨 **主题适配** — 自动适配 Obsidian 深色/浅色主题

---

## 界面预览

| 聊天界面 | 设置面板 |
|----------|----------|
| ![chat](./docs/assets/hermdian-chat.png) | ![settings](./docs/assets/hermdian-settings.png) |

---

## 下载安装

### 第一步：下载

前往 [Releases](https://github.com/axin6ai/hermdian/releases) 页面，下载最新版本的文件：

- `main.js`
- `manifest.json`
- `styles.css`

### 第二步：安装

1. 打开 Obsidian
2. 进入 设置 → 第三方插件
3. 点击「打开插件文件夹」
4. 创建一个新文件夹，命名为 `hermdian`
5. 将下载的三个文件复制到该文件夹
6. 重启 Obsidian
7. 在第三方插件中启用「Hermdian」

### 第三步：配置

1. 点击左侧栏的 🧠 图标
2. 点击右上角的 ⚙️ 设置图标
3. 选择 AI 模式（Hermes CLI 或直连 API）
4. 配置你的提供商信息

---

## 支持的提供商

Hermdian 支持所有 OpenAI 兼容的 API：

| 提供商 | 接口地址 |
|--------|----------|
| 讯飞星辰 | `https://maas-api.cn-huabei-1.xf-yun.com/v2` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| 本地 Ollama | `http://localhost:11434` |
| 本地 LM Studio | `http://localhost:1234` |

> 💡 只需填写基础地址，系统会自动补全 `/chat/completions` 路径

---

## 功能详解

### 聊天界面
- 气泡式消息（用户右侧，AI 左侧）
- Markdown 渲染，支持代码高亮
- 思考动画，显示 AI 处理中
- 响应时间显示
- 悬浮复制按钮

### 文件上下文
- 自动检测当前打开的笔记
- 在上下文栏显示文件名
- 支持选中文本作为上下文
- 上下文使用百分比显示

### 状态栏
- 当前模型名称
- 深度思考开关
- 上下文使用量（Token）
- 当前文件指示器

---

## 文档

- [产品需求文档 (PRD)](./docs/PRD.md)
- [实现方案文档](./docs/IMPLEMENTATION.md)

---

## 许可证

MIT License

---

## 致谢

- [Obsidian](https://obsidian.md/) — 优秀的知识管理工具
- [Hermes Agent](https://hermes-agent.nousresearch.com/) — 强大的 AI Agent 框架
- [Claudian](https://github.com/YishenTu/claudian) — UI 设计灵感来源

---

## 支持

- 🐛 [报告问题](https://github.com/axin6ai/hermdian/issues)
- 💡 [功能建议](https://github.com/axin6ai/hermdian/issues)
- ⭐ 如果觉得有用，请点个 Star！
