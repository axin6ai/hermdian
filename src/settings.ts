import { App, PluginSettingTab, Setting, Modal } from 'obsidian';
import HermdianPlugin from './main';
import { HermdianSettings, CustomProvider } from './types';

export class HermdianSettingTab extends PluginSettingTab {
  plugin: HermdianPlugin;

  constructor(app: App, plugin: HermdianPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Hermdian 设置' });

    // Mode selection
    containerEl.createEl('h3', { text: '运行模式' });

    new Setting(containerEl)
      .setName('集成模式')
      .setDesc('选择 Hermes CLI（推荐）或直连 API')
      .addDropdown(dropdown => dropdown
        .addOption('hermes-cli', 'Hermes CLI（推荐）')
        .addOption('direct-api', '直连 API')
        .setValue(this.plugin.settings.mode)
        .onChange(async (value: 'hermes-cli' | 'direct-api') => {
          this.plugin.settings.mode = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    // Hermes CLI settings
    if (this.plugin.settings.mode === 'hermes-cli') {
      containerEl.createEl('h3', { text: 'Hermes CLI 配置' });

      new Setting(containerEl)
        .setName('CLI 路径')
        .setDesc('Hermes CLI 可执行文件路径')
        .addText(text => text
          .setPlaceholder('hermes')
          .setValue(this.plugin.settings.hermesCliPath)
          .onChange(async (value) => {
            this.plugin.settings.hermesCliPath = value;
            await this.plugin.saveSettings();
          }));
    }

    // Direct API settings
    if (this.plugin.settings.mode === 'direct-api') {
      containerEl.createEl('h3', { text: 'API 配置' });

      // Built-in providers
      containerEl.createEl('h4', { text: '内置提供商' });

      new Setting(containerEl)
        .setName('提供商')
        .setDesc('选择预设的 LLM 提供商')
        .addDropdown(dropdown => dropdown
          .addOption('custom', '自定义提供商')
          .addOption('openrouter', 'OpenRouter')
          .addOption('openai', 'OpenAI')
          .addOption('anthropic', 'Anthropic')
          .addOption('google', 'Google Gemini')
          .addOption('deepseek', 'DeepSeek')
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value;
            if (value !== 'custom') {
              this.plugin.settings.activeCustomProviderId = '';
            }
            await this.plugin.saveSettings();
            this.display();
          }));

      // Show built-in provider settings if not custom
      if (this.plugin.settings.provider !== 'custom') {
        this.renderBuiltInProviderSettings(containerEl);
      }

      // Custom providers section
      containerEl.createEl('h4', { text: '自定义提供商' });

      // List existing custom providers
      this.renderCustomProvidersList(containerEl);

      // Add new custom provider button
      const addBtnContainer = containerEl.createDiv({ cls: 'hermdian-add-btn-container' });
      const addBtn = addBtnContainer.createEl('button', {
        cls: 'hermdian-add-provider-btn',
      });
      addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> 添加自定义提供商`;
      addBtn.addEventListener('click', () => {
        new AddCustomProviderModal(this.app, this.plugin, () => {
          this.display();
        }).open();
      });
    }

    // Behavior settings
    containerEl.createEl('h3', { text: '行为配置' });

    new Setting(containerEl)
      .setName('请求超时')
      .setDesc('API 请求超时时间（秒）')
      .addSlider(slider => slider
        .setLimits(30, 300, 30)
        .setValue(this.plugin.settings.requestTimeout / 1000)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.requestTimeout = value * 1000;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('最大上下文长度')
      .setDesc('发送给模型的最大上下文字符数')
      .addSlider(slider => slider
        .setLimits(1000, 16000, 1000)
        .setValue(this.plugin.settings.maxContextLength)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxContextLength = value;
          await this.plugin.saveSettings();
        }));

    // File interaction settings
    containerEl.createEl('h3', { text: '文件交互' });

    new Setting(containerEl)
      .setName('自动备份')
      .setDesc('修改文件前自动创建备份')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoBackup)
        .onChange(async (value) => {
          this.plugin.settings.autoBackup = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('操作确认')
      .setDesc('执行文件操作前显示确认对话框')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.confirmOperations)
        .onChange(async (value) => {
          this.plugin.settings.confirmOperations = value;
          await this.plugin.saveSettings();
        }));

    // UI settings
    containerEl.createEl('h3', { text: '界面设置' });

    new Setting(containerEl)
      .setName('显示时间戳')
      .setDesc('在消息旁显示时间')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showTimestamp)
        .onChange(async (value) => {
          this.plugin.settings.showTimestamp = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('启用 Markdown')
      .setDesc('渲染 AI 响应中的 Markdown')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableMarkdown)
        .onChange(async (value) => {
          this.plugin.settings.enableMarkdown = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('代码高亮')
      .setDesc('对代码块启用语法高亮')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableCodeHighlight)
        .onChange(async (value) => {
          this.plugin.settings.enableCodeHighlight = value;
          await this.plugin.saveSettings();
        }));
  }

  private renderBuiltInProviderSettings(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('你的 API Key')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('接口地址')
      .setDesc('API 端点（可选，留空使用默认地址）')
      .addText(text => text
        .setPlaceholder('https://api.example.com/v1')
        .setValue(this.plugin.settings.baseUrl)
        .onChange(async (value) => {
          this.plugin.settings.baseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Model ID')
      .setDesc('模型标识符（API 调用时使用）')
      .addText(text => text
        .setPlaceholder('anthropic/claude-sonnet-4')
        .setValue(this.plugin.settings.modelId)
        .onChange(async (value) => {
          this.plugin.settings.modelId = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Model Name')
      .setDesc('模型显示名称（用于界面展示）')
      .addText(text => text
        .setPlaceholder('Claude Sonnet')
        .setValue(this.plugin.settings.modelName)
        .onChange(async (value) => {
          this.plugin.settings.modelName = value;
          await this.plugin.saveSettings();
        }));
  }

  private renderCustomProvidersList(containerEl: HTMLElement) {
    const providers = this.plugin.settings.customProviders;

    if (providers.length === 0) {
      const emptyState = containerEl.createDiv({ cls: 'hermdian-empty-state' });
      emptyState.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path d="M9 10h.01M15 10h.01M8 14s1.5 2 4 2 4-2 4-2"/>
        </svg>
        <p>暂无自定义提供商</p>
        <span>点击下方按钮添加你的 API 配置</span>
      `;
      return;
    }

    const listContainer = containerEl.createDiv({ cls: 'hermdian-custom-providers' });

    for (const provider of providers) {
      const isActive = this.plugin.settings.activeCustomProviderId === provider.id;
      
      const card = listContainer.createDiv({
        cls: `hermdian-provider-card ${isActive ? 'hermdian-provider-card-active' : ''}`
      });

      // Header with status
      const header = card.createDiv({ cls: 'hermdian-provider-card-header' });
      
      const statusDot = header.createSpan({
        cls: `hermdian-status-dot ${isActive ? 'hermdian-status-active' : ''}`
      });
      
      const name = header.createSpan({ cls: 'hermdian-provider-name', text: provider.name });
      
      if (isActive) {
        const activeTag = header.createSpan({ cls: 'hermdian-active-tag', text: '使用中' });
      }

      // Model info
      const info = card.createDiv({ cls: 'hermdian-provider-info' });
      
      const modelRow = info.createDiv({ cls: 'hermdian-info-row' });
      modelRow.createSpan({ cls: 'hermdian-info-label', text: '模型' });
      modelRow.createSpan({ cls: 'hermdian-info-value', text: provider.modelName || provider.modelId });

      const idRow = info.createDiv({ cls: 'hermdian-info-row' });
      idRow.createSpan({ cls: 'hermdian-info-label', text: 'ID' });
      idRow.createSpan({ cls: 'hermdian-info-value hermdian-info-code', text: provider.modelId });

      const urlRow = info.createDiv({ cls: 'hermdian-info-row' });
      urlRow.createSpan({ cls: 'hermdian-info-label', text: '接口' });
      const urlValue = urlRow.createSpan({ cls: 'hermdian-info-value hermdian-info-url' });
      // Truncate long URLs
      const displayUrl = provider.baseUrl.length > 40 
        ? provider.baseUrl.substring(0, 37) + '...' 
        : provider.baseUrl;
      urlValue.textContent = displayUrl;
      urlValue.title = provider.baseUrl;

      // Controls
      const controls = card.createDiv({ cls: 'hermdian-provider-controls' });

      if (!isActive) {
        const useBtn = controls.createEl('button', {
          cls: 'hermdian-btn hermdian-btn-use',
          text: '使用此模型',
        });
        useBtn.addEventListener('click', async () => {
          this.plugin.settings.activeCustomProviderId = provider.id;
          this.plugin.settings.provider = 'custom';
          await this.plugin.saveSettings();
          this.display();
        });
      }

      const editBtn = controls.createEl('button', {
        cls: 'hermdian-btn hermdian-btn-icon',
        attr: { 'title': '编辑' }
      });
      editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener('click', () => {
        new AddCustomProviderModal(this.app, this.plugin, () => {
          this.display();
        }, provider).open();
      });

      const deleteBtn = controls.createEl('button', {
        cls: 'hermdian-btn hermdian-btn-icon hermdian-btn-danger',
        attr: { 'title': '删除' }
      });
      deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`确定要删除 "${provider.name}" 吗？`)) {
          this.plugin.settings.customProviders = this.plugin.settings.customProviders.filter(
            p => p.id !== provider.id
          );
          if (this.plugin.settings.activeCustomProviderId === provider.id) {
            this.plugin.settings.activeCustomProviderId = '';
          }
          await this.plugin.saveSettings();
          this.display();
        }
      });
    }
  }
}

