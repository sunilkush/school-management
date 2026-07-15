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
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            // Large libraries used by only a handful of lazy-loaded routes:
            // isolate them so they don't get pulled into whatever chunk
            // happens to load first. Everything else is left to Rollup's
            // automatic per-dynamic-import chunking, so a heavy dependency
            // only used by one lazy page ships only with that page instead
            // of one shared mega-chunk that blocks every route (including
            // the login screen) on first load.
            if (id.includes('/xlsx/')) return 'vendor-xlsx';
            if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-charts';
            if (id.includes('/@ant-design/plots/') || id.includes('/@antv/')) return 'vendor-plots';
            if (id.includes('/leaflet/') || id.includes('/react-leaflet/')) return 'vendor-maps';
            if (id.includes('/@fullcalendar/')) return 'vendor-calendar';
            if (id.includes('/chart.js/') || id.includes('/react-chartjs-2/')) return 'vendor-chartjs';

            // Deliberately NOT splitting react/react-dom/antd/primereact into
            // their own chunks: they're all used eagerly by the root app
            // shell (providers in main.jsx) and antd/primereact read from
            // React at module-eval time. Forcing them into separate chunks
            // let Rollup order their script evaluation incorrectly and
            // crashed the whole app ("Cannot read properties of undefined
            // (reading 'version')") before React ever mounted. Only split
            // out libraries that are exclusively pulled in by specific
            // React.lazy() route chunks, never by the eager root render.
            return undefined;
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
