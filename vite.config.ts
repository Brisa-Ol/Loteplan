import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path'; // ✅ 1. Importamos path

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true, brotliSize: true }),
  ],

  // ✅ 2. Agregamos la configuración del alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Parche de compatibilidad para librerías legacy
  define: {
    'process.env': {},
  },

  build: {
    sourcemap: false, 
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // 1. Núcleo de React
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // 2. UI Heavy
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // 3. Utilidades Generales
          utils: ['formik', 'yup', 'axios', 'date-fns', '@tanstack/react-query'],
          // 4. 🔴 NUEVO: Herramientas Pesadas (PDF y QR)
          pdf: ['react-pdf', 'pdf-lib', 'pdfjs-dist', 'qrcode'],
        },
      },
    },
    // Subimos el límite de aviso a 1600kb
    chunkSizeWarningLimit: 1600, 
  },
});