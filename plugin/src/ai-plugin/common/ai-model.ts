export type ModelType = 'ollama' | 'google-genai'

export type AiModel = {
  id: string
  name: string
  tool: boolean
  type: ModelType
}

/**
 * Returns true when a model ID is expected to support function calling / tool use.
 */
export function supportsTools(modelId: string): boolean {
  if (/^gemini-2\./.test(modelId)) return true
  if (/^gemini-1\.5/.test(modelId)) return true
  if (/^gemini-1\.0-pro(-\d{3})?$/.test(modelId)) return true
  if (/^gemini-pro$/.test(modelId)) return true
  return false
}

/**
 * Creates an AiModel descriptor from a model ID alone, inferring the provider
 * type and tool-support capability from the ID.  Useful for models that were
 * selected dynamically and are not present in the static MODELS list.
 */
export function buildModelFromId(id: string): AiModel {
  const type: ModelType = id.startsWith('gemini-') ? 'google-genai' : 'ollama'
  return { id, name: id, tool: supportsTools(id), type }
}

/**
 * Fetches the list of chat-capable Gemini models from the Google Generative
 * Language API.  Only models that support `generateContent` are returned.
 * Requires a valid Google API key.
 */
export async function fetchGeminiModels(apiKey: string): Promise<AiModel[]> {
  const models: AiModel[] = []
  let pageToken: string | undefined

  do {
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('pageSize', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Google API request failed (${response.status})`)
    }

    const data = (await response.json()) as {
      models?: { name: string; displayName: string; supportedGenerationMethods: string[] }[]
      nextPageToken?: string
    }
    if (Array.isArray(data.models)) {
      for (const m of data.models) {
        const id = m.name.replace('models/', '')
        if (
          id.startsWith('gemini-') &&
          !id.includes('embedding') &&
          !id.includes('aqa') &&
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent')
        ) {
          models.push({ id, name: m.displayName, tool: supportsTools(id), type: 'google-genai' })
        }
      }
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  return models.sort((a, b) => a.id.localeCompare(b.id))
}

/** Static list of known Ollama models (manually maintained). */
export const OLLAMA_MODELS: AiModel[] = [
  { id: 'granite3.1-moe:latest', name: 'Granite 3.1 Moe', tool: true, type: 'ollama' },
  { id: 'granite3.1-dense:latest', name: 'Granite 3.1 Dense', tool: true, type: 'ollama' },
  { id: 'llama3:latest', name: 'Llama 3', tool: false, type: 'ollama' },
  { id: 'llama3.2:latest', name: 'Llama 3.2', tool: true, type: 'ollama' },
  { id: 'phi4:latest', name: 'Phi 4', tool: false, type: 'ollama' },
  { id: 'phi3.5:latest', name: 'Phi 3.5', tool: false, type: 'ollama' },
  { id: 'qwen3:4b', name: 'Qwen 3 4B', tool: true, type: 'ollama' },
  { id: 'qwen3:latest', name: 'Qwen 3', tool: true, type: 'ollama' },
]

/**
 * Combined fallback model list used when dynamic fetching is unavailable
 * (e.g. no API token configured yet).
 */
export const MODELS: AiModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tool: true, type: 'google-genai' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tool: true, type: 'google-genai' },
  ...OLLAMA_MODELS,
]
