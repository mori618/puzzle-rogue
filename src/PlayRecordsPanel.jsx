// 実績画面「遊びトークン」タブ
// ランをまたいで残る遊びトークン（ミニゲーム・ギャンブル・うさぎ/狼など）の記録を表示する。
// ネタバレにならないよう、記録の無いもの（遊んだことのないゲーム・釣ったことのない魚・0回の項目）は隠す。
import React from 'react';
import { UiSection } from './ScreenShell';
import { formatJapaneseNumber } from './utils/numberUtils.js';
import { formatFishSize } from './utils/minigames.js';
import { buildPlayRecordSections } from './utils/playRecords.js';

const n = formatJapaneseNumber;
const RecordRow = ({ label, value, unit }) => (
  <div className="ui-row">
    <span className="text-slate-300 font-semibold">{label}</span>
    <span className="ui-row-value">
      {typeof value === 'number' ? n(value) : value}
      {unit && <span className="ui-row-unit">{unit}</span>}
    </span>
  </div>
);

const PlayRecordsPanel = ({ progress = {} }) => {
  const sections = buildPlayRecordSections(progress);
  const played = sections.filter(s => s.plays > 0);
  const hiddenCount = sections.length - played.length;

  return (
    <div className="flex flex-col gap-5" data-testid="play-records">
      <p className="text-[11px] text-slate-400 leading-relaxed">
        これまでのすべてのゲームで遊んだ遊びトークンの記録です（練習モードは含みません）。
        遊んだことのないものは記録が隠されています。
      </p>

      {played.length === 0 && (
        <div className="ui-card p-4 text-center text-sm text-slate-400" data-testid="play-records-empty">
          まだ記録がありません。遊びトークンを使ってみよう！
        </div>
      )}

      {played.map(sec => (
        <UiSection key={sec.id} title={`${sec.icon} ${sec.title}`}>
          <div className="ui-card overflow-hidden" data-testid={`play-record-${sec.id}`}>
            {sec.id !== 'star_gamble' && sec.id !== 'token_gamble' && sec.id !== 'rabbit' && (
              <RecordRow label="遊んだ回数" value={sec.plays} unit="回" />
            )}
            {sec.rows.map(([label, value, unit]) => (
              <RecordRow key={label} label={label} value={value} unit={unit} />
            ))}
          </div>
          {sec.fish && sec.fish.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 mt-2" data-testid="play-record-fish-list">
              {sec.fish.map(f => (
                <div key={f.id} className="ui-card px-2.5 py-2 flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-slate-200 truncate">{f.icon} {f.name}</span>
                  <span className="flex justify-between text-[11px] text-slate-400">
                    <span>{f.count > 0 ? `${n(f.count)}匹` : '-'}</span>
                    <span className="text-amber-200 font-bold">{f.best > 0 ? `最大 ${formatFishSize(f.best)}` : ''}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </UiSection>
      ))}

      {hiddenCount > 0 && (
        <div className="ui-card p-3 flex items-center gap-2 text-[12px] text-slate-500" data-testid="play-records-hidden">
          <span className="material-icons-round text-[18px]">lock</span>
          まだ遊んでいない遊びトークンの記録が {hiddenCount} 件あります
        </div>
      )}
    </div>
  );
};

export default PlayRecordsPanel;
