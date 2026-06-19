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
  contextPercentEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: HermdianPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_HERMDIAN; }
  getDisplayText(): string { return 'Hermdian'; }
  getIcon(): string { return 'brain'; }

  async onOpen() {
    // 关键：覆盖 containerEl 样式实现全宽
    this.containerEl.style.padding = '0';
    this.containerEl.style.overflow = 'hidden';

    const container = this.contentEl;
    container.empty();
    container.addClass('hermdian');

    this.renderHeader(container);
    this.renderMessages(container);
    this.renderInput(container);
  }

  async onClose() {}

  private getModelName(): string {
    if (this.plugin.settings.mode === 'hermes-cli') return 'Hermes CLI';
    if (this.plugin.settings.provider === 'custom' && this.plugin.settings.activeCustomProviderId) {
      const p = this.plugin.settings.customProviders.find(x => x.id === this.plugin.settings.activeCustomProviderId);
      if (p) return p.modelName || p.modelId;
    }
    return this.plugin.settings.modelName || this.plugin.settings.modelId || '未配置';
  }

  private renderHeader(container: HTMLElement) {
    const header = container.createDiv({ cls: 'hermdian-header' });

    const left = header.createDiv({ cls: 'hermdian-header-left' });
    const logo = left.createDiv({ cls: 'hermdian-logo' });
    setIcon(logo, 'brain');
    left.createSpan({ cls: 'hermdian-title', text: 'Hermdian' });

    const center = header.createDiv({ cls: 'hermdian-header-center' });
    const badge = center.createDiv({ cls: 'hermdian-model-badge' });
    setIcon(badge.createSpan({ cls: 'hermdian-badge-icon' }), 'cpu');
    badge.createSpan({ text: this.getModelName() });

    const right = header.createDiv({ cls: 'hermdian-header-right' });

    const newBtn = right.createDiv({ cls: 'hermdian-header-btn' });
    setIcon(newBtn, 'plus');
    newBtn.addEventListener('click', () => this.clearMessages());

    const settingsBtn = right.createDiv({ cls: 'hermdian-header-btn' });
    setIcon(settingsBtn, 'settings');
    settingsBtn.addEventListener('click', () => {
      // @ts-ignore
      this.app.setting.open();
      // @ts-ignore
      this.app.setting.openTabById('hermdian');
    });

    const closeBtn = right.createDiv({ cls: 'hermdian-header-btn' });
    setIcon(closeBtn, 'x');
    closeBtn.addEventListener('click', () => this.leaf.detach());
  }

  private renderMessages(container: HTMLElement) {
    this.messageContainer = container.createDiv({ cls: 'hermdian-messages' });

    // 欢迎消息
    const welcome = this.messageContainer.createDiv({ cls: 'hermdian-msg hermdian-msg-ai' });
    const bubble = welcome.createDiv({ cls: 'hermdian-bubble hermdian-bubble-ai' });
    bubble.innerHTML = `<p>你好！我是 <strong>Hermdian</strong> 👋</p>
<p>我可以帮你：</p>
<ul>
<li>📖 阅读和理解笔记</li>
<li>✏️ 创建和编辑内容</li>
<li>🔍 搜索知识库</li>
<li>💡 提供写作建议</li>
</ul>
<p>输入问题开始对话！</p>`;
  }

  private renderInput(container: HTMLElement) {
    const inputArea = container.createDiv({ cls: 'hermdian-input-area' });

    // 上下文标签
    const contextBar = inputArea.createDiv({ cls: 'hermdian-context-bar' });
    this.updateContext(contextBar);

    // 输入框
    const inputRow = inputArea.createDiv({ cls: 'hermdian-input-row' });

    this.inputEl = inputRow.createEl('textarea', {
      cls: 'hermdian-input',
      placeholder: '输入消息...',
    });

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 100) + 'px';
      this.updateContextPercent();
    });

    const sendBtn = inputRow.createDiv({ cls: 'hermdian-send-btn' });
    setIcon(sendBtn, 'arrow-up');
    sendBtn.addEventListener('click', () => this.handleSend());

    // 状态栏
    const statusBar = inputArea.createDiv({ cls: 'hermdian-status' });
    this.renderStatus(statusBar);
  }

  private renderStatus(statusBar: HTMLElement) {
    statusBar.empty();

    const left = statusBar.createDiv({ cls: 'hermdian-status-left' });

    const modelTag = left.createDiv({ cls: 'hermdian-status-tag' });
    setIcon(modelTag.createSpan({ cls: 'hermdian-tag-icon' }), 'cpu');
    modelTag.createSpan({ text: this.getModelName() });

    const thinkTag = left.createEl('label', { cls: 'hermdian-status-tag hermdian-toggle' });
    const thinkInput = thinkTag.createEl('input', { type: 'checkbox' });
    setIcon(thinkTag.createSpan({ cls: 'hermdian-tag-icon' }), 'brain');
    thinkTag.createSpan({ text: '深度思考' });
    thinkInput.checked = this.plugin.settings.thinkingDepth === 'high';
    thinkInput.addEventListener('change', (e) => {
      this.plugin.settings.thinkingDepth = (e.target as HTMLInputElement).checked ? 'high' : 'low';
      this.plugin.saveSettings();
    });

    const right = statusBar.createDiv({ cls: 'hermdian-status-right' });

    const ctxTag = right.createDiv({ cls: 'hermdian-status-tag' });
    setIcon(ctxTag.createSpan({ cls: 'hermdian-tag-icon' }), 'database');
    this.contextPercentEl = ctxTag.createSpan({ text: '0%' });

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView?.file) {
      const fileTag = right.createDiv({ cls: 'hermdian-status-tag hermdian-status-file' });
      setIcon(fileTag.createSpan({ cls: 'hermdian-tag-icon' }), 'file-text');
      fileTag.createSpan({ text: activeView.file.basename });
    }

    this.updateContextPercent();
  }

  private updateContextPercent() {
    if (!this.contextPercentEl) return;
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const content = activeView?.editor?.getValue() || '';
    const percent = Math.min(Math.round((content.length / this.plugin.settings.maxContextLength) * 100), 100);
    this.contextPercentEl.textContent = `${percent}%`;
  }

  private updateContext(container: HTMLElement) {
    container.empty();
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView?.file) {
      const tag = container.createDiv({ cls: 'hermdian-context-tag' });
      setIcon(tag.createSpan({ cls: 'hermdian-tag-icon' }), 'file-text');
      tag.createSpan({ text: activeView.file.basename });
    }

    const selection = activeView?.editor?.getSelection();
    if (selection) {
      const tag = container.createDiv({ cls: 'hermdian-context-tag hermdian-context-selection' });
      setIcon(tag.createSpan({ cls: 'hermdian-tag-icon' }), 'text-cursor-input');
      tag.createSpan({ text: '已选中文本' });
    }
  }

  async handleSend() {
    const message = this.inputEl.value.trim();
    if (!message || this.isLoading) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';

    this.addUserMessage(message);

    const context = this.getContext();
    this.isLoading = true;
    const thinkingEl = this.addThinking();
    const startTime = Date.now();

    try {
      const response = await this.plugin.aiService.chat(message, context);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      thinkingEl.remove();
      this.addAiMessage(response, elapsed);
    } catch (error: any) {
      thinkingEl.remove();
      this.addErrorMessage(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  private getContext(): ChatContext {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const context: ChatContext = {};
    if (activeView) {
      context.currentFile = activeView.file?.path;
      context.currentContent = activeView.editor?.getValue() || '';
      const selection = activeView.editor?.getSelection();
      if (selection) context.selectedText = selection;
    }
    return context;
  }

  private addUserMessage(text: string) {
    const msg = this.messageContainer.createDiv({ cls: 'hermdian-msg hermdian-msg-user' });
    const bubble = msg.createDiv({ cls: 'hermdian-bubble hermdian-bubble-user' });
    bubble.textContent = text;
    this.addCopyButton(bubble, text);
    this.scrollToBottom();
  }

  private addAiMessage(text: string, elapsed?: string) {
    const msg = this.messageContainer.createDiv({ cls: 'hermdian-msg hermdian-msg-ai' });

    const header = msg.createDiv({ cls: 'hermdian-msg-header' });
    header.createSpan({ cls: 'hermdian-msg-arrow', text: '←' });
    if (elapsed) {
      header.createSpan({ cls: 'hermdian-msg-time', text: `${elapsed}s` });
    }

    const bubble = msg.createDiv({ cls: 'hermdian-bubble hermdian-bubble-ai' });
    if (this.plugin.settings.enableMarkdown) {
      MarkdownRenderer.renderMarkdown(text, bubble, '', this.plugin);
    } else {
      bubble.textContent = text;
    }
    this.addCopyButton(bubble, text);

    this.scrollToBottom();
  }

  private addThinking(): HTMLElement {
    const msg = this.messageContainer.createDiv({ cls: 'hermdian-msg hermdian-msg-ai' });
    const header = msg.createDiv({ cls: 'hermdian-msg-header' });
    header.createSpan({ cls: 'hermdian-msg-arrow', text: '←' });

    const bubble = msg.createDiv({ cls: 'hermdian-bubble hermdian-bubble-ai hermdian-thinking' });
    bubble.createDiv({ cls: 'hermdian-spinner' });
    bubble.createSpan({ cls: 'hermdian-thinking-text', text: '思考中...' });

    this.scrollToBottom();
    return msg;
  }

  private addCopyButton(bubble: HTMLElement, text: string) {
    bubble.addClass('hermdian-bubble-hoverable');
    const copyBtn = bubble.createDiv({ cls: 'hermdian-copy-btn' });
    setIcon(copyBtn, 'copy');
    copyBtn.setAttribute('aria-label', '复制');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '';
      setIcon(copyBtn, 'check');
      setTimeout(() => {
        copyBtn.innerHTML = '';
        setIcon(copyBtn, 'copy');
      }, 1500);
    });
  }

  private addErrorMessage(error: string) {
    const msg = this.messageContainer.createDiv({ cls: 'hermdian-msg hermdian-msg-ai' });
    const bubble = msg.createDiv({ cls: 'hermdian-bubble hermdian-bubble-error' });
    bubble.textContent = `❌ ${error}`;
    this.scrollToBottom();
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    });
  }

  clearMessages() {
    this.messages = [];
    this.messageContainer.empty();
    const welcome = this.messageContainer.createDiv({ cls: 'hermdian-msg hermdian-msg-ai' });
    const bubble = welcome.createDiv({ cls: 'hermdian-bubble hermdian-bubble-ai' });
    bubble.textContent = '对话已清空，有什么新问题吗？';
  }

  sendMessage(message: string) {
    this.inputEl.value = message;
    this.handleSend();
  }
}
