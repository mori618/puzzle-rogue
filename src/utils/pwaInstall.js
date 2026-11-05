// ホーム画面への追加（PWA インストール）まわりの判定ヘルパー

/** ホーム画面から単独アプリとして起動しているか */
export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.navigator.standalone === true) return true; // iOS Safari
    return !!window.matchMedia?.('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
};

/** iPhone / iPad か（iPadOS 13+ は Mac として名乗るためタッチ対応で判定） */
export const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isAndroid = () =>
  typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

// --- Android Chrome 等のインストールプロンプト ---
// beforeinstallprompt は起動直後に一度だけ飛んでくるため、モジュール読み込み時に捕まえておく
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export const canPromptInstall = () => deferredPrompt !== null;

/** ブラウザ標準のインストールダイアログを出す。出せなければ false */
export const promptInstall = async () => {
  if (!deferredPrompt) return false;
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  notify();
  try {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    return outcome === 'accepted';
  } catch {
    return false;
  }
};

export const subscribeInstallPrompt = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// --- タイトル画面の「ホーム画面に追加」バナーを閉じたかどうか ---
const BANNER_DISMISSED_KEY = 'puzzle-rogue:install-banner-dismissed';

export const isInstallBannerDismissed = () => {
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

export const dismissInstallBanner = () => {
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, '1');
  } catch { /* 保存できなくても動作には影響しない */ }
};

/** ホーム画面への追加を勧めるべき環境か（スマホのブラウザで開いている） */
export const shouldRecommendInstall = () => !isStandalone() && (isIOS() || isAndroid());
