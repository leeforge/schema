import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'cjs',
  clean: true,
  dts: false,
  shims: true,
  platform: 'node',
  target: 'node18',
  minify: true,
  sourcemap: false,
  // Copy assets to dist after build
  onSuccess: async () => {
    const { cp } = await import('fs/promises')
    const { join } = await import('path')

    const assetsSource = join(process.cwd(), 'assets')
    const assetsDest = join(process.cwd(), 'dist', 'assets')

    await cp(assetsSource, assetsDest, {
      recursive: true,
      filter: (src) => {
        return !src.includes('.DS_Store')
      }
    })

    console.log('✓ Assets copied to dist/assets')
  }
})
