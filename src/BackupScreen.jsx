import React, { useRef, useState } from 'react';
import {
    exportBackupCode,
    exportBackupJson,
    parseBackup,
    applyBackup,
    formatBackupDate,
} from './utils/saveBackup';
import { isIOS, isStandalone } from './utils/pwaInstall';
import InstallGuideModal from './InstallGuideModal';

const backupFileName = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `pazuru-roguelike-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
};

/** クリップボードへコピー（古い環境向けに execCommand へフォールバック） */
const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, text.length);
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }
};

const Section = ({ icon, title, children }) => (
    <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5">
        <p className="text-slate-300 text-sm font-bold mb-2 flex items-center gap-1.5">
            <span className="material-icons-round text-base text-indigo-400">{icon}</span>
            {title}
        </p>
        {children}
    </div>
);

/**
 * BackupScreen - セーブデータの書き出し・読み込み
 * 設定画面から開く。読み込み後はページを再読み込みして全データを反映する。
 */
const BackupScreen = ({ onClose }) => {
    const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
    const [exportedCode, setExportedCode] = useState('');
    const [importText, setImportText] = useState('');
    const [pending, setPending] = useState(null); // 読み込み確認待ちのバックアップ
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const fileInputRef = useRef(null);

    const showOk = (text) => setMessage({ type: 'ok', text });
    const showError = (text) => setMessage({ type: 'error', text });

    const handleCopy = async () => {
        const code = exportBackupCode();
        setExportedCode(code);
        if (await copyText(code)) {
            showOk('コードをコピーしました。メモアプリなど安全な場所に貼り付けて保管してください。');
        } else {
            showError('自動コピーできませんでした。下の欄のコードを長押しして手動でコピーしてください。');
        }
    };

    const handleSaveFile = async () => {
        const json = exportBackupJson();
        const name = backupFileName();
        const file = new File([json], name, { type: 'application/json' });

        // iPhone のホーム画面アプリではダウンロードが効かないことがあるため共有シートを使う
        if (isIOS() && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file] });
                showOk('「ファイルに保存」などで保管してください。');
                return;
            } catch (e) {
                if (e?.name === 'AbortError') return;
                // 共有に失敗した場合は通常のダウンロードを試す
            }
        }

        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showOk(`${name} を保存しました。`);
    };

    const tryImport = (text) => {
        try {
            setPending(parseBackup(text));
            setMessage(null);
        } catch (e) {
            showError(e.message);
        }
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            tryImport(await file.text());
        } catch {
            showError('ファイルを読み込めませんでした。');
        }
    };

    const handleConfirmImport = () => {
        try {
            applyBackup(pending);
        } catch (e) {
            setPending(null);
            showError(e.message);
            return;
        }
        // 各画面・キャッシュに確実に反映させるため再読み込みする
        window.location.reload();
    };

    return (
        <div
            className="absolute inset-0 z-[500] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in font-game-cyber"
            onClick={onClose}
        >
            <div
                className="game-panel-cyber rounded-2xl w-full max-w-xs flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-game-header text-indigo-300 mb-2 text-center tracking-widest flex items-center justify-center gap-2">
                    <span className="material-icons-round text-indigo-400">backup</span>
                    バックアップ
                </h2>
                <p className="text-slate-500 text-[11px] mb-4 leading-relaxed text-center">
                    二つ名・実績・設定・進行中のランをまとめて保存 / 復元します。
                </p>

                <div className="w-full flex flex-col gap-4">
                    {/* ホーム画面アプリ化の案内（ブラウザで開いている場合のみ） */}
                    {!isStandalone() && (
                        <button
                            onClick={() => setShowInstallGuide(true)}
                            className="w-full rounded-xl p-3 bg-amber-500/10 border border-amber-500/30 text-left flex items-center gap-2"
                        >
                            <span className="material-icons-round text-amber-300">add_to_home_screen</span>
                            <span className="text-[11px] text-slate-300 leading-snug flex-1">
                                ブラウザで遊んでいるとデータが消えることがあります。<span className="text-amber-300 font-bold">ホーム画面に追加</span>がおすすめです。
                            </span>
                            <span className="material-icons-round text-slate-500 text-sm">chevron_right</span>
                        </button>
                    )}

                    {/* 書き出し */}
                    <Section icon="upload" title="書き出し（保存）">
                        <div className="flex flex-col gap-2">
                            <button onClick={handleCopy} className="w-full btn-game-primary py-2.5 text-sm flex items-center justify-center gap-2">
                                <span className="material-icons-round text-base">content_copy</span>
                                コードをコピー
                            </button>
                            <button onClick={handleSaveFile} className="w-full btn-game-cyber py-2.5 text-sm text-indigo-200 flex items-center justify-center gap-2">
                                <span className="material-icons-round text-base">save_alt</span>
                                ファイルに保存
                            </button>
                        </div>
                        {exportedCode && (
                            <textarea
                                readOnly
                                value={exportedCode}
                                onFocus={(e) => e.target.select()}
                                className="mt-2 w-full h-16 text-[10px] font-mono bg-slate-950 text-slate-400 rounded-lg p-2 border border-white/10 resize-none select-text"
                                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                            />
                        )}
                    </Section>

                    {/* 読み込み */}
                    <Section icon="download" title="読み込み（復元）">
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="ここにコードを貼り付け"
                            className="w-full h-16 text-[11px] font-mono bg-slate-950 text-slate-300 rounded-lg p-2 border border-white/10 resize-none mb-2 placeholder:text-slate-600"
                            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                        />
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => tryImport(importText)}
                                disabled={!importText.trim()}
                                className="w-full btn-game-primary py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                <span className="material-icons-round text-base">input</span>
                                コードを読み込む
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full btn-game-cyber py-2.5 text-sm text-indigo-200 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-base">folder_open</span>
                                ファイルから読み込む
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.txt,application/json,text/plain"
                                onChange={handleFile}
                                className="hidden"
                            />
                        </div>
                    </Section>

                    {message && (
                        <p className={`text-[12px] leading-relaxed rounded-lg p-2.5 border ${message.type === 'ok'
                            ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-rose-300 bg-rose-500/10 border-rose-500/30'}`}
                        >
                            {message.text}
                        </p>
                    )}

                    <div className="my-1 border-b border-white/10 w-full"></div>

                    <button
                        onClick={onClose}
                        className="w-full btn-game-secondary py-3 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-lg">arrow_back</span>
                        戻る
                    </button>
                </div>
            </div>

            {/* 読み込み確認ダイアログ */}
            {pending && (
                <div
                    className="absolute inset-0 z-10 bg-black/70 flex items-center justify-center p-6"
                    onClick={(e) => { e.stopPropagation(); setPending(null); }}
                >
                    <div
                        className="game-panel-cyber rounded-2xl w-full max-w-xs p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-amber-300 font-bold text-sm mb-2 flex items-center gap-1.5">
                            <span className="material-icons-round text-base">warning</span>
                            データを上書きしますか？
                        </p>
                        <p className="text-slate-300 text-[12px] leading-relaxed mb-1">
                            バックアップ日時: <span className="font-mono text-indigo-200">{formatBackupDate(pending.exportedAt)}</span>
                        </p>
                        <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                            今のセーブデータはこのバックアップの内容に置き換わります（元に戻せません）。読み込み後、ゲームを再起動します。
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setPending(null)} className="flex-1 btn-game-secondary py-2.5 text-sm">
                                やめる
                            </button>
                            <button onClick={handleConfirmImport} className="flex-1 btn-game-danger py-2.5 text-sm font-bold">
                                上書きする
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showInstallGuide && (
                <div onClick={(e) => e.stopPropagation()}>
                    <InstallGuideModal onClose={() => setShowInstallGuide(false)} />
                </div>
            )}
        </div>
    );
};

export default BackupScreen;
