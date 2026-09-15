import { defineConfig } from 'tsup'

export default defineConfig(() => {
  return {
    entry: ['src/ai-plugin/index.ts'],
    target: 'esnext',
    dts: true,
    format: 'cjs',
    sourcemap: true,
    splitting: false,
    external: ['jolokia.js'],
    loader: {
      '.svg': 'dataurl',
      '.jpg': 'dataurl',
      '.png': 'dataurl',
      '.md': 'text',
    },
  }
})
