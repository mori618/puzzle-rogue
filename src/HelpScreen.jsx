import React, { useState } from 'react';

// ============================================================
// ヘルパーコンポーネント群
// ============================================================

/**
 * パズル盤面のドロップを模したアイコンコンポーネント
 * ゲーム内の実際の見た目に合わせたスタイルを使用
 */
/**
 * OrbIconのborder-radius（inner含む）をtype別に直接定義
 * .orbクラスは position:absolute; width:60px; height:60px の固定サイズを持つため使用不可
 */
const ORB_STYLES = {
    fire:    { outer: { borderRadius: '0% 50% 50% 50%', transform: 'none' },             inner: '10% 50% 50% 50%',  iconTransform: 'none' },
    water:   { outer: { borderRadius: '50%' },                                            inner: '50%',              iconTransform: null },
    wood:    { outer: { borderRadius: '35%' },                                            inner: '35%',              iconTransform: null },
    light:   { outer: { borderRadius: '40% 60% 40% 60% / 60% 40% 60% 40%' },             inner: '40% 60% 40% 60% / 60% 40% 60% 40%', iconTransform: null },
    dark:    { outer: { borderRadius: '50% 50% 50% 0%', transform: 'none' },             inner: '50% 50% 50% 10%',  iconTransform: 'none' },
    heart:   { outer: { borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' },             inner: '50% 50% 50% 50% / 40% 40% 60% 60%', iconTransform: null },
    rainbow: { outer: { borderRadius: '50%', animation: 'none' },                         inner: '50%',              iconTransform: null },
    move:    { outer: { borderRadius: '50%' },                                            inner: '50%',              iconTransform: null },
};

const OrbIcon = ({ type, icon, special, size = 'md' }) => {
    const sizeClass = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
    const iconSize  = size === 'sm' ? 'text-[14px]' : size === 'lg' ? 'text-[22px]' : 'text-[18px]';
    const styles    = ORB_STYLES[type] ?? { outer: { borderRadius: '50%' }, inner: '50%', iconTransform: null };

    return (
        // バッジ位置の基準となる外側ラッパー（transform影響なし・relativeのみ）
        <div className={`relative ${sizeClass} shrink-0`}>
            {/* 形状用ラッパー：styles.outerで回転・border-radius適用 */}
            <div className={`w-full h-full shadow-md`} style={{ 
                position: 'relative', 
                ...styles.outer,
                animation: type === 'rainbow' ? 'none' : undefined 
            }}>
                {/* orb-inner: インラインで border-radius を直接指定（.orbクラス依存を排除） */}
                <div
                    className={`w-full h-full flex items-center justify-center orb-inner ${
                        type === 'rainbow' ? 'orb-rainbow' : type === 'move' ? 'orb-move' : `orb-${type}`
                    }`}
                    style={{ 
                        borderRadius: styles.inner,
                        animation: type === 'rainbow' ? 'none' : undefined
                    }}
                >
                    {special === 'rainbow' ? (
                        // ヘルプ画面では虹ドロップのアニメーションを完全停止
                        <span className="rainbow-count-text text-white font-bold text-sm drop-shadow-md select-none shrink-0" style={{ animation: 'none', transform: 'none' }}>3</span>
                    ) : special === 'move' ? (
                        <span className="move-count-text text-xs shrink-0" style={{ fontSize: '14px' }}>0</span>
                    ) : (
                        <span className={`material-icons-round text-white ${iconSize} opacity-90 drop-shadow-md`}
                            style={styles.iconTransform ? { transform: styles.iconTransform } : {}}>
                            {icon}
                        </span>
                    )}
                </div>
            </div>

            {/* スペシャルマーク：外側ラッパーにabsoluteで配置するため回転の影響を受けない */}
            {special === 'enhanced' && (
                <div className="absolute top-[-3px] right-[-3px] w-4 h-4 bg-yellow-400 text-white text-[10px] leading-none font-bold flex items-center justify-center rounded-full border border-white shadow z-10">+</div>
            )}
            {special === 'bomb' && (
                <span className="material-icons-round absolute top-[-5px] left-[-5px] text-[16px] text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">cyclone</span>
            )}
            {special === 'repeat' && (
                <span className="material-icons-round absolute bottom-[-3px] left-[-3px] text-white text-[13px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-bold z-10">autorenew</span>
            )}
            {special === 'star' && (
                <span className="material-icons-round absolute bottom-[-4px] right-[-4px] text-yellow-300 text-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-bold z-10">star</span>
            )}
        </div>
    );
};

/**
 * 特殊消し（形消し）のグリッド表示コンポーネント
 */
const ShapeGrid = ({ shape, colorClass = 'bg-purple-500' }) => {
    // 3x3グリッドで強調するインデックス
    const patterns = {
        cross:    { mode: '3x3', active: [1, 3, 4, 5, 7] },
        l_shape:  { mode: '3x3', active: [0, 3, 6, 7, 8] },
        square:   { mode: '3x3', active: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
        len5:     { mode: 'row5' },  // 横に5個並び（残り1マスはグレーで「5個以上」を表現）
        len4:     { mode: 'row4' },  // 横に4個並び（残り2マスはグレーで「ちょうど4個」を表現）
        row:      { mode: 'row' },
    };

    const p = patterns[shape];
    if (!p) return null;

    if (p.mode === '3x3') {
        return (
            <div className="grid grid-cols-3 gap-[3px] p-2 bg-black/30 rounded-lg border border-white/10 shrink-0">
                {Array(9).fill(0).map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-[4px] transition-all ${
                            p.active.includes(i)
                                ? `${colorClass} shadow-sm`
                                : 'bg-slate-700/60 border border-white/5'
                        }`}
                    />
                ))}
            </div>
        );
    }

    if (p.mode === 'row') {
        return (
            <div className="flex gap-[3px] p-2 bg-black/30 rounded-lg border border-white/10 items-center shrink-0">
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-[4px] ${colorClass} shadow-sm`} />
                ))}
            </div>
        );
    }

    // 4個ちょうど：横に4個の色付き + 2個のグレー（ちょうど4個であることを表現）
    if (p.mode === 'row4') {
        return (
            <div className="flex gap-[3px] p-2 bg-black/30 rounded-lg border border-white/10 items-center shrink-0">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-[4px] ${colorClass} shadow-sm`} />
                ))}
                {Array(2).fill(0).map((_, i) => (
                    <div key={`e${i}`} className="w-4 h-4 rounded-[4px] bg-slate-700/60 border border-white/5" />
                ))}
            </div>
        );
    }

    // 5個以上連結：横に5個の色付き + 1個のグレー（「以上」を表現）
    if (p.mode === 'row5') {
        return (
            <div className="flex gap-[3px] p-2 bg-black/30 rounded-lg border border-white/10 items-center shrink-0">
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-[4px] ${colorClass} shadow-sm`} />
                ))}
                <div className="w-4 h-4 rounded-[4px] bg-slate-700/60 border border-white/5" />
            </div>
        );
    }

    return null;
};

