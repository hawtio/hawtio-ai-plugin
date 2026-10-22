import { jolokiaService, MBeanNode } from '@hawtio/react'
import { PageContext } from '@hawtio/react/ui'
import { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot'
import { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message'
import { Button } from '@patternfly/react-core'
import { MonitoringIcon } from '@patternfly/react-icons'
import React, { useContext } from 'react'
import { ChatbotPanel } from '../chat/ChatbotPanel'
import { ChatbotContext, useChatbot } from '../chat/context'
import { ThinkInfo } from '../chat/ThinkInfo'
import { ToolCallsApprove } from '../chat/ToolCallsApprove'
import { ToolCallsInfo } from '../chat/ToolCallsInfo'
import { aiService } from '../common/ai-service'
import { log } from './globals'
import { jmxAiService } from './jmx-ai-service'
import './JmxDiagnoseButton.css'

/**
 * Standalone Diagnose button injected into the JMX Attributes view toolbar via
 * the `jmx-attributes-toolbar` extension slot.
 *
 * Props are forwarded from HawtioExtensionSlot: { node: MBeanNode }
 */
export const JmxDiagnoseButton: React.FC<{
  node: MBeanNode
}> = ({ node }) => {
  const { username } = useContext(PageContext)
  const chatbotContext = useChatbot()
  const { setAnnouncement, isChatbotOpen, setIsChatbotOpen, updateConversations } = chatbotContext

  if (!node.mbean || !node.objectName) {
    return null
  }
  const { objectName } = node

  const diagnose = async () => {
    setIsChatbotOpen(true)

    // Read current attribute values via Jolokia
    const attrs = await jolokiaService.readAttributes(objectName)
    const attrsValue = JSON.stringify(attrs)
    log.debug('Attributes for diagnosis:', attrsValue)

    const systemMessage = jmxAiService.systemMessage()
    const diagnoseMessage = jmxAiService.diagnoseMessage(objectName, attrsValue)
    const newMessages: MessageProps[] = []
    newMessages.push(aiService.createUserMessage(username, diagnoseMessage))
    newMessages.push(aiService.createLoadingBotMessage())
    updateConversations(newMessages, `Diagnose ${objectName}`)
    setAnnouncement('Diagnosis in progress...')
    log.debug('diagnose - new messages:', newMessages)

    const dialogId = newMessages[0]!.id!
    const answer = await aiService.newChat(dialogId, { message: diagnoseMessage, system: systemMessage })
    const loadedMessages: MessageProps[] = [...newMessages]
    // Remove the loading message
    loadedMessages.pop()
    const botMessage = aiService.toBotMessage(answer, false, ThinkInfo, ToolCallsInfo, ToolCallsApprove)
    loadedMessages.push(botMessage)
    updateConversations(loadedMessages)
    setAnnouncement('Diagnosis complete.')
  }

  return (
    <ChatbotContext.Provider value={chatbotContext}>
      <Button variant='primary' size='sm' icon={<MonitoringIcon />} onClick={diagnose} style={{ alignSelf: 'flex-start' }}>
        Diagnose
      </Button>
      {isChatbotOpen && (
        <div id='ai-jmx-diagnose-chatbot-panel'>
          <ChatbotPanel title='JMX Diagnosis' displayMode={ChatbotDisplayMode.docked} />
        </div>
      )}
    </ChatbotContext.Provider>
  )
}
