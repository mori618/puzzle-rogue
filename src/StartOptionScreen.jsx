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

  // 各デッキの見た目（アイコン・アクセント色）
  const looks = {
    safety: { icon: 'shield', tag: 'おすすめ', accent: '#34d399', tint: 'rgba(16, 185, 129, 0.14)' },
    solid: { icon: 'balance', tag: 'バランス', accent: '#60a5fa', tint: 'rgba(59, 130, 246, 0.14)' },
    challenge: { icon: 'local_fire_department', tag: '上級者向け', accent: '#fb7185', tint: 'rgba(244, 63, 94, 0.14)' },
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background-dark flex justify-center overflow-y-auto no-scrollbar font-game-cyber text-slate-200">
      <div className="cyber-grid-bg opacity-40" />
      <div className="screen-shell-glow" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md md:max-w-4xl my-auto px-4 py-[calc(24px+env(safe-area-inset-top,0px))] pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
        <div className="text-center mb-6">
          <p className="text-violet-300/80 text-[11px] font-bold tracking-[0.35em] uppercase mb-2">
            Select your deck
          </p>
          <h2 className="text-3xl font-game-header tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
            始まりの力を選択
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {options.map((option) => {
            const look = looks[option.id];
            return (
              <button
                key={option.id}
                onClick={() => onSelect(option.id)}
                className="group relative flex flex-col gap-2 p-4 rounded-2xl text-left overflow-hidden bg-slate-950/70 border transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  borderColor: option.borderColor,
                  boxShadow: `0 8px 24px rgba(0, 0, 0, 0.45), inset 0 0 24px ${option.glow}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = option.borderColorHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = option.borderColor; }}
              >
                {/* 左端のアクセント */}
                <span className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${option.color}`} aria-hidden="true" />

                <div className="flex items-center gap-3">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: look.tint, color: look.accent }}
                  >
                    <span className="material-icons-round text-[24px]">{look.icon}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-2xl font-game-header tracking-wide leading-none text-transparent bg-clip-text bg-gradient-to-br ${option.color}`}>
                      {option.name}
                    </h3>
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: look.accent }}>
                      {look.tag}
                    </span>
                  </div>
                  <span className="material-icons-round text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                    chevron_right
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {option.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StartOptionScreen;
