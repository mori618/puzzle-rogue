import React from 'react';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';

/**
 * 画面ヘッダー（共通）
 * 左に戻るボタン、アイコン付きの見出し、右側に任意の要素を置く。
 * - accent: 見出しアイコンの色（indigo / amber / emerald / rose）
 */
export const ScreenHeader = ({ icon, title, subtitle, accent = 'indigo', onClose, closeLabel = '戻る', right }) => (
    <header className="screen-header">
        {onClose && (
            <button
                type="button"
                onClick={() => {
                    soundManager.playSE(SE_IDS.UI_CLICK);
                    onClose();
                }}
                aria-label={closeLabel}
                className="screen-back-btn"
            >
                <span className="material-icons-round">arrow_back</span>
            </button>
        )}
        <div className="screen-title">
            {icon && (
                <span className={`screen-title-icon is-${accent}`} aria-hidden="true">
                    <span className="material-icons-round">{icon}</span>
                </span>
            )}
            <div className="min-w-0">
                <h1 className="screen-title-text">{title}</h1>
                {subtitle && <p className="screen-title-sub">{subtitle}</p>}
            </div>
        </div>
        {right && <div className="ml-auto shrink-0 flex items-center gap-2">{right}</div>}
    </header>
);

/**
 * 全画面の共通フレーム
 * 背景（グリッド＋光）・ヘッダー・スクロール本文・任意のフッターをまとめる。
 * - toolbar: ヘッダー直下に固定表示する要素（タブ・検索など）
 * - wide: 図鑑など、PCで横に広げたい画面用
 * - bodyKey: 変えると本文を作り直す（タブ切り替えでスクロールを先頭に戻す）
 */
const ScreenShell = ({
    icon,
    title,
    subtitle,
    accent,
    onClose,
    closeLabel,
    headerRight,
    toolbar,
    footer,
    wide = false,
    bodyClassName = '',
    bodyKey,
    children,
}) => (
    <div className="screen-shell font-game-cyber animate-fade-in">
        <div className="cyber-grid-bg opacity-40" />
        <div className="screen-shell-glow" aria-hidden="true" />
        <div className={`screen-shell-col ${wide ? 'is-wide' : ''}`}>
            <ScreenHeader
                icon={icon}
                title={title}
                subtitle={subtitle}
                accent={accent}
                onClose={onClose}
                closeLabel={closeLabel}
                right={headerRight}
            />
            {toolbar && <div className="screen-toolbar">{toolbar}</div>}
            <main key={bodyKey} className={`screen-body no-scrollbar ${bodyClassName}`}>{children}</main>
            {footer && <footer className="screen-footer">{footer}</footer>}
        </div>
    </div>
);

/** 見出し付きのまとまり */
export const UiSection = ({ title, icon, children, className = '' }) => (
    <section className={className}>
        {title && (
            <h2 className="ui-section-label">
                {icon && <span className="material-icons-round">{icon}</span>}
                {title}
            </h2>
        )}
        {children}
    </section>
);

export default ScreenShell;
