import React from 'react';

const HelpScreen = ({ onClose }) => {
    return (
        <div className="w-full h-screen bg-background-dark flex flex-col items-center justify-center p-4 animate-fade-in font-display">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md h-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">

                {/* ヘッダー */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-surface-dark shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary">menu_book</span>
                        ヘルプ・遊び方
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* スクロール可能なコンテンツエリア */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">

                    {/* 1. 基本ルール */}
                    <section>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2 border-b border-primary/30 pb-1">1. 基本ルール</h3>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-sm text-slate-300 space-y-2">
                            <p>ドロップを自由に動かし、同じ色を<strong className="text-white">3つ以上</strong>繋げて消すパズルです。</p>
                            <p>各サイクルには<strong className="text-yellow-400">「目標コンボ数 (Target Combo)」</strong>が設定されています。指定ターン以内に目標を達成するとクリアとなり、ショップへ進みます。</p>
                            <p className="text-xs text-slate-400 mt-2">※早く目標を達成し、残りのターンをスキップするとボーナスとしてスター(★)が多く貰えます。</p>
                        </div>
                    </section>

                    {/* 2. 形状ボーナス */}
                    <section>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2 border-b border-primary/30 pb-1">2. 形状ボーナス</h3>
                        <p className="text-xs text-slate-400 mb-2">特定の形でドロップを消すと、スコアにボーナスが加算されます。</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold">十</div>
                                <div className="text-sm"><strong className="text-white">十字消し:</strong> コンボ加算 +2</div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold">L</div>
                                <div className="text-sm"><strong className="text-white">L字消し:</strong> コンボ加算 +1</div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-white/5">
                                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold text-xs">5+</div>
                                <div className="text-sm"><strong className="text-white">5個以上連結:</strong> コンボ加算 +1</div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">※特定のパッシブスキルを装備することで、「正方形」や「横一列」などにも強力な倍率ボーナスが追加されます。</p>
                        </div>
                    </section>

                    {/* 3. 全消しボーナス */}
                    <section>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2 border-b border-primary/30 pb-1">3. 全消しボーナス</h3>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-sm text-slate-300 space-y-3">
                            <div>
                                <strong className="text-yellow-400">初期盤面全消し (Initial Clear)</strong>
                                <p className="text-xs mt-1">ターン開始時に存在したドロップを全て消すと、最終コンボ数が <strong className="text-white">x2倍</strong> になります。</p>
                            </div>
                            <div>
                                <strong className="text-pink-400">パーフェクトクリア (Perfect Clear)</strong>
                                <p className="text-xs mt-1">落ちコンが終わった後、盤面にドロップが1つも残っていない状態になると、最終コンボ数が <strong className="text-white">x2倍</strong> になります。</p>
                            </div>
                        </div>
                    </section>

                    {/* 4. トークン（スキル）について */}
                    <section>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2 border-b border-primary/30 pb-1">4. トークンとショップ</h3>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-sm text-slate-300 space-y-3">
                            <p>サイクルクリア後のショップで、スター(★)を使って自分を強化できます。</p>
                            <ul className="list-disc pl-4 text-xs space-y-1">
                                <li><strong className="text-white">アクティブスキル (Active):</strong> タップして使用します。ターンが経過するとチャージが溜まります。</li>
                                <li><strong className="text-white">パッシブスキル (Passive):</strong> 持っているだけで常に効果を発揮します。</li>
                                <li>同じトークンを購入するとレベルアップし、効果が上昇したりコストが下がったりします。</li>
                            </ul>
                        </div>
                    </section>
                </div>

                {/* フッター（閉じるボタン） */}
                <div className="p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-colors"
                    >
                        ゲームに戻る
                    </button>
                </div>

            </div>
        </div>
    );
};

export default HelpScreen;
