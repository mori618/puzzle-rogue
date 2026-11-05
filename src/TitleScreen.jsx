import React, { useState } from 'react';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';
import TitleEncyclopediaScreen from './TitleEncyclopediaScreen';
import { loadTitleState, getEquippedTitleInfo } from './utils/titleManager';
import InstallGuideModal from './InstallGuideModal';
import BackupScreen from './BackupScreen';
import { UpdateBanner } from './UpdateNotice';
import { shouldRecommendInstall, isInstallBannerDismissed, dismissInstallBanner } from './utils/pwaInstall';

// --- 開発用更新情報設定（不要になったら false に変更、または本ブロックごと削除可能） ---
const SHOW_DEV_UPDATE_INFO = true;
// 日時・概要はビルド時に最新コミットから自動生成される（vite.config.js の getLastUpdateInfo）
/* global __LAST_UPDATE_INFO__ */
const DEV_UPDATE_INFO = typeof __LAST_UPDATE_INFO__ !== 'undefined'
    ? __LAST_UPDATE_INFO__
    : { date: '', time: '', summary: '' };

const DevUpdateInfo = () => {
    if (!SHOW_DEV_UPDATE_INFO || !DEV_UPDATE_INFO.date) return null;
    return (
        <div className="w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-500 select-none min-w-0">
            <span className="material-icons-round text-[12px] text-amber-500/80">update</span>
            <span className="font-mono shrink-0">{DEV_UPDATE_INFO.date} {DEV_UPDATE_INFO.time}</span>
            {DEV_UPDATE_INFO.summary && (
                <span className="truncate text-slate-400">· {DEV_UPDATE_INFO.summary}</span>
            )}
        </div>
    );
};

// ロゴの上に並べるドロップ（ゲーム内と同じ形・色・アイコン）
const HERO_ORBS = [
    { type: 'fire', icon: 'whatshot' },
    { type: 'water', icon: 'water_drop' },
    { type: 'wood', icon: 'air' },
    { type: 'light', icon: 'bolt' },
    { type: 'dark', icon: 'nightlight_round' },
    { type: 'heart', icon: 'favorite' },
];

/** モード・コレクションのカード型ボタン */
const CardButton = ({ icon, label, desc, tone, onClick }) => (
    <button
        type="button"
        onClick={() => {
            soundManager.playSE(SE_IDS.UI_CLICK);
            onClick();
        }}
        className="title-card-btn"
    >
        <span className={`title-card-icon ${tone}`}>
            <span className="material-icons-round">{icon}</span>
        </span>
        <span className="min-w-0">
            <span className="block title-card-label">{label}</span>
            <span className="block title-card-desc">{desc}</span>
        </span>
    </button>
);

/** 画面下のアイコンボタン */
const UtilButton = ({ icon, label, onClick }) => (
    <button
        type="button"
        onClick={() => {
            soundManager.playSE(SE_IDS.UI_CLICK);
            onClick();
        }}
        className="title-util-btn"
    >
        <span className="material-icons-round">{icon}</span>
        <span>{label}</span>
    </button>
);

