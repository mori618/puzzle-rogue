// テストプレイ記録（プレイログ）
// ゲーム開始〜ゲームオーバーまでの詳細イベントを記録し、JSON としてダウンロードできるようにする。
// 人間向けではなく後から解析するための機械可読ログ。
//
// 形式: { v, runId, startedAt, endedAt, endReason, meta, memo, final, events: [ { i, t, k, tu, cy, st, ...data } ] }
//   i : 連番, t : 開始からの経過ms, k : イベント種別
//   tu: その時点の手番, cy: サイクル, st: 所持スター（ctx から自動付与）

const CURRENT_KEY = 'puzzle_rogue_playlog_current';
const ARCHIVE_KEY = 'puzzle_rogue_playlog_archive';
const ARCHIVE_MAX = 5;
const LOG_VERSION = 1;

let current = null;
let ctx = {};
let saveTimer = null;
let disabled = false; // 練習モード中など

const now = () => Date.now();

const safeParse = (s) => {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
};

const persist = () => {
  saveTimer = null;
  if (!current) return;
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(current));
  } catch {
    // 容量オーバー時はアーカイブを削って再試行
    try {
      localStorage.removeItem(ARCHIVE_KEY);
      localStorage.setItem(CURRENT_KEY, JSON.stringify(current));
    } catch { /* noop */ }
  }
};

const schedulePersist = () => {
  if (saveTimer) return;
  saveTimer = setTimeout(persist, 1000);
};

const flush = () => {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  persist();
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush);
  document.addEventListener?.('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

const loadArchive = () => {
  const a = safeParse(localStorage.getItem(ARCHIVE_KEY));
  return Array.isArray(a) ? a : [];
};

const pushArchive = (log) => {
  if (!log) return;
  let arr = loadArchive().filter(l => l.runId !== log.runId);
  arr.unshift(log);
  arr = arr.slice(0, ARCHIVE_MAX);
  while (arr.length > 0) {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(arr));
      return;
    } catch {
      arr.pop();
    }
  }
};

/** トークンを解析用にコンパクト化 */
export const compactToken = (t, slot) => {
  if (!t) return null;
  const o = { id: t.id, iid: t.instanceId, lv: t.level || 1 };
  if (slot !== undefined) o.s = slot;
  if (t.name) o.n = t.name;
  if (t.type) o.ty = t.type;
  if (t.effect) o.ef = t.effect;
  if (t.rarity) o.r = t.rarity;
  if (t.price !== undefined) o.pr = t.price;
  if (t.charge !== undefined) o.ch = t.charge;
  if (t.cost !== undefined) o.co = t.cost;
  if (t.isCurse || t.type === 'curse') o.curse = 1;
  if (t.curseUses !== undefined) o.cu = t.curseUses;
  if (t.params && Object.keys(t.params).length) o.p = t.params;
  if (t.enchantments?.length) o.en = t.enchantments.map(e => e.id || e.effect);
  if (t.isLocked) o.lock = 1;
  if (t.isInherited) o.inh = 1;
  if (t.parentId) o.par = t.parentId;
  if (t.startValue) o.sv = t.startValue;
  // 成長系トークンの内部カウンタ（数値系の独自プロパティ）を拾う
  ['counter', 'stack', 'stacks', 'growth', 'bonus', 'storedValue', 'accum', 'count'].forEach(k => {
    if (typeof t[k] === 'number') o[k] = t[k];
  });
  return o;
};

export const compactTokens = (tokens) => (tokens || []).map((t, i) => compactToken(t, i)).filter(Boolean);

export const compactBuffs = (buffs) => (buffs || []).filter(Boolean).map(b => {
  const o = { a: b.action };
  if (b.duration !== undefined) o.d = b.duration;
  if (b.params && Object.keys(b.params).length) o.p = b.params;
  if (b.sourceId) o.src = b.sourceId;
  return o;
});

export const playLog = {
  setDisabled(v) { disabled = !!v; },

  /** 手番やサイクル等、各イベントに自動付与するコンテキスト */
  setCtx(next) { ctx = { ...ctx, ...next }; },

  /** 新しいランの記録を開始（進行中の記録があればアーカイブ） */
  start(meta = {}) {
    if (current && !current.endedAt) {
      current.endedAt = new Date().toISOString();
      current.endReason = current.endReason || 'abandoned';
      pushArchive(current);
    }
    current = {
      v: LOG_VERSION,
      runId: `${now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      startedAt: new Date().toISOString(),
      startedAtMs: now(),
      endedAt: null,
      endReason: null,
      meta: {
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
        ...meta,
      },
      memo: '',
      final: null,
      events: [],
      seq: 0,
    };
    flush();
    return current.runId;
  },

  /** ページ再読み込み後、セーブデータからの再開時に前回のログを引き継ぐ */
  resume() {
    if (current) return true;
    const saved = safeParse(localStorage.getItem(CURRENT_KEY));
    if (saved && !saved.endedAt) {
      current = saved;
      playLog.event('resume', {});
      return true;
    }
    return false;
  },

  isActive() { return !!current && !current.endedAt; },

  event(k, data = {}) {
    if (disabled || !current || current.endedAt) return;
    current.seq = (current.seq || 0) + 1;
    current.events.push({
      i: current.seq,
      t: now() - current.startedAtMs,
      k,
      tu: ctx.turn,
      cy: ctx.cycle,
      st: ctx.stars,
      ...data,
    });
    schedulePersist();
  },

  /** ランの終了（ゲームオーバー等）。final にはその時点の状態スナップショットを入れる */
  end(reason, final = {}) {
    if (!current || current.endedAt) return;
    playLog.event('end', { reason });
    current.endedAt = new Date().toISOString();
    current.endReason = reason;
    current.final = final;
    flush();
    pushArchive(current);
  },

  setMemo(text) {
    if (!current) return;
    current.memo = text;
    schedulePersist();
    // アーカイブ側にも反映
    if (current.endedAt) {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { persist(); pushArchive(current); }, 500);
    }
  },

  getMemo() { return current?.memo || ''; },
  getCurrent() { return current; },
  getArchive() { return loadArchive(); },

  toJSON(log = current) {
    if (!log) return '';
    // events は1行1イベントにしてdiffや grep をしやすくする
    const { events = [], ...head } = log;
    const headStr = JSON.stringify(head, null, 1);
    const evStr = events.map(e => JSON.stringify(e)).join(',\n');
    return `${headStr.slice(0, -2)},\n"events": [\n${evStr}\n]}\n`;
  },

  fileName(log = current) {
    const d = log?.startedAt ? new Date(log.startedAt) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
    const cyc = log?.final?.cycle ? `-c${log.final.cycle}` : '';
    return `puzzle-rogue-playlog-${stamp}${cyc}.json`;
  },

  download(log = current) {
    if (!log) return false;
    flush();
    const blob = new Blob([playLog.toJSON(log)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = playLog.fileName(log);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  },

  async copy(log = current) {
    if (!log) return false;
    flush();
    try {
      await navigator.clipboard.writeText(playLog.toJSON(log));
      return true;
    } catch {
      return false;
    }
  },
};

if (typeof window !== 'undefined') {
  // デバッグ用にコンソールから参照可能にする
  window.__playLog = playLog;
}

export default playLog;
