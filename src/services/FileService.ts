import { App, TFile, TFolder } from 'obsidian';
import { HermdianSettings } from '../types';

export class FileService {
  private app: App;
  private settings: HermdianSettings;

  constructor(app: App, settings: HermdianSettings) {
    this.app = app;
    this.settings = settings;
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<string> {
    if (!this.isPathAllowed(path, 'read')) {
      throw new Error(`无权读取: ${path}`);
    }

    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      throw new Error(`文件不存在: ${path}`);
    }

    return this.app.vault.read(file);
  }

  /**
   * Create a new file
   */
  async createFile(path: string, content: string): Promise<TFile> {
    if (!this.isPathAllowed(path, 'write')) {
      throw new Error(`无权写入: ${path}`);
    }

    // Ensure directory exists
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
      await this.app.vault.createFolder(dir);
    }

    return this.app.vault.create(path, content);
  }

  /**
   * Modify existing file
   */
  async modifyFile(path: string, content: string): Promise<void> {
    if (!this.isPathAllowed(path, 'write')) {
      throw new Error(`无权写入: ${path}`);
    }

    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      throw new Error(`文件不存在: ${path}`);
    }

    // Auto backup
    if (this.settings.autoBackup) {
      await this.backupFile(file);
    }

    await this.app.vault.modify(file, content);
  }

  /**
   * Search files by content
   */
  async searchFiles(query: string): Promise<TFile[]> {
    const files = this.app.vault.getMarkdownFiles();
    const results: TFile[] = [];

    for (const file of files) {
      // Filename match
      if (file.basename.toLowerCase().includes(query.toLowerCase())) {
        results.push(file);
        continue;
      }

      // Content match
      const content = await this.app.vault.read(file);
      if (content.toLowerCase().includes(query.toLowerCase())) {
        results.push(file);
      }
    }

    return results;
  }

  /**
   * Get currently active file
   */
  getActiveFile(): TFile | null {
    return this.app.workspace.getActiveFile();
  }

  /**
   * List files in folder
   */
  async listFiles(folderPath: string): Promise<string[]> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) {
      throw new Error(`文件夹不存在: ${folderPath}`);
    }

    const files: string[] = [];
    const recurse = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFile) {
          files.push(child.path);
        } else if (child instanceof TFolder) {
          recurse(child);
        }
      }
    };

    recurse(folder);
    return files;
  }

  /**
   * Check if path is allowed for operation
   */
  private isPathAllowed(path: string, operation: 'read' | 'write'): boolean {
    const allowedPaths = operation === 'read'
      ? this.settings.allowedReadFolders
      : this.settings.allowedWriteFolders;

    // Default: allow all
    if (allowedPaths.includes('/')) {
      return true;
    }

    return allowedPaths.some(allowed => path.startsWith(allowed));
  }

  /**
   * Create backup of file
   */
  private async backupFile(file: TFile): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = '.hermdian/backups';

      // Ensure backup directory exists
      if (!this.app.vault.getAbstractFileByPath(backupDir)) {
        await this.app.vault.createFolder(backupDir);
      }

      const backupPath = `${backupDir}/${file.basename}_${timestamp}.md`;
      const content = await this.app.vault.read(file);

      await this.app.vault.create(backupPath, content);
    } catch (error) {
      console.error('Backup failed:', error);
      // Don't throw - backup failure shouldn't prevent file modification
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(path: string): Promise<{ name: string; size: number; modified: number }> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      throw new Error(`文件不存在: ${path}`);
    }

    return {
      name: file.name,
      size: file.stat.size,
      modified: file.stat.mtime,
    };
  }
}
