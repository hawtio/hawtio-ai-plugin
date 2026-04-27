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
import React, { useEffect, useState } from 'react'
import { AiModel, fetchGeminiModels, MODELS, OLLAMA_MODELS } from './ai-model'
import { AiOptions, aiPreferencesService } from './ai-preferences-service'
import { log } from '../jmx-ai/globals'

export const AiPreferences: React.FunctionComponent = () => {
  const [options, setOptions] = useState(aiPreferencesService.loadOptions())
  const [passwordHidden, setPasswordHidden] = useState(true)
  const [availableModels, setAvailableModels] = useState<AiModel[]>(MODELS)

  useEffect(() => {
    const { token } = options
    if (!token) {
      setAvailableModels(MODELS)
      return
    }
    let cancelled = false
    fetchGeminiModels(token)
      .then(geminiModels => {
        if (!cancelled) setAvailableModels([...geminiModels, ...OLLAMA_MODELS])
      })
      .catch(err => {
        if (!cancelled) {
          log.warn('Failed to fetch Gemini models, falling back to static list:', err)
          setAvailableModels(MODELS)
        }
      })
    return () => {
      cancelled = true
    }
  }, [options.token])

  const updateOptions = (updated: Partial<AiOptions>) => {
    aiPreferencesService.saveOptions(updated)
    setOptions({ ...options, ...updated })
  }

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
              {availableModels.map(m => (
                <FormSelectOption key={m.id} value={m.id} label={`${m.name} (${m.type})`} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup fieldId='ai-prefs-form-token' label='Token for the model (optional)'>
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
        </FormSection>
      </Form>
    </CardBody>
  )
}
