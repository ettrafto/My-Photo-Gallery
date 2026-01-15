import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'esbuild', // Use esbuild for faster minification
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and React DOM into separate chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Split animation library
          'animation': ['framer-motion'],
          // Split map libraries
          'map': ['leaflet'],
          // Split data visualization libraries
          'viz': ['d3', 'd3-geo', 'topojson-client'],
        },
      },
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 1000,
  },
})
