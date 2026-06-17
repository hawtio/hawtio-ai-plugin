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
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tool: true, provider: 'google-genai' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', tool: true, provider: 'google-genai' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', tool: true, provider: 'google-genai' },

  // Ollama models
  { id: 'granite4.1:3b', name: 'Granite 4.1 3B', tool: true, provider: 'ollama' },
  { id: 'llama3:latest', name: 'Llama 3', tool: false, provider: 'ollama' },
  { id: 'llama3.2:latest', name: 'Llama 3.2', tool: true, provider: 'ollama' },
  { id: 'gemma4:e4b', name: 'Gemma 4 4B', tool: true, provider: 'ollama' },
  { id: 'gemma4:e4b-mlx', name: 'Gemma 4 4B MLX', tool: true, provider: 'ollama' },
  { id: 'phi4:latest', name: 'Phi 4', tool: false, provider: 'ollama' },
  { id: 'phi3.5:latest', name: 'Phi 3.5', tool: false, provider: 'ollama' },
  { id: 'qwen3.5:4b', name: 'Qwen 3.5 4B', tool: true, provider: 'ollama' },
  { id: 'qwen3.5:4b-mlx', name: 'Qwen 3.5 4B MLX', tool: true, provider: 'ollama' },
  { id: 'qwen3.5:latest', name: 'Qwen 3.5', tool: true, provider: 'ollama' },
] as const
