import React, { useState, useMemo } from 'react';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { ENCHANTMENTS, getEnchantDescription } from './constants/enchantments.js';
import { getTokenIcon, getAttributeBarStyles } from './utils/tokenUtils.js';

const TokenEncyclopediaScreen = ({ onClose }) => {
    // --- State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterRarity, setFilterRarity] = useState('all');
    const [filterAttr, setFilterAttr] = useState('all');
    const [filterInitial, setFilterInitial] = useState('all'); // 追加: 初期取得フィルタ
    const [sortBy, setSortBy] = useState('rarity_desc');
    const [selectedItem, setSelectedItem] = useState(null);

    // --- データ統合と前処理 ---
    const allData = useMemo(() => {
        const tokens = ALL_TOKEN_BASES.map(t => ({
            ...t,
            category: (t.type === 'curse' || t.isCurse) ? 'curse' : t.type
        }));
        const enchants = ENCHANTMENTS.map(e => ({
            ...e,
            category: 'enchant',
            type: 'enchant',
            desc: getEnchantDescription(e.id),
            attributes: e.params?.color ? [e.params.color] : [], // エンチャントの属性
            canBeInitial: false // エンチャントは初期取得不可
        }));
        return [...tokens, ...enchants];
    }, []);

    // --- フィルタリング & 並び替え ---
    const filteredAndSortedData = useMemo(() => {
        let result = allData.filter(item => {
            // 種類フィルタ
            if (filterType !== 'all' && item.category !== filterType) return false;
            
            // レアリティフィルタ
            if (filterRarity !== 'all' && (item.rarity || 1) !== parseInt(filterRarity)) return false;
            
            // 属性フィルタ (無属性対応)
            if (filterAttr !== 'all') {
                if (filterAttr === 'none') {
                    if (item.attributes && item.attributes.length > 0) return false;
                } else {
                    if (!item.attributes || !item.attributes.includes(filterAttr)) return false;
                }
            }

            // 初期取得フィルタ
            if (filterInitial === 'yes' && !item.canBeInitial) return false;
            if (filterInitial === 'no' && item.canBeInitial) return false;

            // 検索 (名前 or 説明文)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const nameMatch = item.name && item.name.toLowerCase().includes(q);
                const descMatch = item.desc && item.desc.toLowerCase().includes(q);
                if (!nameMatch && !descMatch) return false;
            }
            return true;
        });

        // 並び替え
        result.sort((a, b) => {
            const rarityA = a.rarity || 0;
            const rarityB = b.rarity || 0;
            const priceA = a.price || 0;
            const priceB = b.price || 0;

            switch (sortBy) {
                case 'rarity_desc': return rarityB - rarityA || priceB - priceA;
                case 'rarity_asc': return rarityA - rarityB || priceA - priceB;
                case 'price_desc': return priceB - priceA;
                case 'price_asc': return priceA - priceB;
                case 'name': return (a.name || '').localeCompare(b.name || '');
                default: return 0;
            }
        });

        return result;
    }, [allData, searchQuery, filterType, filterRarity, filterAttr, filterInitial, sortBy]);

    // --- UIヘルパー ---
    const getCardStyle = (item) => {
        if (item.category === 'curse' || item.isCurse) return 'from-red-900/40 to-slate-900/40 border-red-500/50';
        if (item.category === 'enchant') return 'from-fuchsia-900/20 to-purple-900/20 border-fuchsia-500/40 border-dashed shadow-fuchsia-500/20';
        const rarity = item.rarity || 1;
        if (rarity === 3) return 'from-purple-900/40 to-slate-900/40 border-purple-500/50';
        if (rarity === 2) return 'from-blue-900/40 to-slate-900/40 border-blue-500/50';
        return 'from-slate-800/40 to-slate-900/40 border-white/10';
    };

    const getIconStyle = (item) => {
        if (item.category === 'curse' || item.isCurse) return 'text-red-400';
        if (item.category === 'enchant') return 'text-fuchsia-300';
        const rarity = item.rarity || 1;
        if (rarity === 3) return 'text-purple-300';
        if (rarity === 2) return 'text-blue-300';
        return 'text-slate-300';
    };

    const translateAttributes = (attrs) => {
        if (!attrs || attrs.length === 0) return '無属性';
        const map = { fire: '炎', water: '雨', wood: '風', light: '雷', dark: '月', heart: '癒' };
        return attrs.map(a => map[a] || a).join(', ');
    };

    return (
        <div className="fixed inset-0 z-50 bg-background-dark font-display text-slate-100 flex flex-col animate-fade-in">
            {/* --- ヘッダー --- */}
            <header className="flex-none px-6 pt-6 pb-4 bg-slate-900/80 border-b border-white/10 backdrop-blur-md z-20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="material-icons-round text-primary text-3xl">menu_book</span>
                    <h1 className="text-xl font-bold tracking-widest uppercase text-japanese">トークン図鑑</h1>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                    <span className="material-icons-round">close</span>
                </button>
            </header>

            {/* --- 検索 & フィルタパネル --- */}
            <div className="flex-none p-4 bg-slate-800/50 border-b border-white/5 z-10 space-y-3">
                {/* 検索バー */}
                <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="トークン名や効果で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                {/* フィルタドロップダウン群 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none">
                        <option value="all">すべての種類</option>
                        <option value="skill">アクティブ</option>
                        <option value="passive">パッシブ</option>
                        <option value="enchant">エンチャント</option>
                        <option value="curse">呪い</option>
                    </select>

                    <select value={filterRarity} onChange={e => setFilterRarity(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none">
                        <option value="all">すべてのレア度</option>
                        <option value="1">★1 (コモン)</option>
                        <option value="2">★2 (レア)</option>
                        <option value="3">★3 (エピック)</option>
                        <option value="0">★0 (特殊)</option>
                    </select>

                    <select value={filterAttr} onChange={e => setFilterAttr(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none">
                        <option value="all">すべての属性</option>
                        <option value="none">無属性 (空)</option>
                        <option value="fire">炎</option>
                        <option value="water">雨</option>
                        <option value="wood">風</option>
                        <option value="light">雷</option>
                        <option value="dark">月</option>
                        <option value="heart">癒(ハート)</option>
                    </select>

                    <select value={filterInitial} onChange={e => setFilterInitial(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none">
                        <option value="all">初期取得(すべて)</option>
                        <option value="yes">初期取得可能のみ</option>
                        <option value="no">初期取得不可のみ</option>
                    </select>

                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none md:col-span-1 col-span-2">
                        <option value="rarity_desc">レア度 (高→低)</option>
                        <option value="rarity_asc">レア度 (低→高)</option>
                        <option value="price_desc">価格 (高→低)</option>
                        <option value="price_asc">価格 (低→高)</option>
                        <option value="name">名前順</option>
                    </select>
                </div>
                <div className="text-xs text-slate-400 text-right">該当件数: {filteredAndSortedData.length}件</div>
            </div>

            {/* --- リストエリア --- */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredAndSortedData.map((item, idx) => (
                        <div
                            key={`${item.id}-${idx}`}
                            onClick={() => setSelectedItem(item)}
                            className={`relative bg-gradient-to-br ${getCardStyle(item)} border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}
                        >
                            {/* 属性カラーバー */}
                            {item.attributes && item.attributes.length > 0 && (
                                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-md" style={getAttributeBarStyles(item.attributes)} />
                            )}

                            <div className="flex items-start justify-between ml-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-center flex-shrink-0`}>
                                        <span className={`material-icons-round ${getIconStyle(item)} text-3xl`}>
                                            {item.category === 'enchant' ? 'auto_fix_high' : getTokenIcon(item)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base md:text-lg leading-tight">{item.name}</h3>
                                        <div className="flex items-center gap-1 mt-1 text-gold">
                                            {Array.from({ length: item.rarity || 0 }).map((_, i) => (
                                                <span key={i} className="material-icons-round text-xs">star</span>
                                            ))}
                                            {(!item.rarity || item.rarity === 0) && <span className="text-xs text-slate-500 font-bold">-</span>}
                                        </div>
                                    </div>
                                </div>
                                {item.category === 'enchant' && (
                                    <div className="absolute top-2 right-2 flex flex-col items-end">
                                        <div className="bg-fuchsia-600 shadow-sm shadow-fuchsia-900/50 text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">
                                            Enchant
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/5">
                                        <span className="text-xs font-bold">{item.price || 0}</span>
                                        <span className="material-icons-round text-[10px] text-gold">star</span>
                                    </div>
                                </div>
                            </div>

                            {/* タグリスト */}
                            <div className="flex flex-wrap gap-1.5 ml-2">
                                {item.isCurse || item.category === 'curse' ? (
                                    <span className="bg-red-900/60 border border-red-500/30 text-red-200 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                        <span className="material-icons-round text-[10px]">skull</span>呪い
                                    </span>
                                ) : null}
                                {item.category === 'skill' && (
                                    <span className="bg-blue-900/60 border border-blue-500/30 text-blue-200 text-[10px] px-2 py-0.5 rounded-md font-bold">アクティブ</span>
                                )}
                                {item.category === 'passive' && (
                                    <span className="bg-purple-900/60 border border-purple-500/30 text-purple-200 text-[10px] px-2 py-0.5 rounded-md font-bold">パッシブ</span>
                                )}
                                {item.category === 'enchant' && (
                                    <span className="bg-fuchsia-900/60 border border-fuchsia-500/30 text-fuchsia-200 text-[10px] px-2 py-0.5 rounded-md font-bold">エンチャント</span>
                                )}
                                {item.canBeInitial && (
                                    <span className="bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-[10px] px-2 py-0.5 rounded-md font-bold">初期取得可</span>
                                )}
                                <span className="bg-slate-800/80 border border-slate-600/50 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                    {translateAttributes(item.attributes)}
                                </span>
                            </div>

                            {/* 簡易説明文 */}
                            <p className="text-xs text-slate-300 ml-2 line-clamp-2 mt-1">
                                {item.desc?.replace(/{cost}/g, item.cost || 0)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- 詳細モーダル --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedItem(null)}>
                    <div 
                        className={`bg-slate-900 border ${getCardStyle(selectedItem).split(' ')} rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`h-24 bg-gradient-to-br ${getCardStyle(selectedItem).split(' ')} w-full absolute top-0 left-0 opacity-50`}></div>
                        
                        <div className="relative p-6 pt-8">
                            <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800/50 rounded-full p-1">
                                <span className="material-icons-round text-sm">close</span>
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-16 h-16 rounded-2xl bg-slate-800 border ${getCardStyle(selectedItem).split(' ')} flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden`}>
                                    {selectedItem.attributes && selectedItem.attributes.length > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={getAttributeBarStyles(selectedItem.attributes)} />
                                    )}
                                    <span className={`material-icons-round ${getIconStyle(selectedItem)} text-4xl`}>
                                        {selectedItem.category === 'enchant' ? 'auto_fix_high' : getTokenIcon(selectedItem)}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-400 font-mono">ID: {selectedItem.id}</p>
                                        {selectedItem.canBeInitial && (
                                            <span className="bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-[10px] px-2 py-0.5 rounded-md font-bold">初期取得可</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex justify-between">
                                        <span>Effect / Description</span>
                                        <span className="text-slate-400">属性: {translateAttributes(selectedItem.attributes)}</span>
                                    </h4>
                                    <p className="text-sm leading-relaxed text-slate-200">
                                        {selectedItem.desc?.replace(/{cost}/g, selectedItem.cost || 0) || '説明がありません'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                        <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Item Type</h4>
                                        <div className="flex items-center gap-1 font-bold text-white">
                                            <span className={`material-icons-round text-sm ${getIconStyle(selectedItem)}`}>
                                                {selectedItem.category === 'enchant' ? 'auto_fix_high' : (selectedItem.category === 'skill' ? 'bolt' : 'inventory_2')}
                                            </span>
                                            <span className="text-xs">
                                                {selectedItem.category === 'enchant' ? 'エンチャント' : 
                                                 (selectedItem.category === 'skill' ? 'アクティブトークン' : 
                                                 (selectedItem.category === 'curse' ? '呪い' : 'パッシブトークン'))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                        <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Base Price</h4>
                                        <div className="flex items-center gap-1 font-bold text-gold">
                                            <span>{selectedItem.price || 0}</span>
                                            <span className="material-icons-round text-sm">star</span>
                                        </div>
                                    </div>
                                    {selectedItem.cost !== undefined && (
                                        <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                            <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Initial Cost (Energy)</h4>
                                            <div className="flex items-center gap-1 font-bold text-blue-400">
                                                <span className="material-icons-round text-sm">bolt</span>
                                                <span>{selectedItem.cost} ターン</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedItem.conditionDesc && (
                                    <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20">
                                        <h4 className="text-[10px] text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <span className="material-icons-round text-[12px]">lock_open</span> 解除条件
                                        </h4>
                                        <p className="text-sm text-red-200 font-bold">{selectedItem.conditionDesc}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TokenEncyclopediaScreen;
