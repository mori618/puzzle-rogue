import React, { useState } from 'react';
import soundManager from './utils/SoundManager';
import { SE_IDS } from './constants/sounds';

// 初期デッキの見た目（色・紋章アイコン・難易度）
const DECKS = [
  {
    id: 'safety',
    no: '01',
    code: 'GUARD',
    name: '安全',
    tag: 'おすすめ',
    icon: 'shield',
    level: 1,
    c1: '#6ee7b7',
    c2: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 'solid',
    no: '02',
    code: 'BALANCE',
    name: '堅実',
    tag: 'バランス',
    icon: 'balance',
    level: 2,
    c1: '#93c5fd',
    c2: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.45)',
  },
  {
    id: 'challenge',
    no: '03',
    code: 'ASSAULT',
    name: '挑戦',
    tag: '上級者向け',
    icon: 'local_fire_department',
    level: 3,
    c1: '#fcd34d',
    c2: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.45)',
  },
];

// 選んだカードを光らせてから開始するまでの時間
const SELECT_DELAY_MS = 450;

const StartOptionScreen = ({ onSelect }) => {
  const [picked, setPicked] = useState(null);

  const handlePick = (id) => {
    if (picked) return;
    soundManager.playSE(SE_IDS.UI_CLICK);
    setPicked(id);
    setTimeout(() => onSelect(id), SELECT_DELAY_MS);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background-dark flex justify-center overflow-y-auto no-scrollbar font-game-cyber text-slate-200">
      <div className="cyber-grid-bg opacity-40" />
      <div className="screen-shell-glow" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md md:max-w-4xl my-auto px-4 py-[calc(24px+env(safe-area-inset-top,0px))] pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
        {/* 見出し */}
        <div className="deck-heading">
          <p className="deck-heading-sub">SELECT YOUR DECK</p>
          <h2 className="deck-heading-title">始まりの力を選択</h2>
          <div className="deck-heading-rule" aria-hidden="true"><span /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {DECKS.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handlePick(d.id)}
              aria-label={`${d.name}（${d.tag}）で始める`}
              className={`deck-card ${picked === d.id ? 'is-picked' : ''} ${picked && picked !== d.id ? 'is-dimmed' : ''}`}
              style={{ '--c1': d.c1, '--c2': d.c2, '--glow': d.glow, '--i': i }}
            >
              {/* 背景の大きな紋章・斜線・光の筋 */}
              <span className="deck-card-watermark material-icons-round" aria-hidden="true">{d.icon}</span>
              <span className="deck-card-stripes" aria-hidden="true" />
              <span className="deck-card-shine" aria-hidden="true" />

              {/* 紋章 */}
              <span className="deck-emblem" aria-hidden="true">
                <span className="deck-emblem-ring" />
                <span className="deck-emblem-core">
                  <span className="material-icons-round">{d.icon}</span>
                </span>
              </span>

              {/* 名前・難易度 */}
              <span className="deck-card-body">
                <span className="deck-card-code">DECK {d.no} · {d.code}</span>
                <span className="deck-card-name">{d.name}</span>
                <span className="deck-card-meta">
                  <span className="deck-card-tag">{d.tag}</span>
                  <span className="deck-card-level" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <span key={n} className={n <= d.level ? 'is-on' : ''} />
                    ))}
                  </span>
                </span>
              </span>

              <span className="deck-card-go material-icons-round" aria-hidden="true">arrow_forward_ios</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartOptionScreen;
