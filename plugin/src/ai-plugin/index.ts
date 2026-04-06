import { HawtioPlugin, configManager } from '@hawtio/react'
import { jmxAi } from './jmx-ai'
import { aiCommon } from './common'

/**
 * The entry function for the plugin exposed to Hawtio.
 *
 * The default name for the function is "plugin". If you want to use the name other
 * than the default one, you need to specify the name using {HawtioPlugin#setPluginEntry()}
 * method when registering the plugin to JMX MBean server.
 *
 * <code>
 * HawtioPlugin plugin = new HawtioPlugin();
 * plugin.setPluginEntry("registerMyPlugin");
 * </code>
 *
 * @see src/main/java/io/hawt/example/spring/boot/SampleSpringBootService.java
 */
export const plugin: HawtioPlugin = () => {
  aiCommon()
  jmxAi()
}

// Register the custom plugin version to Hawtio
// See package.json "replace-version" script for how to replace the version placeholder with a real version
configManager.addProductInfo('Hawtio AI Plugin', '__PACKAGE_VERSION_PLACEHOLDER__')
