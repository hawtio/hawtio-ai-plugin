import { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav'
import { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message'
import { createContext, Dispatch, useState } from 'react'
import { log } from './globals'
import { ChatbotDialog } from './model'

/**
 * Custom React hook for managing AI Chatbot state and conversation history.
 *
 * Provides state and controls for:
 * - Active messages and multi-dialog conversation history
 * - Assistive device announcements (accessibility)
 * - Drawer open/close visibility and send button state
 */
export function useChatbot(): ChatbotContext {
  const [messages, setMessages] = useState<MessageProps[]>([])
  const [dialogs, setDialogs] = useState<ChatbotDialog[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(false)

  const updateConversations = (messages: MessageProps[], summary?: string) => {
    const dialogId = messages[0]?.id
    if (!dialogId) {
      return
    }
    setMessages(messages)
    let dialog = dialogs.find(d => d.id === dialogId)
    if (dialog) {
      dialog.setMessages(messages)
    } else {
      dialog = new ChatbotDialog(messages, summary)
      dialogs.push(dialog)
    }
    setDialogs([...dialogs])
    log.debug('Updated dialogs:', dialogs)

    if (!conversations.some(c => c.id === dialogId)) {
      const conversation = dialog.createConversation()
      conversations.push(conversation)
      setConversations([...conversations])
      log.debug('Updated conversations:', conversations)
    }
  }

  return {
    messages,
    setMessages,
    dialogs,
    setDialogs,
    conversations,
    setConversations,
    announcement,
    setAnnouncement,
    isChatbotOpen,
    setIsChatbotOpen,
    isSendButtonDisabled,
    setIsSendButtonDisabled,
    updateConversations,
  }
}

export type ChatbotContext = {
  messages: MessageProps[]
  setMessages: Dispatch<React.SetStateAction<MessageProps[]>>
  dialogs: ChatbotDialog[]
  setDialogs: Dispatch<React.SetStateAction<ChatbotDialog[]>>
  conversations: Conversation[]
  setConversations: Dispatch<React.SetStateAction<Conversation[]>>
  announcement: string
  setAnnouncement: Dispatch<React.SetStateAction<string>>
  isChatbotOpen: boolean
  setIsChatbotOpen: (value: boolean) => void
  isSendButtonDisabled: boolean
  setIsSendButtonDisabled: (value: boolean) => void
  updateConversations: (messages: MessageProps[], summary?: string) => void
}

export const ChatbotContext = createContext<ChatbotContext>({
  messages: [],
  setMessages: () => {
    /* no-op */
  },
  dialogs: [],
  setDialogs: () => {
    /* no-op */
  },
  conversations: [],
  setConversations: () => {
    /* no-op */
  },
  announcement: '',
  setAnnouncement: () => {
    /* no-op */
  },
  isChatbotOpen: false,
  setIsChatbotOpen: () => {
    /* no-op */
  },
  isSendButtonDisabled: false,
  setIsSendButtonDisabled: () => {
    /* no-op */
  },
  updateConversations: () => {
    /* no-op */
  },
})
