import { AIMessage } from '@langchain/core/messages'
import { aiService } from '../common/ai-service'

const SYSTEM_MESSAGES = {
  diagnosis: `You are a helpful assistant diagnosing a JMX MBean based on its attribute values.
Given the following ObjectName and attribute values, identify any potential issues or anomalies.
Provide suggestions for further investigation or resolution if applicable.
Respond in a concise manner.`,
} as const

export interface IJmxAiService {
  diagnoseMessage(objectName: string, attributes: string): string
}

class JmxAiService implements IJmxAiService {
  systemMessage(): string {
    return SYSTEM_MESSAGES.diagnosis
  }

  diagnoseMessage(objectName: string, attributes: string): string {
    return `ObjectName:
~~~
${objectName}
~~~
Attribute values:
~~~
${attributes}
~~~
What potential issues or anomalies do you see?`
  }
}

export const jmxAiService = new JmxAiService()
