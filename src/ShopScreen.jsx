import React from 'react';

const ShopScreen = ({
    items, stars, onBuy, onClose, onRefresh, rerollPrice, onPause,
    isEnchantShopUnlocked, tokenSlotExpansionCount, onAwakeningBuy,
    isAwakeningLevelUpBought,
}) => {
    const [activeTab, setActiveTab] = React.useState('normal');

    // 覚醒ショップの価格計算
    const AWAKENING_TOKEN_SLOT_BASE_PRICE = 100;
    const AWAKENING_TOKEN_SLOT_PRICE_STEP = 50;
    const tokenSlotExpandPrice = AWAKENING_TOKEN_SLOT_BASE_PRICE + (tokenSlotExpansionCount || 0) * AWAKENING_TOKEN_SLOT_PRICE_STEP;
    const currentMaxSlots = 5 + (tokenSlotExpansionCount || 0);
    const nextMaxSlots = currentMaxSlots + 1;

    // アイテムをカテゴリごとに分類
    const enchantItems = items.filter(item => item.type === 'enchant_grant' || item.type === 'enchant_random');
    const normalItems = items.filter(item => item.type !== 'enchant_grant' && item.type !== 'enchant_random');
    const passiveItems = normalItems.filter(item => item.type === 'passive' || item.type === 'collector' || item.type === 'upgrade_random');
    const activeItems = normalItems.filter(item => item.type === 'skill');

    // アイテムのアイコンを決定するヘルパー
    const getItemIcon = (item) => {
        if (item.type === 'skill') {
            if (item.action === 'refresh' || item.action === 'force_refresh') return 'refresh';
            if (item.action === 'skyfall' || item.action === 'skyfall_limit') return 'auto_awesome';
            if (item.action === 'convert' || item.action === 'convert_multi') return 'bolt';
            if (item.action === 'board_change') return 'grid_view';
            if (item.action === 'row_fix') return 'splitscreen';
            if (item.action === 'forbidden_temp') return 'block';
            return 'bolt';
        }
        if (item.type === 'passive') {
            if (item.id === 'time_ext') return 'hourglass_top';
            if (item.id === 'power_up') return 'fitness_center';
            if (item.id === 'collector') return 'savings';
            if (item.id === 'forbidden') return 'dangerous';
            if (item.id === 'bargain') return 'percent';
            if (item.id === 'skip_master') return 'fast_forward';
            return 'auto_awesome';
        }
        if (item.type === 'enchant_grant' || item.type === 'enchant_random') return 'auto_fix_high';
        if (item.type === 'upgrade_random') return 'arrow_upward';
        return 'star';
    };

    // エンチャントのレアリティに応じた色を返すヘルパー
    const getEnchantRarityStyle = (rarity) => {
        if (rarity === 3) return {
            cardBg: 'from-fuchsia-900/40 to-purple-900/40',
            border: 'border-fuchsia-500/50',
            iconBg: 'from-fuchsia-600/30 to-purple-900/30',
            iconBorder: 'border-fuchsia-500/40',
            iconColor: 'text-fuchsia-300',
            badge: 'bg-fuchsia-700/50 text-fuchsia-200',
            glow: 'shadow-fuchsia-900/50',
        };
        if (rarity === 2) return {
            cardBg: 'from-blue-900/40 to-indigo-900/40',
            border: 'border-blue-500/50',
            iconBg: 'from-blue-600/30 to-indigo-900/30',
            iconBorder: 'border-blue-500/40',
            iconColor: 'text-blue-300',
            badge: 'bg-blue-700/50 text-blue-200',
            glow: 'shadow-blue-900/50',
        };
        return {
            cardBg: 'from-purple-900/30 to-slate-900/30',
            border: 'border-purple-500/40',
            iconBg: 'from-purple-600/20 to-purple-900/20',
            iconBorder: 'border-purple-500/30',
            iconColor: 'text-purple-300',
            badge: 'bg-purple-700/50 text-purple-200',
            glow: 'shadow-purple-900/50',
        };
    };

    // 通常アイテムの背景・ボーダー色を返すヘルパー
    const getItemColors = (item) => {
        if (item.type === 'upgrade_random') {
            return { bg: 'from-green-500/20 to-green-900/20', border: 'border-green-500/30', iconColor: 'text-green-400' };
        }
        const rarity = item.rarity || 1;
        if (rarity === 3) {
            return { bg: 'from-fuchsia-600/20 to-purple-900/20', border: 'border-fuchsia-500/40', iconColor: 'text-fuchsia-300' };
        } else if (rarity === 2) {
            return { bg: 'from-blue-500/20 to-blue-900/20', border: 'border-blue-500/30', iconColor: 'text-blue-300' };
        } else {
            return { bg: 'from-slate-500/20 to-slate-800/20', border: 'border-white/10', iconColor: 'text-slate-300' };
        }
    };

    // スワイプバックでショップを閉じる
    const [touchStartInfo, setTouchStartInfo] = React.useState(null);

    const handleTouchStart = (e) => {
        setTouchStartInfo({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        });
    };

    const handleTouchEnd = (e) => {
        if (!touchStartInfo) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartInfo.x;
        const dy = touchEndY - touchStartInfo.y;
        const dt = Date.now() - touchStartInfo.time;
        if (dx > 50 && Math.abs(dy) < 50 && dt < 300) {
            onClose();
        }
        setTouchStartInfo(null);
    };

    // 通常アイテムのカードを描画するコンポーネント
    const NormalItemCard = ({ item }) => {
        const styles = getItemColors(item);
        const isAffordable = stars >= item.price;
        return (
            <div className="group bg-surface-dark hover:bg-white/5 border border-white/5 hover:border-primary/50 rounded-xl p-3 flex items-center transition-all duration-200">
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${styles.bg} border ${styles.border} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                    <span className={`material-icons-round ${styles.iconColor} text-2xl relative z-10`}>{getItemIcon(item)}</span>
                </div>
                <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-base">{item.name}</h3>
                        <div className="flex text-gold text-[10px]">
                            {Array.from({ length: item.rarity || 1 }).map((_, i) => (
                                <span key={i} className="material-icons-round">star</span>
                            ))}
                        </div>
                        {item.isSale && (
                            <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">SALE</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                </div>
                <button
                    onClick={() => onBuy(item)}
                    disabled={!isAffordable}
                    className={`transition-transform text-white px-3 py-2 rounded-lg flex flex-col items-center justify-center min-w-[70px] ${isAffordable ? 'bg-primary hover:bg-primary-hover active:scale-95' : 'bg-surface-dark border border-white/10 opacity-50 cursor-not-allowed'}`}
                >
                    <span className="text-xs font-bold flex items-center text-white">
                        {item.price} <span className={`material-icons-round text-[10px] ml-1 ${isAffordable ? 'text-gold' : 'text-slate-500'}`}>star</span>
                    </span>
                    <span className="text-[10px] uppercase font-medium opacity-80">{isAffordable ? 'Buy' : 'Locked'}</span>
                </button>
            </div>
        );
    };

    // 覚醒ショップのカードを描画するコンポーネント
    const AwakeningCard = ({ icon, title, desc, price, onBuy: onCardBuy, disabled, disabledReason, badgeText, color }) => {
        const isAffordable = stars >= price && !disabled;
        const colorMap = {
            green: {
                cardBg: 'from-emerald-900/40 to-teal-900/40',
                border: disabled ? 'border-slate-700/50' : 'border-emerald-500/50',
                iconBg: 'from-emerald-600/30 to-teal-900/30',
                iconBorder: 'border-emerald-500/40',
                iconColor: 'text-emerald-300',
                btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50',
            },
            amber: {
                cardBg: 'from-amber-900/40 to-orange-900/40',
                border: disabled ? 'border-slate-700/50' : 'border-amber-500/50',
                iconBg: 'from-amber-600/30 to-orange-900/30',
                iconBorder: 'border-amber-500/40',
                iconColor: 'text-amber-300',
                btn: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/50',
            },
            indigo: {
                cardBg: 'from-indigo-900/40 to-blue-900/40',
                border: disabled ? 'border-slate-700/50' : 'border-indigo-500/50',
                iconBg: 'from-indigo-600/30 to-blue-900/30',
                iconBorder: 'border-indigo-500/40',
                iconColor: 'text-indigo-300',
                btn: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50',
            },
        };
        const c = colorMap[color] || colorMap.green;
        return (
            <div className={`rounded-2xl bg-gradient-to-br ${c.cardBg} border ${c.border} overflow-hidden transition-all duration-200 ${disabled ? 'opacity-60' : 'hover:scale-[1.01]'}`}>
                <div className="px-4 pt-4 pb-3 flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconBg} border ${c.iconBorder} flex items-center justify-center flex-shrink-0`}>
                        <span className={`material-icons-round ${c.iconColor} text-2xl`}>{icon}</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-white text-base">{title}</h3>
                            {badgeText && (
                                <span className="text-[10px] bg-emerald-700/50 text-emerald-200 px-2 py-0.5 rounded-full font-bold">{badgeText}</span>
                            )}
                            {disabled && (
                                <span className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full font-bold">購入済</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-tight">{disabledReason || desc}</p>
                    </div>
                </div>
                {/* 効果説明ボックス */}
                <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-black/25 border border-white/5">
                    <div className="flex items-center space-x-1.5 mb-1">
                        <span className="material-icons-round text-slate-400 text-xs">info</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">効果</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{desc}</p>
                </div>
                {/* 購入ボタン */}
                <div className="px-4 pb-4">
                    <button
                        onClick={onCardBuy}
                        disabled={!isAffordable}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 ${isAffordable
                            ? `${c.btn} text-white shadow-md`
                            : 'bg-surface-dark border border-white/10 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {disabled ? (
                            <span>購入済み</span>
                        ) : (
                            <>
                                <span className="material-icons-round text-gold text-sm">star</span>
                                <span>{price} で購入</span>
                                {!isAffordable && !disabled && <span className="text-[10px] opacity-70 ml-1">(★不足)</span>}
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <main
            className="w-full h-full flex flex-col relative bg-background-dark shadow-2xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* ヘッダー */}
            <header className="flex-none px-6 py-4 z-20 relative bg-surface-dark/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <span className="material-icons-round">arrow_back</span>
                    </button>
                    <h1 className="text-sm font-medium tracking-widest uppercase text-slate-400">Merchant's Wares</h1>
                    <div className="flex items-center space-x-1 p-2 -mr-2 text-white">
                        <button onClick={onPause} className="p-2 mr-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                            <span className="material-icons-round">pause</span>
                        </button>
                        <span className="material-icons-round text-gold text-lg animate-pulse">star</span>
                        <span className="text-lg font-bold tracking-wide">{stars.toLocaleString()}</span>
                    </div>
                </div>

                {/* タブUI */}
                <div className="flex space-x-1 p-1 bg-black/20 rounded-xl">
                    <button
                        onClick={() => setActiveTab('normal')}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${activeTab === 'normal' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        <span className="material-icons-round text-sm">shopping_bag</span>
                        <span>ノーマル</span>
                    </button>
                    <button
                        onClick={() => isEnchantShopUnlocked && setActiveTab('enchant')}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 relative ${!isEnchantShopUnlocked
                            ? 'text-slate-600 cursor-not-allowed bg-black/10'
                            : activeTab === 'enchant'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-[1.02]'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        {isEnchantShopUnlocked ? (
                            <>
                                <span className="material-icons-round text-sm">auto_fix_high</span>
                                <span>エンチャント</span>
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round text-sm">lock</span>
                                <span>エンチャント</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('awakening')}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${activeTab === 'awakening' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 scale-[1.02]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        <span className="material-icons-round text-sm">egg_alt</span>
                        <span>覚醒</span>
                    </button>
                </div>
            </header>

            {/* スクロール可能なコンテンツエリア */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 pb-32 space-y-6">

                {/* ノーマルショップ */}
                {activeTab === 'normal' && (
                    <>
                        {passiveItems.length > 0 && (
                            <div>
                                <div className="flex items-center space-x-2 mb-3">
                                    <span className="material-icons-round text-primary text-sm">auto_fix_high</span>
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Passive Artifacts</h2>
                                </div>
                                <div className="space-y-3">
                                    {passiveItems.map((item, idx) => <NormalItemCard key={idx} item={item} />)}
                                </div>
                            </div>
                        )}
                        {activeItems.length > 0 && (
                            <div>
                                <div className="flex items-center space-x-2 mb-3 pt-2">
                                    <span className="material-icons-round text-primary text-sm">flash_on</span>
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Spells</h2>
                                </div>
                                <div className="space-y-3">
                                    {activeItems.map((item, idx) => <NormalItemCard key={idx} item={item} />)}
                                </div>
                            </div>
                        )}
                        {passiveItems.length === 0 && activeItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="material-icons-round text-slate-600 text-4xl mb-3">inventory_2</span>
                                <p className="text-slate-500 text-sm">商品がありません</p>
                            </div>
                        )}
                    </>
                )}

                {/* エンチャントショップ */}
                {activeTab === 'enchant' && isEnchantShopUnlocked && (
                    <div className="space-y-4">
                        {/* 注意書き */}
                        <div className="flex items-start space-x-2 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
                            <span className="material-icons-round text-red-400 text-base flex-shrink-0 mt-0.5">warning</span>
                            <p className="text-red-300 text-xs font-semibold leading-relaxed">
                                購入したエンチャントは所持しているランダムなトークンに付与されます。
                            </p>
                        </div>
                        {enchantItems.length > 0 ? (
                            <div className="space-y-4">
                                {enchantItems.map((item, idx) => {
                                    const isAffordable = stars >= item.price;
                                    const style = getEnchantRarityStyle(item.rarity || 1);
                                    const rarityLabel = item.rarity === 3 ? 'Epic' : item.rarity === 2 ? 'Rare' : 'Uncommon';
                                    return (
                                        <div key={idx} className={`rounded-2xl bg-gradient-to-br ${style.cardBg} border ${style.border} shadow-lg ${style.glow} overflow-hidden transition-all duration-200 hover:scale-[1.01]`}>
                                            <div className="px-4 pt-4 pb-3 flex items-center space-x-3">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.iconBg} border ${style.iconBorder} flex items-center justify-center flex-shrink-0`}>
                                                    <span className={`material-icons-round ${style.iconColor} text-2xl`}>auto_fix_high</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                                        <h3 className="font-bold text-white text-base">{item.name}</h3>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{rarityLabel}</span>
                                                    </div>
                                                    <div className="flex text-gold text-[10px] mt-0.5">
                                                        {Array.from({ length: item.rarity || 1 }).map((_, i) => (
                                                            <span key={i} className="material-icons-round">star</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-black/25 border border-white/5">
                                                <div className="flex items-center space-x-1.5 mb-1">
                                                    <span className="material-icons-round text-slate-400 text-xs">info</span>
                                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">効果</span>
                                                </div>
                                                <p className="text-sm text-slate-200 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <div className="px-4 pb-4">
                                                <button
                                                    onClick={() => onBuy(item)}
                                                    disabled={!isAffordable}
                                                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 ${isAffordable ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/50' : 'bg-surface-dark border border-white/10 text-slate-500 cursor-not-allowed'}`}
                                                >
                                                    <span className="material-icons-round text-gold text-sm">star</span>
                                                    <span>{item.price} で購入</span>
                                                    {!isAffordable && <span className="text-[10px] opacity-70 ml-1">(★不足)</span>}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="material-icons-round text-slate-600 text-4xl mb-3">auto_fix_high</span>
                                <p className="text-slate-500 text-sm">エンチャントアイテムがありません</p>
                                <p className="text-slate-600 text-xs mt-1">ショップを更新してみましょう</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 覚醒ショップ */}
                {activeTab === 'awakening' && (
                    <div className="space-y-4">
                        {/* 概要説明 */}
                        <div className="flex items-start space-x-2 bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-3">
                            <span className="material-icons-round text-amber-400 text-base flex-shrink-0 mt-0.5">egg_alt</span>
                            <p className="text-amber-200 text-xs font-semibold leading-relaxed">
                                スターを消費して永続的な強化を解放します。覚醒効果はゲーム全体を通じて有効です。
                            </p>
                        </div>

                        {/* 1. ランダムなトークンをレベルアップ */}
                        <AwakeningCard
                            icon="trending_up"
                            title="ランダムレベルアップ"
                            desc="所持しているトークンの中からランダムに1つを選び、レベルアップさせます（最大Lv3）。"
                            price={5}
                            onBuy={() => onAwakeningBuy('random_levelup')}
                            disabled={isAwakeningLevelUpBought}
                            disabledReason={isAwakeningLevelUpBought ? "このラインナップでは購入済みです" : null}
                            color="green"
                            badgeText="毎回購入可"
                        />

                        {/* 2. エンチャントショップの解放 */}
                        <AwakeningCard
                            icon="auto_fix_high"
                            title="エンチャントショップ解放"
                            desc="「エンチャント」タブを解放し、エンチャントを購入してトークンに付与できるようになります。一度購入すれば永続です。"
                            price={10}
                            onBuy={() => onAwakeningBuy('unlock_enchant_shop')}
                            disabled={isEnchantShopUnlocked}
                            color="indigo"
                            badgeText="1回限り"
                        />

                        {/* 3. トークン所持枠の解放 */}
                        <AwakeningCard
                            icon="add_box"
                            title="トークン所持枠の拡張"
                            desc={`トークンの最大所持枠を ${currentMaxSlots} → ${nextMaxSlots} に拡張します。購入するごとに価格が ${AWAKENING_TOKEN_SLOT_PRICE_STEP}★ 上昇します。`}
                            price={tokenSlotExpandPrice}
                            onBuy={() => onAwakeningBuy('expand_token_slots')}
                            disabled={false}
                            color="amber"
                            badgeText={`現在 ${currentMaxSlots} 枠`}
                        />
                    </div>
                )}
            </div>

            {/* フッター */}
            <footer className="absolute bottom-0 left-0 w-full p-6 glass-panel border-t border-white/10 z-30">
                <div className="flex space-x-3 h-14">
                    <button
                        onClick={onRefresh}
                        className="h-full aspect-square flex flex-col items-center justify-center bg-surface-dark hover:bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95 group relative"
                    >
                        <span className="material-icons-round text-xl mb-0.5 group-hover:rotate-180 transition-transform duration-500">sync</span>
                        <div className="flex flex-col items-center leading-none">
                            <span className="flex items-center bg-slate-800/80 px-1.5 rounded-full border border-white/5">
                                <span className="text-[10px] font-mono">{rerollPrice}</span>
                                <span className="material-icons-round text-gold text-[8px] ml-0.5">star</span>
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={onClose}
                        className="h-full flex-1 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-500 active:scale-[0.98] transition-all rounded-xl shadow-glow flex items-center justify-center space-x-2 text-white relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <span className="text-lg font-bold tracking-wide relative z-10">Return</span>
                        <span className="material-icons-round group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </footer>
        </main>
    );
};

export default ShopScreen;
