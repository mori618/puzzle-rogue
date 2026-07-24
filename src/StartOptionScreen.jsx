import React from 'react';

const StartOptionScreen = ({ onSelect }) => {
  const options = [
    {
      id: 'safety',
      name: '安全',
      desc: 'HP回復や防御トークンを重視した、ゲームオーバーになりにくい安定ビルド。パズルゲームに慣れていない方におすすめです。',
      color: 'from-emerald-400 to-teal-500',
      glow: 'rgba(16, 185, 129, 0.2)',
      glowHover: 'rgba(16, 185, 129, 0.45)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      borderColorHover: 'rgba(52, 211, 153, 0.7)',
    },
    {
      id: 'solid',
      name: '堅実',
      desc: '攻撃と防御のバランスに優れた、柔軟な立ち回りが可能な王道ビルド。様々な状況に対応しやすい汎用的な能力を持ちます。',
      color: 'from-blue-400 to-indigo-500',
      glow: 'rgba(59, 130, 246, 0.2)',
      glowHover: 'rgba(59, 130, 246, 0.45)',
      borderColor: 'rgba(59, 130, 246, 0.25)',
      borderColorHover: 'rgba(96, 165, 250, 0.7)',
    },
    {
      id: 'challenge',
      name: '挑戦',
      desc: '初期HPは低く抑えられるものの、強力な攻撃スペルや乗算トークンを揃えた、ハイリスク・ハイリターンな超攻撃型ビルド。',
      color: 'from-amber-500 to-rose-600',
      glow: 'rgba(244, 63, 94, 0.2)',
      glowHover: 'rgba(244, 63, 94, 0.45)',
      borderColor: 'rgba(244, 63, 94, 0.25)',
      borderColorHover: 'rgba(251, 113, 133, 0.7)',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto font-sans text-slate-200">
      {/* サイバーグリッド背景 */}
      <div className="cyber-grid-bg opacity-30" />

      {/* ネオン装飾背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[35%] h-[35%] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center px-4">
        {/* サブタイトル */}
        <p className="text-violet-400 text-xs font-bold tracking-[0.4em] uppercase mb-3 animate-in slide-in-from-bottom-2 duration-500">
          SELECT YOUR INITIAL DECK
        </p>
        
        {/* メインタイトル */}
        <h2 className="text-3xl md:text-4xl font-game-header font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 mb-14 drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] animate-in slide-in-from-bottom-4 duration-700">
          始まりの力を選択
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="group relative flex flex-col justify-between p-6 bg-slate-900/80 rounded-2xl transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 shadow-2xl overflow-hidden min-h-[260px] text-left"
              style={{
                border: `1px solid ${option.borderColor}`,
                boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px ${option.glow}, 0 0 15px ${option.glow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = option.borderColorHover;
                e.currentTarget.style.boxShadow = `0 15px 35px rgba(0, 0, 0, 0.6), inset 0 0 25px ${option.glowHover}, 0 0 25px ${option.glowHover}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = option.borderColor;
                e.currentTarget.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px ${option.glow}, 0 0 15px ${option.glow}`;
              }}
            >
              {/* カード上部の属性ラベルと装飾 */}
              <div className="flex justify-between items-center w-full mb-4">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
                  DECK MODULE
                </span>
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${option.color} shadow-lg`} />
              </div>

              {/* タイトル（属性名） */}
              <div className="mb-4">
                <h3 className={`text-2xl md:text-3xl font-game-header font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-br ${option.color} group-hover:scale-105 transition-transform duration-300`}>
                  {option.name}
                </h3>
              </div>

              {/* 説明文 */}
              <div className="flex-grow">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {option.desc}
                </p>
              </div>

              {/* カード下部の選択表示 */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center w-full">
                <span className="text-[10px] font-bold tracking-[0.1em] text-slate-500 group-hover:text-slate-300 transition-colors">
                  選択して開始
                </span>
                <span className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>

              {/* 背景の光沢オーバーレイ */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartOptionScreen;
