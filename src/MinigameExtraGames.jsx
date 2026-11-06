// ★2 強化版ミニゲーム（大物釣り / デーモン / 交互連打 / ダブルダイス / ハイアンドロー / ランニング）
// 精密射撃は的当て（MinigameModal.jsx の TargetGame）を流用する。
// 結果が確定したら onResolve(rewards, logInfo) を1回だけ呼ぶ。
import React, { useEffect, useRef, useState } from 'react';
import ResultBox from './MinigameResultBox.jsx';
import {
  getLevelValue, describeRewards,
  FISH_TABLE, rollBigFish, formatFishSize, fishRecordKey,
  DEMON_WIN_CHARGE, DEMON_MAX_ROUNDS, judgeDemonRound, pickDemonMove, getDemonRewards,
  DUO_MASH_DURATION_MS, DUO_MASH_FAIL_THRESHOLD, DUO_MASH_ENERGY_THRESHOLD, DUO_MASH_MULT_THRESHOLD,
  DUO_MASH_LEVELUP_THRESHOLD, countDuoTap, getDuoMashRewards,
  DICE_FACES, DICE_INVERTED_FACES, rollDie, getDoubleDiceRewards,
  dealHighLow, judgeHighLow, getHighLowRewards, HIGHLOW_PENALTY,
  RUNNER, createRunnerState, runnerJump, stepRunner, runnerMeters, getRunningRewards, RUN_FAIL_METERS,
} from './utils/minigames.js';
import { loadTitleState } from './utils/titleManager.js';


const readProgress = () => {
  try {
    return loadTitleState().progress || {};
  } catch {
    return {};
  }
};

