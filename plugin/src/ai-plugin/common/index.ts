import { HawtioPlugin, preferencesRegistry } from '@hawtio/react'
import { AiPreferences } from '../common/AiPreferences'
import { pluginName, pluginTitle } from './globals'

const order = 40

export const aiCommon: HawtioPlugin = () => {
  preferencesRegistry.add(pluginName, pluginTitle, AiPreferences, order)
}
