import { EVENT_REFRESH, eventService, MBeanNode, MBeanTree, PluginNodeSelectionContext, workspace } from '@hawtio/react'
import { Conversation } from '@patternfly/chatbot/dist/esm/ChatbotConversationHistoryNav'
import { MessageProps } from '@patternfly/chatbot/dist/esm/Message'
import { createContext, Dispatch, useContext, useEffect, useRef, useState } from 'react'
import { To, useNavigate, useSearchParams } from 'react-router-dom'
import { log, PARAM_KEY_NODE_ID, pluginName, pluginPath } from './globals'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function useMBeanTree(): MBeanTreeContext {
  const [tree, setTree] = useState(MBeanTree.createEmpty(pluginName))
  const [loaded, setLoaded] = useState(false)
  const { selectedNode, setSelectedNode } = useContext(PluginNodeSelectionContext)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  /*
   * Need to preserve the selected node between re-renders since the
   * populateTree function called via the refresh listener does not
   * cache the value and stores it as null
   */
  const refSelectedNode = useRef<MBeanNode | null>()
  refSelectedNode.current = selectedNode

  const populateTree = async () => {
    const wkspTree = await workspace.getTree()
    setTree(wkspTree)

    const nodeId = searchParams.get(PARAM_KEY_NODE_ID)
    if (nodeId && nodeId !== refSelectedNode.current?.id) {
      log.debug('Restore selected node with nid:', nodeId)
      // Try to restore node from URL
      const urlNode = wkspTree.find(node => node.id === nodeId)
      if (urlNode) {
        setSelectedNode(urlNode)
        refSelectedNode.current = urlNode
      } else {
        // Clear nid as it is invalid
        log.debug('Clear invalid nid:', nodeId)
        searchParams.delete(PARAM_KEY_NODE_ID)
        setSearchParams(searchParams)
      }
    }

    if (!refSelectedNode.current) return

    const path = [...refSelectedNode.current.path()]

    // Expand the nodes to redisplay the path
    wkspTree.forEach(path, node => {
      node.defaultExpanded = true
    })

    // Ensure the new version of the selected node is selected
    const newSelected = wkspTree.navigate(...path)
    if (newSelected) {
      setSelectedNode(newSelected)
      // Reset to base path with nid to sync URL with restored selection
      navigate(pluginPathWithNodeId(newSelected, searchParams))
    } else {
      // Node no longer exists - clear selection and go to base path
      navigate(pluginPath)
    }
  }

  useEffect(() => {
    const loadTree = async () => {
      await populateTree()
      setLoaded(true)
    }

    const listener = () => {
      setLoaded(false)
      loadTree()
    }
    eventService.onRefresh(listener)

    loadTree()

    return () => eventService.removeListener(EVENT_REFRESH, listener)
  }, [])

  return { tree, loaded, selectedNode, setSelectedNode }
}

/**
 * Build URL query string with nid parameter, preserving other existing params
 * @param node - The node to encode
 * @param searchParams - The current URL search params to preserve, defaults to the ones from the window location
 */
export function pluginPathWithNodeId(
  node: MBeanNode,
  searchParams: URLSearchParams = new URLSearchParams(window.location.search),
): Partial<To> {
  searchParams.set(PARAM_KEY_NODE_ID, node.id)
  const query = `?${searchParams.toString()}`
  return { pathname: pluginPath, search: query }
}

type MBeanTreeContext = {
  tree: MBeanTree
  selectedNode: MBeanNode | null
  setSelectedNode: (selected: MBeanNode | null) => void
}

export const MBeanTreeContext = createContext<MBeanTreeContext>({
  tree: MBeanTree.createEmpty(pluginName),
  selectedNode: null,
  setSelectedNode: () => {
    /* no-op */
  },
})

export type Conversations = Conversation[] | Record<string, Conversation[]>

export const initialConversations: Conversations = {}

/**
 * Custom React hook for using AI Chatbot.
 */
export function useChatbot(): ChatbotContext {
  const [messages, setMessages] = useState<MessageProps[]>([])
  const [conversations, setConversations] = useState<Conversations>(initialConversations)
  const [announcement, setAnnouncement] = useState('')
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(false)
  return {
    messages,
    setMessages,
    conversations,
    setConversations,
    announcement,
    setAnnouncement,
    isChatbotOpen,
    setIsChatbotOpen,
    isSendButtonDisabled,
    setIsSendButtonDisabled,
  }
}

type ChatbotContext = {
  messages: MessageProps[]
  setMessages: Dispatch<React.SetStateAction<MessageProps[]>>
  conversations: Conversations
  setConversations: Dispatch<React.SetStateAction<Conversations>>
  announcement: string
  setAnnouncement: Dispatch<React.SetStateAction<string>>
  isChatbotOpen: boolean
  setIsChatbotOpen: (value: boolean) => void
  isSendButtonDisabled: boolean
  setIsSendButtonDisabled: (value: boolean) => void
}

export const ChatbotContext = createContext<ChatbotContext>({
  messages: [],
  setMessages: () => {
    /* no-op */
  },
  conversations: initialConversations,
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
})
