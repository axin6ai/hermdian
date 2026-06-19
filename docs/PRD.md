# Hermdian — 产品设计文档

## 一、产品概述

**Hermdian** 是一个 Obsidian 插件，将 Hermes Agent 的 AI 能力集成到 Obsidian 知识库管理中。

### 核心定位
**不只是聊天窗口，而是 Obsidian 的 AI 协作伙伴**

### 命名来源
- **Hermes** (AI Agent) + **Obsidian** = **Hermdian**

---

## 二、竞品分析：Claudian

### Claudian 特点
1. **多 Provider 支持** — Claude、Codex、OpenCode、Pi
2. **丰富的功能** — 内联编辑、Plan 模式、MCP、子代理
3. **成熟的 UI** — 标签页、工具栏、状态面板
4. **深度集成** — 文件上下文、@提及、图片支持

### Claudian 架构
```
ClaudianView (生命周期 + 组装)
├── ChatState (状态管理)
├── Controllers (输入、流、会话、选择)
├── Services (子代理、Bash)
├── Rendering (消息、工具调用、思考、Diff)
├── Tabs (标签管理)
└── UI Components (工具栏、文件上下文、状态面板)
```

### Hermdian 的差异化
| 特性 | Claudian | Hermdian |
|------|----------|----------|
| AI Provider | Claude/Codex/OpenCode | Hermes CLI + 任意 API |
| 功能复杂度 | 高（内联编辑、Plan、MCP） | 中（专注对话和文件交互） |
| 依赖 | 需要 Claude/Codex CLI | 可选 Hermes CLI |
| 目标用户 | Claude 深度用户 | Hermes 用户 + 通用 API 用户 |

---

## 三、功能设计

### 3.1 核心功能

#### 对话功能
- ✅ 多轮对话，保持上下文
- ✅ Markdown 渲染（代码高亮、表格、列表）
- ✅ 流式输出（可选）
- ✅ 对话历史保存
- ✅ 思考过程展示

#### 文件交互
- ✅ 读取当前笔记内容
- ✅ 创建新笔记
- ✅ 编辑现有笔记
- ✅ 搜索 vault
- ✅ @提及文件

#### AI Provider
- ✅ Hermes CLI 模式（推荐）
- ✅ 直连 API 模式
- ✅ 自定义提供商配置
- ✅ 多模型切换

### 3.2 UI 设计

#### 参考 Claudian 的设计语言
- 使用 Obsidian 的 CSS 变量
- BEM 命名规范（`.hermdian-*`）
- 响应式布局
- 深色/浅色主题适配

#### 布局结构
```
┌─────────────────────────────────────────────┐
│ 🧠 Hermdian    [模型]           [+] [⚙] [×] │  ← Header
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Tab1 | Tab2 | Tab3                  │    │  ← Tabs (可选)
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ AI: 你好！我是 Hermdian 👋          │    │  ← Messages
│  │     我可以帮你...                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│            ┌───────────────────────┐        │
│            │ User: 你好啊          │        │
│            └───────────────────────┘        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ AI: 你好！很高兴见到你。  ← 1.2s    │    │
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 输入消息...                             │ │  ← Input
│ └─────────────────────────────────────────┘ │
│                                             │
│ [📄 file.md] [✂️ 选中文本]                 │  ← Context
│                                             │
├─────────────────────────────────────────────┤
│ [CPU Qwen3.6] [🧠 深度思考]    [12%] [📄]  │  ← Status
└─────────────────────────────────────────────┘
```

---

## 四、技术架构

### 4.1 目录结构
```
hermdian/
├── src/
│   ├── main.ts                    # 插件入口
│   ├── types.ts                   # 类型定义
│   ├── constants.ts               # 常量
│   │
│   ├── views/
│   │   └── HermdianView.ts        # 主视图
│   │
│   ├── services/
│   │   ├── HermesService.ts       # Hermes CLI 集成
│   │   ├── ApiService.ts          # 直连 API
│   │   └── FileService.ts         # 文件操作
│   │
│   ├── settings/
│   │   ├── HermdianSettingTab.ts  # 设置面板
│   │   └── ProviderModal.ts       # 提供商配置弹窗
│   │
│   ├── components/
│   │   ├── Header.ts              # 头部组件
│   │   ├── MessageList.ts         # 消息列表
│   │   ├── InputArea.ts           # 输入区域
│   │   └── StatusBar.ts           # 状态栏
│   │
│   └── styles/
│       ├── index.css              # 主样式入口
│       ├── base.css               # 基础样式
│       ├── header.css             # 头部样式
│       ├── messages.css           # 消息样式
│       ├── input.css              # 输入样式
│       └── status.css             # 状态栏样式
│
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── styles.css                     # 构建输出
```

