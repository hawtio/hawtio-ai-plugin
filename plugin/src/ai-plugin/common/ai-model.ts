export type ModelType = 'ollama' | 'google-genai' | 'openai' | 'anthropic'

export type AiModel = {
  id: string
  name: string
  tool: boolean
  type: ModelType
}

export const MODELS: AiModel[] = [
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', tool: true, type: 'anthropic' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', tool: true, type: 'anthropic' },
  { id: 'claude-haiku-3-5', name: 'Claude Haiku 3.5', tool: true, type: 'anthropic' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tool: true, type: 'google-genai' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tool: true, type: 'google-genai' },
  { id: 'granite3.1-moe:latest', name: 'Granite 3.1 Moe', tool: true, type: 'ollama' },
  { id: 'granite3.1-dense:latest', name: 'Granite 3.1 Dense', tool: true, type: 'ollama' },
  { id: 'llama3:latest', name: 'Llama 3', tool: false, type: 'ollama' },
  { id: 'llama3.2:latest', name: 'Llama 3.2', tool: true, type: 'ollama' },
  { id: 'gpt-4o', name: 'GPT-4o', tool: true, type: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tool: true, type: 'openai' },
  { id: 'gpt-4.1', name: 'GPT-4.1', tool: true, type: 'openai' },
  { id: 'phi4:latest', name: 'Phi 4', tool: false, type: 'ollama' },
  { id: 'phi3.5:latest', name: 'Phi 3.5', tool: false, type: 'ollama' },
  { id: 'qwen3:4b', name: 'Qwen 3 4B', tool: true, type: 'ollama' },
  { id: 'qwen3:latest', name: 'Qwen 3', tool: true, type: 'ollama' },
] as const
