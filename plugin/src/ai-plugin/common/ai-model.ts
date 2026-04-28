export const PROVIDERS = ['openai', 'anthropic', 'google-genai', 'ollama'] as const
export type AiProvider = (typeof PROVIDERS)[number]

export type AiModel = {
  id: string
  name: string
  tool: boolean
  provider: AiProvider
}

export const MODELS: AiModel[] = [
  // OpenAI models
  { id: 'gpt-5.5', name: 'GPT-5.5', tool: true, provider: 'openai' },
  { id: 'gpt-5.4', name: 'GPT-5.4', tool: true, provider: 'openai' },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 mini', tool: true, provider: 'openai' },

  // Anthropic Claude models
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', tool: true, provider: 'anthropic' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tool: true, provider: 'anthropic' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', tool: true, provider: 'anthropic' },

  // Google Gemini models
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tool: true, provider: 'google-genai' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', tool: true, provider: 'google-genai' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tool: true, provider: 'google-genai' },

  // Ollama models
  { id: 'granite3.1-moe:latest', name: 'Granite 3.1 Moe', tool: true, provider: 'ollama' },
  { id: 'granite3.1-dense:latest', name: 'Granite 3.1 Dense', tool: true, provider: 'ollama' },
  { id: 'llama3:latest', name: 'Llama 3', tool: false, provider: 'ollama' },
  { id: 'llama3.2:latest', name: 'Llama 3.2', tool: true, provider: 'ollama' },
  { id: 'phi4:latest', name: 'Phi 4', tool: false, provider: 'ollama' },
  { id: 'phi3.5:latest', name: 'Phi 3.5', tool: false, provider: 'ollama' },
  { id: 'qwen3:4b', name: 'Qwen 3 4B', tool: true, provider: 'ollama' },
  { id: 'qwen3:latest', name: 'Qwen 3', tool: true, provider: 'ollama' },
] as const