// ---------------------------------------------------------------------------
// 大物釣り（魚のサイズで効果が変わる。魚ごとの最大サイズを記録する）
// ---------------------------------------------------------------------------
export const BigFishingGame = ({ state, onResolve }) => {
  const sizeBonus = getLevelValue(state.values, state.level, 0);
  const [phase, setPhase] = useState('idle'); // idle → waiting → bite → caught
  const [catchInfo, setCatchInfo] = useState(null);
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState(() => readProgress());
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const cast = () => {
    if (phase !== 'idle') return;
    setPhase('waiting');
    timerRef.current = setTimeout(() => setPhase('bite'), 1000 + Math.random() * 1500);
  };

  const reel = () => {
    if (phase !== 'bite') return;
    const result = rollBigFish(sizeBonus);
    const prevBest = records[fishRecordKey(result.fish.id)] || 0;
    const isRecord = result.cm > prevBest;
    setCatchInfo({ ...result, prevBest, isRecord });
    setPhase('caught');
    onResolve(result.rewards, { fish: result.fish.id, fishSize: result.cm, sizeClass: result.sizeClass.id });
    // 記録は useGameState 側で保存する。表示用に手元も更新しておく
    if (isRecord) setRecords(r => ({ ...r, [fishRecordKey(result.fish.id)]: result.cm }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-b from-sky-900 to-blue-950 border border-white/10 flex items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-sky-300/30" />
        {phase === 'idle' && <span className="text-slate-300 text-sm">大物を狙って竿を投げよう</span>}
        {phase === 'waiting' && (
          <div className="flex flex-col items-center">
            <span className="text-3xl animate-bounce">🎣</span>
            <span className="text-xs text-sky-200 mt-2">待っています…</span>
          </div>
        )}
        {phase === 'bite' && (
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-amber-300 animate-pulse">！！</span>
            <span className="text-xs text-amber-200 mt-1">強い引き！</span>
          </div>
        )}
        {phase === 'caught' && catchInfo && (
          <div className="flex flex-col items-center">
            <span className="text-6xl" data-testid="fishing-catch">{catchInfo.fish.icon}</span>
            <span className="text-2xl font-black text-white mt-1" data-testid="fishing-size">{formatFishSize(catchInfo.cm)}</span>
            <span className="text-[11px] font-bold text-sky-200">{catchInfo.sizeClass.name}（効果×{catchInfo.sizeClass.factor}）</span>
          </div>
        )}
      </div>
      {phase === 'caught' && catchInfo ? (
        <ResultBox
          title={`${catchInfo.fish.name}が釣れた！`}
          note={catchInfo.isRecord
            ? `自己ベスト更新！${catchInfo.prevBest > 0 ? `（前回 ${formatFishSize(catchInfo.prevBest)}）` : ''}`
            : `自己ベスト ${formatFishSize(catchInfo.prevBest)}`}
          rewards={catchInfo.rewards}
        />
      ) : phase === 'bite' ? (
        <button data-testid="fishing-reel" onClick={reel} className="bg-amber-500 text-slate-900 py-3 rounded-xl font-bold active:scale-95 shadow-lg animate-pulse">
          引き上げる！
        </button>
      ) : (
        <button data-testid="fishing-cast" onClick={cast} disabled={phase !== 'idle'} className="bg-sky-600 text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg disabled:opacity-50">
          {phase === 'idle' ? '竿を投げる' : '待機中…'}
        </button>
      )}
      <button
        data-testid="fishing-records-toggle"
        onClick={() => setShowRecords(v => !v)}
        className="text-[11px] text-sky-300 font-bold underline underline-offset-2"
      >
        {showRecords ? '記録を閉じる' : '最大サイズの記録を見る'}
      </button>
      {showRecords && (
        <div className="grid grid-cols-2 gap-1 text-[11px]" data-testid="fishing-records">
          {FISH_TABLE.map(f => {
            const best = records[fishRecordKey(f.id)] || 0;
            return (
              <div key={f.id} className="flex justify-between bg-slate-900/60 rounded px-2 py-1 border border-white/5">
                <span className="text-slate-300">{best > 0 ? `${f.icon} ${f.name}` : '？？？'}</span>
                <span className="text-amber-200 font-bold">{best > 0 ? formatFishSize(best) : '-'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// デーモン（チャージ / 攻撃 / 防御）
// ---------------------------------------------------------------------------
const DEMON_MOVE_INFO = {
  charge: { label: 'チャージ', icon: '⚡' },
  attack: { label: '攻撃', icon: '⚔️' },
  guard: { label: '防御', icon: '🛡️' },
};

const ChargeBar = ({ value, color }) => (
  <div className="flex gap-1 justify-center">
    {Array.from({ length: DEMON_WIN_CHARGE }, (_, i) => (
      <div key={i} className={`w-3 h-3 rounded-full ${i < value ? color : 'bg-slate-700'}`} />
    ))}
  </div>
);

export const DemonGame = ({ state, onResolve }) => {
  const winMult = getLevelValue(state.values, state.level, 3);
  const [pc, setPc] = useState(0);
  const [dc, setDc] = useState(0);
  const [round, setRound] = useState(0);
  const [last, setLast] = useState(null); // { player, demon, text }
  const [result, setResult] = useState(null); // { winner, rewards }

  const play = (move) => {
    if (result) return;
    if (move === 'attack' && pc <= 0) return;
    const demonMove = pickDemonMove(dc, pc);
    const r = judgeDemonRound(move, demonMove, pc, dc);
    const nextRound = round + 1;
    let text = '';
    if (move === 'attack' && demonMove === 'attack') text = '攻撃がぶつかり合った！';
    else if (move === 'attack' && demonMove === 'guard') text = 'デーモンに防がれた！';
    else if (demonMove === 'attack' && move === 'guard') text = 'デーモンの攻撃を防いだ！';
    else text = '互いに様子を見ている…';
    setPc(Math.max(0, r.player));
    setDc(Math.max(0, r.demon));
    setRound(nextRound);
    let winner = r.winner;
    if (!winner && nextRound >= DEMON_MAX_ROUNDS) winner = 'draw';
    if (winner === 'player') text = r.player >= DEMON_WIN_CHARGE && move === 'charge' ? '5チャージ達成！デーモンを打ち破った！' : 'チャージ中のデーモンに攻撃が命中！';
    if (winner === 'demon') text = r.demon >= DEMON_WIN_CHARGE && demonMove === 'charge' ? 'デーモンが力を溜めきった…' : 'チャージ中に攻撃を受けた…';
    if (winner === 'draw') text = '決着がつかなかった…';
    setLast({ player: move, demon: demonMove, text });
    if (winner) {
      const rewards = getDemonRewards(winner, winMult);
      setResult({ winner, rewards });
      onResolve(rewards, { winner, rounds: nextRound, bad: winner === 'demon' });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        攻撃は1チャージ消費。チャージ中の相手に攻撃を当てるか、{DEMON_WIN_CHARGE}チャージ貯めたら勝ち
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 rounded-xl p-2 text-center border border-white/5">
          <div className="text-4xl">{last ? DEMON_MOVE_INFO[last.player].icon : '🧑'}</div>
          <div className="text-[10px] text-slate-400 mb-1">あなた</div>
          <ChargeBar value={pc} color="bg-amber-300" />
        </div>
        <div className="bg-slate-900/60 rounded-xl p-2 text-center border border-red-500/20">
          <div className="text-4xl">{last ? DEMON_MOVE_INFO[last.demon].icon : '😈'}</div>
          <div className="text-[10px] text-slate-400 mb-1">デーモン</div>
          <ChargeBar value={dc} color="bg-red-500" />
        </div>
      </div>
      <p data-testid="demon-message" className="text-center text-sm font-bold text-slate-200 min-h-[1.25rem]">
        {last ? last.text : '行動を選んでください'}
      </p>
      {result ? (
        <ResultBox
          title={result.winner === 'player' ? '勝利！' : result.winner === 'demon' ? '敗北…' : '引き分け'}
          rewards={result.rewards}
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {['charge', 'attack', 'guard'].map(m => (
            <button
              key={m}
              data-testid={`demon-${m}`}
              onClick={() => play(m)}
              disabled={m === 'attack' && pc <= 0}
              className="bg-slate-700 hover:bg-slate-600 border border-white/10 rounded-xl py-3 flex flex-col items-center active:scale-95 disabled:opacity-40"
            >
              <span className="text-2xl">{DEMON_MOVE_INFO[m].icon}</span>
              <span className="text-[10px] text-slate-200 font-bold mt-1">{DEMON_MOVE_INFO[m].label}</span>
            </button>
          ))}
        </div>
      )}
      {!result && <div className="text-[10px] text-slate-500 text-center">ラウンド {round + 1} / {DEMON_MAX_ROUNDS}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 交互連打（左右のボタンを交互に押した回数を数える）
// ---------------------------------------------------------------------------
export const DuoMashGame = ({ state, onResolve }) => {
  const perTap = getLevelValue(state.values, state.level, 0.5);
  const [phase, setPhase] = useState('ready'); // ready → countdown → playing → done
  const [count, setCount] = useState(3);
  const [taps, setTaps] = useState(0);
  const [lastSide, setLastSide] = useState(null);
  const [remaining, setRemaining] = useState(DUO_MASH_DURATION_MS);
  const [rewards, setRewards] = useState(null);
  const tapsRef = useRef(0);
  const lastSideRef = useRef(null);
  const onResolveRef = useRef(onResolve);
  useEffect(() => { onResolveRef.current = onResolve; }, [onResolve]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    const id = setTimeout(() => {
      if (count <= 0) setPhase('playing');
      else setCount(c => c - 1);
    }, count <= 0 ? 300 : 700);
    return () => clearTimeout(id);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const start = performance.now();
    const id = setInterval(() => {
      const left = Math.max(0, DUO_MASH_DURATION_MS - (performance.now() - start));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        const total = tapsRef.current;
        const r = getDuoMashRewards(total, perTap);
        setRewards(r);
        setPhase('done');
        onResolveRef.current(r, { taps: total });
      }
    }, 50);
    return () => clearInterval(id);
  }, [phase, perTap]);

  const tap = (side) => (e) => {
    e.preventDefault();
    if (phase !== 'playing') return;
    if (countDuoTap(lastSideRef.current, side)) {
      tapsRef.current += 1;
      setTaps(tapsRef.current);
    }
    lastSideRef.current = side;
    setLastSide(side);
  };

  const nextSide = lastSide === 'left' ? 'right' : lastSide === 'right' ? 'left' : null;
  const btnClass = (side) => `h-28 rounded-2xl font-black text-xl text-white border-4 shadow-lg active:scale-95 disabled:opacity-60 select-none ${side === 'left'
    ? 'bg-gradient-to-b from-sky-500 to-sky-700 border-sky-300/60'
    : 'bg-gradient-to-b from-rose-500 to-rose-700 border-rose-300/60'} ${phase === 'playing' && nextSide === side ? 'ring-4 ring-amber-300' : ''}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="text-xs text-slate-400">交互連打数</div>
          <div className="text-4xl font-black text-amber-300" data-testid="mash-count">{taps}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">残り</div>
          <div className="text-2xl font-bold text-white">{(remaining / 1000).toFixed(1)}秒</div>
        </div>
      </div>
      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400" style={{ width: `${(remaining / DUO_MASH_DURATION_MS) * 100}%` }} />
      </div>
      <p className="text-[11px] text-slate-400 text-center">
        左右を交互に押そう（同じボタンの連続は数えない）。{DUO_MASH_FAIL_THRESHOLD}回未満は代償／{DUO_MASH_ENERGY_THRESHOLD}回でエネルギー+5／{DUO_MASH_MULT_THRESHOLD}回で倍率×3／{DUO_MASH_LEVELUP_THRESHOLD}回でLvUP
      </p>
      {phase === 'done' && rewards ? (
        <ResultBox title={`${taps}回連打！`} rewards={rewards} />
      ) : phase === 'ready' ? (
        <button data-testid="mash-start" onClick={() => setPhase('countdown')} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">
          スタート
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3" style={{ touchAction: 'manipulation' }}>
          {['left', 'right'].map(side => (
            <button key={side} data-testid={`mash-${side}`} onPointerDown={tap(side)} disabled={phase !== 'playing'} className={btnClass(side)}>
              {phase === 'countdown' ? (count > 0 ? count : 'GO!') : side === 'left' ? '左' : '右'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ダブルダイス（1つずつ目が決まる。ゾロ目ボーナス・悪い目のゾロ目は反転）
// ---------------------------------------------------------------------------
const DIE_FACE_CHARS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export const DoubleDiceGame = ({ state, onResolve }) => {
  const maxRerolls = getLevelValue(state.values, state.level, 0);
  const [faces, setFaces] = useState([null, null]);
  const [rollingIdx, setRollingIdx] = useState(null);
  const [rerollsLeft, setRerollsLeft] = useState(maxRerolls);
  const [confirmed, setConfirmed] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => () => timersRef.current.forEach(id => { clearInterval(id); clearTimeout(id); }), []);

  const finalize = (a, b) => {
    setConfirmed(true);
    onResolve(getDoubleDiceRewards(a, b), { faces: [a, b] });
  };

  const animateDie = (idx, result, done) => {
    setRollingIdx(idx);
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      if (ticks >= 10) {
        clearInterval(id);
        setFaces(prev => { const n = [...prev]; n[idx] = result; return n; });
        setRollingIdx(null);
        done();
      } else {
        setFaces(prev => { const n = [...prev]; n[idx] = rollDie(); return n; });
      }
    }, 70);
    timersRef.current.push(id);
  };

  const roll = () => {
    if (rollingIdx !== null || confirmed) return;
    const isReroll = faces[1] !== null;
    const left = isReroll ? rerollsLeft - 1 : rerollsLeft;
    if (isReroll) setRerollsLeft(left);
    setFaces([null, null]);
    const a = rollDie();
    const b = rollDie();
    // 1つ目 → 少し間を置いて 2つ目
    animateDie(0, a, () => {
      const t = setTimeout(() => animateDie(1, b, () => {
        if (left <= 0) finalize(a, b);
      }), 450);
      timersRef.current.push(t);
    });
  };

  const [a, b] = faces;
  const bothDone = a !== null && b !== null && rollingIdx === null;
  const isDoubles = bothDone && a === b;
  const faceLabel = (f, other) => {
    if (f === null) return '';
    if (bothDone && f === other && DICE_INVERTED_FACES[f]) return `${DICE_INVERTED_FACES[f].label}（反転！）`;
    return DICE_FACES[f].label;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map(i => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`text-7xl leading-none text-white ${rollingIdx === i ? 'animate-spin' : ''}`}
              data-testid={`dice-face-${i}`}
              style={{ animationDuration: '0.4s' }}
            >
              {faces[i] ? DIE_FACE_CHARS[faces[i]] : '🎲'}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 font-bold min-h-[1rem]">
              {rollingIdx !== i && faces[i] ? faceLabel(faces[i], faces[1 - i]) : ''}
            </div>
          </div>
        ))}
      </div>
      {isDoubles && (
        <p className="text-center text-lg font-black text-fuchsia-300 animate-pulse" data-testid="dice-doubles">
          ゾロ目！ボーナス発動！
        </p>
      )}
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="rounded px-1 py-1 text-center border border-white/5 bg-slate-900/50 text-slate-400">
            {n}: {DICE_FACES[n].label}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 text-center -mt-2">ゾロ目でボーナス。1・2のゾロ目は効果が反転して良い効果に！</p>
      {confirmed ? (
        <ResultBox title={`${a} と ${b}！`} rewards={getDoubleDiceRewards(a, b)} />
      ) : !bothDone ? (
        <button data-testid="dice-roll" onClick={roll} disabled={rollingIdx !== null || a !== null} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg disabled:opacity-50">
          {rollingIdx !== null || a !== null ? '…' : 'サイコロを振る'}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button data-testid="dice-confirm" onClick={() => finalize(a, b)} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">
            この目で決定
          </button>
          <button data-testid="dice-reroll" onClick={roll} disabled={rerollsLeft <= 0} className="bg-slate-700 text-white py-3 rounded-xl font-bold active:scale-95 disabled:opacity-50">
            振り直す（残り{rerollsLeft}）
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ハイアンドロー（勝つ限りダブルアップ。負けると積み上げた効果を全て失う）
// ---------------------------------------------------------------------------
const Card = ({ value, open, highlight }) => (
  <div className={`w-12 h-16 rounded-lg flex items-center justify-center text-2xl font-black border-2 transition-all ${open
    ? `bg-white text-slate-900 ${highlight ? 'border-amber-400' : 'border-slate-300'}`
    : 'bg-gradient-to-b from-indigo-600 to-indigo-900 text-indigo-200 border-indigo-300/50'}`}
  >
    {open ? value : '？'}
  </div>
);

export const HighLowGame = ({ state, onResolve }) => {
  const perWin = getLevelValue(state.values, state.level, 10);
  const [hand, setHand] = useState(() => dealHighLow());
  // guess → revealDealer → revealPlayer → (win: choose / lose: done / draw: redeal)
  const [phase, setPhase] = useState('guess');
  const [wins, setWins] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [final, setFinal] = useState(null); // { title, rewards }
  const timersRef = useRef([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };

  const guess = (g) => {
    if (phase !== 'guess') return;
    const res = judgeHighLow(hand, g);
    setPhase('revealDealer');
    later(() => setPhase('revealPlayer'), 700);
    later(() => {
      setOutcome(res);
      if (res === 'win') {
        setWins(w => w + 1);
        setPhase('choose');
      } else if (res === 'draw') {
        setPhase('draw');
      } else {
        const rewards = wins > 0 ? [] : HIGHLOW_PENALTY;
        setFinal({ title: wins > 0 ? `${wins}連勝分の効果を全て失った…` : '外れ…', rewards });
        setPhase('done');
        onResolve(rewards, { wins, lost: true, bad: true });
      }
    }, 1400);
  };

  const next = () => {
    setHand(dealHighLow());
    setOutcome(null);
    setPhase('guess');
  };

  const stop = () => {
    const rewards = getHighLowRewards(wins, perWin);
    setFinal({ title: `${wins}連勝で終了！`, rewards });
    setPhase('done');
    onResolve(rewards, { wins, lost: false });
  };

  const dealerOpen = phase !== 'guess';
  const playerOpen = !['guess', 'revealDealer'].includes(phase);
  const pSum = hand.player[0] + hand.player[1];
  const dSum = hand.dealer[0] + hand.dealer[1];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-slate-400 text-center">自分の2枚の合計が、相手の合計より「ハイ」か「ロー」かを当てよう</p>
      <div className="flex flex-col gap-2 bg-emerald-950/60 rounded-xl p-3 border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 w-12">相手</span>
          <div className="flex gap-2" data-testid="highlow-dealer">
            <Card value={hand.dealer[0]} open />
            <Card value={hand.dealer[1]} open={dealerOpen} />
          </div>
          <span className="text-sm font-bold text-white w-12 text-right">{dealerOpen ? dSum : '?'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 w-12">あなた</span>
          <div className="flex gap-2" data-testid="highlow-player">
            <Card value={hand.player[0]} open />
            <Card value={hand.player[1]} open={playerOpen} highlight />
          </div>
          <span className="text-sm font-bold text-amber-300 w-12 text-right">{playerOpen ? pSum : '?'}</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-xs text-slate-400">連勝数 </span>
        <span className="text-2xl font-black text-amber-300" data-testid="highlow-wins">{wins}</span>
        {wins > 0 && phase !== 'done' && (
          <div className="text-[11px] text-emerald-300 font-bold">獲得予定: {describeRewards(getHighLowRewards(wins, perWin))}</div>
        )}
      </div>
      {phase === 'done' && final ? (
        <ResultBox title={final.title} titleClass={outcome === 'lose' ? 'text-red-400' : undefined} rewards={final.rewards} />
      ) : phase === 'guess' ? (
        <div className="grid grid-cols-2 gap-3">
          <button data-testid="highlow-high" onClick={() => guess('high')} className="bg-rose-600 text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">ハイ ▲</button>
          <button data-testid="highlow-low" onClick={() => guess('low')} className="bg-sky-600 text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">ロー ▼</button>
        </div>
      ) : phase === 'choose' ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-amber-300 font-bold text-center">当たり！ダブルアップに挑戦しますか？（負けると全て失う）</p>
          <div className="grid grid-cols-2 gap-3">
            <button data-testid="highlow-continue" onClick={next} className="bg-amber-500 text-slate-900 py-3 rounded-xl font-bold active:scale-95 shadow-lg">挑戦する</button>
            <button data-testid="highlow-stop" onClick={stop} className="bg-slate-700 text-white py-3 rounded-xl font-bold active:scale-95">やめて受け取る</button>
          </div>
        </div>
      ) : phase === 'draw' ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-200 font-bold text-center">同じ合計！引き分けなので配り直し</p>
          <button data-testid="highlow-redeal" onClick={next} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">配り直す</button>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-300 font-bold animate-pulse">オープン…</p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ランニング（タップでジャンプして障害物を避ける。走った距離で効果）
// ---------------------------------------------------------------------------
const RUN_VIEW_H = 150;
const RUN_GROUND = 24; // 地面の高さ（px）

export const RunningGame = ({ state, onResolve }) => {
  const perTen = getLevelValue(state.values, state.level, 1);
  const [phase, setPhase] = useState('ready'); // ready → playing → done
  const [view, setView] = useState(() => createRunnerState());
  const [rewards, setRewards] = useState(null);
  const stateRef = useRef(view);
  const boxRef = useRef(null);
  const onResolveRef = useRef(onResolve);
  useEffect(() => { onResolveRef.current = onResolve; }, [onResolve]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    let raf;
    let prev = null;
    const tick = (now) => {
      if (prev === null) prev = now;
      // タブ切り替えなどで間が空いても一気に進めない
      const dt = Math.min(34, now - prev);
      prev = now;
      const width = boxRef.current?.clientWidth || 300;
      const next = stepRunner(stateRef.current, dt, width);
      stateRef.current = next;
      setView(next);
      if (next.over) {
        const meters = runnerMeters(next);
        const r = getRunningRewards(meters, perTen);
        setRewards(r);
        setPhase('done');
        onResolveRef.current(r, { meters, cleared: !!next.cleared });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, perTen]);

  const jump = (e) => {
    e?.preventDefault?.();
    if (phase !== 'playing') return;
    stateRef.current = runnerJump(stateRef.current);
  };

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const meters = runnerMeters(view);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="text-xs text-slate-400">距離</div>
          <div className="text-3xl font-black text-amber-300" data-testid="running-distance">{meters}m</div>
        </div>
        <div className="text-[10px] text-slate-400 text-right leading-relaxed">
          {RUN_FAIL_METERS}m未満は代償<br />400m 倍率×2／600m 倍率×3／1000m 完走
        </div>
      </div>
      <div
        ref={boxRef}
        data-testid="running-field"
        onPointerDown={jump}
        className="relative w-full rounded-xl overflow-hidden bg-gradient-to-b from-indigo-950 to-slate-900 border border-white/10 select-none"
        style={{ height: RUN_VIEW_H, touchAction: 'manipulation' }}
      >
        <div className="absolute inset-x-0 bottom-0 bg-emerald-900/70 border-t border-emerald-400/40" style={{ height: RUN_GROUND }} />
        {view.obstacles.map((o, i) => (
          <div
            key={i}
            className="absolute bg-red-500 rounded-t border border-red-300/60"
            style={{ left: o.x, bottom: RUN_GROUND, width: RUNNER.obstacleW, height: o.h }}
          />
        ))}
        <div
          className="absolute text-2xl leading-none"
          style={{ left: RUNNER.playerX, bottom: RUN_GROUND + view.y, width: RUNNER.playerSize, height: RUNNER.playerSize, transform: 'scaleX(-1)' }}
        >
          🏃
        </div>
        {phase === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm">タップでジャンプ</div>
        )}
      </div>
      {phase === 'done' && rewards ? (
        <ResultBox title={view.cleared ? `${meters}m 完走！` : `${meters}m 走った！`} rewards={rewards} />
      ) : phase === 'ready' ? (
        <button data-testid="running-start" onClick={() => setPhase('playing')} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">
          スタート
        </button>
      ) : (
        <button data-testid="running-jump" onPointerDown={jump} className="bg-emerald-600 text-white py-4 rounded-xl font-black text-lg active:scale-95 shadow-lg select-none" style={{ touchAction: 'manipulation' }}>
          ジャンプ！
        </button>
      )}
    </div>
  );
};
