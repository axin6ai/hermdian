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

## 快速开始

### 1. 安装插件

**方式一：手动安装**
1. 从 Releases 下载 `main.js`、`manifest.json`、`styles.css`
2. 复制到 `{Vault文件夹}/.obsidian/plugins/hermdian/`
3. 重启 Obsidian
4. 在 Settings → Community plugins 中启用插件

**方式二：从源码构建**
```bash
git clone https://github.com/your-username/hermdian.git
cd hermdian
npm install
./dev.sh dev
```

### 2. 配置 AI 提供商

**Hermes CLI 模式（推荐）**
1. 安装 [Hermes Agent](https://hermes-agent.nousresearch.com/)
2. 在 Settings → Hermdian 中选择 "Hermes CLI"

**直连 API 模式**
1. 在 Settings → Hermdian 中选择 "直连 API"
2. 点击 "+ 添加" 配置你的提供商
3. 填写：名称、接口地址、API Key、Model ID

### 3. 开始对话

- 点击左侧栏的 🧠 图标
- 或使用 `Ctrl/Cmd + P` → "Hermdian: Open Hermdian"

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

## 开发指南

```bash
# 克隆仓库
git clone https://github.com/your-username/hermdian.git
cd hermdian

# 安装依赖
npm install

# 开发模式（监听 + 构建）
npm run dev

# 构建并安装到 Obsidian
./dev.sh dev

# 仅构建
./dev.sh build
```

---

## 项目结构

```
hermdian/
├── src/
│   ├── main.ts              # 插件入口
│   ├── types.ts             # TypeScript 类型定义
│   ├── views/
│   │   └── HermdianView.ts  # 主对话视图
│   ├── services/
│   │   └── AIService.ts     # AI 集成（CLI + API）
│   ├── settings/
│   │   └── SettingTab.ts    # 设置面板
│   └── styles/
│       └── index.css        # 样式文件
├── docs/
│   ├── PRD.md               # 产品需求文档
│   └── IMPLEMENTATION.md    # 实现方案文档
├── manifest.json
├── package.json
└── dev.sh                   # 开发脚本
```

---

## 为什么选择 Hermdian？

### 与 Claudian 的区别
Claudian 是一个强大的 Claude/Codex Obsidian 插件。Hermdian 受 Claudian UI 启发，但：
- 支持**任意 OpenAI 兼容 API**（不仅限于 Claude）
- 与 **Hermes Agent** 生态集成
- **更轻量** — 专注核心对话和文件交互
- **更灵活** — 自定义提供商支持

### 与其他 AI 插件的区别
- 🔒 **隐私优先** — 数据本地处理（Hermes CLI 模式）
- 💰 **成本友好** — 可使用免费/低价模型
- 🛠️ **开发者友好** — 开源，MIT 协议

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

- 🐛 [报告问题](https://github.com/your-username/hermdian/issues)
- 💡 [功能建议](https://github.com/your-username/hermdian/issues)
- ⭐ 如果觉得有用，请点个 Star！
