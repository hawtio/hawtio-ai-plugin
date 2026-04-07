import { hawtio, helpRegistry, workspace, type HawtioPlugin } from '@hawtio/react'
import { log, pluginName, pluginPath, pluginTitle } from './globals'
import help from './help.md'

const order = 41

export const jmxAi: HawtioPlugin = () => {
  log.info('Loading', pluginName)

  hawtio.addDeferredPlugin(pluginName, async () => {
    return import('./ui').then(({ Jmx }) => {
      return {
        id: pluginName,
        title: pluginTitle,
        path: pluginPath,
        component: Jmx,
        knownQueryParams: ['nid'],
        isActive: async () => workspace.hasMBeans(),
      }
    })
  })
  helpRegistry.add(pluginName, pluginTitle, help, order)
}
