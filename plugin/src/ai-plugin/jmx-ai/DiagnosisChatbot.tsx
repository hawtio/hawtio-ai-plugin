import { PageContext } from '@hawtio/react/ui'
import { ToolCall } from '@langchain/core/messages/tool'
import { Conversation } from '@patternfly/chatbot'
import Chatbot, { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot'
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent'
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav'
import ChatbotFooter, { ChatbotFootnote } from '@patternfly/chatbot/dist/dynamic/ChatbotFooter'
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader'
import Message, { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message'
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar'
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox'
import { Alert, Button, Content, Flex, Label } from '@patternfly/react-core'
import WrenchIcon from '@patternfly/react-icons/dist/esm/icons/wrench-icon'
import React, { Dispatch, useContext, useEffect, useRef, useState } from 'react'
import { aiService } from '../common/ai-service'
import { ChatbotContext } from './context'
import { log } from './globals'

export const DiagnosisChatbot: React.FC = () => {
  const { setMessages, dialogs, conversations } = useContext(ChatbotContext)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations)

  const onSelectItemInHistory = (selected: string) => {
    log.debug('Selected conversation with ID:', selected)
    const dialog = dialogs.find(c => c.id === selected)
    if (dialog) {
      setMessages(dialog.messages)
      setIsDrawerOpen(!isDrawerOpen)
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

  const displayMode = ChatbotDisplayMode.drawer

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
          setIsDrawerOpen(!isDrawerOpen)
          setFilteredConversations(conversations)
          setMessages([])
        }}
        handleTextInputChange={handleSearchTextChange}
        drawerContent={
          <>
            <DiagnosisChatbotHeader isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
            <DiagnosisChatbotContent />
            <DiagnosisChatbotFooter />
          </>
        }
      />
    </Chatbot>
  )
}

const DiagnosisChatbotHeader: React.FC<{
  isDrawerOpen: boolean
  setIsDrawerOpen: Dispatch<React.SetStateAction<boolean>>
}> = ({ isDrawerOpen, setIsDrawerOpen }) => {
  const { setIsChatbotOpen } = useContext(ChatbotContext)
  const modelName = aiService.getModel()?.name

  return (
    <ChatbotHeader>
      <ChatbotHeaderMain>
        <ChatbotHeaderMenu aria-expanded={isDrawerOpen} onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
        <ChatbotHeaderTitle>
          <Content component='h2'>AI - Diagnosis</Content>
        </ChatbotHeaderTitle>
      </ChatbotHeaderMain>
      <ChatbotHeaderActions>
        {modelName && <Label variant='outline'>{modelName}</Label>}
        <ChatbotHeaderCloseButton onClick={() => setIsChatbotOpen(false)} />
      </ChatbotHeaderActions>
    </ChatbotHeader>
  )
}

const DiagnosisChatbotContent: React.FC = () => {
  const { messages, announcement } = useContext(ChatbotContext)
  const scrollToBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 2) {
      scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <ChatbotContent>
      <MessageBox announcement={announcement}>
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

const DiagnosisChatbotFooter: React.FC = () => {
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

export const ThinkInfo = (think: string) => {
  return (
    <Alert variant='info' title='Think' isExpandable>
      {think}
    </Alert>
  )
}

export const ToolCallsInfo = (call: ToolCall, index: number) => {
  return (
    <Alert key={index} variant='info' customIcon={<WrenchIcon />} title={call.name} isExpandable>
      <p>Args: {JSON.stringify(call.args)} </p>
    </Alert>
  )
}

export const ToolCallsApprove = (toolCalls: ToolCall[]) => {
  const { username } = useContext(PageContext)
  const { messages, setAnnouncement, setIsSendButtonDisabled, updateConversations } = useContext(ChatbotContext)
  const messagesRef = useRef(messages)

  const approve = async (toolCalls: ToolCall[]) => {
    log.debug('Approved', messagesRef.current)

    setIsSendButtonDisabled(true)
    const newMessages: MessageProps[] = []
    newMessages.push(...messagesRef.current)
    newMessages.push(aiService.createUserMessage(username, 'Approved'))
    newMessages.push(aiService.createLoadingBotMessage())
    updateConversations(newMessages)
    // make announcement to assistive devices that new messages have been added
    setAnnouncement(`User approved tool usage. Message from Bot is loading.`)
    log.debug('approve - newMessages:', newMessages)

    const answer = await aiService.invokeTools(toolCalls)
    log.debug('Answer:', answer)
    const loadedMessages: MessageProps[] = []
    loadedMessages.push(...newMessages)
    log.debug('approve - loadedMessages:', loadedMessages)
    // Remove the loading message
    loadedMessages.pop()
    const botMessage = aiService.toBotMessage(answer, ThinkInfo, ToolCallsInfo, ToolCallsApprove)
    loadedMessages.push(botMessage)
    updateConversations(loadedMessages)
    setAnnouncement(`Message from Bot: ${answer}`)
    setIsSendButtonDisabled(false)
  }

  const reject = () => {
    log.debug('Rejected')

    setIsSendButtonDisabled(true)
    const newMessages: MessageProps[] = []
    newMessages.push(...messages)
    newMessages.push(aiService.createUserMessage(username, 'Rejected'))
    setMessages(newMessages)
    setIsSendButtonDisabled(false)
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
