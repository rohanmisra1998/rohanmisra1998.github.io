import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const pagesBase = process.env.GITHUB_ACTIONS
  ? repository.endsWith('.github.io') ? '/' : `/${repository}/`
  : '/'

export default defineConfig({
  base: pagesBase,
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true }
})
