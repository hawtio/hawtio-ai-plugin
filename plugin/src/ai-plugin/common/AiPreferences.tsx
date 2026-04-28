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
import { MODELS, PROVIDERS } from './ai-model'
import { aiPreferencesService } from './ai-preferences-service'

export const AiPreferences: React.FunctionComponent = () => {
  const [options, setOptions] = useState(aiPreferencesService.loadOptions())
  const [provider, setProvider] = useState<string>(options.model.provider)
  const [models, setModels] = useState(MODELS.filter(m => m.provider === provider))
  const [passwordHidden, setPasswordHidden] = useState(true)

  const updateProvider = (provider: string) => {
    setProvider(provider)
    setModels(MODELS.filter(m => m.provider === provider))
  }

  const updateModel = (updated: string) => {
    const model = MODELS.find(m => m.id === updated)
    if (model) {
      aiPreferencesService.saveOptions({ model })
      setOptions({ ...options, model })
    }
  }

  const updateToken = (updated?: string) => {
    aiPreferencesService.saveOptions({ token: updated })
    setOptions({ ...options, token: updated })
  }

  return (
    <CardBody>
      <Form isHorizontal>
        <FormSection title='AI' titleElement='h2'>
          <FormGroup fieldId='ai-prefs-form-provider' label='Provider'>
            <FormSelect
              id='ai-prefs-form-provider-input'
              aria-label='Form Select Provider'
              value={provider}
              onChange={(_, provider) => updateProvider(provider)}
            >
              {PROVIDERS.map((p, i) => (
                <FormSelectOption key={i} value={p} label={p} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup fieldId='ai-prefs-form-model' label='Model'>
            <FormSelect
              id='ai-prefs-form-model-input'
              aria-label='Form Select Model'
              value={options.model.id}
              onChange={(_, id) => updateModel(id)}
            >
              {models.map(m => (
                <FormSelectOption key={m.id} value={m.id} label={m.name} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup fieldId='ai-prefs-form-token' label='API Key / Token (optional)'>
            <InputGroup>
              <InputGroupItem isFill>
                <TextInput
                  id='ai-prefs-form-token-input'
                  aria-label='Form Select Token'
                  type={passwordHidden ? 'password' : 'text'}
                  value={options.token}
                  onChange={(_, token) => updateToken(token)}
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
