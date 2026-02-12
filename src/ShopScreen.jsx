import React from 'react';

const ShopScreen = ({ items, stars, onBuy, onClose, onRefresh }) => {
    // Separate items into passive and active/other for display categories if needed.
    // The current items structure is mixed, but we can filter based on type.
    // The design separates "Passive Artifacts" and "Active Spells".
    // Assuming 'passive' type for artifacts and 'skill'/'skyfall' etc for active.

    const passiveItems = items.filter(item => item.type === 'passive' || item.type === 'collector');
    const activeItems = items.filter(item => item.type !== 'passive' && item.type !== 'collector');

    // Helper to determine icon for item based on type or properties
    const getItemIcon = (item) => {
        if (item.type === 'skill') {
            if (item.action === 'refresh') return 'refresh';
            if (item.action === 'skyfall') return 'cloud_download';
            if (item.action === 'convert') return 'transform';
            return 'flash_on'; // default active
        }
        if (item.type === 'passive') return 'auto_fix_high';
        if (item.id === 'bargain') return 'savings';
        if (item.id === 'collector') return 'savings';
        if (item.id === 'scanner') return 'visibility';

        // Fallback based on name or generic
        return 'stars';
    };

    // Helper for background gradients/colors based on type
    const getItemStyles = (item) => {
        if (item.type === 'skill') return { bg: 'from-red-500/20 to-red-900/20', border: 'border-red-500/30', text: 'text-red-400' };
        if (item.type === 'passive') return { bg: 'from-blue-500/20 to-blue-900/20', border: 'border-blue-500/30', text: 'text-blue-400' };
        if (item.id === 'bargain' || item.id === 'collector') return { bg: 'from-yellow-500/20 to-yellow-900/20', border: 'border-yellow-500/30', text: 'text-amber-400' };
        return { bg: 'from-purple-500/20 to-purple-900/20', border: 'border-purple-500/30', text: 'text-purple-300' };
    };

    return (
        <div className="w-full max-w-md h-full flex flex-col relative bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden font-display text-slate-800 dark:text-white">
            {/* Header: Currency & Title */}
            <header className="flex-none px-6 pt-6 pb-4 z-20 glass-panel border-b border-white/5 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-background-dark to-transparent opacity-90 -z-10"></div>
                <div className="flex items-center justify-between mb-2">
                    {/* Close/Back button */}
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">arrow_back</span>
                    </button>

                    <h1 className="text-sm font-medium tracking-widest uppercase text-slate-400">Merchant's Wares</h1>

                    <button className="p-2 -mr-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <span className="material-icons-round">help_outline</span>
                    </button>
                </div>

                {/* Currency Display */}
                <div className="flex items-center justify-center space-x-2 py-2">
                    <div className="flex items-center bg-surface-dark border border-primary/30 rounded-full px-4 py-1.5 shadow-lg shadow-primary/10">
                        <span className="material-icons-round text-gold text-xl mr-2 animate-pulse">star</span>
                        <span className="text-xl font-bold text-white tracking-wide">{stars}</span>
                    </div>
                </div>
            </header>

            {/* Merchant Banner */}
            <section className="flex-none px-6 py-4 relative">
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-4 flex items-center border border-primary/20">
                    <div className="w-12 h-12 rounded-full bg-surface-dark border-2 border-primary overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                        {/* Placeholder for Merchant Avatar if image fails or acts as fallback */}
                        <span className="material-icons-round text-primary text-3xl">sentiment_satisfied</span>
                    </div>
                    <div className="ml-4">
                        <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">The Void Trader</p>
                        <p className="text-sm text-slate-300 italic">"Power comes at a price, traveler. What do you seek?"</p>
                    </div>
                </div>
            </section>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 space-y-6">

                {/* Passive/Artifacts Section */}
                {passiveItems.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="material-icons-round text-primary text-sm">auto_fix_high</span>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Passive Artifacts</h2>
                        </div>
                        <div className="space-y-3">
                            {passiveItems.map((item, idx) => {
                                const styles = getItemStyles(item);
                                return (
                                    <div key={idx} className="group bg-surface-dark hover:bg-white/5 border border-white/5 hover:border-primary/50 rounded-xl p-3 flex items-center transition-all duration-200">
                                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${styles.bg} border ${styles.border} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                                            <span className={`material-icons-round text-2xl relative z-10 ${styles.text}`}>{getItemIcon(item)}</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-bold text-white text-base">{item.name}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5 leading-tight line-clamp-2">{item.desc}</p>
                                            <div className="flex gap-1 mt-1">
                                                {item.isSale && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">SALE</span>}
                                                {item.enchantment && <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">Enchanted</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onBuy(item)}
                                            className="bg-primary hover:bg-primary-hover active:scale-95 transition-transform text-white px-3 py-2 rounded-lg flex flex-col items-center justify-center min-w-[70px]"
                                        >
                                            <span className="text-xs font-bold flex items-center">
                                                {item.price} <span className="material-icons-round text-gold text-[10px] ml-1">star</span>
                                            </span>
                                            <span className="text-[10px] uppercase font-medium opacity-80">Buy</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Active Spells/Skills Section */}
                {activeItems.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3 pt-2">
                            <span className="material-icons-round text-primary text-sm">flash_on</span>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Spells</h2>
                        </div>
                        <div className="space-y-3">
                            {activeItems.map((item, idx) => {
                                const styles = getItemStyles(item);
                                return (
                                    <div key={idx} className="group bg-surface-dark hover:bg-white/5 border border-white/5 hover:border-primary/50 rounded-xl p-3 flex items-center transition-all duration-200">
                                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${styles.bg} border ${styles.border} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                                            <span className={`material-icons-round text-2xl relative z-10 ${styles.text}`}>{getItemIcon(item)}</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-bold text-white text-base">{item.name}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5 leading-tight line-clamp-2">{item.desc}</p>
                                            <div className="flex gap-1 mt-1">
                                                {item.isSale && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">SALE</span>}
                                                {item.enchantment && <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">Enchanted</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onBuy(item)}
                                            className="bg-primary hover:bg-primary-hover active:scale-95 transition-transform text-white px-3 py-2 rounded-lg flex flex-col items-center justify-center min-w-[70px]"
                                        >
                                            <span className="text-xs font-bold flex items-center">
                                                {item.price} <span className="material-icons-round text-gold text-[10px] ml-1">star</span>
                                            </span>
                                            <span className="text-[10px] uppercase font-medium opacity-80">Buy</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <footer className="absolute bottom-0 left-0 w-full p-6 glass-panel border-t border-white/10 z-30">
                <div className="flex space-x-3 h-14">
                    {/* Refresh Button */}
                    <button
                        onClick={onRefresh}
                        className="h-full aspect-square flex flex-col items-center justify-center bg-surface-dark hover:bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95"
                    >
                        <span className="material-icons-round text-xl mb-1">refresh</span>
                        <span className="text-[10px] font-bold flex items-center">
                            50 <span className="material-icons-round text-gold text-[8px] ml-0.5">star</span>
                        </span>
                    </button>

                    {/* Next Cycle / Close Button */}
                    {/* Use different label if just closing vs next cycle */}
                    <button
                        onClick={onClose}
                        className="h-full flex-1 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-xl shadow-glow flex items-center justify-center space-x-2 text-white relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        <span className="text-lg font-bold tracking-wide">Leave Shop</span>
                        <span className="material-icons-round group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ShopScreen;
