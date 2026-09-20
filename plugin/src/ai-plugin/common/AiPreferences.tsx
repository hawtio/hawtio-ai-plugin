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
  NumberInput,
  Switch,
  TextInput,
} from '@patternfly/react-core'
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon'
import EyeSlashIcon from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useState } from 'react'
import { MODELS, PROVIDERS } from './ai-model'
import {
  AiOptions,
  DEFAULT_MAX_AUTO_TOOL_STEPS,
  DEFAULT_TOOL_PERMISSIONS,
  aiPreferencesService,
} from './ai-preferences-service'
import { WORKSPACE_TOOLS_META } from './tools'

export const AiPreferences: React.FC = () => {
  const [options, setOptions] = useState(aiPreferencesService.loadOptions())

  return (
    <CardBody>
      <Form isHorizontal>
        <ModelForm options={options} setOptions={setOptions} />
        <PermissionForm options={options} setOptions={setOptions} />
      </Form>
    </CardBody>
  )
}

const ModelForm: React.FC<{
  options: AiOptions
  setOptions: React.Dispatch<React.SetStateAction<AiOptions>>
}> = ({ options, setOptions }) => {
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
    <FormSection title='Model' titleElement='h2'>
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
              onChange={(_, t) => updateToken(t)}
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

const PermissionForm: React.FC<{
  options: AiOptions
  setOptions: React.Dispatch<React.SetStateAction<AiOptions>>
}> = ({ options, setOptions }) => {
  const maxAutoToolSteps = options.maxAutoToolSteps ?? DEFAULT_MAX_AUTO_TOOL_STEPS
  const toolPermissions = options.toolPermissions ?? DEFAULT_TOOL_PERMISSIONS

  const updateMaxAutoToolSteps = (updated: number) => {
    aiPreferencesService.saveOptions({ maxAutoToolSteps: updated })
    setOptions({ ...options, maxAutoToolSteps: updated })
  }

  const updatePermission = (tool: string, updated: boolean) => {
    const updatedPermissions = { ...toolPermissions, [tool]: updated }
    aiPreferencesService.saveOptions({ toolPermissions: updatedPermissions })
    setOptions({ ...options, toolPermissions: updatedPermissions })
  }

  return (
    <FormSection title='Permission control' titleElement='h2'>
      <FormGroup fieldId='ai-prefs-form-max-steps' label='Max auto-approve steps'>
        <NumberInput
          id='ai-prefs-form-max-steps-input'
          aria-label='Form select max auto-approve steps'
          value={options.maxAutoToolSteps}
          min={1}
          max={100}
          onMinus={() => updateMaxAutoToolSteps(Math.max(1, maxAutoToolSteps - 1))}
          onPlus={() => updateMaxAutoToolSteps(Math.min(100, maxAutoToolSteps + 1))}
          onChange={e => {
            const value = parseInt((e.target as HTMLInputElement).value)
            if (!isNaN(value) && value >= 1 && value <= 100) {
              updateMaxAutoToolSteps(value)
            }
          }}
        />
      </FormGroup>
      <FormGroup fieldId='ai-prefs-form-tool-permissions' style={{ display: 'flex', minWidth: 'fit-content' }}>
        <Content component='small'>
          Enable auto-approve to allow a tool to run without asking for confirmation each time.
        </Content>
        <Table
          aria-label='Tool permissions'
          variant='compact'
          borders={false}
          isStriped
          isStickyHeader
          style={{ marginTop: '0.5rem' }}
        >
          <Thead>
            <Tr>
              <Th modifier='fitContent'>Tool</Th>
              <Th modifier='wrap'>Description</Th>
              <Th modifier='fitContent'>Auto-approve</Th>
            </Tr>
          </Thead>
          <Tbody>
            {WORKSPACE_TOOLS_META.map(({ name, description }) => (
              <Tr key={name}>
                <Td dataLabel='Tool'>
                  <b>{name}</b>
                </Td>
                <Td dataLabel='Description'>{description}</Td>
                <Td dataLabel='Auto-approve' textCenter>
                  <Switch
                    id={`ai-prefs-tool-switch-${name}`}
                    aria-label={`Auto-approve ${name}`}
                    isChecked={toolPermissions[name] ?? false}
                    onChange={(_, checked) => updatePermission(name, checked)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </FormGroup>
    </FormSection>
  )
}
