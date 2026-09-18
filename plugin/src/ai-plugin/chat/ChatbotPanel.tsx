import { PageContext } from '@hawtio/react/ui'
import Chatbot, { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot'
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent'
import ChatbotConversationHistoryNav, {
  Conversation,
} from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav'
import ChatbotFooter, { ChatbotFootnote } from '@patternfly/chatbot/dist/dynamic/ChatbotFooter'
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader'
import ChatbotWelcomePrompt from '@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt'
import Message, { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message'
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar'
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox'
import { Content, Label } from '@patternfly/react-core'
import React, { Dispatch, useContext, useEffect, useRef, useState } from 'react'
import { aiService } from '../common/ai-service'
import { ChatbotContext } from './context'
import { log } from './globals'
import { ThinkInfo } from './ThinkInfo'
import { ToolCallsApprove } from './ToolCallsApprove'
import { ToolCallsInfo } from './ToolCallsInfo'

export const ChatbotPanel: React.FC<{
  title: string
  displayMode: ChatbotDisplayMode
}> = ({ title, displayMode }) => {
  const { setMessages, dialogs, conversations } = useContext(ChatbotContext)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations)

  const onSelectItemInHistory = (selected: string) => {
    log.debug('Selected conversation with ID:', selected)
    const dialog = dialogs.find(c => c.id === selected)
    if (dialog) {
      setMessages(dialog.messages)
      setIsDrawerOpen(false)
    }
  }

  const handleSearchTextChange = (value: string) => {
    if (value.trim() === '') {
      setFilteredConversations(conversations)
      return
    }

    const filtered = conversations.filter(c => c.text.toLowerCase().includes(value.toLowerCase()))
    log.debug('Filtered conversations:', filtered)
    setFilteredConversations(filtered)
  }

  return (
    <Chatbot isCompact displayMode={displayMode}>
      <ChatbotConversationHistoryNav
        isCompact
        drawerPanelContentProps={{ isResizable: true, minSize: '200px' }}
        displayMode={displayMode}
        onDrawerToggle={() => {
          setIsDrawerOpen(!isDrawerOpen)
          setFilteredConversations(conversations)
        }}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        onSelectActiveItem={(_e, selectedItem) => onSelectItemInHistory(String(selectedItem))}
        conversations={[...filteredConversations].reverse()}
        onNewChat={() => {
          setIsDrawerOpen(false)
          setFilteredConversations(conversations)
          setMessages([])
        }}
        handleTextInputChange={handleSearchTextChange}
        drawerContent={
          <>
            <ChatbotPanelHeader
              isDrawerOpen={isDrawerOpen}
              setIsDrawerOpen={setIsDrawerOpen}
              title={title}
              hasCloseButton={displayMode === ChatbotDisplayMode.drawer}
            />
            <ChatbotPanelContent />
            <ChatbotPanelFooter />
          </>
        }
      />
    </Chatbot>
  )
}

const ChatbotPanelHeader: React.FC<{
  isDrawerOpen: boolean
  setIsDrawerOpen: Dispatch<React.SetStateAction<boolean>>
  title: string
  hasCloseButton: boolean
}> = ({ isDrawerOpen, setIsDrawerOpen, title, hasCloseButton }) => {
  const { setIsChatbotOpen } = useContext(ChatbotContext)
  const modelName = aiService.getModel()?.name

  return (
    <ChatbotHeader>
      <ChatbotHeaderMain>
        <ChatbotHeaderMenu aria-expanded={isDrawerOpen} onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
        <ChatbotHeaderTitle>
          <Content component='h2'>{title}</Content>
        </ChatbotHeaderTitle>
      </ChatbotHeaderMain>
      <ChatbotHeaderActions>
        {modelName && <Label variant='outline'>{modelName}</Label>}
        {hasCloseButton && <ChatbotHeaderCloseButton onClick={() => setIsChatbotOpen(false)} />}
      </ChatbotHeaderActions>
    </ChatbotHeader>
  )
}

const ChatbotPanelContent: React.FC = () => {
  const { messages, announcement } = useContext(ChatbotContext)
  const { username } = useContext(PageContext)
  const scrollToBottomRef = useRef<HTMLDivElement>(null)

  const welcomeTitle = `Hello, ${username}!`
  const welcomeDescription = 'How can I help you manage or diagnose your Java application?'

  useEffect(() => {
    if (messages.length > 2) {
      scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <ChatbotContent>
      <MessageBox announcement={announcement}>
        {messages.length === 0 && <ChatbotWelcomePrompt title={welcomeTitle} description={welcomeDescription} />}
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {index === messages.length - 1 && <div ref={scrollToBottomRef} />}
            <Message key={message.id} {...message} />
          </React.Fragment>
        ))}
      </MessageBox>
    </ChatbotContent>
  )
}

const ChatbotPanelFooter: React.FC = () => {
  const { username } = useContext(PageContext)
  const { messages, setAnnouncement, isSendButtonDisabled, setIsSendButtonDisabled, updateConversations } =
    useContext(ChatbotContext)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const handleSend = async (message: string) => {
    if (!message.trim()) {
      return
    }
    log.debug('Send', messagesRef.current)

    setIsSendButtonDisabled(true)
    const newMessages: MessageProps[] = []
    newMessages.push(...messagesRef.current)
    newMessages.push(aiService.createUserMessage(username, message))
    newMessages.push(aiService.createLoadingBotMessage())
    updateConversations(newMessages)
    // make announcement to assistive devices that new messages have been added
    setAnnouncement(`Message from User: ${message}. Message from Bot is loading.`)
    log.debug('handleSend - new messages:', newMessages)

    const dialogId = newMessages[0]!.id!
    const answer = await (newMessages.length === 2
      ? aiService.newChat(dialogId, message)
      : aiService.chat(dialogId, message))
    const loadedMessages: MessageProps[] = []
    loadedMessages.push(...newMessages)
    log.debug('handleSend - loaded messages:', loadedMessages)
    // Remove the loading message
    loadedMessages.pop()
    const botMessage = aiService.toBotMessage(answer, ThinkInfo, ToolCallsInfo, ToolCallsApprove)
    loadedMessages.push(botMessage)
    updateConversations(loadedMessages)
    setAnnouncement(`Message from Bot: ${answer}`)
    setIsSendButtonDisabled(false)
  }

  return (
    <ChatbotFooter>
      <MessageBar
        onSendMessage={m => handleSend(String(m))}
        hasAttachButton={false}
        isSendButtonDisabled={isSendButtonDisabled}
      />
      <ChatbotFootnote label='AI may be inaccurate. Please verify important information.' />
    </ChatbotFooter>
  )
}
