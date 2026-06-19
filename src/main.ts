import { Plugin, WorkspaceLeaf } from 'obsidian';
import { HermdianView, VIEW_TYPE_HERMDIAN } from './views/HermdianView';
import { SettingTab } from './settings/SettingTab';
import { HermdianSettings, DEFAULT_SETTINGS } from './types';
import { AIService } from './services/AIService';

export default class HermdianPlugin extends Plugin {
  settings: HermdianSettings;
  aiService: AIService;

  async onload() {
    console.log('[Hermdian] Loading plugin');

    await this.loadSettings();
    this.aiService = new AIService(this.settings);

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

    this.addCommand({
      id: 'new-chat',
      name: 'New Chat',
      callback: () => this.newChat(),
    });

    this.addSettingTab(new SettingTab(this.app, this));
  }

  onunload() {
    console.log('[Hermdian] Unloading plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.aiService = new AIService(this.settings);
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

  async newChat() {
    await this.activateView();
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_HERMDIAN);
    if (leaves.length > 0) {
      const view = leaves[0].view as HermdianView;
      view.clearMessages();
    }
  }
}