class AddCustomProviderModal extends Modal {
  plugin: HermdianPlugin;
  onSave: () => void;
  provider?: CustomProvider;
  nameInput: HTMLInputElement;
  baseUrlInput: HTMLInputElement;
  apiKeyInput: HTMLInputElement;
  modelIdInput: HTMLInputElement;
  modelNameInput: HTMLInputElement;
  previewEl: HTMLElement;

  constructor(app: App, plugin: HermdianPlugin, onSave: () => void, provider?: CustomProvider) {
    super(app);
    this.plugin = plugin;
    this.onSave = onSave;
    this.provider = provider;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', {
      text: this.provider ? '编辑提供商' : '添加自定义提供商'
    });

    // Preview card
    this.previewEl = contentEl.createDiv({ cls: 'hermdian-provider-preview' });
    this.updatePreview();

    // Form
    const form = contentEl.createDiv({ cls: 'hermdian-form' });

    // Name
    const nameField = form.createDiv({ cls: 'hermdian-form-field' });
    nameField.createEl('label', { text: '提供商名称', cls: 'hermdian-form-label' });
    nameField.createEl('span', { text: '显示名称，便于识别', cls: 'hermdian-form-hint' });
    this.nameInput = nameField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'text',
      placeholder: '例如：讯飞星辰、我的API',
      value: this.provider?.name || '',
    });
    this.nameInput.addEventListener('input', () => this.updatePreview());

    // Base URL
    const urlField = form.createDiv({ cls: 'hermdian-form-field' });
    urlField.createEl('label', { text: '接口地址', cls: 'hermdian-form-label' });
    urlField.createEl('span', { text: 'API 的 Base URL，系统会自动补全接口路径', cls: 'hermdian-form-hint' });
    this.baseUrlInput = urlField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'text',
      placeholder: '例如：https://maas-api.cn-huabei-1.xf-yun.com/v2',
      value: this.provider?.baseUrl || '',
    });
    this.baseUrlInput.addEventListener('input', () => this.updatePreview());

    // API Key
    const keyField = form.createDiv({ cls: 'hermdian-form-field' });
    keyField.createEl('label', { text: 'API Key', cls: 'hermdian-form-label' });
    keyField.createEl('span', { text: '认证密钥', cls: 'hermdian-form-hint' });
    const keyWrapper = keyField.createDiv({ cls: 'hermdian-input-wrapper-modal' });
    this.apiKeyInput = keyWrapper.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'password',
      placeholder: 'sk-... 或其他格式',
      value: this.provider?.apiKey || '',
    });
    const toggleBtn = keyWrapper.createEl('button', {
      cls: 'hermdian-btn-toggle',
      attr: { 'type': 'button', 'title': '显示/隐藏' }
    });
    toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    toggleBtn.addEventListener('click', () => {
      const isPassword = this.apiKeyInput.type === 'password';
      this.apiKeyInput.type = isPassword ? 'text' : 'password';
    });

    // Model ID
    const modelIdField = form.createDiv({ cls: 'hermdian-form-field' });
    modelIdField.createEl('label', { text: 'Model ID', cls: 'hermdian-form-label' });
    modelIdField.createEl('span', { text: 'API 调用时使用的模型标识符', cls: 'hermdian-form-hint' });
    this.modelIdInput = modelIdField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'text',
      placeholder: '例如：xopqwen36v35b、gpt-4',
      value: this.provider?.modelId || '',
    });
    this.modelIdInput.addEventListener('input', () => this.updatePreview());

    // Model Name
    const modelNameField = form.createDiv({ cls: 'hermdian-form-field' });
    modelNameField.createEl('label', { text: 'Model Name', cls: 'hermdian-form-label' });
    modelNameField.createEl('span', { text: '界面显示的模型名称（可选）', cls: 'hermdian-form-hint' });
    this.modelNameInput = modelNameField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'text',
      placeholder: '例如：Qwen3.6-35B-A3B',
      value: this.provider?.modelName || '',
    });
    this.modelNameInput.addEventListener('input', () => this.updatePreview());

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'hermdian-modal-buttons' });

    buttonContainer.createEl('button', {
      text: '取消',
      cls: 'hermdian-btn hermdian-btn-cancel',
    }).addEventListener('click', () => this.close());

    buttonContainer.createEl('button', {
      text: this.provider ? '保存修改' : '添加提供商',
      cls: 'hermdian-btn hermdian-btn-save',
    }).addEventListener('click', () => this.save());
  }

  updatePreview() {
    const name = this.nameInput.value || '未命名';
    const modelId = this.modelIdInput.value || '-';
    const modelName = this.modelNameInput.value || modelId;
    const baseUrl = this.baseUrlInput.value || '-';

    this.previewEl.innerHTML = `
      <div class="hermdian-preview-header">预览</div>
      <div class="hermdian-preview-content">
        <div class="hermdian-preview-name">${name}</div>
        <div class="hermdian-preview-model">${modelName}</div>
        <div class="hermdian-preview-id">ID: ${modelId}</div>
        <div class="hermdian-preview-url">接口: ${baseUrl.length > 35 ? baseUrl.substring(0, 32) + '...' : baseUrl}</div>
      </div>
    `;
  }

  async save() {
    const name = this.nameInput.value.trim();
    const baseUrl = this.baseUrlInput.value.trim();
    const apiKey = this.apiKeyInput.value.trim();
    const modelId = this.modelIdInput.value.trim();
    const modelName = this.modelNameInput.value.trim();

    if (!name) {
      this.showError('请输入提供商名称');
      return;
    }
    if (!baseUrl) {
      this.showError('请输入接口地址');
      return;
    }
    if (!modelId) {
      this.showError('请输入 Model ID');
      return;
    }

    if (this.provider) {
      // Update existing
      const index = this.plugin.settings.customProviders.findIndex(
        p => p.id === this.provider!.id
      );
      if (index >= 0) {
        this.plugin.settings.customProviders[index] = {
          ...this.plugin.settings.customProviders[index],
          name,
          baseUrl,
          apiKey,
          modelId,
          modelName: modelName || modelId,
        };
      }
    } else {
      // Add new
      const newProvider: CustomProvider = {
        id: Date.now().toString(),
        name,
        baseUrl,
        apiKey,
        modelId,
        modelName: modelName || modelId,
      };
      this.plugin.settings.customProviders.push(newProvider);
    }

    await this.plugin.saveSettings();
    this.close();
    this.onSave();
  }

  showError(message: string) {
    // Simple error display
    const existing = this.contentEl.querySelector('.hermdian-form-error');
    if (existing) existing.remove();
    
    const error = this.contentEl.createDiv({ cls: 'hermdian-form-error' });
    error.textContent = message;
    setTimeout(() => error.remove(), 3000);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
