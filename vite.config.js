import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import license from 'rollup-plugin-license'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            output: path.resolve(process.cwd(), 'dist/licenses.txt'),
            includePrivate: false,
          },
        }),
      ],
    },
  },
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
  }
})
