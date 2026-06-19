# Hermdian

<div align="center">

🧠 **An AI Assistant Plugin for Obsidian, Powered by Hermes Agent**

[English](./README_EN.md) | [中文](./README_CN.md)

</div>

---

## What is Hermdian?

**Hermdian** is an Obsidian plugin that brings AI capabilities to your knowledge base. The name comes from **Hermes** (AI Agent) + **Obsidian** = **Hermdian**.

Think of it as your **AI-powered knowledge companion** — not just a chat window, but a collaborative partner that can read, understand, search, and create content in your Obsidian vault.

### Key Features

- 💬 **Chat Interface** — Beautiful bubble-style conversation UI (like WeChat/iMessage)
- 🤖 **Dual Mode** — Support both Hermes CLI and Direct API connections
- 🔧 **Custom Providers** — Add any OpenAI-compatible API (Xunfei, DeepSeek, etc.)
- 📖 **File Context** — Automatically includes current note as context
- ✏️ **File Interaction** — AI can read, create, and edit your notes
- 📋 **Copy Support** — Hover to copy any message with one click
- 🧠 **Markdown Rendering** — Full support for code blocks, tables, lists
- 🎨 **Theme Compatible** — Adapts to Obsidian's light/dark themes

---

## Screenshots

| Chat Interface | Settings Panel |
|----------------|----------------|
| ![chat](./docs/assets/hermdian-chat.png) | ![settings](./docs/assets/hermdian-settings.png) |

---

## Quick Start

### 1. Install Plugin

**Option A: Manual Install**
1. Download `main.js`, `manifest.json`, `styles.css` from releases
2. Copy to `{VaultFolder}/.obsidian/plugins/hermdian/`
3. Restart Obsidian
4. Enable plugin in Settings → Community plugins

**Option B: Build from Source**
```bash
git clone https://github.com/your-username/hermdian.git
cd hermdian
npm install
./dev.sh dev
```

### 2. Configure AI Provider

**Hermes CLI Mode (Recommended)**
1. Install [Hermes Agent](https://hermes-agent.nousresearch.com/)
2. In Settings → Hermdian, select "Hermes CLI"

**Direct API Mode**
1. In Settings → Hermdian, select "Direct API"
2. Click "+ Add" to configure your provider
3. Fill in: Name, API URL, API Key, Model ID

### 3. Start Chatting

- Click the 🧠 icon in the left sidebar
- Or use `Ctrl/Cmd + P` → "Hermdian: Open Hermdian"

---

## Supported Providers

Hermdian supports any OpenAI-compatible API:

| Provider | Base URL |
|----------|----------|
| Xunfei (讯飞星辰) | `https://maas-api.cn-huabei-1.xf-yun.com/v2` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| Local (Ollama) | `http://localhost:11434` |
| Local (LM Studio) | `http://localhost:1234` |

> 💡 Just fill in the base URL, the system will automatically append `/chat/completions`

---

## Features in Detail

### Chat Interface
- Bubble-style messages (user right, AI left)
- Markdown rendering with syntax highlighting
- Thinking animation during AI processing
- Response time display
- Copy button on hover

### File Context
- Automatically detects current open note
- Shows file name in context bar
- Supports selected text as context
- Context usage percentage display

### Status Bar
- Current model name
- Deep thinking toggle
- Context usage (tokens)
- Current file indicator

---

## Development

```bash
# Clone repository
git clone https://github.com/your-username/hermdian.git
cd hermdian

# Install dependencies
npm install

# Development mode (watch + build)
npm run dev

# Build and install to Obsidian
./dev.sh dev

# Build only
./dev.sh build
```

---

## Project Structure

```
hermdian/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── types.ts             # TypeScript types
│   ├── views/
│   │   └── HermdianView.ts  # Main chat view
│   ├── services/
│   │   └── AIService.ts     # AI integration (CLI + API)
│   ├── settings/
│   │   └── SettingTab.ts    # Settings panel
│   └── styles/
│       └── index.css        # Styles
├── docs/
│   ├── PRD.md               # Product requirements
│   └── IMPLEMENTATION.md    # Implementation guide
├── manifest.json
├── package.json
└── dev.sh                   # Development script
```

---

## Why Hermdian?

### vs Claudian
Claudian is a powerful Obsidian plugin for Claude/Codex. Hermdian is inspired by Claudian's UI but:
- Supports **any OpenAI-compatible API** (not just Claude)
- Works with **Hermes Agent** ecosystem
- **Lighter weight** — focused on core chat and file interaction
- **More flexible** — custom provider support

### vs Other AI Plugins
- 🔒 **Privacy First** — Your data stays local (Hermes CLI mode)
- 💰 **Cost Effective** — Use free/cheap models
- 🛠️ **Developer Friendly** — Open source, MIT license

---

## Documentation

- [Product Requirements (PRD)](./docs/PRD.md)
- [Implementation Guide](./docs/IMPLEMENTATION.md)

---

## License

MIT License

---

## Acknowledgments

- [Obsidian](https://obsidian.md/) — Amazing knowledge management tool
- [Hermes Agent](https://hermes-agent.nousresearch.com/) — Powerful AI agent framework
- [Claudian](https://github.com/YishenTu/claudian) — UI design inspiration

---

## Support

- 🐛 [Report Issues](https://github.com/your-username/hermdian/issues)
- 💡 [Feature Requests](https://github.com/your-username/hermdian/issues)
- ⭐ Star this repo if you find it useful!