/**
 * セクションヘッダー
 */
const SectionTitle = ({ children }) => (
    <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
        <span className="block w-1 h-3.5 bg-primary rounded-full" />
        {children}
    </h4>
);

/**
 * 情報カード
 */
const InfoCard = ({ children, className = '' }) => (
    <div className={`bg-slate-800/50 border border-white/8 rounded-xl p-3.5 ${className}`}>
        {children}
    </div>
);

// ============================================================
// 各タブのコンテンツ
// ============================================================

/** タブ1: 基本ルール・画面の見方 */
const TabBasic = () => (
    <div className="space-y-5">
        {/* 画面の見方 */}
        <section>
            <SectionTitle>画面の見方</SectionTitle>
            <InfoCard>
                <div className="space-y-2.5 text-sm">
                    {[
                        { icon: 'flag', color: 'text-yellow-400', label: 'Target', desc: '目標コンボ数。サイクルクリアに必要なコンボの累計目標値。' },
                        { icon: 'swap_calls', color: 'text-blue-400', label: 'Turn', desc: '残りターン数。使い切るとゲームオーバーの可能性あり。' },
                        { icon: 'bolt', color: 'text-purple-400', label: 'エネルギー (E)', desc: 'アクティブスキルの発動に必要。ターン経過で溜まる。' },
                        { icon: 'star', color: 'text-yellow-300', label: 'スター (★)', desc: 'ショップで使う通貨。ドロップ消去やスキップで獲得。' },
                        { icon: 'timer', color: 'text-green-400', label: '操作時間', desc: '1ターンに使える時間。スキルやトークンで延長可能。' },
                    ].map(({ icon, color, label, desc }) => (
                        <div key={label} className="flex items-start gap-3">
                            <span className={`material-icons-round ${color} text-[20px] shrink-0 mt-0.5`}>{icon}</span>
                            <div>
                                <span className="text-white font-bold">{label}：</span>
                                <span className="text-slate-300">{desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </InfoCard>
        </section>

        {/* ゲームの進行 */}
        <section>
            <SectionTitle>ゲームの進行フロー</SectionTitle>
            <div className="space-y-1.5">
                {[
                    { step: '1', icon: 'grid_on', color: 'bg-blue-600', label: 'パズルフェーズ', desc: '盤面のドロップを移動してコンボを稼ぐ' },
                    { step: '↓', icon: null, color: '', label: '', desc: '' },
                    { step: '2', icon: 'emoji_events', color: 'bg-green-600', label: 'クリア達成', desc: '累計コンボが目標値 (Target) に到達！' },
                    { step: '↓', icon: null, color: '', label: '', desc: '' },
                    { step: '3', icon: 'store', color: 'bg-purple-600', label: 'ショップフェーズ', desc: '★を使ってトークン購入・強化' },
                    { step: '↓', icon: null, color: '', label: '', desc: '' },
                    { step: '4', icon: 'replay', color: 'bg-amber-600', label: '次のサイクルへ', desc: '目標値が上昇して繰り返し' },
                ].map(({ step, icon, color, label, desc }, i) => {
                    if (!icon) return (
                        <div key={i} className="flex items-center justify-center text-slate-500 text-sm py-0.5">▼</div>
                    );
                    return (
                        <InfoCard key={i} className="flex items-center gap-3 !py-2.5">
                            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center shrink-0`}>
                                <span className="material-icons-round text-white text-[18px]">{icon}</span>
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{label}</div>
                                <div className="text-xs text-slate-400">{desc}</div>
                            </div>
                        </InfoCard>
                    );
                })}
            </div>
        </section>

        {/* 基本操作 */}
        <section>
            <SectionTitle>基本操作</SectionTitle>
            <InfoCard>
                <div className="space-y-2 text-sm text-slate-300">
                    <p>
                        <strong className="text-white">同じ色のドロップを3つ以上</strong>繋げると消えてコンボが発生します。
                    </p>
                    <p>
                        ドロップは<strong className="text-white">1ターン中に自由に何度でも移動</strong>でき、
                        操作時間が切れると盤面が確定してコンボ計算が始まります。
                    </p>
                    <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-2 text-xs text-amber-200 mt-2">
                        💡 目標コンボを早く達成して残りターンを<strong>スキップ</strong>すると、★ボーナスが多く貰えます！
                    </div>
                </div>
            </InfoCard>
        </section>
    </div>
);

/** タブ2: 特殊消し（形消し） */
const TabShapes = () => {
    const shapes = [
        {
            key: 'cross',
            label: '十字消し',
            colorClass: 'bg-red-500',
            passiveId: '十字の祈り',
            effect: 'コンボ加算 +2',
            tip: '「十字の祈り」装備でさらに操作時間延長',
            tipColor: 'text-red-300',
        },
        {
            key: 'l_shape',
            label: 'L字消し',
            colorClass: 'bg-blue-500',
            passiveId: '鉤十字の型',
            effect: 'コンボ加算 +1',
            tip: '「鉤十字の型」装備でさらにコンボ加算',
            tipColor: 'text-blue-300',
        },
        {
            key: 'square',
            label: '3×3 正方形消し',
            colorClass: 'bg-green-500',
            passiveId: '四方の型',
            effect: 'コンボ倍率 ×2倍',
            tip: '「四方の型」装備でさらに ×2〜5倍 強化',
            tipColor: 'text-green-300',
        },
        {
            key: 'len4',
            label: '4個ちょうど消し',
            colorClass: 'bg-amber-500',
            passiveId: '四連の術',
            effect: '基本ボーナスなし',
            tip: '「四連の術」装備でコンボ加算ボーナス',
            tipColor: 'text-amber-300',
        },
        {
            key: 'len5',
            label: '5個以上連結消し',
            colorClass: 'bg-purple-500',
            passiveId: '五星の印',
            effect: 'コンボ加算 +1',
            tip: '「五星の印」装備でさらに操作時間延長',
            tipColor: 'text-purple-300',
        },
        {
            key: 'row',
            label: '横一列消し',
            colorClass: 'bg-yellow-500',
            passiveId: '横一閃',
            effect: 'コンボ加算 +2',
            tip: '「横一閃」装備でさらにコンボ加算',
            tipColor: 'text-yellow-300',
        },
    ];

    return (
        <div className="space-y-4">
            <InfoCard className="!p-3">
                <p className="text-xs text-slate-300">
                    特定の<strong className="text-white">形</strong>でドロップを消すと特殊ボーナスが発生します。
                    対応するパッシブトークンを装備するとさらに効果が増幅します。
                </p>
            </InfoCard>

            <div className="space-y-2.5">
                {shapes.map(({ key, label, colorClass, effect, tip, tipColor }) => (
                    <InfoCard key={key} className="!p-3">
                        <div className="flex items-start gap-3">
                            <ShapeGrid shape={key} colorClass={colorClass} />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white text-sm mb-1">{label}</div>
                                <div className="text-xs text-slate-300 mb-1.5">{effect}</div>
                                <div className={`text-xs ${tipColor} bg-black/20 rounded-md px-2 py-1`}>
                                    🔮 {tip}
                                </div>
                            </div>
                        </div>
                    </InfoCard>
                ))}
            </div>

            {/* 全消しボーナス */}
            <section>
                <SectionTitle>全消しボーナス</SectionTitle>
                <div className="space-y-2">
                    <InfoCard className="border-yellow-500/20 !bg-yellow-900/20">
                        <div className="font-bold text-yellow-400 text-sm mb-1">🌟 初期盤面全消し (Initial Clear)</div>
                        <p className="text-xs text-slate-300">ターン開始時に存在したドロップを全部消すと、最終コンボ数が <strong className="text-white">×2倍</strong>。</p>
                    </InfoCard>
                    <InfoCard className="border-pink-500/20 !bg-pink-900/20">
                        <div className="font-bold text-pink-400 text-sm mb-1">✨ パーフェクトクリア (Perfect Clear)</div>
                        <p className="text-xs text-slate-300">落ちコン後も盤面にドロップが1つも残らない状態になると、<strong className="text-white">×2倍 ＋ 10コンボ</strong> 加算。</p>
                    </InfoCard>
                </div>
            </section>
        </div>
    );
};

/** タブ3: 特殊ドロップ */
const TabDrops = () => {
    const basicDrops = [
        { type: 'fire',  icon: 'whatshot', label: '炎（Fire）',   color: 'text-red-400',    desc: '左上が尖った雫形' },
        { type: 'water', icon: 'water_drop', label: '雨（Water）', color: 'text-blue-400',  desc: '正円' },
        { type: 'wood',  icon: 'air',      label: '風（Wood）',   color: 'text-green-400',  desc: '超角丸四角' },
        { type: 'light', icon: 'bolt',     label: '雷（Light）',  color: 'text-yellow-400', desc: '有機的オーバル' },
        { type: 'dark',  icon: 'nightlight_round', label: '月（Dark）',color: 'text-purple-400', desc: '左下が尖った雫形' },
        { type: 'heart', icon: 'favorite', label: 'ハート',       color: 'text-pink-400',   desc: '縦長のハート' },
    ];

    const specialDrops = [
        {
            type: 'fire',
            icon: 'whatshot',
            special: 'enhanced',
            label: '強化ドロップ',
            badge: '+',
            badgeColor: 'text-yellow-400',
            desc: '右上に「+」マークが付いたドロップ。消した際に追加コンボボーナスが発生します。',
            how: '「星の導き・〇〇」スキルや「マナの結晶化」パッシブで生成',
        },
        {
            type: 'wood',
            icon: 'air',
            special: 'bomb',
            label: 'ボムドロップ',
            badge: '💥',
            badgeColor: 'text-white',
            desc: '左上に竜巻マークが付いたドロップ。揃えて消すと爆発し、同じ色（同属性）のドロップを盤面から全消しします。',
            how: '「爆発の種」スキルやパッシブ確率で生成',
        },
        {
            type: 'water',
            icon: 'water_drop',
            special: 'repeat',
            label: 'リピートドロップ',
            badge: '🔄',
            badgeColor: 'text-blue-300',
            desc: '左下に矢印マークが付いたドロップ。1回のマッチで消えず、復活してもう1回消える耐久力があります。',
            how: '「循環の理」スキルやパッシブ確率で生成',
        },
        {
            type: 'light',
            icon: 'bolt',
            special: 'star',
            label: 'スタードロップ',
            badge: '⭐',
            badgeColor: 'text-yellow-300',
            desc: '右下に星マークが付いたドロップ。消すとショップで使うスター（★）通貨を確定で獲得します。',
            how: '「星の創造」スキルやパッシブ確率で生成',
        },
        {
            type: 'rainbow',
            icon: '',
            special: 'rainbow',
            label: '虹ドロップ',
            badge: '数字',
            badgeColor: 'text-white',
            desc: '全属性のドロップの代わりになるオールマイティなドロップ。中央の数字の回数分マッチに使えます。',
            how: '「虹の創造」スキルや「虹の呼び声」パッシブで生成',
        },
        {
            type: 'move',
            icon: '',
            special: 'move',
            label: 'ムーブドロップ',
            badge: '数字',
            badgeColor: 'text-green-400',
            desc: '緑白縞の丸いドロップ。操作中に移動させた距離（マス数）に応じてカウントが増え、ターン終了時にカウント分のコンボが加算されます。',
            how: '「ムーブドロップ」パッシブで盤面に常駐',
        },
    ];

    return (
        <div className="space-y-5">
            {/* 基本ドロップ */}
            <section>
                <SectionTitle>基本の6属性</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                    {basicDrops.map(({ type, icon, label, color, desc }) => (
                        <div key={type} className="flex items-center gap-2.5 bg-slate-800/50 border border-white/8 rounded-xl p-2.5">
                            <OrbIcon type={type} icon={icon} size="sm" />
                            <div>
                                <div className={`font-bold text-xs ${color}`}>{label}</div>
                                <div className="text-[10px] text-slate-400">{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 特殊ドロップ */}
            <section>
                <SectionTitle>特殊ドロップ</SectionTitle>
                <div className="space-y-2.5">
                    {specialDrops.map(({ type, icon, special, label, desc, how }) => (
                        <InfoCard key={label} className="!p-3">
                            <div className="flex items-start gap-3">
                                <OrbIcon type={type} icon={icon} special={special} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white text-sm mb-1">{label}</div>
                                    <p className="text-xs text-slate-300 mb-1.5">{desc}</p>
                                    <div className="text-[10px] text-slate-500 bg-black/20 rounded px-2 py-1">
                                        🔧 {how}
                                    </div>
                                </div>
                            </div>
                        </InfoCard>
                    ))}
                </div>
            </section>
        </div>
    );
};

/** タブ4: アクティブ/パッシブ/呪いトークンの違い */
const TabTokens = () => (
    <div className="space-y-5">
        <InfoCard className="!p-3">
            <p className="text-xs text-slate-300">
                ショップで購入する「トークン」は種類によって使い方が大きく異なります。
                同じトークンを2回購入すると<strong className="text-white">レベルアップ</strong>（最大Lv3）し、効果が強化されます。
            </p>
        </InfoCard>

        {/* アクティブ */}
        <section>
            <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-orange-600/80 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-white text-[18px]">flash_on</span>
                </div>
                <h4 className="font-bold text-orange-300 text-base">アクティブスキル</h4>
            </div>
            <InfoCard className="border-orange-500/20 !bg-orange-900/15">
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-orange-400 text-[16px] shrink-0 mt-0.5">touch_app</span>
                        <p className="text-slate-300"><strong className="text-white">タップ（クリック）</strong>で発動。エネルギー (E) を消費します。</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-orange-400 text-[16px] shrink-0 mt-0.5">battery_charging_full</span>
                        <p className="text-slate-300">ターンが経過するとエネルギーが溜まります。チャージ完了でいつでも使えます。</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-orange-400 text-[16px] shrink-0 mt-0.5">manage_search</span>
                        <p className="text-slate-300">主な効果：盤面変換・特殊ドロップ生成・操作時間延長・コンボ倍率ブーストなど。</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 text-xs text-orange-200">
                        💡 レベルアップで消費エネルギーが減少、または効果量がアップします。
                    </div>
                </div>
            </InfoCard>
        </section>

        {/* パッシブ */}
        <section>
            <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-blue-600/80 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-white text-[18px]">shield</span>
                </div>
                <h4 className="font-bold text-blue-300 text-base">パッシブスキル</h4>
            </div>
            <InfoCard className="border-blue-500/20 !bg-blue-900/15">
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-blue-400 text-[16px] shrink-0 mt-0.5">auto_awesome</span>
                        <p className="text-slate-300">持っているだけで<strong className="text-white">常に効果を発揮</strong>します。操作不要。</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-blue-400 text-[16px] shrink-0 mt-0.5">category</span>
                        <p className="text-slate-300">主な効果のカテゴリ：</p>
                    </div>
                    <div className="pl-5 space-y-1 text-xs text-slate-400">
                        <p>• <strong className="text-blue-200">形消しボーナス</strong>：L字、十字、5個消しなどの形でコンボ加算や時間ボーナス</p>
                        <p>• <strong className="text-blue-200">属性倍率</strong>：特定の色を消すとコンボ倍率アップ</p>
                        <p>• <strong className="text-blue-200">落ちコン強化</strong>：落ちコン発生時に追加コンボ加算</p>
                        <p>• <strong className="text-blue-200">ドロップ出現確率</strong>：特殊ドロップが落ちやすくなる</p>
                        <p>• <strong className="text-blue-200">ショップ強化</strong>：商品数増加、レアリティアップなど</p>
                        <p>• <strong className="text-blue-200">統計依存</strong>：累計コンボ数、クリア回数などに応じて強化</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 text-xs text-blue-200">
                        💡 「時の砂」はパッシブの特別版で、購入するたびにトークン枠を使わず操作時間が累積延長されます。
                    </div>
                </div>
            </InfoCard>
        </section>

        {/* 呪い */}
        <section>
            <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-red-800/80 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-white text-[18px]">warning</span>
                </div>
                <h4 className="font-bold text-red-300 text-base">呪いトークン</h4>
            </div>
            <InfoCard className="border-red-500/20 !bg-red-900/15">
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-red-400 text-[16px] shrink-0 mt-0.5">block</span>
                        <p className="text-slate-300"><strong className="text-white">デメリット効果</strong>を持つ負のトークン。特定条件でショップに出現します。</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-red-400 text-[16px] shrink-0 mt-0.5">lock_open</span>
                        <p className="text-slate-300">解除条件を達成すると呪いが解け、<strong className="text-white">強力なパッシブなど報酬</strong>に変化します！</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 text-xs">
                        <p className="text-red-200 font-bold mb-1">主な呪いの効果例</p>
                        <div className="space-y-0.5 text-red-300/80">
                            <p>• 焦燥の刻印：操作時間が4秒固定</p>
                            <p>• 不運の枷：1サイクルの手番 -1</p>
                            <p>• 脆弱の断層：コンボ数が半分（×0.5）</p>
                            <p>• 倍加の呪い：1サイクルの目標値が2倍</p>
                        </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 text-xs text-red-200">
                        💡 「呪われた力」や「厄災の祈り」など、呪いを逆利用するパッシブも存在します！
                    </div>
                </div>
            </InfoCard>
        </section>

        {/* エンチャント */}
        <section>
            <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 bg-amber-600/80 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-white text-[18px]">auto_fix_high</span>
                </div>
                <h4 className="font-bold text-amber-300 text-base">エンチャント</h4>
            </div>
            <InfoCard className="border-amber-500/20 !bg-amber-900/15">
                <div className="space-y-2 text-sm text-slate-300">
                    <p>ショップで購入し、<strong className="text-white">既存トークンに付与する追加効果</strong>です。</p>
                    <p>同じ種類のエンチャントをショップで再度購入・付与すると、<span className="text-yellow-400 font-bold underline decoration-yellow-400/30">その効果は累積（スタック）し、さらに能力が強化されます。</span></p>
                    <div className="text-xs text-amber-200 bg-black/20 rounded px-2 py-1 mt-1">
                        💡 大多数の効果は加算または乗算で重なります。詳細は各エンチャントの解説を確認してください。
                    </div>
                </div>
            </InfoCard>
        </section>
    </div>
);

/** タブ5: スコア計算 */
const TabScore = () => (
    <div className="space-y-5">
        <InfoCard className="!p-3">
            <p className="text-xs text-slate-300">
                1ターンの最終コンボ数は複数のレイヤーで計算されます。以下の順序で積み重なっていきます。
            </p>
        </InfoCard>

        {/* コンボ計算フロー */}
        <section>
            <SectionTitle>コンボ計算の流れ</SectionTitle>
            <div className="space-y-2">
                {[
                    {
                        step: '①',
                        color: 'bg-blue-700',
                        title: '純コンボ',
                        desc: '盤面で実際に消えたコンボ数（3個以上繋げた回数）',
                    },
                    {
                        step: '②',
                        color: 'bg-green-700',
                        title: '加算ボーナス',
                        desc: '形消し（L字・十字・横一列など）、属性脈動パッシブ（〇の脈動）、力の鼓動などによる固定コンボ加算',
                    },
                    {
                        step: '③',
                        color: 'bg-yellow-700',
                        title: 'コンボ倍率',
                        desc: '属性律動（〇〇の律動）、コンボ数条件（七連の闘気）、特定形消し乗算（四方の型など）による最終倍率',
                    },
                    {
                        step: '④',
                        color: 'bg-purple-700',
                        title: '全消しボーナス',
                        desc: '初期盤面全消し（×2）やパーフェクトクリア（×2 +10）の適用',
                    },
                ].map(({ step, color, title, desc }) => (
                    <div key={step} className="flex items-start gap-3 bg-slate-800/40 border border-white/8 rounded-xl p-3">
                        <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center shrink-0 font-bold text-sm text-white`}>{step}</div>
                        <div>
                            <div className="font-bold text-white text-sm">{title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* スキップボーナス */}
        <section>
            <SectionTitle>スキップボーナス</SectionTitle>
            <InfoCard>
                <div className="space-y-2 text-sm text-slate-300">
                    <p>目標コンボを達成した後、残りターンを<strong className="text-white">スキップ</strong>すると★ボーナスが貰えます。</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-black/20 rounded-lg p-2 text-center">
                            <div className="text-yellow-400 font-bold text-sm">早めにクリア</div>
                            <div className="text-xs text-slate-400 mt-0.5">残ターン数 × ★獲得</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2 text-center">
                            <div className="text-purple-400 font-bold text-sm">時短の心得</div>
                            <div className="text-xs text-slate-400 mt-0.5">スキップ報酬 ×3〜10倍</div>
                        </div>
                    </div>
                </div>
            </InfoCard>
        </section>

        {/* ターンスキップ詳細 */}
        <section>
            <SectionTitle>落ちコン（スカイフォール）</SectionTitle>
            <InfoCard>
                <div className="space-y-2 text-sm text-slate-300">
                    <p>ドロップが消えると上から新しいドロップが落ちてきます。これにより<strong className="text-white">連鎖（落ちコン）</strong>が発生することがあります。</p>
                    <div className="text-xs bg-black/20 rounded px-2 py-1.5 space-y-0.5">
                        <p className="text-slate-300">• 「天恵の追撃」パッシブで落ちコン時にコンボ +5〜40</p>
                        <p className="text-slate-300">• 「禁忌の儀式」や「虚無の契約」で落ちコン停止＋倍率UP</p>
                        <p className="text-slate-300">• 各属性の静寂/凪スキルで特定ドロップの出現を制御可能</p>
                    </div>
                </div>
            </InfoCard>
        </section>

        {/* エネルギーとスター獲得 */}
        <section>
            <SectionTitle>スター獲得タイミング</SectionTitle>
            <InfoCard>
                <div className="text-xs text-slate-300 space-y-1.5">
                    <p>• <strong className="text-white">ドロップ消去</strong>：ある程度のコンボで★が自動獲得</p>
                    <p>• <strong className="text-white">スタードロップ消去</strong>：確定で★を追加獲得</p>
                    <p>• <strong className="text-white">ターンスキップ</strong>：残りターン数に応じてボーナス★</p>
                    <p>• <strong className="text-white">トークン売却</strong>：パッシブトークンをショップで売却</p>
                    <p className="text-yellow-300/80 mt-2">💡「黄金の収集者」パッシブで★獲得に必要なコンボ数が大幅減少！</p>
                </div>
            </InfoCard>
        </section>
    </div>
);

/** タブ6: ショップ */
const TabShop = () => (
    <div className="space-y-5">
        {/* ショップ基本 */}
        <section>
            <SectionTitle>ショップの使い方</SectionTitle>
            <div className="space-y-2">
                {[
                    { icon: 'store', color: 'bg-purple-600', title: 'トークン購入', desc: 'アクティブ・パッシブトークンをスターで購入。枠が埋まっている場合は既存トークンを売却して空きを作ります。' },
                    { icon: 'refresh', color: 'bg-blue-600', title: 'リロール（刷新）', desc: 'ショップのラインナップをスターで更新。実行するたびに次回の更新費用が上昇します。' },
                    { icon: 'sell', color: 'bg-green-700', title: 'トークン売却', desc: 'パッシブトークンをドラッグして売却エリアにドロップするか、売却ボタンを押して★を獲得できます。' },
                    { icon: 'upgrade', color: 'bg-orange-600', title: 'レベルアップ', desc: '同じトークンをもう一度購入するとLv2→Lv3と強化されます。レベルが上がると効果量アップやコスト減少。' },
                ].map(({ icon, color, title, desc }) => (
                    <InfoCard key={title} className="!p-3 flex items-start gap-3">
                        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center shrink-0`}>
                            <span className="material-icons-round text-white text-[18px]">{icon}</span>
                        </div>
                        <div>
                            <div className="font-bold text-white text-sm">{title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                        </div>
                    </InfoCard>
                ))}
            </div>
        </section>

        {/* レアリティ */}
        <section>
            <SectionTitle>トークンのレアリティ</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { stars: '★', label: 'スター1', color: 'text-slate-300', bg: 'bg-slate-700/50 border-slate-600/30', desc: '基本的なスキル・パッシブ' },
                    { stars: '★★', label: 'スター2', color: 'text-blue-300', bg: 'bg-blue-900/30 border-blue-600/30', desc: '中級効果・複合ボーナス' },
                    { stars: '★★★', label: 'スター3', color: 'text-yellow-300', bg: 'bg-amber-900/30 border-amber-500/30', desc: '高倍率・特殊ギミック' },
                ].map(({ stars, label, color, bg, desc }) => (
                    <div key={label} className={`${bg} border rounded-xl p-2.5 text-center`}>
                        <div className={`font-bold text-sm ${color}`}>{stars}</div>
                        <div className="text-[10px] text-slate-300 mt-1">{label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{desc}</div>
                    </div>
                ))}
            </div>
            <div className="text-xs text-slate-400 mt-2 text-center">
                「招福の鈴」パッシブでレアトークンの出現率アップ
            </div>
        </section>

        {/* 覚醒ショップ */}
        <section>
            <SectionTitle>覚醒ショップ（プレイ強化）</SectionTitle>
            <InfoCard className="border-amber-500/20 !bg-amber-900/15">
                <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                        <span className="material-icons-round text-amber-400 text-[16px] shrink-0 mt-0.5">diamond</span>
                        <p>パズルを大幅に有利に進めるための<strong className="text-white">強力な追加強化</strong>を購入できるショップ内の特別なタブ。</p>
                    </div>
                    <div className="text-xs space-y-1">
                        <p>• <strong className="text-amber-200">時の砂（追加）</strong>：現在の操作時間を延長</p>
                        <p>• <strong className="text-amber-200">トークン枠拡張</strong>：所持できるトークン数を最大10個まで増やす</p>
                        <p>• <strong className="text-amber-200">レベルアップ購入</strong>：所持トークンの中からランダムにLvアップ</p>
                    </div>
                    <div className="text-xs text-amber-200/70">
                        💡 一度購入した覚醒効果は、そのプレイ（ラン）の間ずっと有効です。
                    </div>
                </div>
            </InfoCard>
        </section>

        {/* ショップ強化パッシブ */}
        <section>
            <SectionTitle>ショップを強化するパッシブ</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { name: '陳列の極意', effect: '商品枠を +1〜3拡張' },
                    { name: '商談の極意', effect: 'セール（半額）枠 +1〜5' },
                    { name: '招福の鈴', effect: 'レア出現率アップ' },
                    { name: '魔道の極意', effect: 'エンチャント枠 +1〜3' },
                ].map(({ name, effect }) => (
                    <div key={name} className="bg-slate-800/40 border border-white/8 rounded-lg p-2">
                        <div className="text-xs font-bold text-white">{name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{effect}</div>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

/** タブ7: ゲームモード */
const TabModes = () => (
    <div className="space-y-4">
        {/* 通常モード */}
        <InfoCard className="border-blue-500/20 !bg-blue-900/10">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-white text-[18px]">play_circle</span>
                </div>
                <h4 className="font-bold text-blue-300 text-base">通常プレイ</h4>
            </div>
            <div className="text-sm text-slate-300 space-y-1.5">
                <p>メインモード。サイクルを重ねるごとに<strong className="text-white">目標コンボ数が上昇</strong>し、難易度が高まっていきます。</p>
                <div className="text-xs space-y-0.5 text-slate-400">
                    <p>• 目標未達成で最大ターン消費 → ゲームオーバー</p>
                    <p>• ゲームオーバー時はセーブデータがリセット（称号や累計実績以外の強化は全てクリア）</p>
                    <p>• サイクル25クリアで「彼岸モード」へ突入</p>
                </div>
            </div>
        </InfoCard>

        {/* 練習モード */}
        <InfoCard className="border-green-500/20 !bg-green-900/10">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-white text-[18px]">fitness_center</span>
                </div>
                <h4 className="font-bold text-green-300 text-base">練習モード（Puzzle Practice）</h4>
            </div>
            <div className="text-sm text-slate-300 space-y-1.5">
                <p>目標値のない<strong className="text-white">自由な操作練習</strong>モード。初期状態（ターン1・トークンなし）で始まります。</p>
                <div className="text-xs space-y-0.5 text-slate-400 mt-1">
                    <p>• <strong className="text-green-300">Pure Mode</strong>：特殊消しボーナスを無効にした純粋なコンボ練習</p>
                    <p>• 操作時間を自由に設定可能（例：10秒）</p>
                    <p>• セーブデータへの影響なし</p>
                </div>
            </div>
        </InfoCard>

        {/* 彼岸モード */}
        <InfoCard className="border-purple-500/30 !bg-purple-900/20">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-white text-[18px]">whatshot</span>
                </div>
                <h4 className="font-bold text-purple-300 text-base">彼岸（Beyond）モード</h4>
            </div>
            <div className="text-sm text-slate-300 space-y-1.5">
                <p>通常サイクルを<strong className="text-white">25回クリア</strong>すると到達する無限エンドコンテンツモード。</p>
                <div className="text-xs space-y-0.5 text-slate-400 mt-1">
                    <p>• 独自のBGMに変化</p>
                    <p>• 目標値が際限なく上昇し続ける</p>
                    <p>• システム上限に挑戦するやり込みコンテンツ</p>
                </div>
                <div className="bg-purple-900/30 rounded p-2 text-xs text-purple-200 mt-2">
                    🌌 どこまでコンボを積み上げられるか挑戦しよう！
                </div>
            </div>
        </InfoCard>

        {/* セーブデータ */}
        <section>
            <SectionTitle>セーブデータと引き継ぎ</SectionTitle>
            <InfoCard>
                <div className="text-xs text-slate-300 space-y-1.5">
                    <p>ゲームはターン終了・ショップ利用など主要な操作のたびに<strong className="text-white">自動保存</strong>されます。</p>
                    <div className="mt-2 space-y-1">
                        <p className="text-green-300 font-bold">ゲームオーバー後も残るもの</p>
                        <p>• 時の砂（操作時間の永続延長）</p>
                        <p>• 覚醒ショップで購入した強化</p>
                        <p>• 累計統計（lifetimeコンボ数、最大コンボなど）</p>
                    </div>
                    <div className="mt-2 space-y-1">
                        <p className="text-red-300 font-bold">ゲームオーバー時にリセットされるもの</p>
                        <p>• 所持トークン・現在のスター数</p>
                        <p>• 現在のサイクル進行状況</p>
                    </div>
                </div>
            </InfoCard>
        </section>
    </div>
);

// ============================================================
// メインコンポーネント
// ============================================================

const TABS = [
    { id: 'basic',  label: '基本',   icon: 'menu_book',   component: TabBasic },
    { id: 'shapes', label: '形消し', icon: 'grid_view',   component: TabShapes },
    { id: 'drops',  label: 'ドロップ', icon: 'bubble_chart', component: TabDrops },
    { id: 'tokens', label: 'トークン', icon: 'auto_awesome_mosaic', component: TabTokens },
    { id: 'score',  label: 'スコア', icon: 'calculate',   component: TabScore },
    { id: 'shop',   label: 'ショップ', icon: 'store',      component: TabShop },
    { id: 'modes',  label: 'モード', icon: 'sports_esports', component: TabModes },
];

const HelpScreen = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('basic');

    const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? TabBasic;

    return (
        <div
            className="w-full h-screen bg-background-dark/90 flex flex-col items-center justify-center p-4 animate-fade-in font-display"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md h-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-surface-dark shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary text-[22px]">menu_book</span>
                        ヘルプ・遊び方
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round text-[20px]">close</span>
                    </button>
                </div>

                {/* タブナビゲーション */}
                <div className="flex gap-0 border-b border-white/10 bg-slate-900 shrink-0 overflow-x-auto no-scrollbar">
                    {TABS.map(({ id, label, icon }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-bold whitespace-nowrap shrink-0 border-b-2 transition-all ${
                                    isActive
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                <span className={`material-icons-round text-[18px] ${isActive ? 'text-primary' : ''}`}>{icon}</span>
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* コンテンツエリア */}
                <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                    <ActiveComponent />
                </div>

                {/* フッター */}
                <div className="p-3 border-t border-white/10 shrink-0 bg-slate-900">
                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-colors shadow-lg"
                    >
                        ゲームに戻る
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpScreen;
