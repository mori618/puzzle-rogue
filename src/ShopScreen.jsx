import React from 'react';
import { getTokenIcon, getAttributeBarStyles } from './utils/tokenUtils';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';
import { formatJapaneseNumber } from './utils/numberUtils';
import { AWAKENING_TOKEN_SLOT_PRICES, INITIAL_TOKEN_SLOTS } from './constants/gameConstants';

// 通常アイテムの背景・ボーダー色を返すヘルパー
const getItemColors = (item) => {
    if (item.type === 'curse' || item.isCurse) {
        return { bg: 'from-red-500/20 to-red-900/20', border: 'border-red-500/30', iconColor: 'text-red-400' };
    }
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

// エンチャントのレアリティに応じたデザインスタイルを返すヘルパー
const getEnchantRarityStyle = (rarity) => {
    if (rarity === 3) {
        return {
            cardBg: 'from-purple-950/80 to-slate-900/90',
            border: 'border-fuchsia-500/40',
            glow: 'shadow-fuchsia-500/10',
            iconBg: 'from-fuchsia-500 to-purple-600',
            iconBorder: 'border-fuchsia-400/50',
            iconColor: 'text-white',
            badge: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
        };
    } else if (rarity === 2) {
        return {
            cardBg: 'from-blue-950/80 to-slate-900/90',
            border: 'border-blue-500/40',
            glow: 'shadow-blue-500/10',
            iconBg: 'from-blue-500 to-indigo-600',
            iconBorder: 'border-blue-400/50',
            iconColor: 'text-white',
            badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        };
    } else {
        return {
            cardBg: 'from-slate-900/90 to-slate-950/90',
            border: 'border-slate-800',
            glow: '',
            iconBg: 'from-slate-700 to-slate-800',
            iconBorder: 'border-slate-600/30',
            iconColor: 'text-slate-300',
            badge: 'bg-slate-800 text-slate-400 border border-slate-700/30'
        };
    }
};

// 通常アイテムのカードを描画するコンポーネント
const NormalItemCard = ({ item, stars, onBuy, isBought }) => {
    const styles = getItemColors(item);
    const isAffordable = stars >= item.price;
    const handleBuyClick = (e) => {
        if (!isAffordable) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onBuy(item, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };
    return (
        <div className={`game-panel-cyber rounded-xl p-3 flex items-center transition-all ${isBought ? 'animate-purchase-success z-50' : ''}`}>
            <div className={`w-14 h-14 ${(item.type === 'curse' || item.isCurse) ? 'token-card-curse' : (item.type === 'skill' ? 'token-card-skill' : 'token-card-passive')} flex-shrink-0 relative`}>
                <div className="absolute inset-0 overflow-hidden">
                    {/* 属性バー */}
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-1.5 z-30" 
                        style={getAttributeBarStyles(item.attributes)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`material-icons-round ${styles.iconColor} text-2xl drop-shadow-md relative z-35 token-icon-wrap`}>
                            {getTokenIcon(item)}
                        </span>
                    </div>
                </div>
                {/* レベルタグ（中央下に配置、初期レベルは1） */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 token-level-tag-center">
                    Lv.1
                </div>
            </div>
            <div className="ml-3 flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-white text-sm md:text-base truncate">{item.name}</h3>
                    <div className="flex text-gold text-[8px] md:text-[10px]">
                        {Array.from({ length: item.rarity || 1 }).map((_, i) => (
                            <span key={i} className="material-icons-round text-[10px] md:text-[12px]">star</span>
                        ))}
                    </div>
                    {item.isSale && (
                        <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded-full font-bold">SALE</span>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-tight">{item.desc}</p>
            </div>
            <button
                onClick={handleBuyClick}
                disabled={!isAffordable}
                style={{ touchAction: 'manipulation' }}
                className={`px-3 py-1.5 flex flex-col items-center justify-center min-w-[72px] ${isAffordable ? 'btn-game-primary' : 'btn-game-cyber'}`}
            >
                <span className="text-xs font-bold flex items-center gap-0.5">
                    {item.price} <span className="material-icons-round text-[9px]">star</span>
                </span>
                <span className="text-[9px] uppercase font-bold opacity-80">{isAffordable ? 'Buy' : 'Locked'}</span>
            </button>
        </div>
    );
};

// 覚醒ショップのカードを描画するコンポーネント
const AwakeningCard = ({ icon, title, desc, price, stars, onBuy: onCardBuy, disabled, disabledReason, badgeText, color, type, isBought }) => {
    const isAffordable = stars >= price && !disabled;
    const colorMap = {
        green: {
            cardBg: 'from-emerald-900/30 to-teal-900/30',
            border: disabled ? 'border-slate-800' : 'border-emerald-500/40',
            iconBg: 'from-emerald-600/20 to-teal-900/20',
            iconBorder: 'border-emerald-500/30',
            iconColor: 'text-emerald-300',
        },
        amber: {
            cardBg: 'from-amber-900/30 to-orange-900/30',
            border: disabled ? 'border-slate-800' : 'border-amber-500/40',
            iconBg: 'from-amber-600/20 to-orange-900/20',
            iconBorder: 'border-amber-500/30',
            iconColor: 'text-amber-300',
        },
        indigo: {
            cardBg: 'from-indigo-900/30 to-blue-900/30',
            border: disabled ? 'border-slate-800' : 'border-indigo-500/40',
            iconBg: 'from-indigo-600/20 to-blue-900/20',
            iconBorder: 'border-indigo-500/30',
            iconColor: 'text-indigo-300',
        },
    };
    const c = colorMap[color] || colorMap.green;
    const handleBuyClick = (e) => {
        if (!isAffordable) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onCardBuy(type, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };
    return (
        <div className={`game-panel-cyber rounded-2xl bg-gradient-to-br ${c.cardBg} border ${c.border} overflow-hidden transition-all ${disabled ? 'opacity-50' : ''} ${isBought ? 'animate-purchase-success z-50' : ''}`}>
            <div className="px-4 pt-4 pb-3 flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.iconBg} border ${c.iconBorder} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-icons-round ${c.iconColor} text-2xl`}>{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="font-bold text-white text-base truncate">{title}</h3>
                        {badgeText && (
                            <span className="text-[9px] bg-emerald-700/40 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">{badgeText}</span>
                        )}
                        {disabled && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">購入済</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{disabledReason || desc}</p>
                </div>
            </div>
            {/* 効果説明ボックス */}
            <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-black/35 border border-white/5">
                <div className="flex items-center space-x-1.5 mb-1">
                    <span className="material-icons-round text-slate-400 text-xs">info</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">効果</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{desc}</p>
            </div>
            {/* 購入ボタン */}
            <div className="px-4 pb-4 font-game-cyber">
                <button
                    onClick={handleBuyClick}
                    disabled={!isAffordable}
                    style={{ touchAction: 'manipulation' }}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 ${isAffordable ? 'btn-game-primary' : 'btn-game-cyber'}`}
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


const ShopScreen = ({
    items, stars, onBuy, onClose, onRefresh, rerollPrice, onPause,
    isEnchantShopUnlocked, tokenSlotExpansionCount, onAwakeningBuy,
    isAwakeningLevelUpBought, freeRerolls,
}) => {
    const [activeTab, setActiveTab] = React.useState('normal');
    const [boughtItemId, setBoughtItemId] = React.useState(null);

    const handleBuy = (item, clickPos) => {
        setBoughtItemId(item.id || item.instanceId);
        onBuy(item, clickPos);
        setTimeout(() => setBoughtItemId(null), 600);
    };

    const handleAwakeningBuy = (type, clickPos) => {
        setBoughtItemId(type);
        onAwakeningBuy(type, clickPos);
        setTimeout(() => setBoughtItemId(null), 600);
    };



    const tokenSlotExpCount = tokenSlotExpansionCount || 0;
    const isTokenSlotMaxed = tokenSlotExpCount >= 5;
    const tokenSlotExpandPrice = isTokenSlotMaxed ? 0 : (AWAKENING_TOKEN_SLOT_PRICES[Math.min(tokenSlotExpCount, 4)] || 50000);
    const currentMaxSlots = INITIAL_TOKEN_SLOTS + tokenSlotExpCount;
    const nextMaxSlots = currentMaxSlots + 1;

    // アイテムをカテゴリごとに分類
    const enchantItems = items.filter(item => item.type === 'enchant_grant' || item.type === 'enchant_random');
    const normalItems = items.filter(item => item.type !== 'enchant_grant' && item.type !== 'enchant_random');
    const passiveItems = normalItems.filter(item => item.type === 'passive' || item.type === 'collector' || item.type === 'upgrade_random' || item.type === 'grant_random_curse');
    const activeItems = normalItems.filter(item => item.type === 'skill');

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

    return (
        <main
            className="w-full h-full flex flex-col relative bg-background-dark shadow-2xl overflow-hidden animate-fade-in font-game-cyber"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Cyber Grid Background */}
            <div className="cyber-grid-bg"></div>

            {/* Background effects overlay */}
            <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>

            {/* ヘッダー */}
            <header className="flex-none px-6 py-4 z-20 relative bg-surface-dark/80 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onClose} style={{ touchAction: 'manipulation' }} className="p-1 rounded-xl btn-game-cyber w-9 h-9 flex items-center justify-center text-slate-400">
                        <span className="material-icons-round text-lg">arrow_back</span>
                    </button>
                    <h1 className="text-sm font-game-header tracking-widest text-indigo-300">Merchant's Wares</h1>
                    <div className="flex items-center space-x-1 text-white">
                        <button onClick={onPause} style={{ touchAction: 'manipulation' }} className="p-1 mr-1 rounded-xl btn-game-cyber w-9 h-9 flex items-center justify-center text-slate-400">
                            <span className="material-icons-round text-lg">pause</span>
                        </button>
                        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-yellow-500/30 px-3 py-1.5 rounded-full relative shadow-inner text-yellow-400 font-bold text-sm">
                            <span className="material-icons-round text-gold text-base animate-pulse">star</span>
                            <span>{formatJapaneseNumber(stars)}</span>
                        </div>
                    </div>
                </div>

                {/* タブUI */}
                <div className="flex space-x-1 p-1 bg-black/35 rounded-xl border border-white/5">
                    <button
                        onClick={() => {
                            setActiveTab('normal');
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        style={{ touchAction: 'manipulation' }}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${activeTab === 'normal' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <span className="material-icons-round text-sm">shopping_bag</span>
                        <span>ノーマル</span>
                    </button>
                    <button
                        onClick={() => {
                            if (isEnchantShopUnlocked) {
                                setActiveTab('enchant');
                                soundManager.playSE(SE_IDS.UI_CLICK);
                            }
                        }}
                        style={{ touchAction: 'manipulation' }}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 relative ${!isEnchantShopUnlocked
                            ? 'text-slate-600 cursor-not-allowed bg-black/10'
                            : activeTab === 'enchant'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-[1.02]'
                                : 'text-slate-400 hover:text-slate-200'
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
                        onClick={() => {
                            setActiveTab('awakening');
                            soundManager.playSE(SE_IDS.UI_CLICK);
                        }}
                        style={{ touchAction: 'manipulation' }}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${activeTab === 'awakening' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 scale-[1.02]' : 'text-slate-400 hover:text-slate-200'}`}
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
                                    {passiveItems.map((item, idx) => <NormalItemCard key={idx} item={item} stars={stars} onBuy={handleBuy} isBought={boughtItemId === (item.id || item.instanceId)} />)}
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
                                    {activeItems.map((item, idx) => <NormalItemCard key={idx} item={item} stars={stars} onBuy={handleBuy} isBought={boughtItemId === (item.id || item.instanceId)} />)}
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
                                        <div key={idx} className={`rounded-2xl bg-gradient-to-br ${style.cardBg} border ${style.border} shadow-lg ${style.glow} overflow-hidden`}>
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
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        handleBuy(item, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                                                    }}
                                                    disabled={!isAffordable}
                                                    style={{ touchAction: 'manipulation' }}
                                                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-transform ${isAffordable ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50' : 'bg-surface-dark border border-white/10 text-slate-500 cursor-not-allowed'}`}
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
                                スターを消費して現在のプレイを強力にサポートする強化を解放します。覚醒効果はこのプレイ中ずっと有効です。
                            </p>
                        </div>

                        {/* 1. ランダムなトークンをレベルアップ */}
                                <AwakeningCard
                                    icon="trending_up"
                                    title="ランダムレベルアップ"
                                    desc="所持しているトークンの中からランダムに1つを選び、レベルアップさせます（最大Lv3）。"
                                    price={5}
                                    stars={stars}
                                    onBuy={handleAwakeningBuy}
                                    disabled={isAwakeningLevelUpBought}
                                    disabledReason={isAwakeningLevelUpBought ? "このラインナップでは購入済みです" : null}
                                    color="green"
                                    badgeText="毎回購入可"
                                    type="random_levelup"
                                    isBought={boughtItemId === 'random_levelup'}
                                />
        
                                {/* 2. エンチャントショップの解放 */}
                                <AwakeningCard
                                    icon="auto_fix_high"
                                    title="エンチャントショップ解放"
                                    desc="「エンチャント」タブを解放し、エンチャントを購入してトークンに付与できるようになります。一度購入すれば現在のプレイ中はずっと有効です。"
                                    price={10}
                                    stars={stars}
                                    onBuy={handleAwakeningBuy}
                                    disabled={isEnchantShopUnlocked}
                                    color="indigo"
                                    badgeText="1回限り"
                                    type="unlock_enchant_shop"
                                    isBought={boughtItemId === 'unlock_enchant_shop'}
                                />
        
                                {/* 3. トークン所持枠の解放 */}
                                <AwakeningCard
                                    icon="add_box"
                                    title="トークン所持枠の拡張"
                                    desc={isTokenSlotMaxed ? `トークンの最大所持枠はこれ以上拡張できません。` : `トークンの最大所持枠を ${currentMaxSlots} → ${nextMaxSlots} に拡張します。購入するごとに価格が大幅に上昇します。`}
                                    price={tokenSlotExpandPrice}
                                    stars={stars}
                                    onBuy={handleAwakeningBuy}
                                    disabled={isTokenSlotMaxed}
                                    disabledReason={isTokenSlotMaxed ? `最大拡張済み (上限${INITIAL_TOKEN_SLOTS + 5}枠)` : null}
                                    color="amber"
                                    badgeText={isTokenSlotMaxed ? `最大拡張済 (${INITIAL_TOKEN_SLOTS + 5}枠)` : `現在 ${currentMaxSlots} 枠`}
                                    type="expand_token_slots"
                                    isBought={boughtItemId === 'expand_token_slots'}
                                />

                    </div>
                )}
            </div>

            {/* フッター */}
            <footer className="absolute bottom-0 left-0 w-full p-6 glass-panel border-t border-white/10 z-30 font-game-cyber bg-slate-950/80 backdrop-blur-md">
                <div className="flex space-x-3 h-14">
                    <button
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            onRefresh({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                        }}
                        style={{ touchAction: 'manipulation' }}
                        className="h-full aspect-square flex flex-col items-center justify-center btn-game-cyber rounded-xl text-slate-300 relative"
                    >
                        {freeRerolls > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900 animate-bounce">
                                {freeRerolls}
                            </span>
                        )}
                        <span className="material-icons-round text-xl mb-0.5 transition-transform duration-500">sync</span>
                        <div className="flex flex-col items-center leading-none">
                            <span className="flex items-center bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5">
                                {freeRerolls > 0 ? (
                                    <span className="text-[8px] font-bold text-green-400">FREE</span>
                                ) : (
                                    <>
                                        <span className="text-[9px] font-mono font-bold text-yellow-400">{formatJapaneseNumber(rerollPrice)}</span>
                                        <span className="material-icons-round text-gold text-[8px] ml-0.5">star</span>
                                    </>
                                )}
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={onClose}
                        style={{ touchAction: 'manipulation' }}
                        className="h-full flex-1 btn-game-primary flex items-center justify-center space-x-2 text-white relative overflow-hidden"
                    >
                        <span className="text-base font-bold tracking-wide relative z-10">Return</span>
                        <span className="material-icons-round text-base">arrow_forward</span>
                    </button>
                </div>
            </footer>
        </main>
    );
};

export default ShopScreen;
