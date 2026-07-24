import React, { useState, useMemo } from 'react';
import { ALL_TOKEN_BASES } from './constants/tokens.js';
import { ENCHANTMENTS, getEnchantDescription } from './constants/enchantments.js';
import { getTokenIcon, getAttributeBarStyles, getTokenDescription } from './utils/tokenUtils.js';

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
        if (item.category === 'curse' || item.isCurse) return 'token-card-curse';
        if (item.category === 'enchant') return 'token-card-passive border-dashed';
        if (item.category === 'skill') return 'token-card-skill';
        return 'token-card-passive';
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
        <div className="fixed inset-0 z-50 bg-background-dark font-game-cyber text-slate-100 flex flex-col animate-fade-in relative">
            {/* Cyber Grid Background */}
            <div className="cyber-grid-bg"></div>

            {/* --- ヘッダー --- */}
            <header className="flex-none px-6 py-4 bg-slate-950/80 border-b border-white/10 backdrop-blur-md z-20 flex justify-between items-center relative">
                <div className="flex items-center gap-3">
                    <span className="material-icons-round text-indigo-400 text-3xl">menu_book</span>
                    <h1 className="text-lg font-game-header tracking-widest text-indigo-300 uppercase text-japanese">トークン図鑑</h1>
                </div>
                <button onClick={onClose} className="btn-game-cyber rounded-xl w-9 h-9 p-0 flex items-center justify-center text-slate-400">
                    <span className="material-icons-round text-lg">close</span>
                </button>
            </header>

            {/* --- 検索 & フィルタパネル --- */}
            <div className="flex-none p-4 bg-slate-950/45 border-b border-white/5 z-10 space-y-3 relative backdrop-blur-sm">
                {/* 検索バー */}
                <div className="relative">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="トークン名や効果で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                {/* フィルタドロップダウン群 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500">
                        <option value="all">すべての種類</option>
                        <option value="skill">アクティブ</option>
                        <option value="passive">パッシブ</option>
                        <option value="enchant">エンチャント</option>
                        <option value="curse">呪い</option>
                    </select>

                    <select value={filterRarity} onChange={e => setFilterRarity(e.target.value)} className="bg-slate-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500">
                        <option value="all">すべてのレア度</option>
                        <option value="1">★1 (コモン)</option>
                        <option value="2">★2 (レア)</option>
                        <option value="3">★3 (エピック)</option>
                        <option value="4">★4 (レジェンド)</option>
                    </select>

                    <select value={filterAttr} onChange={e => setFilterAttr(e.target.value)} className="bg-slate-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500">
                        <option value="all">すべての属性</option>
                        <option value="fire">炎 (火)</option>
                        <option value="water">雨 (水)</option>
                        <option value="wood">風 (木)</option>
                        <option value="light">雷 (光)</option>
                        <option value="dark">月 (闇)</option>
                        <option value="heart">癒 (回復)</option>
                        <option value="none">無属性</option>
                    </select>

                    <select value={filterInitial} onChange={e => setFilterInitial(e.target.value)} className="bg-slate-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500">
                        <option value="all">すべての取得形態</option>
                        <option value="yes">初期取得可能のみ</option>
                        <option value="no">初期取得不可のみ</option>
                    </select>

                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-slate-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 col-span-2 md:col-span-1">
                        <option value="rarity_desc">レア度順 (降順)</option>
                        <option value="rarity_asc">レア度順 (昇順)</option>
                        <option value="price_desc">価格順 (降順)</option>
                        <option value="price_asc">価格順 (昇順)</option>
                        <option value="name">五十音順</option>
                    </select>
                </div>
            </div>

            {/* --- リストエリア --- */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar relative z-10 bg-slate-950/10">
                {filteredAndSortedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <span className="material-icons-round text-5xl mb-2">find_in_page</span>
                        <p className="text-sm font-bold">該当するトークンが見つかりません</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredAndSortedData.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedItem(item)}
                                className={`p-4 flex flex-col justify-between cursor-pointer relative overflow-hidden h-32 ${getCardStyle(item)}`}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 z-30" style={getAttributeBarStyles(item.attributes)} />
                                <div className="flex justify-between items-start mb-1">
                                    {/* アイコン枠 */}
                                    <div className="w-10 h-10 token-icon-wrap flex items-center justify-center">
                                        <span className={`material-icons-round ${getIconStyle(item)} text-2xl`}>
                                            {item.category === 'enchant' ? 'auto_fix_high' : getTokenIcon(item)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold opacity-60 text-slate-400 tracking-tighter">
                                            {item.category === 'enchant' ? 'ENCHANT' : (item.category === 'skill' ? 'ACTIVE' : (item.category === 'curse' ? 'CURSE' : 'PASSIVE'))}
                                        </span>
                                        {item.category !== 'enchant' && item.category !== 'curse' && (
                                            <div className="flex text-gold text-[8px] mt-0.5">
                                                {Array.from({ length: item.rarity || 1 }).map((_, i) => (
                                                    <span key={i} className="material-icons-round text-[9px]">star</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-1">
                                    <h3 className="text-xs md:text-sm font-bold text-white truncate drop-shadow-sm leading-tight">
                                        {item.name}
                                    </h3>
                                    {/* 簡易説明文 */}
                                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                                        {getTokenDescription(item)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 詳細モーダル --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedItem(null)}>
                    <div 
                        className={`game-panel-cyber rounded-2xl w-full max-w-md overflow-hidden relative bg-gradient-to-br ${getCardStyle(selectedItem)}`}
                        style={{ clipPath: 'none' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`h-24 bg-gradient-to-br ${getCardStyle(selectedItem)} w-full absolute top-0 left-0 opacity-40`}></div>
                        
                        <div className="relative p-6 pt-8">
                            <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 btn-game-cyber rounded-xl w-8 h-8 p-0 flex items-center justify-center text-slate-400">
                                <span className="material-icons-round text-sm">close</span>
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-2xl token-icon-wrap flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                                    {selectedItem.attributes && selectedItem.attributes.length > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={getAttributeBarStyles(selectedItem.attributes)} />
                                    )}
                                    <span className={`material-icons-round ${getIconStyle(selectedItem)} text-4xl`}>
                                        {selectedItem.category === 'enchant' ? 'auto_fix_high' : getTokenIcon(selectedItem)}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-game-header text-white">{selectedItem.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-400 font-mono">ID: {selectedItem.id}</p>
                                        {selectedItem.canBeInitial && (
                                            <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-[9px] px-2 py-0.5 rounded-md font-bold">初期取得可</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex justify-between">
                                        <span>Effect / Description</span>
                                        <span className="text-indigo-300 font-bold">属性: {translateAttributes(selectedItem.attributes)}</span>
                                    </h4>
                                    <p className="text-sm leading-relaxed text-slate-200">
                                        {getTokenDescription(selectedItem) || '説明がありません'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                        <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Item Type</h4>
                                        <div className="flex items-center gap-1 font-bold text-white mt-0.5">
                                            <span className={`material-icons-round text-sm ${getIconStyle(selectedItem)}`}>
                                                {selectedItem.category === 'enchant' ? 'auto_fix_high' : (selectedItem.category === 'skill' ? 'bolt' : 'inventory_2')}
                                            </span>
                                            <span className="text-xs">
                                                {selectedItem.category === 'enchant' ? 'エンチャント' : 
                                                 (selectedItem.category === 'skill' ? 'アクティブ' : 
                                                 (selectedItem.category === 'curse' ? '呪い' : 'パッシブ'))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                        <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Base Price</h4>
                                        <div className="flex items-center gap-1 font-bold text-yellow-400 mt-0.5">
                                            <span>{selectedItem.price || 0}</span>
                                            <span className="material-icons-round text-xs">star</span>
                                        </div>
                                    </div>
                                    {selectedItem.cost !== undefined && (
                                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                            <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Initial Cost (Energy)</h4>
                                            <div className="flex items-center gap-1 font-bold text-blue-400 mt-0.5">
                                                <span className="material-icons-round text-sm">bolt</span>
                                                <span>{selectedItem.cost} ターン</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedItem.conditionDesc && (
                                    <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/20">
                                        <h4 className="text-[9px] text-red-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
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
