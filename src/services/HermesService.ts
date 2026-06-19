import { exec } from 'child_process';
import { promisify } from 'util';
import { requestUrl } from 'obsidian';
import { HermdianSettings, ChatContext, CustomProvider } from '../types';

const execAsync = promisify(exec);

export class HermesService {
  private settings: HermdianSettings;

  constructor(settings: HermdianSettings) {
    this.settings = settings;
  }

  /**
   * Chat via Hermes CLI
   */
  async chat(message: string, context?: ChatContext): Promise<string> {
    const prompt = this.buildPrompt(message, context);
    const cliPath = this.settings.hermesCliPath || 'hermes';

    try {
      const { stdout, stderr } = await execAsync(
        `${cliPath} chat -q "${this.escapeShell(prompt)}" --quiet`,
        {
          timeout: this.settings.requestTimeout,
          maxBuffer: 1024 * 1024 * 10,
        }
      );

      if (stderr && !stdout) {
        console.warn('Hermes stderr:', stderr);
      }

      const lines = stdout.trim().split('\n');
      const filteredLines = lines.filter(line => !line.startsWith('session_id:'));
      return filteredLines.join('\n').trim() || '（无响应）';
    } catch (error: any) {
      if (error.killed) {
        throw new Error('请求超时，请增加超时时间或简化问题');
      }
      if (error.code === 'ENOENT') {
        throw new Error(`找不到 Hermes CLI，请确认已安装或检查路径配置`);
      }
      throw new Error(`Hermes CLI 错误: ${error.message}`);
    }
  }

  /**
   * Direct API call
   */
  async chatDirect(message: string, context?: ChatContext): Promise<string> {
    const prompt = this.buildPrompt(message, context);
    const providerConfig = this.getActiveProviderConfig();

    if (!providerConfig) {
      throw new Error('请先在设置中配置 API 提供商');
    }

    return this.callCustomAPI(prompt, providerConfig);
  }

  /**
   * Get active provider configuration
   */
  private getActiveProviderConfig(): CustomProvider | null {
    if (this.settings.provider === 'custom' && this.settings.activeCustomProviderId) {
      const customProvider = this.settings.customProviders.find(
        p => p.id === this.settings.activeCustomProviderId
      );
      if (customProvider) {
        return customProvider;
      }
    }

    if (this.settings.provider !== 'custom' && this.settings.apiKey) {
      return {
        id: this.settings.provider,
        name: this.settings.provider,
        baseUrl: this.getProviderBaseUrl(this.settings.provider),
        apiKey: this.settings.apiKey,
        modelId: this.settings.modelId || this.getDefaultModel(this.settings.provider),
        modelName: this.settings.modelName,
      };
    }

    return null;
  }

  /**
   * Normalize URL - automatically append endpoint suffix
   */
  normalizeUrl(url: string): string {
    if (!url) return '';
    
    url = url.replace(/\/+$/, '');
    
    const knownEndpoints = [
      '/chat/completions',
      '/messages',
      '/completions',
      '/api/chat',
      '/api/generate',
    ];
    
    for (const endpoint of knownEndpoints) {
      if (url.endsWith(endpoint) || url.includes(endpoint + '?')) {
        return url;
      }
    }
    
    if (url.includes('anthropic')) {
      return url + '/messages';
    }
    
    if (url.includes('ollama') || url.includes('11434')) {
      return url + '/api/chat';
    }
    
    if (url.includes('1234') || url.includes('lmstudio')) {
      return url + '/v1/chat/completions';
    }
    
    if (url.includes('googleapis.com') || url.includes('generativelanguage')) {
      return url + ':generateContent';
    }
    
    if (url.match(/\/v\d+$/)) {
      return url + '/chat/completions';
    }
    
    if (url.match(/\/v\d+\//)) {
      if (!url.endsWith('/chat/completions')) {
        return url + '/chat/completions';
      }
      return url;
    }
    
    return url + '/v1/chat/completions';
  }

  private getProviderBaseUrl(provider: string): string {
    const urls: Record<string, string> = {
      'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
      'openai': 'https://api.openai.com/v1/chat/completions',
      'anthropic': 'https://api.anthropic.com/v1/messages',
      'google': 'https://generativelanguage.googleapis.com/v1beta/models',
      'deepseek': 'https://api.deepseek.com/v1/chat/completions',
    };

    if (this.settings.baseUrl) {
      return this.normalizeUrl(this.settings.baseUrl);
    }

    return urls[provider] || '';
  }

  private getDefaultModel(provider: string): string {
    const models: Record<string, string> = {
      'openrouter': 'anthropic/claude-sonnet-4',
      'openai': 'gpt-4',
      'anthropic': 'claude-sonnet-4-20250514',
      'google': 'gemini-pro',
      'deepseek': 'deepseek-chat',
    };
    return models[provider] || 'gpt-4';
  }

  /**
   * Call custom API using Obsidian's requestUrl
   */
  private async callCustomAPI(prompt: string, config: CustomProvider): Promise<string> {
    const url = this.normalizeUrl(config.baseUrl);

    const requestBody: any = {
      model: config.modelId,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
    };

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

    if (config.headers) {
      Object.assign(headers, config.headers);
    }

    try {
      console.log(`[Hermdian] Calling API: ${url}`);
      console.log(`[Hermdian] Model: ${config.modelId}`);

      // Use Obsidian's requestUrl to avoid CORS issues
      const response = await requestUrl({
        url: url,
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        throw: false,
      });

      console.log(`[Hermdian] Response status: ${response.status}`);

      if (response.status >= 400) {
        const errorText = typeof response.text === 'string' ? response.text : JSON.stringify(response.json);
        throw new Error(`API 错误 (${response.status}): ${errorText}`);
      }

      const data = response.json;

      // Handle different response formats
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }

      if (data.content?.[0]?.text) {
        return data.content[0].text;
      }

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      if (data.response) {
        return data.response;
      }

      if (data.message) {
        return data.message;
      }

      return JSON.stringify(data, null, 2);
    } catch (error: any) {
      console.error('[Hermdian] API Error:', error);
      throw new Error(`API 调用失败: ${error.message}`);
    }
  }

  private buildPrompt(message: string, context?: ChatContext): string {
    let prompt = '';

    if (context?.currentFile) {
      prompt += `当前文件: ${context.currentFile}\n\n`;
    }

    if (context?.currentContent) {
      prompt += `当前笔记内容:\n\`\`\`\n${context.currentContent}\n\`\`\`\n\n`;
    }

    if (context?.selectedText) {
      prompt += `选中的文本:\n\`\`\`\n${context.selectedText}\n\`\`\`\n\n`;
    }

    prompt += `用户问题: ${message}`;

    return prompt;
  }

  private escapeShell(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')
      .replace(/\n/g, '\\n');
  }
}
