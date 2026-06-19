import { App, PluginSettingTab, Setting, Modal } from 'obsidian';
import HermdianPlugin from '../main';
import { HermdianSettings, CustomProvider } from '../types';

export class SettingTab extends PluginSettingTab {
  plugin: HermdianPlugin;

  constructor(app: App, plugin: HermdianPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Hermdian 设置' });

    // 运行模式
    containerEl.createEl('h3', { text: '运行模式' });
    new Setting(containerEl)
      .setName('集成模式')
      .setDesc('选择 Hermes CLI（推荐）或直连 API')
      .addDropdown(dropdown => dropdown
        .addOption('hermes-cli', 'Hermes CLI')
        .addOption('direct-api', '直连 API')
        .setValue(this.plugin.settings.mode)
        .onChange(async (value: 'hermes-cli' | 'direct-api') => {
          this.plugin.settings.mode = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    // Hermes CLI 设置
    if (this.plugin.settings.mode === 'hermes-cli') {
      containerEl.createEl('h3', { text: 'Hermes CLI' });
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

    // 直连 API 设置
    if (this.plugin.settings.mode === 'direct-api') {
      containerEl.createEl('h3', { text: '自定义提供商' });
      this.renderCustomProviders(containerEl);

      new Setting(containerEl)
        .setName('添加提供商')
        .addButton(button => button
          .setButtonText('+ 添加')
          .setCta()
          .onClick(() => {
            new ProviderModal(this.app, this.plugin, () => this.display()).open();
          }));
    }

    // 行为设置
    containerEl.createEl('h3', { text: '行为设置' });

    new Setting(containerEl)
      .setName('请求超时')
      .setDesc('秒')
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
      .setDesc('Token 数量（约 1 token ≈ 1.5 个中文字符）')
      .addSlider(slider => slider
        .setLimits(2000, 128000, 2000)
        .setValue(this.plugin.settings.maxContextLength)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxContextLength = value;
          await this.plugin.saveSettings();
        }));

    // 界面设置
    containerEl.createEl('h3', { text: '界面设置' });

    new Setting(containerEl)
      .setName('启用 Markdown')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableMarkdown)
        .onChange(async (value) => {
          this.plugin.settings.enableMarkdown = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('显示时间戳')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showTimestamp)
        .onChange(async (value) => {
          this.plugin.settings.showTimestamp = value;
          await this.plugin.saveSettings();
        }));
  }

  private renderCustomProviders(containerEl: HTMLElement) {
    const providers = this.plugin.settings.customProviders;

    if (providers.length === 0) {
      containerEl.createEl('p', {
        text: '暂无自定义提供商',
        cls: 'hermdian-setting-hint'
      });
      return;
    }

    const list = containerEl.createDiv({ cls: 'hermdian-provider-list' });

    for (const provider of providers) {
      const isActive = this.plugin.settings.activeCustomProviderId === provider.id;
      const item = list.createDiv({ cls: `hermdian-provider-item ${isActive ? 'active' : ''}` });

      const info = item.createDiv({ cls: 'hermdian-provider-info' });
      info.createEl('strong', { text: provider.name });
      info.createEl('span', { text: ` | ${provider.modelName || provider.modelId}`, cls: 'hermdian-setting-muted' });

      const controls = item.createDiv({ cls: 'hermdian-provider-controls' });

      if (!isActive) {
        controls.createEl('button', { text: '使用' }).addEventListener('click', async () => {
          this.plugin.settings.activeCustomProviderId = provider.id;
          this.plugin.settings.provider = 'custom';
          await this.plugin.saveSettings();
          this.display();
        });
      }

      // 编辑按钮
      controls.createEl('button', { text: '编辑' }).addEventListener('click', () => {
        new ProviderModal(this.app, this.plugin, () => this.display(), provider).open();
      });

      controls.createEl('button', { text: '删除' }).addEventListener('click', async () => {
        this.plugin.settings.customProviders = this.plugin.settings.customProviders.filter(p => p.id !== provider.id);
        if (this.plugin.settings.activeCustomProviderId === provider.id) {
          this.plugin.settings.activeCustomProviderId = '';
        }
        await this.plugin.saveSettings();
        this.display();
      });
    }
  }
}

class ProviderModal extends Modal {
  plugin: HermdianPlugin;
  onSave: () => void;
  provider?: CustomProvider;
  nameInput: HTMLInputElement;
  baseUrlInput: HTMLInputElement;
  apiKeyInput: HTMLInputElement;
  modelIdInput: HTMLInputElement;
  modelNameInput: HTMLInputElement;

