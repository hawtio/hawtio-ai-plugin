import { hawtio, type HawtioPlugin } from '@hawtio/react'
import { log, pluginName, pluginPath, pluginTitle } from './globals'

const order = 42

export const aiChat: HawtioPlugin = () => {
  log.info('Loading', pluginName)

  hawtio.addDeferredPlugin(pluginName, async () => {
    return import('./ui').then(({ Chat }) => {
      return {
        id: pluginName,
        title: pluginTitle,
        path: pluginPath,
        order,
        component: Chat,
        isActive: async () => true,
      }
    })
  })
}
