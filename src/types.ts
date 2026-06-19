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
  enableMarkdown: boolean;
  showTimestamp: boolean;
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
  maxContextLength: 20000,
  requestTimeout: 120000,
  enableMarkdown: true,
  showTimestamp: true,
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
