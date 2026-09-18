import { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot'
import { PageSection } from '@patternfly/react-core'
import React from 'react'
import './Chat.css'
import { ChatbotPanel } from './ChatbotPanel'
import { ChatbotContext, useChatbot } from './context'

export const Chat: React.FC = () => {
  const chatbotContext = useChatbot()

  return (
    <ChatbotContext.Provider value={chatbotContext}>
      <PageSection id='chat-content' hasBodyWrapper={false} isFilled padding={{ default: 'noPadding' }}>
        <ChatbotPanel title='AI Chat' displayMode={ChatbotDisplayMode.embedded} />
      </PageSection>
    </ChatbotContext.Provider>
  )
}
