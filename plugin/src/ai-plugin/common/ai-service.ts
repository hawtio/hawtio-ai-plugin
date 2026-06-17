import { ChatAnthropic } from '@langchain/anthropic'
import { BaseLanguageModelInput } from '@langchain/core/language_models/base'
import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ToolCall } from '@langchain/core/messages/tool'
import { Runnable } from '@langchain/core/runnables'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOllama } from '@langchain/ollama'
import { ChatOpenAI } from '@langchain/openai'
import { MessageExtraContent, MessageProps } from '@patternfly/chatbot/dist/esm/Message'
import patternflyAvatar from '@patternfly/chatbot/patternfly-docs/content/extensions/chatbot/examples/Messages/patternfly_avatar.jpg'
import userAvatar from '@patternfly/react-core/dist/styles/assets/images/img_avatar-light.svg'
import { ReactNode } from 'react'
import { log } from '../jmx-ai/globals'
import { AiModel } from './ai-model'
import { aiPreferencesService } from './ai-preferences-service'

const BOT_NAME = 'Hawtio AI'

const TOOLS: DynamicStructuredTool[] = [] as const
const TOOLS_BY_NAME: Record<string, DynamicStructuredTool> = TOOLS.reduce(
  (acc, tool) => {
    acc[tool.name] = tool
    return acc
  },
  {} as Record<string, DynamicStructuredTool>,
)

export type MessageWithThink = {
  content: string
  think?: string
}

export type LLM = ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI | ChatOllama

export interface IAiService {
  reset(model: AiModel): void
  getModel(): AiModel | undefined
  newChat(dialogId: string, message: string, system?: string): Promise<AIMessage | string>
  chat(dialogId: string, message: string): Promise<AIMessage | string>
  invokeTools(dialogId: string, toolCalls: ToolCall[]): Promise<AIMessage | string>
  createUserMessage(name: string, content: string): MessageProps
  createLoadingBotMessage(): MessageProps
  createBotMessage(content: string, extraContent?: MessageExtraContent): MessageProps
  extractThink(message: string): MessageWithThink
  toBotMessage(
    answer: AIMessage | string,
    thinkInfo: (think: string) => ReactNode,
    toolCallsInfo: (call: ToolCall, index: number) => ReactNode,
    toolCallsApprove: (toolCalls: ToolCall[]) => ReactNode,
  ): MessageProps
}

class AiService implements IAiService {
  private model?: AiModel
  private llm?: LLM
  private llmWithTools?: Runnable<BaseLanguageModelInput, AIMessageChunk>
  private memory: Record<string, BaseMessage[]> = {}

  reset(model: AiModel): void {
    if (this.model && this.model.id === model.id && this.llm && (!model.tool || this.llmWithTools)) {
      return
    }
    log.info('AI model to use:', model.id)
    // Reset the current memory
    this.memory = {}
    const { token } = aiPreferencesService.loadOptions()
    this.model = model
    try {
      switch (this.model.provider) {
        case 'openai':
          this.llm = new ChatOpenAI({
            model: this.model.id,
            apiKey: token,
            temperature: 0,
            streaming: false,
          })
          break
        case 'anthropic':
          this.llm = new ChatAnthropic({
            model: this.model.id,
            apiKey: token,
            temperature: 0,
            streaming: false,
          })
          break
        case 'google-genai':
          this.llm = new ChatGoogleGenerativeAI({
            model: this.model.id,
            apiKey: token,
            temperature: 0,
            disableStreaming: true,
          })
          break
        case 'ollama':
        default:
          this.llm = new ChatOllama({
            model: this.model.id,
            streaming: false,
          })
      }
    } catch (error) {
      // Mostly token is missing/invalid
      log.warn('Error initialising AI model:', error)
      this.llm = undefined
    }
    this.llmWithTools = undefined
    if (TOOLS.length !== 0 && this.model.tool) {
      this.llmWithTools = this.llm?.bindTools(TOOLS)
    }
  }

  private getLlm(): LLM | Runnable<BaseLanguageModelInput, AIMessageChunk> | undefined {
    if (!this.model || !this.llm) {
      const { model } = aiPreferencesService.loadOptions()
      this.reset(model)
    }
    return this.llmWithTools ?? this.llm
  }

  getModel(): AiModel | undefined {
    this.getLlm()
    return this.model
  }

