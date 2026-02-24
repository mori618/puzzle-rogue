import React from 'react';

const ShopScreen = ({ items, stars, onBuy, onClose, onRefresh, goalReached, rerollPrice, onPause }) => {
    // Separate items into categories
    const passiveItems = items.filter(item => item.type === 'passive' || item.type === 'collector');
    const activeItems = items.filter(item => item.type !== 'passive' && item.type !== 'collector');

    // Helper to determine icon for item
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

    // Helper for background gradients - matches shopcode.html style logic concept
    // In shopcode.html, they use specific color classes. We will map item types to colors.
    // Apply background and border colors based on rarity, overriding previous rules
    const getItemColors = (item) => {
        // Enchantment grants and upgrades can keep their specific colors or we can force them too. Let's keep them if they are special items, otherwise use rarity.
        if (item.type === 'enchant_grant' || item.type === 'enchant_random') {
            return { bg: 'from-purple-500/20 to-purple-900/20', border: 'border-purple-500/30', iconColor: 'text-purple-300' };
        }
        if (item.type === 'upgrade_random') {
            return { bg: 'from-green-500/20 to-green-900/20', border: 'border-green-500/30', iconColor: 'text-green-400' };
        }

        const rarity = item.rarity || 1;
        if (rarity === 3) {
            // Epic (★3) - Purple/Gold
            return { bg: 'from-fuchsia-600/20 to-purple-900/20', border: 'border-fuchsia-500/40', iconColor: 'text-fuchsia-300' };
        } else if (rarity === 2) {
            // Rare (★2) - Blue
            return { bg: 'from-blue-500/20 to-blue-900/20', border: 'border-blue-500/30', iconColor: 'text-blue-300' };
        } else {
            // Common (★1) - Slate/Gray
            return { bg: 'from-slate-500/20 to-slate-800/20', border: 'border-white/10', iconColor: 'text-slate-300' };
        }
    };

    // Swipe back to exit shop
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

        // X方向への移動量が十分大きく、Y方向のズレが少なく、短時間でのフリック判定
        if (dx > 50 && Math.abs(dy) < 50 && dt < 300) {
            onClose();
        }
        setTouchStartInfo(null);
    };

    return (
        <main
            className="w-full h-full flex flex-col relative bg-background-dark shadow-2xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header: Currency & Title */}
            <header className="flex-none px-6 py-4 z-20 relative">
                <div className="flex items-center justify-between">
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
            </header>



            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 space-y-6">

                {/* Passive Skills Section */}
                {passiveItems.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="material-icons-round text-primary text-sm">auto_fix_high</span>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Passive Artifacts</h2>
                        </div>
                        <div className="space-y-3">
                            {passiveItems.map((item, idx) => {
                                const styles = getItemColors(item);
                                const isAffordable = stars >= item.price;
                                return (
                                    <div key={idx} className="group bg-surface-dark hover:bg-white/5 border border-white/5 hover:border-primary/50 rounded-xl p-3 flex items-center transition-all duration-200">
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
                            })}
                        </div>
                    </div>
                )}

                {/* Active Skills Section */}
                {activeItems.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3 pt-2">
                            <span className="material-icons-round text-primary text-sm">flash_on</span>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Spells</h2>
                        </div>
                        <div className="space-y-3">
                            {activeItems.map((item, idx) => {
                                const styles = getItemColors(item);
                                const isAffordable = stars >= item.price;
                                return (
                                    <div key={idx} className="group bg-surface-dark hover:bg-white/5 border border-white/5 hover:border-primary/50 rounded-xl p-3 flex items-center transition-all duration-200">
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
                    {/* Close Button */}
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