const TitleScreen = ({
    onStart,
    onHelp,
    onStats,
    hasSaveData,
    onContinue,
    onCredits,
    onSettings,
    onEncyclopedia,
    onPractice,
    onUIPreview,
    onEndless
}) => {
    const [showTitleEncyclopedia, setShowTitleEncyclopedia] = useState(false);
    // スマホのブラウザで開いている場合は「ホーム画面に追加」を勧める（データ消失対策）
    const [showInstallBanner, setShowInstallBanner] = useState(() => shouldRecommendInstall() && !isInstallBannerDismissed());
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [showBackup, setShowBackup] = useState(false);
    const titleState = loadTitleState();
    const equippedInfo = getEquippedTitleInfo(titleState.equippedTitle);

    return (
        <div className="w-full h-[100dvh] bg-background-dark flex flex-col items-center justify-between relative overflow-hidden font-game-cyber px-4 py-[calc(10px+env(safe-area-inset-top,0px))] pb-[calc(10px+env(safe-area-inset-bottom,0px))]">
            {/* Cyber Grid Background */}
            <div className="cyber-grid-bg"></div>

            {/* 背景の光 */}
            <div className="screen-shell-glow z-0" aria-hidden="true" />

            {/* 二つ名図鑑モーダル */}
            {showTitleEncyclopedia && (
                <TitleEncyclopediaScreen onClose={() => setShowTitleEncyclopedia(false)} />
            )}

            {/* ホーム画面に追加の案内 */}
            {showInstallGuide && (
                <InstallGuideModal
                    onClose={() => setShowInstallGuide(false)}
                    onOpenBackup={() => {
                        setShowInstallGuide(false);
                        setShowBackup(true);
                    }}
                />
            )}
            {showBackup && <BackupScreen onClose={() => setShowBackup(false)} />}

            <UpdateBanner />

            {showInstallBanner && (
                <div className="relative z-20 w-full max-w-sm flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3 py-2 backdrop-blur-sm">
                    <button
                        onClick={() => {
                            soundManager.playSE(SE_IDS.UI_CLICK);
                            setShowInstallGuide(true);
                        }}
                        className="flex-1 flex items-center gap-2 text-left"
                    >
                        <span className="material-icons-round text-amber-300 text-xl">add_to_home_screen</span>
                        <span className="text-[11px] leading-snug text-slate-200">
                            データ消失を防ぐため<span className="text-amber-300 font-bold">ホーム画面に追加</span>して遊ぶのがおすすめ
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            dismissInstallBanner();
                            setShowInstallBanner(false);
                        }}
                        aria-label="閉じる"
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-white"
                    >
                        <span className="material-icons-round text-base">close</span>
                    </button>
                </div>
            )}

            {/* メインエリア */}
            <div className="relative z-10 w-full max-w-sm flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">
                    <div className="my-auto w-full flex flex-col gap-5 py-2">
                        {/* ロゴ */}
                        <div className="title-hero">
                            <div className="title-orbs" aria-hidden="true">
                                {HERO_ORBS.map((o, i) => (
                                    <div key={o.type} className={`title-orb orb-shape-${o.type}`} style={{ '--i': i }}>
                                        <div className={`orb-inner orb-${o.type}`}>
                                            <span className="material-icons-round">{o.icon}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <h1 className="title-logo">PUZZLE</h1>
                            <p className="title-logo-sub">ROGUE-LIKE</p>

                            {/* 装備中二つ名バッジ */}
                            <button
                                type="button"
                                onClick={() => {
                                    soundManager.playSE(SE_IDS.UI_CLICK);
                                    setShowTitleEncyclopedia(true);
                                }}
                                className="title-badge"
                            >
                                <span className="material-icons-round text-amber-400 text-[16px]">military_tech</span>
                                <span className="truncate">
                                    {equippedInfo.fullName !== '未設定' ? equippedInfo.fullName : '二つ名未設定'}
                                </span>
                                <span className="material-icons-round text-slate-500 text-[16px]">chevron_right</span>
                            </button>
                        </div>

                        {/* メインの開始ボタン */}
                        <div className="flex flex-col gap-2">
                            {hasSaveData ? (
                                <>
                                    <button
                                        onClick={() => {
                                            onContinue();
                                            soundManager.playSE(SE_IDS.UI_CLICK);
                                        }}
                                        className="w-full btn-game-primary py-3.5 flex items-center justify-center gap-2 text-lg"
                                    >
                                        <span className="material-icons-round text-2xl">play_arrow</span>
                                        続きから
                                    </button>
                                    <button
                                        onClick={() => {
                                            onStart();
                                            soundManager.playSE(SE_IDS.UI_CLICK);
                                        }}
                                        className="w-full btn-game-secondary py-2.5 flex items-center justify-center gap-2 text-sm"
                                    >
                                        <span className="material-icons-round text-lg">restart_alt</span>
                                        初めから (スタート)
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        onStart();
                                        soundManager.playSE(SE_IDS.UI_CLICK);
                                    }}
                                    className="w-full btn-game-primary py-3.5 flex items-center justify-center gap-2 text-lg tracking-wider"
                                >
                                    <span className="material-icons-round text-2xl">play_arrow</span>
                                    GAME START
                                </button>
                            )}
                        </div>

                        {/* モード・コレクション */}
                        <div className="grid grid-cols-2 gap-2">
                            <CardButton
                                icon="all_inclusive"
                                label="エンドレス"
                                desc="限界に挑む"
                                tone="bg-amber-400/15 text-amber-300"
                                onClick={() => (onEndless ? onEndless() : onStart())}
                            />
                            {onPractice && (
                                <CardButton
                                    icon="fitness_center"
                                    label="練習モード"
                                    desc="自由に盤面を試す"
                                    tone="bg-emerald-400/15 text-emerald-300"
                                    onClick={onPractice}
                                />
                            )}
                            {onEncyclopedia && (
                                <CardButton
                                    icon="menu_book"
                                    label="トークン図鑑"
                                    desc="全トークンの効果"
                                    tone="bg-indigo-400/15 text-indigo-300"
                                    onClick={onEncyclopedia}
                                />
                            )}
                            {onStats && (
                                <CardButton
                                    icon="emoji_events"
                                    label="実績"
                                    desc="これまでの記録"
                                    tone="bg-yellow-400/15 text-yellow-300"
                                    onClick={onStats}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* 下部：ヘルプ・設定など */}
                <div className="shrink-0 pt-2 flex flex-col gap-2">
                    <div className="flex justify-center gap-1 border-t border-white/5 pt-2">
                        {onHelp && <UtilButton icon="help_outline" label="ヘルプ" onClick={onHelp} />}
                        {onSettings && <UtilButton icon="settings" label="設定" onClick={onSettings} />}
                        {onCredits && <UtilButton icon="info_outline" label="クレジット" onClick={onCredits} />}
                        {onUIPreview && <UtilButton icon="visibility" label="UI Preview" onClick={onUIPreview} />}
                    </div>
                    <DevUpdateInfo />
                </div>
            </div>
        </div>
    );
};

export default TitleScreen;