  private async invoke(messages: BaseMessage[]): Promise<AIMessage | string> {
    // Lazy init model and llm
    const llm = this.getLlm()
    log.debug('Chatting with', this.model?.id, ':', messages)
    try {
      let answer: AIMessageChunk
      if (!llm) {
        throw new Error('AI model not configured')
      }
      answer = await llm.invoke(messages)

      if (answer.tool_calls && answer.tool_calls.length > 0) {
        log.debug('🛠️  calls:', answer.tool_calls)
      }
      log.debug('Answer:', answer)
      return answer
    } catch (error) {
      log.error('Error while chatting:', error)
      return String(error)
    }
  }

  newChat(dialogId: string, message: string, system?: string): Promise<AIMessage | string> {
    if (system) {
      this.memory[dialogId] = [new SystemMessage(system)]
    } else {
      this.memory[dialogId] = []
    }
    return this.chat(dialogId, message)
  }

  async chat(dialogId: string, message: string): Promise<AIMessage | string> {
    let messages = this.memory[dialogId]
    if (!messages) {
      messages = []
      this.memory[dialogId] = messages
    }
    messages.push(new HumanMessage(message))
    const answer = await this.invoke(messages)
    if (typeof answer !== 'string') {
      // Non-error answer
      messages.push(answer)
    }
    return answer
  }

  async invokeTools(dialogId: string, toolCalls: ToolCall[]): Promise<AIMessage | string> {
    if (!this.llmWithTools) {
      return 'Tool invocation not supported'
    }

    let messages = this.memory[dialogId]
    if (!messages) {
      messages = []
      this.memory[dialogId] = messages
    }

    for (const call of toolCalls) {
      log.debug('🛠️  Call:', call.name, JSON.stringify(call.args))
      const selectedTool = TOOLS_BY_NAME[call.name]
      const toolAnswer = await selectedTool?.invoke(call)
      if (toolAnswer) {
        log.debug('🛠️  ' + call.name + ':', toolAnswer)
        messages.push(toolAnswer)
      }
    }
    const finalAnswer = await this.llmWithTools.invoke(messages)
    if (finalAnswer) {
      messages.push(finalAnswer)
    }
    console.debug('Messages>>', messages)
    return finalAnswer
  }

  private generateId(): string {
    return crypto.randomUUID()
  }

  createUserMessage(name: string, content: string): MessageProps {
    const id = this.generateId()
    return { id, role: 'user', content, name, avatar: userAvatar }
  }

  createLoadingBotMessage(): MessageProps {
    const id = this.generateId()
    return {
      id,
      role: 'bot',
      name: BOT_NAME,
      avatar: patternflyAvatar,
      content: 'API response goes here',
      isLoading: true,
    }
  }

  createBotMessage(content: string, extraContent?: MessageExtraContent): MessageProps {
    const id = this.generateId()
    return {
      id,
      role: 'bot',
      name: BOT_NAME,
      avatar: patternflyAvatar,
      content,
      extraContent,
      isLoading: false,
    }
  }

  extractThink(message: string): MessageWithThink {
    // extract inside <think>...</think> from message
    const think = message.match(/<think>(.*?)<\/think>/s)?.[1]?.trim()
    // remove <think>...</think> from message
    const content = message.replace(/<think>.*?<\/think>/s, '')
    log.debug('extractThink - content:', content, 'think:', think)
    return { content, think }
  }

  toBotMessage(
    answer: AIMessage | string,
    thinkInfo: (think: string) => ReactNode,
    toolCallsInfo: (call: ToolCall, index: number) => ReactNode,
    toolCallsApprove: (toolCalls: ToolCall[]) => ReactNode,
  ): MessageProps {
    if (typeof answer === 'string') {
      // Error
      return aiService.createBotMessage(`Error: ${answer}`)
    }

    if (!answer.tool_calls || answer.tool_calls.length === 0) {
      // No tool calls
      const { content, think } = aiService.extractThink(answer.content as string)
      const extraContent = think ? { beforeMainContent: thinkInfo(think) } : undefined
      return aiService.createBotMessage(content, extraContent)
    }

    // Tool calls
    const toolCalls = answer.tool_calls
    const content = `${BOT_NAME} wants to use ` + (toolCalls.length > 1 ? 'tools' : 'a tool')
    const extraContent = {
      beforeMainContent: toolCalls.map(toolCallsInfo),
      afterMainContent: toolCallsApprove(toolCalls),
    }
    return aiService.createBotMessage(content, extraContent)
  }
}

export const aiService = new AiService()
