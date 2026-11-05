// Service Worker（オフライン対応）の登録と、アプリ更新の管理
//
// 新しいバージョンを公開しても勝手には切り替えず、プレイヤーが画面の「更新」ボタンを
// 押したときに反映する（プレイ中に突然リロードされるのを防ぐ）。

import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // ホーム画面アプリは開きっぱなしになりやすいので定期確認

const state = {
  needRefresh: false, // 新しいバージョンが待機中
  offlineReady: false, // 初回キャッシュ完了（オフラインで遊べる）
  checking: false,
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
};

// useSyncExternalStore 用に、変更時だけ新しいオブジェクトになるスナップショットを保持する
let snapshot = { ...state };
const listeners = new Set();
const setState = (patch) => {
  Object.assign(state, patch);
  snapshot = { ...state };
  listeners.forEach((fn) => fn());
};

let registration = null;
let updateSW = null;

// --- 外部フォント（Google Fonts / Material Icons）のキャッシュ ---
// 初回訪問時はフォントの読み込みが Service Worker の制御開始より先に終わってしまい、
// ランタイムキャッシュに入らない（→ オフラインでアイコンが文字化けする）。
// SW の制御が始まったら、フォント CSS を SW 経由で取り直し、実際に使われたフォントファイルだけを
// 取得してキャッシュさせる（日本語フォントの全サブセットを落とすと重いため、使用分に限定）。
const FONT_CSS_ORIGIN = 'https://fonts.googleapis.com';
let fontsWarmed = false;

/** "U+0000-00FF, U+0131" と "U+0-FF, U+131" を同じ文字列に正規化 */
const normalizeUnicodeRange = (range) =>
  String(range || 'U+0-10FFFF')
    .split(',')
    .map((part) => {
      const [a, b = a] = part.trim().replace(/^u\+/i, '').split('-');
      return `${parseInt(a.replace(/\?/g, '0'), 16)}-${parseInt(b.replace(/\?/g, 'F'), 16)}`;
    })
    .join(',');

const faceKey = (family, style, weight, range) =>
  [family.replace(/["']/g, '').trim(), (style || 'normal').trim(), String(weight || '400').trim(), normalizeUnicodeRange(range)].join('|');

/** CSS テキストから @font-face ごとの「キー → フォント URL」を作る */
export const parseFontFaces = (cssText) => {
  const map = new Map();
  const blocks = cssText.match(/@font-face\s*{[^}]*}/g) || [];
  for (const block of blocks) {
    const prop = (name) => block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1];
    const url = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1];
    const family = prop('font-family');
    if (!url || !family) continue;
    map.set(faceKey(family, prop('font-style'), prop('font-weight'), prop('unicode-range')), url);
  }
  return map;
};

const warmFontCache = async () => {
  if (fontsWarmed || !navigator.serviceWorker.controller) return;
  fontsWarmed = true;
  try {
    const cssUrls = [...new Set(
      performance.getEntriesByType('resource')
        .map((e) => e.name)
        .filter((u) => u.startsWith(FONT_CSS_ORIGIN + '/'))
    )];
    const faces = new Map();
    await Promise.all(cssUrls.map(async (u) => {
      const res = await fetch(u, { mode: 'cors', credentials: 'omit' }); // SW 経由でキャッシュされる
      parseFontFaces(await res.text()).forEach((v, k) => faces.set(k, v));
    }));
    const fontUrls = new Set();
    document.fonts.forEach((f) => {
      if (f.status !== 'loaded') return;
      const url = faces.get(faceKey(f.family, f.style, f.weight, f.unicodeRange));
      if (url) fontUrls.add(url);
    });
    await Promise.all([...fontUrls].map((u) => fetch(u, { mode: 'cors', credentials: 'omit' }).catch(() => {})));
  } catch (e) {
    fontsWarmed = false; // 失敗したら次の機会に再挑戦
    console.warn('Failed to cache fonts for offline use:', e);
  }
};

const scheduleFontWarmup = () => {
  const run = () => setTimeout(warmFontCache, 1000);
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
};

/** アプリ起動時に一度だけ呼ぶ */
export const initServiceWorker = () => {
  if (updateSW || !state.supported) return;
  // 2回目以降の起動は最初から制御下、初回は clientsClaim による controllerchange で開始
  if (navigator.serviceWorker.controller) scheduleFontWarmup();
  navigator.serviceWorker.addEventListener('controllerchange', scheduleFontWarmup);

  updateSW = registerSW({
    onNeedRefresh: () => setState({ needRefresh: true }),
    onOfflineReady: () => setState({ offlineReady: true }),
    onRegisteredSW: (_url, r) => {
      if (!r) return;
      registration = r;
      setInterval(() => checkForUpdate().catch(() => {}), UPDATE_CHECK_INTERVAL_MS);
      // アプリに戻ってきたタイミングでも確認する
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate().catch(() => {});
      });
    },
    onRegisterError: (e) => console.error('Service Worker registration failed:', e),
  });
};

export const getUpdateState = () => snapshot;

export const subscribeUpdateState = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * サーバーに新しいバージョンがあるか確認する。
 * @returns {Promise<'available' | 'latest' | 'offline' | 'unsupported'>}
 */
export const checkForUpdate = async () => {
  if (!registration) return 'unsupported';
  if (state.needRefresh) return 'available';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  setState({ checking: true });
  try {
    await registration.update();
    // 新しい SW のダウンロード中なら、完了すると onNeedRefresh が呼ばれる
    if (registration.installing || registration.waiting) return 'available';
    return 'latest';
  } catch {
    return 'offline';
  } finally {
    setState({ checking: false });
  }
};

/** 待機中の新バージョンに切り替えて再読み込みする */
export const applyUpdate = () => {
  if (updateSW) updateSW(true);
  else window.location.reload();
};

export const dismissOfflineReady = () => setState({ offlineReady: false });
