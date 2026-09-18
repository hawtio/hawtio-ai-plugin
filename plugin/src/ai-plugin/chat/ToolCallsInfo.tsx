import { ToolCall } from '@langchain/core/messages/tool'
import { Alert } from '@patternfly/react-core'
import WrenchIcon from '@patternfly/react-icons/dist/esm/icons/wrench-icon'
import React from 'react'

/**
 * Displays a single tool call in an info alert.
 *
 * @param call  - The {@link ToolCall} object containing the tool name and arguments.
 * @param index - The position of this tool call in the list, used as the React `key`.
 */
export const ToolCallsInfo: React.FC<{
  call: ToolCall
  index: number
}> = ({ call, index }) => {
  return (
    <Alert key={index} variant='info' customIcon={<WrenchIcon />} title={call.name}>
      <p>Args: {JSON.stringify(call.args)}</p>
    </Alert>
  )
}
