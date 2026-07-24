import React, { useState } from 'react';
import { getAttributeBarStyles } from './utils/tokenUtils';

// モックデータ: ショップアイテムのプレビュー用
const mockShopItem = {
    name: "インフェルノ・コア",
    desc: "火属性オーブを消したとき、追加で +3 コンボ獲得する。",
    price: 15,
    rarity: 3,
    isSale: true,
    attributes: ['fire'],
};

const UIPreviewScreen = ({ onClose }) => {
    // 状態管理
    const [bgType, setBgType] = useState('cyber-grid'); // cyber-grid, dark-gradient, default
    const [activeModal, setActiveModal] = useState(null); // 'shop', 'settings', 'clear', null
    const [testClickCount, setTestClickCount] = useState(0);


    // 背景に応じたクラス名を取得
    const getBgClass = () => {
        switch (bgType) {
            case 'cyber-grid':
                return 'bg-background-dark relative overflow-hidden';
            case 'dark-gradient':
                return 'bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950';
            case 'default':
            default:
                return 'bg-slate-900';
        }
    };

    return (
        <div className={`w-full h-screen flex flex-col font-game-cyber text-slate-100 ${getBgClass()} transition-colors duration-500`}>
            {/* サイバーグリッド背景がONの時のみレンダリング */}
            {bgType === 'cyber-grid' && <div className="cyber-grid-bg"></div>}

            {/* ヘッダーエリア */}
            <header className="relative z-10 px-6 py-4 border-b border-white/10 bg-slate-950/70 backdrop-blur-md flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-game-header text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                        UI PARTS SHOWCASE
                    </h1>
                    <p className="text-xs text-slate-400 font-bold mt-1 tracking-wider">
                        ゲーム用UIパーツ ＆ スタイルプレビュー画面
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="btn-game-danger px-4 py-2 text-sm"
                >
                    タイトルに戻る
                </button>
            </header>

            {/* メインコンテンツ（スクロール可能エリア） */}
            <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full">
                {/* 1. 背景切り替えセクション */}
                <section className="game-panel-cyber rounded-2xl p-5">
                    <h2 className="text-lg font-game-header text-indigo-300 mb-3">1. 背景テーマ切り替え</h2>
                    <p className="text-xs text-slate-400 mb-4 font-bold">
                        アプリ全体の背景デザインを切り替えて、コントラストと見え方を確認します。
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setBgType('cyber-grid')}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${bgType === 'cyber-grid' ? 'bg-primary text-white border border-primary-hover shadow-lg' : 'bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700'}`}
                        >
                            サイバーグリッド背景 (スクロール付)
                        </button>
                        <button
                            onClick={() => setBgType('dark-gradient')}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${bgType === 'dark-gradient' ? 'bg-primary text-white border border-primary-hover shadow-lg' : 'bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700'}`}
                        >
                            ダークパープル・グラデーション
                        </button>
                        <button
                            onClick={() => setBgType('default')}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${bgType === 'default' ? 'bg-primary text-white border border-primary-hover shadow-lg' : 'bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700'}`}
                        >
                            デフォルト (単色ダークグレー)
                        </button>
                    </div>
                </section>

                {/* 2. ボタンライブラリ */}
                <section className="game-panel-cyber rounded-2xl p-5">
                    <h2 className="text-lg font-game-header text-indigo-300 mb-3">2. ゲームUIボタン</h2>
                    <p className="text-xs text-slate-400 mb-4 font-bold">
                        ピクセル（ドット）を排除し、滑らかな陰影やネオン発光を取り入れた立体的なボタンです。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 有効状態 */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-300 border-l-2 border-primary pl-2">通常状態（ホバー・クリック可能）</h3>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setTestClickCount(c => c + 1)}
                                    className="btn-game-primary w-full py-3"
                                >
                                    決定 / プライマリ (立体ゴールド)
                                </button>
                                <button
                                    onClick={() => setTestClickCount(c => c + 1)}
                                    className="btn-game-cyber w-full py-3"
                                >
                                    サイバーネオンボタン (グロー枠)
                                </button>
                                <button
                                    onClick={() => setTestClickCount(c => c + 1)}
                                    className="btn-game-secondary w-full py-3"
                                >
                                    サブアクション (立体グレー)
                                </button>
                                <button
                                    onClick={() => setTestClickCount(c => c + 1)}
                                    className="btn-game-danger w-full py-3"
                                >
                                    警告 / 破棄 (立体レッド)
                                </button>
                            </div>
                        </div>

                        {/* 無効状態 */}
                        <div className="space-y-3 opacity-80">
                            <h3 className="text-sm font-bold text-slate-300 border-l-2 border-slate-500 pl-2">無効（Disabled）状態</h3>
                            <div className="flex flex-col gap-3">
                                <button disabled className="btn-game-primary w-full py-3">
                                    決定 (使用不可)
                                </button>
                                <button disabled className="btn-game-cyber w-full py-3">
                                    サイバーネオン (ロック中)
                                </button>
                                <button disabled className="btn-game-secondary w-full py-3">
                                    サブアクション (無効)
                                </button>
                                <button disabled className="btn-game-danger w-full py-3">
                                    警告 (使用不可)
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-2.5 bg-black/30 rounded-lg text-xs text-center font-bold text-slate-400">
                        クリック回数カウンター: <span className="text-yellow-400 text-sm font-mono">{testClickCount}</span>
                    </div>
                </section>

                {/* 3. 3Dクリスタル・ジュエルオーブ */}
                <section className="game-panel-cyber rounded-2xl p-5">
                    <h2 className="text-lg font-game-header text-indigo-300 mb-3">3. 3Dジュエルオーブ（パズルピース）</h2>
                    <p className="text-xs text-slate-400 mb-4 font-bold">
                        ラジアルグラデーションと上部の光沢（ハイライト）により、ぷっくりとした宝石の質感に仕上げています。
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 justify-items-center">
                        {[
                            { type: 'fire', icon: 'local_fire_department', label: '火' },
                            { type: 'water', icon: 'water_drop', label: '水' },
                            { type: 'wood', icon: 'eco', label: '木' },
                            { type: 'light', icon: 'light_mode', label: '光' },
                            { type: 'dark', icon: 'dark_mode', label: '闇' },
                            { type: 'heart', icon: 'favorite', label: '回復' },
                        ].map((orb) => (
                            <div key={orb.type} className="flex flex-col items-center gap-1.5">
                                <div className="w-14 h-14 relative cursor-pointer group active:scale-95 transition-transform">
                                    <div className={`orb-inner orb-${orb.type} w-full h-full rounded-2xl transition-all duration-200`}>
                                        <span className="material-icons-round text-2xl text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] z-10">
                                            {orb.icon}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{orb.label}</span>
                            </div>
                        ))}

                        {/* 特殊オーブ: Move Drop */}
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="w-14 h-14 relative cursor-pointer active:scale-95 transition-transform">
                                <div className="orb-inner orb-move w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                    <span className="text-green-500 font-black text-xl z-10 font-mono">5</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">移動ドロップ</span>
                        </div>

                        {/* 特殊オーブ: Rainbow Drop */}
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="w-14 h-14 relative cursor-pointer active:scale-95 transition-transform">
                                <div className="orb-inner orb-rainbow w-full h-full rounded-2xl bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 flex items-center justify-center">
                                    <span className="material-icons-round text-2xl text-white drop-shadow-md z-10 animate-pulse">
                                        star
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">虹ドロップ</span>
                        </div>
                    </div>
                </section>

                {/* 4. トークン・縦バーバリエーションギャラリー */}
                <section className="game-panel-cyber rounded-2xl p-5">
                    <h2 className="text-lg font-game-header text-indigo-300 mb-3">4. トークン・縦バーバリエーションギャラリー</h2>
                    <p className="text-xs text-slate-400 mb-4 font-bold">
                        1pxのシャープなオクタゴン外枠、左端の属性縦バー（幅1.5）、そして様々なステート（Ready、バフ中、クールダウン、選択中、属性シンクロなど）の表現を網羅したギャラリーです。
                    </p>

                    <div className="space-y-8">
                        {/* 4.1 属性＆複数属性 */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-300 border-l-2 border-indigo-500 pl-2">属性 ＆ 複数属性バリエーション</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* 火属性 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['fire'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-orange-400 drop-shadow-md relative z-35 token-icon-wrap">local_fire_department</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">炎 (火)</span>
                                </div>
                                {/* 水属性 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['water'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-sky-400 drop-shadow-md relative z-35 token-icon-wrap">water_drop</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">雨 (水)</span>
                                </div>
                                {/* 木属性 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['wood'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-emerald-400 drop-shadow-md relative z-35 token-icon-wrap">eco</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">風 (木)</span>
                                </div>
                                {/* 光属性 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['light'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-yellow-400 drop-shadow-md relative z-35 token-icon-wrap">light_mode</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">雷 (光)</span>
                                </div>
                                {/* 闇属性 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['dark'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-purple-400 drop-shadow-md relative z-35 token-icon-wrap">dark_mode</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">月 (闇)</span>
                                </div>
                                {/* 回復属性 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['heart'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-pink-400 drop-shadow-md relative z-35 token-icon-wrap">favorite</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">癒 (回復)</span>
                                </div>
                                {/* 無属性 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles([])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-slate-400 drop-shadow-md relative z-35 token-icon-wrap">hourglass_empty</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">無属性 (白バー)</span>
                                </div>

                                {/* 2属性: 火 ＆ 水 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['fire', 'water'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-cyan-400 drop-shadow-md relative z-35 token-icon-wrap">swap_horiz</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.3</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">火＆水 (2属性)</span>
                                </div>
                                {/* 2属性: 光 ＆ 闇 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['light', 'dark'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-amber-400 drop-shadow-md relative z-35 token-icon-wrap">shield</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.2</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">光＆闇 (2属性)</span>
                                </div>
                                {/* 3属性: 火 ＆ 水 ＆ 木 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['fire', 'water', 'wood'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-indigo-400 drop-shadow-md relative z-35 token-icon-wrap">auto_awesome</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.MAX</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">3属性 (火水木)</span>
                                </div>
                            </div>
                        </div>

                        {/* 4.2 効果発動＆ステート（状態）表現 */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-300 border-l-2 border-indigo-500 pl-2">効果発動 ＆ ステート（状態）表現</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* 通常チャージ中 */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['fire'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {/* 背景チャージゲージ (66%) */}
                                                <div className="absolute inset-0 bg-primary/5 z-20">
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/30 to-indigo-500/10 shadow-[inset_0_1px_0_rgba(99,102,241,0.4)] transition-all duration-500" style={{ height: '66.6%' }}></div>
                                                </div>
                                                <span className="material-icons-round text-xl text-slate-500 drop-shadow-md relative z-35 token-icon-wrap">local_fire_department</span>
                                            </div>
                                        </div>
                                        {/* チャージ中分数タグ */}
                                        <span className="token-status-tag tag-charge text-[7px] absolute top-1 right-1 z-40">4/6</span>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.2</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">チャージ中 (4/6)</span>
                                </div>

                                {/* 発動可能 (Ready) */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill token-ready-gold cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['light'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {/* 背景チャージゲージ (100%) */}
                                                <div className="absolute inset-0 bg-primary/5 z-20">
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/35 to-indigo-500/15 shadow-[inset_0_1px_0_rgba(251,191,36,0.4)] transition-all duration-500" style={{ height: '100%' }}></div>
                                                </div>
                                                {/* 回転ネオンマジックリング */}
                                                <div className="token-magic-ring z-25"></div>
                                                <span className="material-icons-round text-xl text-yellow-400 drop-shadow-md relative z-35 token-icon-wrap">bolt</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.MAX</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">発動可能 (Ready)</span>
                                </div>

                                {/* バフ持続中 ＋ チャージ中 (Active + Charge) */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-passive token-buff-cyan cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['wood'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {/* 背景チャージゲージ (40%) */}
                                                <div className="absolute inset-0 bg-primary/5 z-20">
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/30 to-indigo-500/10 shadow-[inset_0_1px_0_rgba(99,102,241,0.4)] transition-all duration-500" style={{ height: '40%' }}></div>
                                                </div>
                                                <span className="material-icons-round text-xl text-cyan-400 drop-shadow-md relative z-35 token-icon-wrap">eco</span>
                                            </div>
                                        </div>
                                        {/* チャージ中分数タグ (右上) */}
                                        <span className="token-status-tag tag-charge text-[7px] absolute top-1 right-1 z-40">2/5</span>
                                        {/* バフ持続タグ (左上) */}
                                        <span className="token-status-tag tag-active text-[7px] absolute top-1 left-1 z-40">3T</span>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.3</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">Active + チャージ</span>
                                </div>

                                {/* 発動可能 ＋ バフ持続中 (Ready + Active) */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill token-ready-gold token-buff-cyan cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['water'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {/* 背景チャージゲージ (100%) */}
                                                <div className="absolute inset-0 bg-primary/5 z-20">
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/35 to-indigo-500/15 shadow-[inset_0_1px_0_rgba(251,191,36,0.4)] transition-all duration-500" style={{ height: '100%' }}></div>
                                                </div>
                                                {/* 回転ネオンマジックリング */}
                                                <div className="token-magic-ring z-25"></div>
                                                <span className="material-icons-round text-xl text-sky-400 drop-shadow-md relative z-35 token-icon-wrap">tsunami</span>
                                            </div>
                                        </div>
                                        {/* バフ持続タグ (左上) */}
                                        <span className="token-status-tag tag-active text-[7px] absolute top-1 left-1 z-40">2T</span>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.5</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">Ready + Active</span>
                                </div>

                                {/* 複数バフスタック中 (Active Stack x2) */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-passive token-buff-cyan cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['dark'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-purple-400 drop-shadow-md relative z-35 token-icon-wrap">dark_mode</span>
                                            </div>
                                        </div>
                                        {/* バフ持続タグ (左上に統合) */}
                                        <span className="token-status-tag tag-active text-[7px] absolute top-1 left-1 z-40">4T x2</span>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.4</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">バフスタック x2</span>
                                </div>

                                {/* カウント型パッシブ */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-passive cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['heart'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {/* 背景チャージゲージ (60% - 18/30) */}
                                                <div className="absolute inset-0 bg-primary/5 z-20">
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/30 to-indigo-500/10 shadow-[inset_0_1px_0_rgba(99,102,241,0.4)] transition-all duration-500" style={{ height: '60%' }}></div>
                                                </div>
                                                <span className="material-icons-round text-xl text-pink-400 drop-shadow-md relative z-35 token-icon-wrap">favorite</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">カウントパッシブ</span>
                                </div>

                                {/* 選択中 (Selected) */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_15px_#fbbf24] scale-105 z-20">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['dark'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-purple-400 drop-shadow-md relative z-35 token-icon-wrap">psychology</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.5</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">選択状態</span>
                                </div>
                                {/* 呪い (赤脈動) */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-curse cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-red-500 drop-shadow-md relative z-35 token-icon-wrap">skull</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">呪い (赤脈動)</span>
                                </div>
                            </div>
                        </div>

                        {/* 4.3 レアリティ＆タイプ */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-300 border-l-2 border-indigo-500 pl-2">レアリティ ＆ スロットタイプ</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* ★1 コモン */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-passive cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['wood'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-emerald-400 drop-shadow-md relative z-35 token-icon-wrap">eco</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.1</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">★1 コモン (木)</span>
                                </div>
                                {/* ★2 レア */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['water'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-sky-400 drop-shadow-md relative z-35 token-icon-wrap">water_drop</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.2</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">★2 レア (水)</span>
                                </div>
                                {/* ★3 エピック */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-passive cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['dark'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-purple-400 drop-shadow-md relative z-35 token-icon-wrap">dark_mode</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.3</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">★3 エピック (闇)</span>
                                </div>
                                {/* ★4 レジェンド */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-passive cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['light'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-yellow-400 drop-shadow-md relative z-35 token-icon-wrap animate-pulse">stars</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.5</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">★4 レジェンド (光)</span>
                                </div>
                                {/* エンチャントコーナー付き */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-skill token-corner-fire cursor-pointer">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(['fire'])} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-icons-round text-xl text-orange-400 drop-shadow-md relative z-35 token-icon-wrap">local_fire_department</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">Lv.3</div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">炎エンチャント</span>
                                </div>
                                {/* 空スロット */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-empty flex items-center justify-center">
                                        <span className="material-icons-round text-slate-700 text-lg">lock</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">空 (ロック中)</span>
                                </div>
                                {/* 拡張可能スロット */}
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="w-16 h-16 relative token-card-empty-expandable flex items-center justify-center cursor-pointer">
                                        <span className="material-icons-round text-amber-500 text-lg animate-pulse">add</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 text-japanese">拡張可能</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. インタラクティブダイアログ確認 */}
                <section className="game-panel-cyber rounded-2xl p-5">
                    <h2 className="text-lg font-game-header text-indigo-300 mb-3">5. ダイアログ・ウィンドウプレビュー</h2>
                    <p className="text-xs text-slate-400 mb-4 font-bold">
                        実際にゲーム内で表示されるダイアログやカードの見た目（透過ぼかし・枠線装飾）を確認できます。
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                            onClick={() => setActiveModal('shop')}
                            className="btn-game-cyber py-3.5"
                        >
                            ショップカード表示
                        </button>
                        <button
                            onClick={() => setActiveModal('settings')}
                            className="btn-game-cyber py-3.5"
                        >
                            設定ウィンドウ表示
                        </button>
                        <button
                            onClick={() => setActiveModal('clear')}
                            className="btn-game-cyber py-3.5"
                        >
                            ゲームクリア表示
                        </button>
                    </div>
                </section>
            </main>

            {/* モーダル表示部 */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    {/* ショップカードプレビュー */}
                    {activeModal === 'shop' && (
                        <div className="game-panel-cyber rounded-2xl p-5 max-w-xs w-full space-y-4 animate-scale-up">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <h3 className="font-game-header text-base text-yellow-400 flex items-center gap-1.5">
                                    <span className="material-icons-round text-sm">storefront</span>
                                    ショッププレビュー
                                </h3>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>
                            
                            {/* ショップカードモック */}
                            <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-3.5 flex items-center shadow-lg relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 flex items-center justify-center shrink-0">
                                    <span className="material-icons-round text-red-400 text-2xl">local_fire_department</span>
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <h4 className="font-bold text-white text-sm truncate">{mockShopItem.name}</h4>
                                        <span className="text-[9px] bg-red-500/20 text-red-300 px-1 py-0.2 rounded border border-red-500/30 font-bold shrink-0">SALE</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">{mockShopItem.desc}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => alert("購入テスト")}
                                className="btn-game-primary w-full py-2.5 text-sm flex items-center justify-center gap-1.5"
                            >
                                <span className="material-icons-round text-sm">star</span>
                                15 で購入
                            </button>
                        </div>
                    )}

                    {/* 設定ダイアログプレビュー */}
                    {activeModal === 'settings' && (
                        <div className="game-panel-cyber rounded-3xl p-6 max-w-sm w-full space-y-5 animate-scale-up">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <h3 className="font-game-header text-lg text-indigo-300 flex items-center gap-1.5">
                                    <span className="material-icons-round">settings</span>
                                    設定プレビュー
                                </h3>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 flex justify-between">
                                        <span>BGM音量</span>
                                        <span className="text-indigo-400 font-mono">75%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        defaultValue="75"
                                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 flex justify-between">
                                        <span>SE音量</span>
                                        <span className="text-indigo-400 font-mono">90%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        defaultValue="90"
                                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                    <span className="text-xs font-bold text-slate-300">高速演出モード</span>
                                    <button className="relative w-12 h-6 bg-primary rounded-full flex items-center px-0.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                                        <div className="w-5 h-5 rounded-full bg-white translate-x-6"></div>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveModal(null)}
                                className="btn-game-primary w-full py-2.5 text-sm"
                            >
                                設定を保存して閉じる
                            </button>
                        </div>
                    )}

                    {/* ゲームクリアプレビュー */}
                    {activeModal === 'clear' && (
                        <div className="game-panel-gold rounded-3xl p-6 max-w-sm w-full space-y-5 text-center animate-scale-up">
                            <div className="space-y-2">
                                <span className="material-icons-round text-5xl text-yellow-400 animate-bounce">
                                    workspace_premium
                                </span>
                                <h3 className="font-game-header text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                                    STAGE CLEAR
                                </h3>
                                <p className="text-xs text-yellow-400/80 font-bold uppercase tracking-widest">
                                    ステージクリア！
                                </p>
                            </div>

                            <div className="bg-black/45 border border-yellow-500/20 rounded-2xl p-4 space-y-2.5 text-sm">
                                <div className="flex justify-between items-center text-slate-300">
                                    <span>合計コンボ数</span>
                                    <span className="text-lg font-bold text-yellow-400 font-mono">1,240</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-300">
                                    <span>獲得スター</span>
                                    <span className="text-lg font-bold text-yellow-400 font-mono">+120 ★</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="btn-game-secondary flex-1 py-2.5 text-sm"
                                >
                                    タイトルへ
                                </button>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="btn-game-primary flex-1 py-2.5 text-sm"
                                >
                                    次のステージへ
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UIPreviewScreen;
