import MarkdownContent from '@patternfly/chatbot/dist/dynamic/MarkdownContent'
import { Alert } from '@patternfly/react-core'
import React from 'react'

/**
 * Displays the model's internal reasoning text in an expandable info alert.
 *
 * @param think - The thinking/reasoning text produced by the model.
 */
export const ThinkInfo: React.FC<{
  think: string
}> = ({ think }) => {
  return (
    <Alert variant='info' title='Thinking' isExpandable>
      <MarkdownContent content={think} />
    </Alert>
  )
}
