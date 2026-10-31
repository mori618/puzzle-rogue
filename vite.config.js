import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import license from 'rollup-plugin-license'
import path from 'path'
import { execFileSync } from 'node:child_process'

// タイトル画面の「最終更新」に表示する情報をビルド時に生成する
// （最新コミットの日時を日本時間で表示。git が使えない環境ではビルド日時を使う）
function getLastUpdateInfo() {
  let date = new Date()
  let summary = ''
  try {
    const [isoDate, subject] = execFileSync('git', ['log', '-1', '--format=%cI%n%s'], { encoding: 'utf8' }).trim().split('\n')
    const commitDate = new Date(isoDate)
    if (!Number.isNaN(commitDate.getTime())) date = commitDate
    summary = (subject || '')
      .replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '') // "fix: " などのプレフィックスを除去
      .replace(/\s*\(#\d+\)$/, '') // 末尾の "(#12)" を除去
  } catch {
    // git が使えない場合はビルド日時のみ表示
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date).map(({ type, value }) => [type, value])
  )
  return {
    date: `${parts.year}/${parts.month}/${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    summary,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __LAST_UPDATE_INFO__: JSON.stringify(getLastUpdateInfo()),
  },
  build: {
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            output: path.resolve(process.cwd(), 'dist/licenses.txt'), // eslint-disable-line no-undef
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
