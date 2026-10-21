import { hawtio, helpRegistry, workspace, type HawtioPlugin } from '@hawtio/react'
import { log, pluginName, pluginPath, pluginTitle } from './globals'
import help from './help.md'

const order = 41

export const aiJmx: HawtioPlugin = () => {
  log.info('Loading', pluginName)

  hawtio.addDeferredPlugin(pluginName, async () => {
    const [{ Jmx }, { JmxDiagnoseButton }] = await Promise.all([import('./ui'), import('./JmxDiagnoseButton')])

    hawtio.addExtension('jmx-attributes-toolbar', {
      component: JmxDiagnoseButton,
      pluginId: pluginName,
    })

    return {
      id: pluginName,
      title: pluginTitle,
      path: pluginPath,
      order,
      component: Jmx,
      knownQueryParams: ['nid'],
      isActive: async () => workspace.hasMBeans(),
    }
  })
  helpRegistry.add(pluginName, pluginTitle, help, order)
}