  constructor(app: App, plugin: HermdianPlugin, onSave: () => void, provider?: CustomProvider) {
    super(app);
    this.plugin = plugin;
    this.onSave = onSave;
    this.provider = provider;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: this.provider ? '编辑提供商' : '添加自定义提供商' });

    const form = contentEl.createDiv({ cls: 'hermdian-form' });

    // 名称
    const nameField = form.createDiv({ cls: 'hermdian-form-field' });
    nameField.createEl('label', { text: '名称', cls: 'hermdian-form-label' });
    this.nameInput = nameField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'text',
      placeholder: '例如：讯飞星辰',
      value: this.provider?.name || '',
    });

    // 接口地址
    const urlField = form.createDiv({ cls: 'hermdian-form-field' });
    urlField.createEl('label', { text: '接口地址', cls: 'hermdian-form-label' });
    urlField.createEl('span', { text: 'API 的 Base URL，会自动补全路径', cls: 'hermdian-form-hint' });
    this.baseUrlInput = urlField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'text',
      placeholder: '例如：https://maas-api.cn-huabei-1.xf-yun.com/v2',
      value: this.provider?.baseUrl || '',
    });

    // API Key
    const keyField = form.createDiv({ cls: 'hermdian-form-field' });
    keyField.createEl('label', { text: 'API Key', cls: 'hermdian-form-label' });
    this.apiKeyInput = keyField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'password',
      placeholder: '认证密钥',
      value: this.provider?.apiKey || '',
    });

    // Model ID
    const modelIdField = form.createDiv({ cls: 'hermdian-form-field' });
    modelIdField.createEl('label', { text: 'Model ID', cls: 'hermdian-form-label' });
    modelIdField.createEl('span', { text: 'API 调用时使用的模型标识符', cls: 'hermdian-form-hint' });
    this.modelIdInput = modelIdField.createEl('input', {
      cls: 'hermdian-form-input',
      type: 'text',
      placeholder: '例如：xopqwen36v35b',
      value: this.provider?.modelId || '',
    });

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

    // 按钮
    const buttons = contentEl.createDiv({ cls: 'hermdian-modal-buttons' });

    buttons.createEl('button', { text: '取消' }).addEventListener('click', () => this.close());

    buttons.createEl('button', {
      text: this.provider ? '保存' : '添加',
      cls: 'mod-cta'
    }).addEventListener('click', () => this.save());
  }

  async save() {
    const name = this.nameInput.value.trim();
    const baseUrl = this.baseUrlInput.value.trim();
    const apiKey = this.apiKeyInput.value.trim();
    const modelId = this.modelIdInput.value.trim();
    const modelName = this.modelNameInput.value.trim();

    if (!name || !baseUrl || !modelId) return;

    if (this.provider) {
      // 编辑模式
      const index = this.plugin.settings.customProviders.findIndex(p => p.id === this.provider!.id);
      if (index >= 0) {
        this.plugin.settings.customProviders[index] = {
          ...this.plugin.settings.customProviders[index],
          name, baseUrl, apiKey, modelId,
          modelName: modelName || modelId,
        };
      }
    } else {
      // 添加模式
      this.plugin.settings.customProviders.push({
        id: Date.now().toString(),
        name, baseUrl, apiKey, modelId,
        modelName: modelName || modelId,
      });
    }

    await this.plugin.saveSettings();
    this.close();
    this.onSave();
  }

  onClose() {
    this.contentEl.empty();
  }
}
