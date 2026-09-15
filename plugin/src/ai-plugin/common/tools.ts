import { MBeanNode, workspace } from '@hawtio/react'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { log } from './globals'
import { workspaceExtension } from './workspace'

function listMBeansTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'listMBeans',
    description: `
      List all MBean ObjectNames available in the Hawtio workspace cache.
      Use this to discover what MBeans are present before querying details.
    `,
    schema: z.object({}),
    func: async (): Promise<string> => {
      log.debug('tools - listMBeans called')
      const result = await workspaceExtension.listMBeans()
      return JSON.stringify(result)
    },
  })
}

function getMBeanInfoTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'getMBeanInfo',
    description: `
      Return the attribute schema (type, description, read/write flag) and operation definitions
      (arguments, return type, description) for a specific MBean.
      Call this before readMBeanAttribute or executeMBeanOperation to inspect available fields.
    `,
    schema: z.object({
      objectName: z.string().describe("JMX ObjectName of the target MBean, e.g. 'java.lang:type=Memory'"),
    }),
    func: async ({ objectName }): Promise<string> => {
      log.debug('tools - getMBeanInfo called:', objectName)
      const info = await workspaceExtension.getMBeanInfo(objectName)
      if (!info) {
        return JSON.stringify({ error: `MBean not found: ${objectName}` })
      }
      return JSON.stringify({ objectName, attr: info.attr, op: info.op })
    },
  })
}

function searchMBeansTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'searchMBeans',
    description: `
      Search MBeans by JMX domain and property key/value pairs.
      Returns a list of matching ObjectNames.
      Use this to narrow down MBeans by type or name, e.g. domain='java.lang', properties='{"type":"Memory"}'.
    `,
    schema: z.object({
      domain: z.string().describe("JMX domain to search in, e.g. 'java.lang'"),
      properties: z
        .string()
        .describe('JSON string of JMX property key/value pairs to match, e.g. \'{"type":"Memory"}\''),
    }),
    func: async ({ domain, properties }): Promise<string> => {
      log.debug('tools - searchMBeans called:', domain, properties)
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(properties) as Record<string, unknown>
      } catch {
        return JSON.stringify({ error: `Invalid JSON for properties: ${properties}` })
      }
      const nodes: MBeanNode[] = await workspace.findMBeans(domain, parsed)
      const result = nodes.map((n: MBeanNode) => n.objectName).filter((s): s is string => s !== undefined)
      log.debug('tools - searchMBeans result count:', result.length)
      return JSON.stringify(result)
    },
  })
}

function readMBeanAttributeTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'readMBeanAttribute',
    description: `
      Read the current value of an MBean attribute via Jolokia.
      This is a read-only operation with no side effects.
      Use getMBeanInfo first to confirm the attribute name and type.
    `,
    schema: z.object({
      objectName: z.string().describe("ObjectName of the target MBean, e.g. 'java.lang:type=Memory'"),
      attribute: z.string().describe("Name of the attribute to read, e.g. 'HeapMemoryUsage'"),
    }),
    func: async ({ objectName, attribute }): Promise<string> => {
      log.debug('tools - readMBeanAttribute called:', objectName, attribute)
      try {
        const value = await workspaceExtension.readMBeanAttribute(objectName, attribute)
        return JSON.stringify({ objectName, attribute, value })
      } catch (e) {
        return JSON.stringify({ error: String(e) })
      }
    },
  })
}

function writeMBeanAttributeTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'writeMBeanAttribute',
    description: `
      Write a value to a writable MBean attribute via Jolokia.
      Verify rw=true with getMBeanInfo before calling this tool.
    `,
    schema: z.object({
      objectName: z.string().describe("ObjectName of the target MBean, e.g. 'java.lang:type=Memory'"),
      attribute: z.string().describe('Name of the attribute to write'),
      value: z.string().describe('JSON-encoded value to set, e.g. "42" or "true" or "\\"hello\\""'),
    }),
    func: async ({ objectName, attribute, value }): Promise<string> => {
      log.debug('tools - writeMBeanAttribute called:', objectName, attribute, value)
      let parsed: unknown
      try {
        parsed = JSON.parse(value)
      } catch {
        parsed = value
      }
      try {
        const result = await workspaceExtension.writeMBeanAttribute(objectName, attribute, parsed)
        return JSON.stringify({ objectName, attribute, result })
      } catch (e) {
        return JSON.stringify({ error: String(e) })
      }
    },
  })
}

function executeMBeanOperationTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'executeMBeanOperation',
    description: `
      Execute an MBean operation via Jolokia.
      Use getMBeanInfo to verify the operation signature before calling.
      For overloaded operations include the signature, e.g. 'gc()'.
    `,
    schema: z.object({
      objectName: z.string().describe("ObjectName of the target MBean, e.g. 'java.lang:type=Memory'"),
      operation: z.string().describe("Operation name to invoke, e.g. 'gc' or 'gc()'"),
      args: z
        .array(z.string())
        .optional()
        .describe('JSON-encoded arguments to pass to the operation, e.g. ["value1", "42"]'),
    }),
    func: async ({ objectName, operation, args }): Promise<string> => {
      log.debug('tools - executeMBeanOperation called:', objectName, operation, args)
      const parsedArgs = args?.map((a: string) => {
        try {
          return JSON.parse(a)
        } catch {
          return a
        }
      })
      try {
        const result = await workspaceExtension.executeMBeanOperation(objectName, operation, parsedArgs)
        return JSON.stringify({ objectName, operation, result })
      } catch (e) {
        return JSON.stringify({ error: String(e) })
      }
    },
  })
}

/** Returns all the workspace tools available in Hawtio AI. */
export function getWorkspaceTools(): DynamicStructuredTool[] {
  return [
    listMBeansTool(),
    getMBeanInfoTool(),
    searchMBeansTool(),
    readMBeanAttributeTool(),
    writeMBeanAttributeTool(),
    executeMBeanOperationTool(),
  ]
}
