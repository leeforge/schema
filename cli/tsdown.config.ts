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
  sourcemap: true,
})
