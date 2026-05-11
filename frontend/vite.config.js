import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_URL;
  const enableProxy = typeof proxyTarget === 'string' && /^https?:\/\//.test(proxyTarget);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            if (id.includes('/antd/') || id.includes('/@ant-design/')) return 'vendor-antd';
            if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-charts';
            if (id.includes('/xlsx/')) return 'vendor-xlsx';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
              return 'vendor-react';
            }

            return 'vendor';
          },
        },
      },
    },
    server: enableProxy
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})
