# Hermdian — 实现方案

## 一、项目结构

```
hermdian/
├── src/
│   ├── main.ts                    # 插件入口
│   ├── types.ts                   # 类型定义
│   ├── constants.ts               # 常量定义
│   │
│   ├── views/
│   │   └── HermdianView.ts        # 主视图
│   │
│   ├── services/
│   │   ├── AIService.ts           # AI 服务（Hermes CLI + API）
│   │   └── FileService.ts         # 文件操作服务
│   │
│   ├── settings/
│   │   ├── SettingTab.ts          # 设置面板
│   │   └── ProviderModal.ts       # 提供商配置弹窗
│   │
│   └── styles/
│       └── index.css              # 样式入口
│
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── styles.css                     # 构建输出
```

---

## 二、核心文件实现

### 2.1 types.ts — 类型定义

```typescript
export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  modelName: string;
}

export interface HermdianSettings {
  mode: 'hermes-cli' | 'direct-api';
  hermesCliPath: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelId: string;
  modelName: string;
  customProviders: CustomProvider[];
  activeCustomProviderId: string;
  thinkingDepth: 'low' | 'high';
  maxContextLength: number;
  requestTimeout: number;
}

export const DEFAULT_SETTINGS: HermdianSettings = {
  mode: 'hermes-cli',
  hermesCliPath: 'hermes',
  provider: 'custom',
  apiKey: '',
  baseUrl: '',
  modelId: '',
  modelName: '',
  customProviders: [],
  activeCustomProviderId: '',
  thinkingDepth: 'low',
  maxContextLength: 4000,
  requestTimeout: 120000,
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  currentFile?: string;
  currentContent?: string;
  selectedText?: string;
}
```

### 2.2 main.ts — 插件入口

```typescript
import { Plugin, WorkspaceLeaf } from 'obsidian';
import { HermdianView, VIEW_TYPE_HERMDIAN } from './views/HermdianView';
import { SettingTab } from './settings/SettingTab';
import { HermdianSettings, DEFAULT_SETTINGS } from './types';
import { AIService } from './services/AIService';
import { FileService } from './services/FileService';

export default class HermdianPlugin extends Plugin {
  settings: HermdianSettings;
  aiService: AIService;
  fileService: FileService;

  async onload() {
    await this.loadSettings();
    
    this.aiService = new AIService(this.settings);
    this.fileService = new FileService(this.app, this.settings);

    this.registerView(
      VIEW_TYPE_HERMDIAN,
      (leaf) => new HermdianView(leaf, this)
    );

    this.addRibbonIcon('brain', 'Hermdian', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-hermdian',
      name: 'Open Hermdian',
      callback: () => this.activateView(),
    });

    this.addSettingTab(new SettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.aiService = new AIService(this.settings);
    this.fileService = new FileService(this.app, this.settings);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf;
    const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_HERMDIAN);

    if (existingLeaves.length > 0) {
      leaf = existingLeaves[0];
    } else {
      const newLeaf = workspace.getRightLeaf(false);
      if (!newLeaf) return;
      leaf = newLeaf;
      await leaf.setViewState({ type: VIEW_TYPE_HERMDIAN });
    }

    workspace.revealLeaf(leaf);
  }
}
```

### 2.3 HermdianView.ts — 主视图

```typescript
import { ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownView, setIcon } from 'obsidian';
import HermdianPlugin from '../main';
import { ChatMessage, ChatContext } from '../types';

export const VIEW_TYPE_HERMDIAN = 'hermdian-view';

export class HermdianView extends ItemView {
  plugin: HermdianPlugin;
  messages: ChatMessage[] = [];
  messageContainer: HTMLElement;
  inputEl: HTMLTextAreaElement;
  isLoading: boolean = false;

  constructor(leaf: WorkspaceLeaf, plugin: HermdianPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_HERMDIAN; }
  getDisplayText(): string { return 'Hermdian'; }
  getIcon(): string { return 'brain'; }

  async onOpen() {
    // 关键：覆盖容器样式实现全宽
    this.containerEl.style.padding = '0';
    this.containerEl.style.overflow = 'hidden';

    const container = this.contentEl;
    container.empty();
    container.addClass('hermdian');

    this.renderHeader(container);
    this.renderMessages(container);
    this.renderInput(container);
  }

  private renderHeader(container: HTMLElement) {
    // Header 实现...
  }

  private renderMessages(container: HTMLElement) {
    // 消息列表实现...
  }

  private renderInput(container: HTMLElement) {
    // 输入区域实现...
  }

  async handleSend() {
    // 发送消息逻辑...
  }
}
```

### 2.4 AIService.ts — AI 服务

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { requestUrl } from 'obsidian';
import { HermdianSettings, ChatContext, CustomProvider } from '../types';

const execAsync = promisify(exec);

export class AIService {
  private settings: HermdianSettings;

  constructor(settings: HermdianSettings) {
    this.settings = settings;
  }

