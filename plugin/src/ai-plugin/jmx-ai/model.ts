import { Conversation, MessageProps } from '@patternfly/chatbot'

export class ChatbotDialog {
  public readonly id: string

  constructor(
    public messages: MessageProps[],
    private summary?: string,
  ) {
    this.id = messages[0]?.id ?? ''
  }

  setMessages(messages: MessageProps[]) {
    if (messages[0]?.id !== this.id) {
      throw new Error('Not the same dialog')
    }
    this.messages = [...messages]
  }

  createConversation(): Conversation {
    const text = this.summary ?? (this.messages[0]?.content ?? '').substring(0, 20)
    return { id: this.id, text }
  }
}
