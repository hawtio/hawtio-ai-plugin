import { MODELS } from './ai-model'
import { aiPreferencesService } from './ai-preferences-service'
import { aiService } from './ai-service'

const API_KEYS: Record<string, string | undefined> = {
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  'google-genai': process.env.GOOGLE_API_KEY,
}

const testAiModels = process.env.TEST_AI_MODELS === 'true'

describe('AI Service Models Connectivity', () => {
  const remoteModels = MODELS.filter(m => m.provider !== 'ollama')

  for (const model of remoteModels) {
    const apiKey = API_KEYS[model.provider]
    const testFn = testAiModels && apiKey ? test : test.skip

    testFn(
      `should connect and respond using ${model.provider} / ${model.id}`,
      async () => {
        aiPreferencesService.saveOptions({ model, token: apiKey })
        const response = await aiService.newChat(`test-${model.id}-${Date.now()}`, { message: 'Hi' })

        expect(typeof response).not.toBe('string')
        expect(response).toHaveProperty('content')
      },
      30000,
    )
  }
})
