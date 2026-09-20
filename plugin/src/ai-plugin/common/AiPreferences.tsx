import {
  Button,
  CardBody,
  Content,
  Form,
  FormGroup,
  FormSection,
  FormSelect,
  FormSelectOption,
  InputGroup,
  InputGroupItem,
  Switch,
  TextInput,
} from '@patternfly/react-core'
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon'
import EyeSlashIcon from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useState } from 'react'
import { MODELS, PROVIDERS } from './ai-model'
import { AiOptions, ToolPermissions, aiPreferencesService } from './ai-preferences-service'
import { WORKSPACE_TOOLS_META } from './tools'

export const AiPreferences: React.FC = () => {
  const [options, setOptions] = useState(aiPreferencesService.loadOptions())

  const handleOptionsChange = (updated: Partial<AiOptions>) => {
    aiPreferencesService.saveOptions(updated)
    setOptions(prev => ({ ...prev, ...updated }))
  }

  const handlePermissionChange = (toolName: string, autoApprove: boolean) => {
    const toolPermissions: ToolPermissions = { ...(options.toolPermissions ?? {}), [toolName]: autoApprove }
    handleOptionsChange({ toolPermissions })
  }

  return (
    <CardBody>
      <Form isHorizontal>
        <ModelSection options={options} onOptionsChange={handleOptionsChange} />
        <PermissionSection toolPermissions={options.toolPermissions} onPermissionChange={handlePermissionChange} />
      </Form>
    </CardBody>
  )
}

const ModelSection: React.FC<{
  options: AiOptions
  onOptionsChange: (updated: Partial<AiOptions>) => void
}> = ({ options, onOptionsChange }) => {
  const [provider, setProvider] = useState<string>(options.model.provider)
  const [models, setModels] = useState(MODELS.filter(m => m.provider === provider))
  const [passwordHidden, setPasswordHidden] = useState(true)

  const updateProvider = (newProvider: string) => {
    setProvider(newProvider)
    setModels(MODELS.filter(m => m.provider === newProvider))
  }

  const updateModel = (id: string) => {
    const model = MODELS.find(m => m.id === id)
    if (model) onOptionsChange({ model })
  }

  return (
    <FormSection title='AI' titleElement='h2'>
      <FormGroup fieldId='ai-prefs-form-provider' label='Provider'>
        <FormSelect
          id='ai-prefs-form-provider-input'
          aria-label='Form Select Provider'
          value={provider}
          onChange={(_, p) => updateProvider(p)}
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
              onChange={(_, token) => onOptionsChange({ token })}
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
  )
}

const PermissionSection: React.FC<{
  toolPermissions: ToolPermissions | undefined
  onPermissionChange: (toolName: string, autoApprove: boolean) => void
}> = ({ toolPermissions, onPermissionChange }) => (
  <FormSection title='Permission control' titleElement='h2'>
    <FormGroup fieldId='ai-prefs-form-tool-permissions'>
      <Content component='small'>
        Enable auto-approve to allow a tool to run without asking for confirmation each time.
      </Content>
      <Table aria-label='Tool permissions' variant='compact' borders={false} style={{ marginTop: '0.5rem' }}>
        <Thead>
          <Tr>
            <Th>Tool</Th>
            <Th>Description</Th>
            <Th>Auto-approve</Th>
          </Tr>
        </Thead>
        <Tbody>
          {WORKSPACE_TOOLS_META.map(({ name, description }) => (
            <Tr key={name}>
              <Td dataLabel='Tool'>
                <strong>{name}</strong>
              </Td>
              <Td dataLabel='Description'>{description}</Td>
              <Td dataLabel='Auto-approve'>
                <Switch
                  id={`ai-prefs-tool-switch-${name}`}
                  aria-label={`Auto-approve ${name}`}
                  isChecked={toolPermissions?.[name] ?? false}
                  onChange={(_, checked) => onPermissionChange(name, checked)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </FormGroup>
  </FormSection>
)