  async chat(message: string, context?: ChatContext): Promise<string> {
    const prompt = this.buildPrompt(message, context);

    if (this.settings.mode === 'hermes-cli') {
      return this.chatViaCLI(prompt);
    } else {
      return this.chatViaAPI(prompt);
    }
  }

  private async chatViaCLI(prompt: string): Promise<string> {
    const cliPath = this.settings.hermesCliPath || 'hermes';
    const { stdout } = await execAsync(
      `${cliPath} chat -q "${this.escapeShell(prompt)}" --quiet`,
      { timeout: this.settings.requestTimeout }
    );
    return stdout.trim();
  }

  private async chatViaAPI(prompt: string): Promise<string> {
    const config = this.getActiveProvider();
    if (!config) throw new Error('请配置 API 提供商');

    const url = this.normalizeUrl(config.baseUrl);
    const response = await requestUrl({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
      }),
      throw: false,
    });

    const data = response.json;
    return data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
  }

  private getActiveProvider(): CustomProvider | null {
    if (this.settings.provider === 'custom' && this.settings.activeCustomProviderId) {
      return this.settings.customProviders.find(
        p => p.id === this.settings.activeCustomProviderId
      );
    }
    return null;
  }

  private normalizeUrl(url: string): string {
    url = url.replace(/\/+$/, '');
    if (!url.endsWith('/chat/completions') && !url.endsWith('/messages')) {
      url += '/chat/completions';
    }
    return url;
  }

  private buildPrompt(message: string, context?: ChatContext): string {
    let prompt = '';
    if (context?.currentFile) prompt += `当前文件: ${context.currentFile}\n\n`;
    if (context?.currentContent) prompt += `笔记内容:\n\`\`\`\n${context.currentContent}\n\`\`\`\n\n`;
    if (context?.selectedText) prompt += `选中文本:\n\`\`\`\n${context.selectedText}\n\`\`\`\n\n`;
    prompt += `用户问题: ${message}`;
    return prompt;
  }

  private escapeShell(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}
```

---

## 三、样式实现

### 3.1 参考 Claudian 的 CSS 规范

```css
/* 使用 Obsidian CSS 变量 */
.hermdian {
  --hermdian-bg: var(--background-primary);
  --hermdian-bg-secondary: var(--background-secondary);
  --hermdian-text: var(--text-normal);
  --hermdian-text-muted: var(--text-muted);
  --hermdian-accent: var(--interactive-accent);
  --hermdian-border: var(--background-modifier-border);
}

/* BEM 命名 */
.hermdian-container { }
.hermdian-header { }
.hermdian-header-left { }
.hermdian-header-center { }
.hermdian-header-right { }
.hermdian-messages { }
.hermdian-message { }
.hermdian-message--user { }
.hermdian-message--ai { }
.hermdian-bubble { }
.hermdian-bubble--user { }
.hermdian-bubble--ai { }
.hermdian-input-area { }
.hermdian-input { }
.hermdian-status { }
```

---

## 四、构建配置

### 4.1 package.json

```json
{
  "name": "hermdian",
  "version": "1.0.0",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "npm run build:js && npm run build:css",
    "build:js": "node esbuild.config.mjs production",
    "build:css": "cat src/styles/*.css > styles.css"
  },
  "devDependencies": {
    "esbuild": "^0.20.0",
    "obsidian": "^1.5.0",
    "tslib": "^2.6.0",
    "typescript": "^5.0.0"
  }
}
```

### 4.2 esbuild.config.mjs

```javascript
import esbuild from 'esbuild';

const prod = process.argv[2] === 'production';

await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/*'],
  format: 'cjs',
  target: 'es2018',
  platform: 'node',
  outfile: 'main.js',
  minify: prod,
  sourcemap: !prod,
}).then(ctx => prod ? ctx.rebuild() : ctx.watch());
```

---

## 五、开发流程

### 5.1 开发模式
```bash
cd ~/localproject/hermdian
npm run dev
```

### 5.2 构建生产版本
```bash
npm run build
```

### 5.3 安装到 Obsidian
```bash
./dev.sh dev
```

---

## 六、关键点总结

### 6.1 视图全宽实现
```typescript
async onOpen() {
  // 关键：覆盖 containerEl 样式
  this.containerEl.style.padding = '0';
  this.containerEl.style.overflow = 'hidden';
  
  // 使用 contentEl 构建内容
  const container = this.contentEl;
  container.addClass('hermdian');
}
```

### 6.2 CSS 变量使用
使用 Obsidian 的 CSS 变量确保主题适配：
- `var(--background-primary)` — 主背景
- `var(--text-normal)` — 文本颜色
- `var(--interactive-accent)` — 强调色
- `var(--background-modifier-border)` — 边框颜色

### 6.3 API 调用
使用 Obsidian 的 `requestUrl` 而不是 `fetch`，避免 CORS 问题。

---

## 七、后续扩展

### 可参考 Claudian 的功能
1. **标签页** — 多会话管理
2. **内联编辑** — 直接编辑笔记内容
3. **Plan 模式** — AI 规划后执行
4. **MCP 支持** — 工具调用
5. **子代理** — 后台任务

这些功能可以在后续版本中逐步添加。
