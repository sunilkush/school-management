import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
// Bundle composition was audited via rollup-plugin-visualizer (installed as
// a devDependency) — framer-motion + React/Router account for the bulk of
// the ~163KB gzipped main chunk, which is the direct, expected cost of the
// animation-rich spec, not inefficiency. Re-enable the visualizer plugin
// here (`visualizer({ filename: 'dist/stats.html', gzipSize: true })`) if a
// deeper look is ever needed again.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
