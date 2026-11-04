// バランス調査用の開発サーバー（ポート 5180）
// ゲームのソースは変更せず、配信時にだけゲーム状態とパズルエンジンを window に公開する。
// 使い方: リポジトリ直下で `node balance-sim/sim/server.mjs`
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const expose = {
  name: 'sim-expose',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/hooks/useGameState.js')) {
      let out = code.replace('engineRef.current = engine;', 'engineRef.current = engine; window.__engine = engine;')
      out = out.replace(/\n  return \{\n    isLoaded, setIsLoaded,/, '\n  return window.__gs = {\n    isLoaded, setIsLoaded,')
      if (out === code) throw new Error('inject failed: useGameState.js の構造が変わった可能性があります')
      return out
    }
  },
}

const server = await createServer({
  root,
  configFile: false,
  plugins: [expose, react()],
  define: { __LAST_UPDATE_INFO__: JSON.stringify({ date: '', time: '', summary: 'sim' }) },
  server: { port: 5180, strictPort: true, hmr: false },
  logLevel: 'warn',
})
await server.listen()
console.log('ready: http://localhost:5180/')