### 4.2 核心类

#### HermdianView (主视图)
```typescript
class HermdianView extends ItemView {
  // 继承 Obsidian 的 ItemView
  // 使用 this.contentEl 构建 UI
  // 覆盖 this.containerEl 的样式
  
  private header: Header;
  private messageList: MessageList;
  private inputArea: InputArea;
  private statusBar: StatusBar;
  
  async onOpen() {
    // 设置容器样式
    this.containerEl.style.padding = '0';
    this.containerEl.style.overflow = 'hidden';
    
    // 构建 UI
    this.header = new Header(this.contentEl, this.plugin);
    this.messageList = new MessageList(this.contentEl);
    this.inputArea = new InputArea(this.contentEl, this.plugin);
    this.statusBar = new StatusBar(this.contentEl, this.plugin);
  }
}
```

#### HermesService (AI 服务)
```typescript
class HermesService {
  // 两种模式
  async chat(message: string, context: Context): Promise<string> {
    if (this.settings.mode === 'hermes-cli') {
      return this.chatViaCLI(message, context);
    } else {
      return this.chatViaAPI(message, context);
    }
  }
  
  // CLI 模式
  private async chatViaCLI(message: string, context: Context): Promise<string> {
    const { stdout } = await execAsync(`hermes chat -q "${prompt}" --quiet`);
    return stdout;
  }
  
  // API 模式
  private async chatViaAPI(message: string, context: Context): Promise<string> {
    const response = await requestUrl({
      url: this.normalizeUrl(config.baseUrl),
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.modelId, messages: [...] })
    });
    return response.json.choices[0].message.content;
  }
}
```

### 4.3 CSS 命名规范

参考 Claudian 的 BEM 规范：
```css
/* 块 */
.hermdian-container { }
.hermdian-header { }
.hermdian-messages { }
.hermdian-input { }
.hermdian-status { }

/* 元素 */
.hermdian-header-left { }
.hermdian-header-center { }
.hermdian-header-right { }
.hermdian-message-user { }
.hermdian-message-ai { }
.hermdian-bubble { }

/* 修饰符 */
.hermdian-bubble--user { }
.hermdian-bubble--ai { }
.hermdian-bubble--error { }
.hermdian-tag--active { }
```

---

## 五、实现计划

### Phase 1：基础框架（1-2 天）
- [ ] 项目初始化
- [ ] main.ts 插件入口
- [ ] HermdianView 基础结构
- [ ] 设置面板

### Phase 2：对话功能（2-3 天）
- [ ] 消息组件（用户/AI 气泡）
- [ ] 输入组件
- [ ] HermesService 集成
- [ ] Markdown 渲染

### Phase 3：文件交互（1-2 天）
- [ ] 当前文件上下文
- [ ] @提及功能
- [ ] 文件创建/编辑

### Phase 4：UI 优化（1-2 天）
- [ ] 状态栏
- [ ] 思考动画
- [ ] 响应式布局
- [ ] 主题适配

### Phase 5：测试发布（1 天）
- [ ] 功能测试
- [ ] 文档编写
- [ ] 插件发布

---

## 六、与 Claudian 的关系

### 不完全 Fork 的原因
1. Claudian 代码量大（772+ 行 main.ts，50+ 源文件）
2. 依赖多个 Provider SDK（Claude、Codex、OpenCode）
3. 功能复杂（内联编辑、Plan、MCP、子代理）

### Hermdian 的策略
1. **参考 UI 设计** — 使用 Claudian 的样式规范和布局
2. **简化功能** — 专注对话和文件交互
3. **灵活后端** — 支持 Hermes CLI + 任意 API
4. **渐进增强** — 后续可逐步添加 Claudian 的高级功能

---

## 七、总结

Hermdian 是一个轻量级的 Obsidian AI 助手插件，参考 Claudian 的 UI 设计，但专注于核心对话和文件交互功能。通过支持 Hermes CLI 和直连 API，为用户提供灵活的 AI 集成方案。
