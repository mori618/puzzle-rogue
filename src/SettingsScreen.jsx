import React, { useState } from 'react';
import BackupScreen from './BackupScreen';
import { UpdateSettingsSection } from './UpdateNotice';
import ScreenShell, { UiSection } from './ScreenShell';

/** 音量スライダー（ミュート切り替え付き） */
const VolumeRow = ({ icon, label, volume, muted, onVolume, onToggleMute }) => {
    const value = muted ? 0 : volume;
    return (
        <div className="px-4 py-3.5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-slate-200 text-sm font-bold flex items-center gap-2">
                    <span className="material-icons-round text-[18px] text-violet-300">{icon}</span>
                    {label}
                </span>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 w-9 text-right">{Math.round(value * 100)}%</span>
                    <button
                        type="button"
                        onClick={onToggleMute}
                        aria-label={muted ? `${label}のミュートを解除` : `${label}をミュート`}
                        aria-pressed={muted}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${muted
                            ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                            }`}
                    >
                        <span className="material-icons-round text-[18px]">{muted ? 'volume_off' : 'volume_up'}</span>
                    </button>
                </div>
            </div>
            <input
                type="range" min="0" max="1" step="0.05"
                value={value}
                onChange={(e) => onVolume(parseFloat(e.target.value))}
                disabled={muted}
                aria-label={label}
                className="ui-range"
                style={{ '--fill': `${value * 100}%` }}
            />
        </div>
    );
};

/**
 * SettingsScreen - ゲーム設定画面
 * タイトル・ポーズ画面から開く。コンボ演出・音量・倍速・更新・バックアップを管理する。
 */
const SettingsScreen = ({ settings, onSettingsChange, onClose }) => {
    const { comboAnimationMode = 'instant' } = settings || {};
    const [showBackup, setShowBackup] = useState(false);
    const speed = settings.speedMultiplier || 3;

    const comboModes = [
        { id: 'instant', icon: 'flash_on', label: '一括演出', desc: 'ボーナスや最終値をまとめて表示' },
        { id: 'step', icon: 'filter_none', label: '段階的演出', desc: '効果ごとに1つずつ順に加算表示' },
    ];

    return (
        <ScreenShell icon="settings" title="設定" onClose={onClose}>
            <div className="flex flex-col gap-5">
                {/* コンボ演出モード */}
                <UiSection title="コンボ演出" icon="auto_awesome">
                    <div className="ui-card p-1.5 flex flex-col gap-1">
                        {comboModes.map((m) => {
                            const active = comboAnimationMode === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => onSettingsChange('comboAnimationMode', m.id)}
                                    aria-pressed={active}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-colors ${active
                                        ? 'bg-amber-400/12 border-amber-400/60'
                                        : 'border-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`material-icons-round text-[20px] ${active ? 'text-amber-300' : 'text-slate-500'}`}>{m.icon}</span>
                                    <span className="flex-1 min-w-0 leading-tight">
                                        <span className={`block text-sm font-black ${active ? 'text-white' : 'text-slate-300'}`}>{m.label}</span>
                                        <span className="block text-[11px] text-slate-400 mt-0.5">{m.desc}</span>
                                    </span>
                                    <span className={`material-icons-round text-[20px] ${active ? 'text-amber-300' : 'text-slate-700'}`}>
                                        {active ? 'radio_button_checked' : 'radio_button_unchecked'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </UiSection>

                {/* サウンド */}
                <UiSection title="サウンド" icon="graphic_eq">
                    <div className="ui-card divide-y divide-white/5">
                        <VolumeRow
                            icon="music_note"
                            label="BGM"
                            volume={settings.bgmVolume}
                            muted={settings.bgmMuted}
                            onVolume={(v) => onSettingsChange('bgmVolume', v)}
                            onToggleMute={() => onSettingsChange('bgmMuted', !settings.bgmMuted)}
                        />
                        <VolumeRow
                            icon="volume_up"
                            label="効果音"
                            volume={settings.seVolume}
                            muted={settings.seMuted}
                            onVolume={(v) => onSettingsChange('seVolume', v)}
                            onToggleMute={() => onSettingsChange('seMuted', !settings.seMuted)}
                        />
                    </div>
                </UiSection>

                {/* 倍速の速さ */}
                <UiSection title="倍速の速さ" icon="speed">
                    <div className="ui-card p-3">
                        <p className="text-slate-400 text-[11px] mb-2.5 leading-relaxed">
                            パズル演出時に長押しした時の倍速スピード
                        </p>
                        <div className="ui-segment">
                            {[2, 3, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => onSettingsChange('speedMultiplier', s)}
                                    aria-pressed={speed === s}
                                    className={speed === s ? 'is-active' : ''}
                                >
                                    {s}倍
                                </button>
                            ))}
                        </div>
                    </div>
                </UiSection>

                {/* データ */}
                <UiSection title="データ" icon="storage">
                    <div className="flex flex-col gap-2">
                        {/* アプリの更新（オフライン用キャッシュの更新） */}
                        <UpdateSettingsSection />

                        {/* セーブデータのバックアップ */}
                        <button
                            type="button"
                            onClick={() => setShowBackup(true)}
                            className="ui-card w-full flex items-center gap-3 px-4 py-3 text-left hover:border-violet-400/50 transition-colors"
                        >
                            <span className="material-icons-round text-[20px] text-violet-300">backup</span>
                            <span className="flex-1 leading-tight">
                                <span className="block text-sm font-bold text-slate-200">セーブデータのバックアップ</span>
                                <span className="block text-[11px] text-slate-400 mt-0.5">書き出し・読み込み / 機種変更</span>
                            </span>
                            <span className="material-icons-round text-slate-500">chevron_right</span>
                        </button>
                    </div>
                </UiSection>
            </div>

            {showBackup && <BackupScreen onClose={() => setShowBackup(false)} />}
        </ScreenShell>
    );
};

export default SettingsScreen;
