import React, { useEffect, useState, useSyncExternalStore } from 'react';
import {
    getUpdateState,
    subscribeUpdateState,
    checkForUpdate,
    applyUpdate,
    dismissOfflineReady,
} from './utils/swUpdate';

const useUpdateState = () => useSyncExternalStore(subscribeUpdateState, getUpdateState, getUpdateState);

/**
 * タイトル画面用のお知らせ
 * - 新しいバージョンがあれば「更新」ボタンを表示
 * - 初回キャッシュ完了時に「オフラインで遊べる」ことを一時表示
 */
export const UpdateBanner = () => {
    const { needRefresh, offlineReady } = useUpdateState();

    useEffect(() => {
        if (!offlineReady) return undefined;
        const t = setTimeout(dismissOfflineReady, 5000);
        return () => clearTimeout(t);
    }, [offlineReady]);

    if (needRefresh) {
        return (
            <div className="relative z-20 w-full max-w-sm flex items-center gap-2 rounded-xl bg-sky-500/15 border border-sky-400/40 px-3 py-2 backdrop-blur-sm mb-1">
                <span className="material-icons-round text-sky-300 text-xl">system_update</span>
                <span className="flex-1 text-[11px] leading-snug text-slate-200">新しいバージョンがあります</span>
                <button
                    onClick={applyUpdate}
                    className="shrink-0 btn-game-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1"
                >
                    <span className="material-icons-round text-sm">refresh</span>
                    更新
                </button>
            </div>
        );
    }

    if (offlineReady) {
        return (
            <div className="relative z-20 w-full max-w-sm flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 backdrop-blur-sm mb-1">
                <span className="material-icons-round text-emerald-300 text-xl">offline_bolt</span>
                <span className="flex-1 text-[11px] leading-snug text-slate-200">オフラインでも遊べるようになりました</span>
                <button onClick={dismissOfflineReady} aria-label="閉じる" className="shrink-0 w-7 h-7 flex items-center justify-center text-slate-400">
                    <span className="material-icons-round text-base">close</span>
                </button>
            </div>
        );
    }

    return null;
};

const RESULT_TEXT = {
    latest: { type: 'ok', text: '最新のバージョンです。' },
    offline: { type: 'error', text: 'オフラインのため確認できませんでした。' },
    unsupported: { type: 'error', text: 'この環境では更新の確認ができません（ページを再読み込みすると最新になります）。' },
};

/** 設定画面用：手動で更新を確認・適用する */
export const UpdateSettingsSection = () => {
    const { needRefresh, checking, supported } = useUpdateState();
    const [result, setResult] = useState(null);

    const handleCheck = async () => {
        setResult(null);
        const r = await checkForUpdate();
        if (r !== 'available') setResult(RESULT_TEXT[r]);
    };

    return (
        <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5">
            <p className="text-slate-300 text-sm font-bold mb-2 flex items-center gap-1.5">
                <span className="material-icons-round text-base text-indigo-400">system_update</span>
                アプリの更新
            </p>
            <p className="text-slate-500 text-[11px] mb-3 leading-relaxed">
                {supported
                    ? 'オフラインでも遊べるよう保存されています。新しいバージョンはここから反映できます。'
                    : 'このブラウザはオフライン保存に対応していません。'}
            </p>

            {needRefresh ? (
                <>
                    <p className="text-sky-300 text-[12px] font-bold mb-2">新しいバージョンがあります</p>
                    <button
                        onClick={applyUpdate}
                        className="w-full btn-game-primary py-2.5 text-sm flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-base">refresh</span>
                        今すぐ更新
                    </button>
                    <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">
                        ゲームが再読み込みされます。進行中のランは最後にセーブされた時点から再開します。
                    </p>
                </>
            ) : (
                <button
                    onClick={handleCheck}
                    disabled={checking || !supported}
                    className="w-full btn-game-cyber py-2.5 text-sm text-indigo-200 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                    <span className={`material-icons-round text-base ${checking ? 'animate-spin' : ''}`}>sync</span>
                    {checking ? '確認中…' : '更新を確認'}
                </button>
            )}

            {result && !needRefresh && (
                <p className={`text-[11px] mt-2 ${result.type === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {result.text}
                </p>
            )}
        </div>
    );
};
