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
    try {
      const { stdout } = await execAsync(
        `${cliPath} chat -q "${this.escapeShell(prompt)}" --quiet`,
        { timeout: this.settings.requestTimeout, maxBuffer: 1024 * 1024 * 10 }
      );
      const lines = stdout.trim().split('\n');
      return lines.filter(l => !l.startsWith('session_id:')).join('\n').trim();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('找不到 Hermes CLI，请检查路径配置');
      }
      throw new Error(`Hermes CLI 错误: ${error.message}`);
    }
  }

  private async chatViaAPI(prompt: string): Promise<string> {
    const config = this.getActiveProvider();
    if (!config) {
      throw new Error('请先配置 API 提供商');
    }

    const url = this.normalizeUrl(config.baseUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      if (url.includes('anthropic')) {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
    }

    try {
      const response = await requestUrl({
        url,
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.modelId,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
        }),
        throw: false,
      });

      if (response.status >= 400) {
        throw new Error(`API 错误 (${response.status})`);
      }

      const data = response.json;

      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      if (data.content?.[0]?.text) {
        return data.content[0].text;
      }

      return JSON.stringify(data);
    } catch (error: any) {
      throw new Error(`API 调用失败: ${error.message}`);
    }
  }

  private getActiveProvider(): CustomProvider | null {
    if (this.settings.provider === 'custom' && this.settings.activeCustomProviderId) {
      return this.settings.customProviders.find(
        p => p.id === this.settings.activeCustomProviderId
      ) || null;
    }
    return null;
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    url = url.replace(/\/+$/, '');
    const endpoints = ['/chat/completions', '/messages', '/completions', '/api/chat'];
    if (endpoints.some(e => url.endsWith(e))) {
      return url;
    }
    if (url.includes('anthropic')) return url + '/messages';
    if (url.includes('ollama') || url.includes('11434')) return url + '/api/chat';
    if (url.match(/\/v\d+$/)) return url + '/chat/completions';
    if (url.match(/\/v\d+\//)) return url + '/chat/completions';
    return url + '/v1/chat/completions';
  }

  private buildPrompt(message: string, context?: ChatContext): string {
    let prompt = '';
    if (context?.currentFile) {
      prompt += `当前文件: ${context.currentFile}\n\n`;
    }
    if (context?.currentContent) {
      const content = context.currentContent;
      if (content.length > this.settings.maxContextLength) {
        prompt += `笔记内容:\n\`\`\`\n${content.substring(0, this.settings.maxContextLength)}\n...(已截断)\n\`\`\`\n\n`;
      } else {
        prompt += `笔记内容:\n\`\`\`\n${content}\n\`\`\`\n\n`;
      }
    }
    if (context?.selectedText) {
      prompt += `选中文本:\n\`\`\`\n${context.selectedText}\n\`\`\`\n\n`;
    }
    prompt += `用户问题: ${message}`;
    return prompt;
  }

  private escapeShell(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`').replace(/\n/g, '\\n');
  }
}
