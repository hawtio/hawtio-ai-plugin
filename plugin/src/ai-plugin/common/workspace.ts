import { IJolokiaService, IWorkspace, OptimisedMBeanInfo, jolokiaService, workspace } from '@hawtio/react'
import { log } from './globals'

export interface IWorkspaceExtension {
  /** List all ObjectNames available in the workspace cache. */
  listMBeans(): Promise<string[]>

  /**
   * Return the OptimisedMBeanInfo for a specific MBean from the workspace cache.
   * Returns null if the MBean is not found in the cache.
   */
  getMBeanInfo(objectName: string): Promise<OptimisedMBeanInfo | null>

  /** Read the current value of an MBean attribute via Jolokia. */
  readMBeanAttribute(objectName: string, attribute: string): Promise<unknown>

  /** Write a value to a writable MBean attribute via Jolokia. */
  writeMBeanAttribute(objectName: string, attribute: string, value: unknown): Promise<unknown>

  /** Execute an MBean operation via Jolokia. */
  executeMBeanOperation(objectName: string, operation: string, args?: unknown[]): Promise<unknown>
}

/**
 * Extends the Hawtio workspace with MBean query and Jolokia operation methods
 * for use by AI tools. No LangChain dependency — pure Hawtio logic only.
 *
 * Read-only methods (workspace cache):
 *   - listMBeans()
 *   - getMBeanInfo(objectName)
 *
 * Jolokia methods (live server calls):
 *   - readMBeanAttribute(objectName, attribute)
 *   - writeMBeanAttribute(objectName, attribute, value)
 *   - executeMBeanOperation(objectName, operation, args?)
 */
class WorkspaceExtension implements IWorkspaceExtension {
  constructor(
    private readonly workspace: IWorkspace,
    private readonly jolokiaService: IJolokiaService,
  ) {}

  async listMBeans(): Promise<string[]> {
    log.debug('workspace - listMBeans called')
    const tree = await this.workspace.getTree()
    const flat = tree.flatten()
    const result = Object.keys(flat).sort()
    log.debug('workspace - listMBeans result count:', result.length)
    return result
  }

  async getMBeanInfo(objectName: string): Promise<OptimisedMBeanInfo | null> {
    log.debug('workspace - getMBeanInfo called:', objectName)
    const tree = await this.workspace.getTree()
    const flat = tree.flatten()
    const mbeanInfo = flat[objectName]?.mbean ?? null
    if (!mbeanInfo) {
      log.debug('workspace - getMBeanInfo: not found:', objectName)
    }
    return mbeanInfo
  }

  async readMBeanAttribute(objectName: string, attribute: string): Promise<unknown> {
    log.debug('workspace - readMBeanAttribute called:', objectName, attribute)
    return this.jolokiaService.readAttribute(objectName, attribute)
  }

  async writeMBeanAttribute(objectName: string, attribute: string, value: unknown): Promise<unknown> {
    log.debug('workspace - writeMBeanAttribute called:', objectName, attribute, value)
    return this.jolokiaService.writeAttribute(objectName, attribute, value)
  }

  async executeMBeanOperation(objectName: string, operation: string, args?: unknown[]): Promise<unknown> {
    log.debug('workspace - executeMBeanOperation called:', objectName, operation, args)
    return this.jolokiaService.execute(objectName, operation, args)
  }
}

export const workspaceExtension: IWorkspaceExtension = new WorkspaceExtension(workspace, jolokiaService)
