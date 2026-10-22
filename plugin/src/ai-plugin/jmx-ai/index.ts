import { hawtio, workspace, type HawtioPlugin } from '@hawtio/react'
import { log, pluginName } from './globals'

export const aiJmx: HawtioPlugin = () => {
  log.info('Loading', pluginName)

  hawtio.addDeferredPlugin(pluginName, async () => {
    return import('./JmxDiagnoseButton').then(({ JmxDiagnoseButton }) => {
      hawtio.addExtension('jmx-attributes-toolbar', {
        component: JmxDiagnoseButton,
        pluginId: pluginName,
      })

      return {
        id: pluginName,
        isActive: async () => workspace.hasMBeans(),
      }
    })
  })
}
