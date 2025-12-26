import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This allows your code to access process.env.GEMINI_API_KEY
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
  }
})
