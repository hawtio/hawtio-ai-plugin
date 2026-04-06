import { HawtioPlugin, hawtio, helpRegistry } from '@hawtio/react'
import { log, pluginName, pluginPath, pluginTitle } from './globals'
import help from './help.md'
import { Jmx } from './Jmx'

const order = 41

export const jmxAi: HawtioPlugin = () => {
  log.info('Loading', pluginName)

  hawtio.addPlugin({
    id: pluginName,
    title: pluginTitle,
    path: pluginPath,
    component: Jmx,
    isActive: async () => true
  })

  helpRegistry.add(pluginName, pluginTitle, help, order)
}
