import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

/** Absolute path from Node resolution (works with hoisting / different layouts). */
const bootstrapIconsCss = path.join(
  path.dirname(require.resolve('bootstrap-icons/package.json')),
  'font',
  'bootstrap-icons.css',
)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'bootstrap-icons/font/bootstrap-icons.css': bootstrapIconsCss,
    },
  },
  /** Evită 504 „Outdated Optimize Dep” la lazy-load pe /calendar (FullCalendar + locale). */
  optimizeDeps: {
    include: [
      '@fullcalendar/react',
      '@fullcalendar/core',
      '@fullcalendar/daygrid',
      '@fullcalendar/bootstrap5',
      '@fullcalendar/multimonth',
      '@fullcalendar/list',
      '@fullcalendar/interaction',
      '@fullcalendar/core/locales/ro',
    ],
  },
  build: {
    sourcemap: false,
  },
})
