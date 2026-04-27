import {
  Button,
  CardBody,
  Form,
  FormGroup,
  FormSection,
  FormSelect,
  FormSelectOption,
  InputGroup,
  InputGroupItem,
  TextInput,
} from '@patternfly/react-core'
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon'
import EyeSlashIcon from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon'
import React, { useState } from 'react'
import { MODELS } from './ai-model'
import { AiOptions, aiPreferencesService } from './ai-preferences-service'

export const AiPreferences: React.FunctionComponent = () => {
  const [options, setOptions] = useState(aiPreferencesService.loadOptions())
  const [passwordHidden, setPasswordHidden] = useState(true)

  const updateOptions = (updated: Partial<AiOptions>) => {
    aiPreferencesService.saveOptions(updated)
    setOptions({ ...options, ...updated })
  }

  const selectedModel = MODELS.find(m => m.id === options.model)
  const isOllama = selectedModel?.type === 'ollama'
  const tokenLabel =
    selectedModel?.type === 'anthropic'
      ? 'Anthropic API key'
      : selectedModel?.type === 'google-genai'
        ? 'Google API key'
        : selectedModel?.type === 'openai'
          ? 'OpenAI API key'
          : 'API key (optional)'

  return (
    <CardBody>
      <Form isHorizontal>
        <FormSection title='AI' titleElement='h2'>
          <FormGroup fieldId='ai-prefs-form-model' label='Model to use'>
            <FormSelect
              id='ai-prefs-form-model-input'
              aria-label='Form Select Model'
              value={options.model}
              onChange={(_, model) => updateOptions({ model })}
            >
              {MODELS.map(m => (
                <FormSelectOption key={m.id} value={m.id} label={`${m.name} (${m.type})`} />
              ))}
            </FormSelect>
          </FormGroup>
          {isOllama && (
            <FormGroup fieldId='ai-prefs-form-url' label='Ollama base URL (optional)'>
              <TextInput
                id='ai-prefs-form-url-input'
                aria-label='Form Ollama URL'
                type='url'
                placeholder='http://localhost:11434'
                value={options.url ?? ''}
                onChange={(_, url) => updateOptions({ url })}
              />
            </FormGroup>
          )}
          {!isOllama && (
            <FormGroup fieldId='ai-prefs-form-token' label={tokenLabel}>
              <InputGroup>
                <InputGroupItem isFill>
                  <TextInput
                    id='ai-prefs-form-token-input'
                    aria-label='Form Select Token'
                    type={passwordHidden ? 'password' : 'text'}
                    value={options.token}
                    onChange={(_, token) => updateOptions({ token })}
                  />
                </InputGroupItem>
                <InputGroupItem>
                  <Button
                    variant='control'
                    onClick={() => setPasswordHidden(!passwordHidden)}
                    aria-label={passwordHidden ? 'Show password' : 'Hide password'}
                  >
                    {passwordHidden ? <EyeIcon /> : <EyeSlashIcon />}
                  </Button>
                </InputGroupItem>
              </InputGroup>
            </FormGroup>
          )}
        </FormSection>
      </Form>
    </CardBody>
  )
}
