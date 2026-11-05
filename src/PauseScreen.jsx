import React from 'react';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';

/**
 * 一時停止メニュー（画面下から出るシート）
 * - 暗い背景を押すか「続ける」で閉じる
 * - runInfo があれば、上部にサイクル・ターン・★を表示する
 */
const PauseScreen = ({ onResume, onTitle, onHelp, onStats, onCredits, onSettings, onTitles, onDownloadLog, runInfo }) => {
    const click = (fn) => () => {
        soundManager.playSE(SE_IDS.UI_CLICK);
        fn();
    };

    // 「そのほか」のボタン（存在するものだけ並べる）
    const items = [
        { key: 'help', icon: 'help_outline', label: 'ヘルプ', onClick: onHelp },
        { key: 'settings', icon: 'settings', label: '設定', onClick: onSettings },
        { key: 'stats', icon: 'emoji_events', label: '実績', onClick: onStats, gold: true },
        onTitles && { key: 'titles', icon: 'military_tech', label: '二つ名', onClick: onTitles, gold: true },
        { key: 'credits', icon: 'info', label: 'クレジット', onClick: onCredits },
        onDownloadLog && { key: 'log', icon: 'download', label: '記録を保存', onClick: onDownloadLog },
    ].filter(Boolean);

    return (
        <div className="pause-sheet-root" role="dialog" aria-modal="true" aria-label="メニュー">
            <div className="pause-sheet-dim animate-fade-in" onClick={onResume} />
            <div className="pause-sheet animate-sheet-up">
                <span className="pause-sheet-grab" aria-hidden="true" />

                {runInfo && (
                    <div className="pause-sheet-runinfo">
                        <span>サイクル <b>{runInfo.cycle}</b></span>
                        <span>
                            ターン <b>{runInfo.turn}</b>
                            {runInfo.isEndlessMode ? ' ∞' : `/${runInfo.maxTurns}`}
                        </span>
                        <span><span className="material-icons-round text-yellow-400 text-sm">star</span> <b>{runInfo.stars}</b></span>
                    </div>
                )}

                <button type="button" onClick={click(onResume)} className="pause-sheet-resume">
                    <span className="material-icons-round">play_arrow</span>
                    続ける
                </button>

                <div className="pause-sheet-group">
                    <span className="pause-sheet-group-label">そのほか</span>
                    <div className="pause-sheet-grid">
                        {items.map((it) => (
                            <button key={it.key} type="button" onClick={click(it.onClick)} className={`pause-sheet-item ${it.gold ? 'is-gold' : ''}`}>
                                <span className="material-icons-round">{it.icon}</span>
                                <span>{it.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button type="button" onClick={click(onTitle)} className="pause-sheet-home">
                    <span className="material-icons-round">home</span>
                    タイトルに戻る
                </button>
            </div>
        </div>
    );
};

export default PauseScreen;
