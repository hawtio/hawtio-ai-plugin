import { ChatAnthropic } from '@langchain/anthropic'
import { BaseLanguageModelInput } from '@langchain/core/language_models/base'
import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import { ToolCall } from '@langchain/core/messages/tool'
import { Runnable } from '@langchain/core/runnables'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOllama } from '@langchain/ollama'
import { ChatOpenAI } from '@langchain/openai'
import { MessageExtraContent, MessageProps } from '@patternfly/chatbot/dist/dynamic/Message'
import botAvatar from '@patternfly/chatbot/patternfly-docs/content/extensions/chatbot/examples/Messages/patternfly_avatar.jpg'
import userAvatar from '@patternfly/react-core/dist/styles/assets/images/img_avatar-light.svg'
import { ComponentType, createElement } from 'react'
import { AiModel } from './ai-model'
import { aiPreferencesService } from './ai-preferences-service'
import { log } from './globals'
import { getWorkspaceTools } from './tools'

const BOT_NAME = 'Hawtio AI'

const TOOLS: DynamicStructuredTool[] = getWorkspaceTools()
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
  newChat(
    dialogId: string,
    initialMessage: { message: string; system?: string },
    onMessage?: (answer: AIMessage) => void,
  ): Promise<AIMessage | string>
  chat(dialogId: string, message: string, onMessage?: (answer: AIMessage) => void): Promise<AIMessage | string>
  invokeTools(
    dialogId: string,
    toolCalls: ToolCall[],
    onMessage?: (answer: AIMessage) => void,
    step?: number,
  ): Promise<AIMessage | string>
  hasToolCalls(answer: AIMessage | string): answer is AIMessage
  rejectTools(dialogId: string, toolCalls: ToolCall[]): void
  createUserMessage(name: string, content: string): MessageProps
  createLoadingBotMessage(): MessageProps
  createBotMessage(content: string, extraContent?: MessageExtraContent): MessageProps
  toBotMessage(
    answer: AIMessage | string,
    autoApprove: boolean,
    ThinkInfo: ComponentType<{ think: string }>,
    ToolCallsInfo: ComponentType<{ call: ToolCall; index: number }>,
    ToolCallsApprove: ComponentType<{ toolCalls: ToolCall[]; messageId: string }>,
  ): MessageProps
}

class AiService implements IAiService {
  private model?: AiModel
  private llm?: LLM
  private llmWithTools?: Runnable<BaseLanguageModelInput, AIMessageChunk>
  private memory: Record<string, BaseMessage[]> = {}

  private appendToolMessages(messages: BaseMessage[], toolCalls: ToolCall[], content: string): void {
    for (const call of toolCalls) {
      messages.push(new ToolMessage({ tool_call_id: call.id ?? call.name, content }))
    }
  }

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

  newChat(
    dialogId: string,
    initialMessage: { message: string; system?: string },
    onMessage?: (answer: AIMessage) => void,
  ): Promise<AIMessage | string> {
    const { message, system } = initialMessage
    if (system) {
      this.memory[dialogId] = [new SystemMessage(system)]
    } else {
      this.memory[dialogId] = []
    }
    return this.chat(dialogId, message, onMessage)
  }

  hasToolCalls(answer: AIMessage | string): answer is AIMessage {
    return typeof answer !== 'string' && (answer.tool_calls?.length ?? 0) > 0
  }

  async chat(dialogId: string, message: string, onMessage?: (answer: AIMessage) => void): Promise<AIMessage | string> {
    let messages = this.memory[dialogId]
    if (!messages) {
      messages = []
      this.memory[dialogId] = messages
    }
    messages.push(new HumanMessage(message))
    const answer = await this.invoke(messages)
    if (typeof answer !== 'string') {
      messages.push(answer)
    }
    log.debug('Current messages:', messages)

    // If the LLM requests auto-approved tool calls, delegate to invokeTools which
    // handles the full auto-approve loop with a step limit.
    if (this.hasToolCalls(answer)) {
      const { toolPermissions } = aiPreferencesService.loadOptions()
      if (answer.tool_calls!.every(call => toolPermissions?.[call.name] === true)) {
        onMessage?.(answer)
        return this.invokeTools(dialogId, answer.tool_calls!, onMessage)
      }
    }

    return answer
  }

