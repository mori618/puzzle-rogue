import { describe, it, expect, beforeEach } from 'vitest';
import {
  BACKUP_KEYS,
  BACKUP_CODE_PREFIX,
  exportBackupCode,
  exportBackupJson,
  parseBackup,
  applyBackup,
} from './saveBackup.js';
import { SAVE_KEY, SETTINGS_KEY } from '../constants/gameConstants.js';
import { TITLE_STORAGE_KEY } from './titleManager.js';

const seed = () => {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ stars: 12, name: '日本語の名前' }));
  localStorage.setItem(TITLE_STORAGE_KEY, JSON.stringify({ unlocked: ['疾風'] }));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ bgmVolume: 0.3 }));
  localStorage.setItem('puzzle_rogue_playlog_current', JSON.stringify({ huge: true }));
};

describe('saveBackup', () => {
  beforeEach(() => localStorage.clear());

  it('コードで書き出し→読み込みすると元のデータに戻る（日本語含む）', () => {
    seed();
    const code = exportBackupCode();
    expect(code.startsWith(BACKUP_CODE_PREFIX)).toBe(true);

    localStorage.clear();
    localStorage.setItem(SAVE_KEY, '{"stars":0}');
    applyBackup(parseBackup(code));

    expect(JSON.parse(localStorage.getItem(SAVE_KEY))).toEqual({ stars: 12, name: '日本語の名前' });
    expect(JSON.parse(localStorage.getItem(TITLE_STORAGE_KEY))).toEqual({ unlocked: ['疾風'] });
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY))).toEqual({ bgmVolume: 0.3 });
  });

  it('JSON ファイル形式も読み込める', () => {
    seed();
    const json = exportBackupJson();
    localStorage.clear();
    applyBackup(parseBackup(json));
    expect(JSON.parse(localStorage.getItem(TITLE_STORAGE_KEY))).toEqual({ unlocked: ['疾風'] });
  });

  it('プレイログはバックアップ対象外', () => {
    seed();
    const backup = parseBackup(exportBackupJson());
    expect(backup.data['puzzle_rogue_playlog_current']).toBeUndefined();
    expect(BACKUP_KEYS).not.toContain('puzzle_rogue_playlog_current');
  });

  it('バックアップに無いキーは読み込み時に削除される（進行中ランなし→ありの上書き防止）', () => {
    localStorage.setItem(TITLE_STORAGE_KEY, '{"a":1}');
    const code = exportBackupCode();
    localStorage.setItem(SAVE_KEY, '{"stars":99}');
    applyBackup(parseBackup(code));
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
  });

  it('改行や前後の空白が混ざったコードも読める', () => {
    seed();
    const code = exportBackupCode();
    const messy = `  ${code.slice(0, 20)}\n${code.slice(20)}  `;
    expect(() => parseBackup(messy)).not.toThrow();
  });

  it.each([
    ['', 'データが空です'],
    ['hello', '形式が正しくありません'],
    [`${BACKUP_CODE_PREFIX}@@@`, '形式が正しくありません'],
    [JSON.stringify({ app: 'other', version: 1, data: {} }), 'このゲームのバックアップデータではありません'],
    [JSON.stringify({ app: 'pazuru-roguelike', version: 999, data: {} }), '新しいバージョン'],
    [JSON.stringify({ app: 'pazuru-roguelike', version: 1, data: {} }), '含まれていません'],
    [JSON.stringify({ app: 'pazuru-roguelike', version: 1, data: { [SAVE_KEY]: '{broken' } }), '壊れています'],
  ])('不正な入力はエラーになる: %s', (input, msg) => {
    expect(() => parseBackup(input)).toThrow(msg);
  });

  it('途中のコードが切れていたら何も書き込まない', () => {
    seed();
    const code = exportBackupCode();
    const before = localStorage.getItem(SAVE_KEY);
    expect(() => applyBackup(parseBackup(code.slice(0, code.length - 10)))).toThrow();
    expect(localStorage.getItem(SAVE_KEY)).toBe(before);
  });
});
