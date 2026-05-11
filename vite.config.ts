import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