  /**
   * Executes the given tool calls and invokes the LLM with the results.
   * If the LLM responds with further tool calls that are all auto-approved,
   * this method recurses (up to {@link maxAutoToolSteps} times) to continue
   * the chain without interruption. Tool calls that are not auto-approved are
   * returned as-is so the caller can decide to approve or reject them.
   *
   * @param step - Current recursion depth; used to enforce the step limit.
   */
  async invokeTools(
    dialogId: string,
    toolCalls: ToolCall[],
    onMessage?: (answer: AIMessage) => void,
    step = 0,
  ): Promise<AIMessage | string> {
    if (!this.llmWithTools) {
      return 'Tool invocation not supported'
    }

    let messages = this.memory[dialogId]
    if (!messages) {
      messages = []
      this.memory[dialogId] = messages
    }

    const { toolPermissions, maxAutoToolSteps } = aiPreferencesService.loadOptions()
    if (step >= maxAutoToolSteps!) {
      const limitMessage = `Automatic tool-call step limit reached after ${maxAutoToolSteps} steps.`
      this.appendToolMessages(messages, toolCalls, limitMessage)
      log.warn(`Auto-tool execution stopped after ${maxAutoToolSteps} steps to prevent runaway execution.`)
      return `Stopped after ${maxAutoToolSteps} automatic tool-call steps. You can increase the limit in Preferences.`
    }

    try {
      for (const call of toolCalls) {
        log.debug('🛠️  Call:', call.name, JSON.stringify(call.args))
        const selectedTool = TOOLS_BY_NAME[call.name]
        const toolAnswer = await selectedTool?.invoke(call)
        if (toolAnswer) {
          log.debug('🛠️  ' + call.name + ':', toolAnswer)
          messages.push(toolAnswer)
        }
      }
      const answer = await this.llmWithTools.invoke(messages)
      if (answer) {
        messages.push(answer)
      }
      log.debug('Messages>>', messages)

      // If the LLM requests more auto-approved tool calls, recurse with incremented step counter
      if (this.hasToolCalls(answer) && answer.tool_calls!.every(call => toolPermissions?.[call.name] === true)) {
        onMessage?.(answer)
        return this.invokeTools(dialogId, answer.tool_calls!, onMessage, step + 1)
      }

      return answer
    } catch (error) {
      log.error('Error while invoking tools:', error)
      return String(error)
    }
  }

  rejectTools(dialogId: string, toolCalls: ToolCall[]): void {
    const messages = this.memory[dialogId]
    if (!messages) return
    this.appendToolMessages(messages, toolCalls, 'User rejected')
    log.debug(
      'rejectTools - added rejection ToolMessages for:',
      toolCalls.map(c => c.name),
    )
  }

  private generateId(): string {
    return crypto.randomUUID()
  }

  createUserMessage(name: string, content: string): MessageProps {
    const id = this.generateId()
    return {
      id,
      role: 'user',
      content,
      name,
      avatar: userAvatar,
      timestamp: new Date().toLocaleString(),
    }
  }

  createLoadingBotMessage(): MessageProps {
    const id = this.generateId()
    return {
      id,
      role: 'bot',
      name: BOT_NAME,
      avatar: botAvatar,
      avatarProps: { style: { fontSize: '90%' } },
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
      avatar: botAvatar,
      avatarProps: { style: { fontSize: '90%' } },
      content,
      extraContent,
      isLoading: false,
      timestamp: new Date().toLocaleString(),
    }
  }

  private extractThink(message: AIMessage): MessageWithThink {
    const content = message.content as string
    let think: string | undefined
    if (message.additional_kwargs?.reasoning_content) {
      think = message.additional_kwargs?.reasoning_content as string | undefined
    }
    return { content, think }
  }

  toBotMessage(
    answer: AIMessage | string,
    autoApprove: boolean,
    ThinkInfo: ComponentType<{ think: string }>,
    ToolCallsInfo: ComponentType<{ call: ToolCall; index: number }>,
    ToolCallsApprove: ComponentType<{ toolCalls: ToolCall[]; messageId: string }>,
  ): MessageProps {
    if (typeof answer === 'string') {
      // Error
      return this.createBotMessage(`Error: ${answer}`)
    }

    if (!answer.tool_calls || answer.tool_calls.length === 0) {
      // No tool calls — normal text response
      const { content, think } = this.extractThink(answer)
      const extraContent = think ? { beforeMainContent: createElement(ThinkInfo, { think }) } : undefined
      return this.createBotMessage(content, extraContent)
    }

    // Tool calls — show which tools are being used
    const toolCalls = answer.tool_calls
    const base = `${BOT_NAME} wants to use ` + (toolCalls.length > 1 ? 'tools' : 'a tool')
    const content = autoApprove ? `${base} (Auto-approved)` : base
    const botMessage = this.createBotMessage(content)
    botMessage.extraContent = {
      beforeMainContent: toolCalls.map((call, index) => createElement(ToolCallsInfo, { key: index, call, index })),
      afterMainContent: autoApprove
        ? undefined
        : createElement(ToolCallsApprove, { toolCalls, messageId: botMessage.id! }),
    }
    return botMessage
  }
}

export const aiService = new AiService()
