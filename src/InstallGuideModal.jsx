import React, { useEffect, useState } from 'react';
import {
    isIOS,
    isStandalone,
    canPromptInstall,
    promptInstall,
    subscribeInstallPrompt,
} from './utils/pwaInstall';

const Step = ({ num, icon, children }) => (
    <li className="flex items-start gap-3">
        <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-black flex items-center justify-center">
            {num}
        </span>
        <span className="text-slate-300 text-[13px] leading-relaxed flex-1">
            {children}
            {icon && <span className="material-icons-round text-base text-sky-300 align-middle ml-1">{icon}</span>}
        </span>
    </li>
);

/**
 * InstallGuideModal - 「ホーム画面に追加」の案内
 * iPhone の Safari はしばらく開かないとセーブデータを消すため、ホーム画面アプリ化を勧める。
 */
const InstallGuideModal = ({ onClose, onOpenBackup }) => {
    const [canPrompt, setCanPrompt] = useState(canPromptInstall());
    useEffect(() => subscribeInstallPrompt(() => setCanPrompt(canPromptInstall())), []);

    const ios = isIOS();
    const installed = isStandalone();

    return (
        <div
            className="fixed inset-0 z-[600] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-game-cyber"
            onClick={onClose}
        >
            <div
                className="game-panel-cyber rounded-2xl w-full max-w-xs flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-game-header text-indigo-300 mb-3 text-center tracking-wider flex items-center justify-center gap-2">
                    <span className="material-icons-round text-indigo-400">add_to_home_screen</span>
                    ホーム画面に追加
                </h2>

                {installed ? (
                    <p className="text-emerald-300 text-sm text-center mb-4 leading-relaxed">
                        ホーム画面アプリとして起動中です。<br />このままでデータは消えにくくなっています。
                    </p>
                ) : (
                    <>
                        <p className="text-slate-400 text-[12px] leading-relaxed mb-4">
                            iPhone の Safari では、<span className="text-amber-300 font-bold">しばらく開かないとセーブデータが自動で消える</span>ことがあります。
                            ホーム画面に追加してそこから遊ぶと、データが消えにくくなります。
                        </p>

                        {canPrompt ? (
                            <button
                                onClick={async () => {
                                    const ok = await promptInstall();
                                    if (ok) onClose();
                                }}
                                className="w-full btn-game-primary py-3 mb-4 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-lg">download</span>
                                アプリとして追加する
                            </button>
                        ) : ios ? (
                            <ol className="flex flex-col gap-2.5 mb-4 bg-slate-950/40 rounded-xl p-3 border border-white/5">
                                <Step num={1} icon="ios_share">Safari の画面下（または上）にある共有ボタンをタップ</Step>
                                <Step num={2} icon="add_box">メニューを下にスクロールして「ホーム画面に追加」を選ぶ</Step>
                                <Step num={3}>右上の「追加」をタップ</Step>
                                <Step num={4}>ホーム画面のアイコンから起動して遊ぶ</Step>
                            </ol>
                        ) : (
                            <ol className="flex flex-col gap-2.5 mb-4 bg-slate-950/40 rounded-xl p-3 border border-white/5">
                                <Step num={1} icon="more_vert">ブラウザのメニューを開く</Step>
                                <Step num={2}>「ホーム画面に追加」または「アプリをインストール」を選ぶ</Step>
                                <Step num={3}>ホーム画面のアイコンから起動して遊ぶ</Step>
                            </ol>
                        )}

                        {/* データ引き継ぎの注意 */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
                            <p className="text-amber-300 text-[12px] font-bold mb-1 flex items-center gap-1">
                                <span className="material-icons-round text-sm">warning</span>
                                今のデータを引き継ぐには
                            </p>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                                {ios ? 'iPhone では' : '端末によっては'}ブラウザとホーム画面アプリでセーブデータが別々になります。
                                追加する前に「バックアップ」でコードをコピーし、ホーム画面アプリ側で読み込んでください。
                            </p>
                            {onOpenBackup && (
                                <button
                                    onClick={onOpenBackup}
                                    className="w-full btn-game-cyber py-2 mt-2 text-xs text-amber-200 flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-icons-round text-sm">backup</span>
                                    バックアップを開く
                                </button>
                            )}
                        </div>
                    </>
                )}

                <button
                    onClick={onClose}
                    className="w-full btn-game-secondary py-2.5 flex justify-center items-center gap-2"
                >
                    <span className="material-icons-round text-lg">close</span>
                    閉じる
                </button>
            </div>
        </div>
    );
};

export default InstallGuideModal;
