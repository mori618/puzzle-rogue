// セーブデータのバックアップ（書き出し・読み込み）
//
// iPhone の Safari には「7日間サイトを開かないと localStorage を消す」仕様（ITP）があるため、
// プレイヤー自身がセーブデータを文字列 / ファイルとして手元に保管・復元できるようにする。
// 機種変更や、Safari → ホーム画面アプリへのデータ移行にも使う。

import { SAVE_KEY, SETTINGS_KEY } from '../constants/gameConstants.js';
import { TITLE_STORAGE_KEY } from './titleManager.js';

/** バックアップ対象の localStorage キー（プレイログはデバッグ用で容量が大きいため対象外） */
export const BACKUP_KEYS = [
  SAVE_KEY,                    // 進行中のラン
  'puzzle_rogue_stats',        // 実績・統計
  TITLE_STORAGE_KEY,           // 二つ名の解放状況・進捗
  SETTINGS_KEY,                // 設定
  'puzzle-rogue:title-sort',   // 二つ名図鑑の並び順
];

const APP_ID = 'pazuru-roguelike';
const FORMAT_VERSION = 1;
/** 文字列コードの先頭に付ける識別子 */
export const BACKUP_CODE_PREFIX = 'PZRG1:';

// --- UTF-8 対応の Base64（日本語を含むデータでも壊れないように） ---
const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const fromBase64 = (b64) => {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** 現在の localStorage からバックアップオブジェクトを作る */
export const createBackupObject = () => {
  const data = {};
  for (const key of BACKUP_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    } catch (e) {
      console.error(`Failed to read "${key}" for backup:`, e);
    }
  }
  return {
    app: APP_ID,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
};

/** 引き継ぎ用の文字列コードを作る */
export const exportBackupCode = () =>
  BACKUP_CODE_PREFIX + toBase64(JSON.stringify(createBackupObject()));

/** ファイル保存用の JSON 文字列を作る */
export const exportBackupJson = () => JSON.stringify(createBackupObject(), null, 2);

/**
 * 文字列コード または JSON テキストを解析し、検証済みのバックアップを返す。
 * 不正な場合は日本語メッセージ付きの Error を投げる。
 */
export const parseBackup = (input) => {
  const text = String(input ?? '').trim();
  if (!text) throw new Error('データが空です。');

  let obj;
  try {
    if (text.startsWith(BACKUP_CODE_PREFIX)) {
      obj = JSON.parse(fromBase64(text.slice(BACKUP_CODE_PREFIX.length).replace(/\s+/g, '')));
    } else {
      obj = JSON.parse(text);
    }
  } catch {
    throw new Error('データの形式が正しくありません。コードが途中で切れていないか確認してください。');
  }

  if (!obj || typeof obj !== 'object' || obj.app !== APP_ID) {
    throw new Error('このゲームのバックアップデータではありません。');
  }
  if (typeof obj.version !== 'number' || obj.version > FORMAT_VERSION) {
    throw new Error('新しいバージョンのバックアップです。ゲームを最新版に更新してから読み込んでください。');
  }
  if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('バックアップの中身が壊れています。');
  }

  const data = {};
  for (const key of BACKUP_KEYS) {
    if (!(key in obj.data)) continue;
    const value = obj.data[key];
    if (typeof value !== 'string') throw new Error('バックアップの中身が壊れています。');
    try {
      JSON.parse(value);
    } catch {
      throw new Error('バックアップの中身が壊れています。');
    }
    data[key] = value;
  }
  if (Object.keys(data).length === 0) {
    throw new Error('バックアップにセーブデータが含まれていません。');
  }

  return { exportedAt: obj.exportedAt, data };
};

/**
 * 検証済みバックアップを localStorage に書き戻す（対象キーは一度すべて置き換える）。
 * 反映にはページの再読み込みが必要。
 */
export const applyBackup = (backup) => {
  // 書き込みが途中で失敗した場合に元へ戻せるよう、現在値を退避しておく
  const previous = {};
  for (const key of BACKUP_KEYS) previous[key] = localStorage.getItem(key);

  try {
    for (const key of BACKUP_KEYS) {
      if (key in backup.data) localStorage.setItem(key, backup.data[key]);
      else localStorage.removeItem(key);
    }
  } catch (e) {
    for (const key of BACKUP_KEYS) {
      try {
        if (previous[key] === null) localStorage.removeItem(key);
        else localStorage.setItem(key, previous[key]);
      } catch { /* 復元も失敗した場合は諦める */ }
    }
    console.error('Failed to apply backup:', e);
    throw new Error('データの書き込みに失敗しました。ストレージの空き容量やプライベートモードを確認してください。');
  }
};

/** バックアップ日時を表示用に整形 */
export const formatBackupDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '不明';
  return d.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};
