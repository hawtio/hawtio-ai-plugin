import { PageContext } from '@hawtio/react/ui'
import { ToolCall } from '@langchain/core/messages/tool'
import { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message'
import { Button, Flex } from '@patternfly/react-core'
import React, { useContext, useEffect, useRef } from 'react'
import { aiService } from '../common/ai-service'
import { ChatbotContext } from './context'
import { log } from './globals'
import { ThinkInfo } from './ThinkInfo'
import { ToolCallsInfo } from './ToolCallsInfo'

/**
 * Renders Approve / Reject buttons for a pending set of tool calls.
 *
 * When the user clicks **Approve**, the tool calls are executed
 * and the conversation is updated with the result.
 * When the user clicks **Reject**, the tool calls are cancelled
 * and a "Rejected" user message is appended to the conversation.
 *
 * @param toolCalls - The list of {@link ToolCall} objects awaiting user approval.
 */
export const ToolCallsApprove: React.FC<{
  toolCalls: ToolCall[]
}> = ({ toolCalls }) => {
  const { username } = useContext(PageContext)
  const { messages, setAnnouncement, setIsSendButtonDisabled, updateConversations } = useContext(ChatbotContext)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const approve = async (toolCalls: ToolCall[]) => {
    log.debug('ToolCallsApprove - Approved', messagesRef.current)

    setIsSendButtonDisabled(true)
    const newMessages: MessageProps[] = [...messagesRef.current]
    newMessages.push(aiService.createUserMessage(username, 'Approved'))
    newMessages.push(aiService.createLoadingBotMessage())
    updateConversations(newMessages)
    setAnnouncement(`User approved tool usage. Message from Bot is loading.`)

    const dialogId = newMessages[0]!.id!
    const answer = await aiService.invokeTools(dialogId, toolCalls)
    const loadedMessages: MessageProps[] = [...newMessages]
    loadedMessages.pop()
    const botMessage = aiService.toBotMessage(answer, ThinkInfo, ToolCallsInfo, ToolCallsApprove)
    loadedMessages.push(botMessage)
    updateConversations(loadedMessages)
    setAnnouncement(`Message from Bot: ${answer}`)
    setIsSendButtonDisabled(false)
  }

  const reject = () => {
    log.debug('ToolCallsApprove - Rejected', messagesRef.current)
    const currentMessages = messagesRef.current
    const dialogId = currentMessages[0]?.id
    if (dialogId) {
      aiService.rejectTools(dialogId, toolCalls)
    }
    const newMessages: MessageProps[] = [...currentMessages]
    newMessages.push(aiService.createUserMessage(username, 'Rejected'))
    updateConversations(newMessages)
  }

  return (
    <Flex columnGap={{ default: 'columnGapSm' }}>
      <Button variant='primary' onClick={() => approve(toolCalls)}>
        Approve
      </Button>
      <Button variant='secondary' onClick={reject}>
        Reject
      </Button>
    </Flex>
  )
}
