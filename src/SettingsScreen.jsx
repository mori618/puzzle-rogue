import React from 'react';

/**
 * SettingsScreen - ゲーム設定画面
 * ポーズ画面から遷移する設定画面。コンボ演出モード等の設定を管理する。
 */
const SettingsScreen = ({ settings, onSettingsChange, onClose }) => {
    const { comboAnimationMode = 'instant' } = settings || {};

    return (
        <div 
            className="w-full h-full bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in font-game-cyber"
            onClick={onClose}
        >
            <div 
                className="game-panel-cyber rounded-2xl w-full max-w-xs flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <h2 className="text-3xl font-game-header text-indigo-300 mb-6 text-center tracking-widest flex items-center justify-center gap-2">
                    <span className="material-icons-round text-indigo-400">settings</span>
                    設定
                </h2>

                <div className="w-full flex flex-col gap-4">

                    {/* コンボ演出モード */}
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5">
                        <p className="text-slate-300 text-sm font-bold mb-2 flex items-center gap-1.5">
                            <span className="material-icons-round text-base text-indigo-400">auto_awesome</span>
                            コンボ演出
                        </p>
                        <p className="text-slate-500 text-[11px] mb-3 leading-relaxed">
                            コンボ終了後のボーナス計算を表示する方法を選択。
                        </p>

                        {/* 一括演出ボタン */}
                        <button
                            onClick={() => onSettingsChange('comboAnimationMode', 'instant')}
                            className={`w-full py-2.5 rounded-xl font-bold flex items-center gap-3 px-4 mb-2 text-sm ${comboAnimationMode === 'instant'
                                ? 'btn-game-primary'
                                : 'btn-game-cyber text-slate-400'
                                }`}
                        >
                            <span className="material-icons-round text-base">flash_on</span>
                            <div className="text-left leading-tight">
                                <div className="font-black text-sm">一括演出</div>
                                <div className={`text-[10px] font-normal mt-0.5 ${comboAnimationMode === 'instant' ? 'text-indigo-950/70 font-semibold' : 'text-slate-500'}`}>
                                    ボーナスや最終値をまとめて表示
                                </div>
                            </div>
                            {comboAnimationMode === 'instant' && (
                                <span className="material-icons-round text-indigo-950 ml-auto text-base">check_circle</span>
                            )}
                        </button>

                        {/* 段階的演出ボタン */}
                        <button
                            onClick={() => onSettingsChange('comboAnimationMode', 'step')}
                            className={`w-full py-2.5 rounded-xl font-bold flex items-center gap-3 px-4 text-sm ${comboAnimationMode === 'step'
                                ? 'btn-game-primary'
                                : 'btn-game-cyber text-slate-400'
                                }`}
                        >
                            <span className="material-icons-round text-base">filter_none</span>
                            <div className="text-left leading-tight">
                                <div className="font-black text-sm">段階的演出</div>
                                <div className={`text-[10px] font-normal mt-0.5 ${comboAnimationMode === 'step' ? 'text-indigo-950/70 font-semibold' : 'text-slate-500'}`}>
                                    効果ごとに1つずつ順に加算表示
                                </div>
                            </div>
                            {comboAnimationMode === 'step' && (
                                <span className="material-icons-round text-indigo-950 ml-auto text-base">check_circle</span>
                            )}
                        </button>
                    </div>

                    {/* BGM音量 */}
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-slate-300 text-sm font-bold flex items-center gap-1.5">
                                <span className="material-icons-round text-base text-indigo-400">music_note</span>
                                BGM音量
                            </p>
                            <button 
                                onClick={() => onSettingsChange('bgmMuted', !settings.bgmMuted)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${settings.bgmMuted ? 'btn-game-danger p-0' : 'btn-game-cyber p-0 text-indigo-300'}`}
                            >
                                <span className="material-icons-round text-base">{settings.bgmMuted ? 'volume_off' : 'volume_up'}</span>
                            </button>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05"
                            value={settings.bgmMuted ? 0 : settings.bgmVolume}
                            onChange={(e) => onSettingsChange('bgmVolume', parseFloat(e.target.value))}
                            disabled={settings.bgmMuted}
                            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                        />
                    </div>

                    {/* SE音量 */}
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-slate-300 text-sm font-bold flex items-center gap-1.5">
                                <span className="material-icons-round text-base text-indigo-400">volume_up</span>
                                効果音音量
                            </p>
                            <button 
                                onClick={() => onSettingsChange('seMuted', !settings.seMuted)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${settings.seMuted ? 'btn-game-danger p-0' : 'btn-game-cyber p-0 text-indigo-300'}`}
                            >
                                <span className="material-icons-round text-base">{settings.seMuted ? 'volume_off' : 'volume_up'}</span>
                            </button>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05"
                            value={settings.seMuted ? 0 : settings.seVolume}
                            onChange={(e) => onSettingsChange('seVolume', parseFloat(e.target.value))}
                            disabled={settings.seMuted}
                            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                        />
                    </div>

                    {/* 倍速の速さ */}
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5">
                        <p className="text-slate-300 text-sm font-bold mb-2 flex items-center gap-1.5">
                            <span className="material-icons-round text-base text-indigo-400">speed</span>
                            倍速の速さ
                        </p>
                        <p className="text-slate-500 text-[11px] mb-3 leading-relaxed">
                            パズル演出時の長押し倍速スピードを変更。
                        </p>

                        <div className="flex gap-2">
                            {[2, 3, 5].map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => onSettingsChange('speedMultiplier', speed)}
                                    className={`flex-1 py-2 rounded-xl font-bold text-xs ${
                                        (settings.speedMultiplier || 3) === speed
                                            ? 'btn-game-primary'
                                            : 'btn-game-cyber text-slate-400'
                                    }`}
                                >
                                    {speed}倍
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="my-1 border-b border-white/10 w-full"></div>

                    {/* 戻るボタン */}
                    <button
                        onClick={onClose}
                        className="w-full btn-game-secondary py-3 flex justify-center items-center gap-2"
                    >
                        <span className="material-icons-round text-lg">arrow_back</span>
                        戻る
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
