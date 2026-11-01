import React, { useState } from 'react';
import playLog from './utils/playLogger';

/**
 * テストプレイ記録パネル（ゲームオーバー画面用）
 * - メモ入力（自動保存）
 * - 記録 JSON のダウンロード / クリップボードコピー
 * - 過去の記録（最大5件）のダウンロード
 */
const PlayLogPanel = () => {
  const [memo, setMemo] = useState(() => playLog.getMemo());
  const [status, setStatus] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const current = playLog.getCurrent();
  const eventCount = current?.events?.length || 0;

  const flashStatus = (text) => {
    setStatus(text);
    setTimeout(() => setStatus(''), 2000);
  };

  const handleMemoChange = (e) => {
    setMemo(e.target.value);
    playLog.setMemo(e.target.value);
  };

  if (!current) {
    return null;
  }

  const archive = showArchive ? playLog.getArchive() : [];

  return (
    <div className="w-full max-w-[320px] mb-4 bg-slate-800/40 border border-white/10 rounded-2xl p-3 text-left">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <span className="material-icons-round text-sm text-sky-400">description</span>
          テスト記録
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{eventCount} events</span>
      </div>
      <textarea
        value={memo}
        onChange={handleMemoChange}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="メモ（気になった点・感想など。自動保存されます）"
        rows={3}
        className="w-full bg-slate-950/60 border border-white/10 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 resize-y focus:outline-none focus:border-sky-500/60"
      />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => { playLog.download(); flashStatus('ダウンロードしました'); }}
          className="bg-sky-600 hover:bg-sky-500 text-white py-2 rounded-lg text-xs font-bold active:scale-95 flex items-center justify-center gap-1"
        >
          <span className="material-icons-round text-sm">download</span>
          ダウンロード
        </button>
        <button
          onClick={async () => { const ok = await playLog.copy(); flashStatus(ok ? 'コピーしました' : 'コピーに失敗しました'); }}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-xs font-bold active:scale-95 flex items-center justify-center gap-1"
        >
          <span className="material-icons-round text-sm">content_copy</span>
          コピー
        </button>
      </div>
      {status && <div className="text-[10px] text-sky-300 mt-1 text-center">{status}</div>}
      <button
        onClick={() => setShowArchive(v => !v)}
        className="w-full text-[10px] text-slate-500 mt-2 underline"
      >
        {showArchive ? '過去の記録を閉じる' : '過去の記録（最大5件）'}
      </button>
      {showArchive && (
        <div className="mt-1 flex flex-col gap-1">
          {archive.length === 0 && <div className="text-[10px] text-slate-600 text-center">なし</div>}
          {archive.map(log => (
            <button
              key={log.runId}
              onClick={() => playLog.download(log)}
              className="w-full bg-slate-900/60 hover:bg-slate-800 text-[10px] text-slate-400 py-1.5 px-2 rounded flex justify-between items-center"
            >
              <span className="font-mono">{new Date(log.startedAt).toLocaleString()}</span>
              <span>C{log.final?.cycle ?? '?'} / {log.endReason || '-'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayLogPanel;
