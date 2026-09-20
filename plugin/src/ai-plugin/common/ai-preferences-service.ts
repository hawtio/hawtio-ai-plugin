import { AiModel, MODELS } from './ai-model'
import { aiService } from './ai-service'

export const STORAGE_KEY_PREFERENCES = 'ai.preferences'

/**
 * Per-tool auto-approval map.
 * Key: tool name (e.g. 'listMBeans'), Value: true = auto-approve without prompting.
 */
export type ToolPermissions = Record<string, boolean>

export type AiOptions = {
  model: AiModel
  token?: string
  toolPermissions?: ToolPermissions
}

/**
 * Workspace-cache-only tools are auto-approved by default (no remote side effects).
 * Jolokia-backed tools default to OFF so the user must explicitly approve them.
 */
export const DEFAULT_TOOL_PERMISSIONS: ToolPermissions = {
  listMBeans: true,
  getMBeanInfo: true,
  searchMBeans: true,
  readMBeanAttribute: false,
  writeMBeanAttribute: false,
  executeMBeanOperation: false,
}

export const DEFAULT_OPTIONS: AiOptions = {
  model: MODELS[0]!,
  toolPermissions: DEFAULT_TOOL_PERMISSIONS,
} as const

export interface IAiPreferencesService {
  loadOptions(): AiOptions
  saveOptions(options: Partial<AiOptions>): void
}

class AiPreferencesService implements IAiPreferencesService {
  loadOptions(): AiOptions {
    const item = localStorage.getItem(STORAGE_KEY_PREFERENCES)
    const savedOptions = item ? JSON.parse(item) : {}
    return { ...DEFAULT_OPTIONS, ...savedOptions }
  }

  saveOptions(options: Partial<AiOptions>) {
    const updated = { ...this.loadOptions(), ...options }
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated))
    if (options.model) {
      aiService.reset(options.model)
    }
  }
}

export const aiPreferencesService = new AiPreferencesService()
