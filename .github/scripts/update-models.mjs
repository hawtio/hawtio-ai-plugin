#!/usr/bin/env node
/**
 * Fetches the current list of Google Gemini models from the Generative Language
 * API and rewrites the google-genai section of ai-model.ts.
 *
 * Ollama models are managed manually and are left untouched.
 *
 * Usage:
 *   GEMINI_API_KEY=<key> node .github/scripts/update-models.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MODELS_FILE = path.resolve(__dirname, '../../plugin/src/ai-plugin/common/ai-model.ts')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required')
  process.exit(1)
}

/**
 * Returns true when a Gemini model ID is expected to support function calling.
 *
 * Gemini 1.5+ and 2.x all support function calling.  Older / vision-only models
 * do not, so they default to false.
 */
function supportsTools(modelId) {
  if (/^gemini-2\./.test(modelId)) return true
  if (/^gemini-1\.5/.test(modelId)) return true
  if (/^gemini-1\.0-pro(-\d{3})?$/.test(modelId)) return true
  if (/^gemini-pro$/.test(modelId)) return true
  return false
}

/**
 * Fetch all Gemini chat models from the Google Generative Language API,
 * following pagination automatically.
 */
async function fetchGeminiModels() {
  const models = []
  let pageToken = undefined

  do {
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models')
    url.searchParams.set('key', GEMINI_API_KEY)
    url.searchParams.set('pageSize', '100')
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Google API request failed (${response.status}): ${body}`)
    }

    const data = await response.json()
    if (Array.isArray(data.models)) {
      models.push(...data.models)
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  return models
    .filter(m => {
      const id = m.name?.replace('models/', '') ?? ''
      return (
        id.startsWith('gemini-') &&
        !id.includes('embedding') &&
        !id.includes('aqa') &&
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent')
      )
    })
    .map(m => ({
      id: m.name.replace('models/', ''),
      name: m.displayName,
      tool: supportsTools(m.name.replace('models/', '')),
      type: 'google-genai',
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Extract Ollama model entries from the existing ai-model.ts source, preserving
 * declaration order so we do not produce spurious diffs.
 */
function parseOllamaModels(content) {
  const re = /\{ id: '([^']+)', name: '([^']+)', tool: (true|false), type: 'ollama' \}/g
  const results = []
  let match
  while ((match = re.exec(content)) !== null) {
    results.push({
      id: match[1],
      name: match[2],
      tool: match[3] === 'true',
      type: 'ollama',
    })
  }
  return results
}

function formatModel(m) {
  return `  { id: '${m.id}', name: '${m.name}', tool: ${m.tool}, type: '${m.type}' },`
}

async function main() {
  console.log('Fetching Gemini models from Google API…')
  const geminiModels = await fetchGeminiModels()
  console.log(`Found ${geminiModels.length} Gemini models`)

  const originalContent = fs.readFileSync(MODELS_FILE, 'utf-8')
  const ollamaModels = parseOllamaModels(originalContent)
  console.log(`Retaining ${ollamaModels.length} existing Ollama models`)

  // google-genai models first, then ollama (matches original ordering)
  const allModels = [...geminiModels, ...ollamaModels]

  const newContent =
    `export type ModelType = 'ollama' | 'google-genai'\n` +
    `\n` +
    `export type AiModel = {\n` +
    `  id: string\n` +
    `  name: string\n` +
    `  tool: boolean\n` +
    `  type: ModelType\n` +
    `}\n` +
    `\n` +
    `export const MODELS: AiModel[] = [\n` +
    allModels.map(formatModel).join('\n') +
    `\n] as const\n`

  if (originalContent === newContent) {
    console.log('No changes detected – ai-model.ts is already up-to-date.')
    return
  }

  fs.writeFileSync(MODELS_FILE, newContent)
  console.log('Updated plugin/src/ai-plugin/common/ai-model.ts')

  // Print a human-readable summary of what changed
  const oldGeminiIds = new Set([...originalContent.matchAll(/id: '(gemini-[^']+)'/g)].map(m => m[1]))
  const newGeminiIds = new Set(geminiModels.map(m => m.id))
  const added = [...newGeminiIds].filter(id => !oldGeminiIds.has(id))
  const removed = [...oldGeminiIds].filter(id => !newGeminiIds.has(id))
  if (added.length) console.log('  Added   :', added.join(', '))
  if (removed.length) console.log('  Removed :', removed.join(', '))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
