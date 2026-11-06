// ミニゲーム系スキル（じゃんけん / 釣り / 的当て / 連打 / サイコロ）の専用ダイアログ
// 結果が確定したら onResolve(rewards, logInfo) を1回だけ呼び、閉じるボタンで onClose を呼ぶ。
import React, { useEffect, useRef, useState } from 'react';
import ResultBox from './MinigameResultBox.jsx';
import {
  BigFishingGame, DemonGame, DuoMashGame, DoubleDiceGame, HighLowGame, RunningGame,
} from './MinigameExtraGames.jsx';
import {
  getLevelValue, EXTRA_MINIGAME_TITLES,
  judgeJanken, randomJankenHand, getJankenFinalRewards, JANKEN_DRAW_BONUS_COUNT,
  rollFish,
  getTargetResult, getAimPosition, getPrecisionTargetResult, getPrecisionAimPosition, TARGET_CORE_RADIUS,
  MASH_DURATION_MS, MASH_FAIL_THRESHOLD, MASH_ENERGY_THRESHOLD, MASH_MULT_THRESHOLD, getMashRewards,
  DICE_FACES, rollDie, getDiceRewards,
} from './utils/minigames.js';

const TITLES = {
  janken: 'じゃんけん',
  fishing: '釣り',
  target: '的当て',
  mash: '連打',
  dice: 'サイコロ',
  ...EXTRA_MINIGAME_TITLES,
};

// ---------------------------------------------------------------------------
// じゃんけん
// ---------------------------------------------------------------------------
const HAND_EMOJI = { rock: '✊', scissors: '✌️', paper: '✋' };
const HAND_LABEL = { rock: 'グー', scissors: 'チョキ', paper: 'パー' };

const JankenGame = ({ state, onResolve }) => {
  const perWin = getLevelValue(state.values, state.level, 3);
  const [streak, setStreak] = useState(0);
  const [last, setLast] = useState(null); // { player, cpu, outcome }
  const [rewards, setRewards] = useState(null);
  // 隠し要素: あいこ連続回数と「以心伝心」の発動回数
  const [drawStreak, setDrawStreak] = useState(0);
  const [drawBonusCount, setDrawBonusCount] = useState(0);
  const [bonusJustTriggered, setBonusJustTriggered] = useState(false);

  const play = (hand) => {
    if (rewards) return;
    const cpu = randomJankenHand();
    const outcome = judgeJanken(hand, cpu);
    setLast({ player: hand, cpu, outcome });
    setBonusJustTriggered(false);
    if (outcome === 0) {
      const nextDraw = drawStreak + 1;
      if (nextDraw >= JANKEN_DRAW_BONUS_COUNT) {
        setDrawBonusCount(c => c + 1);
        setDrawStreak(0);
        setBonusJustTriggered(true);
      } else {
        setDrawStreak(nextDraw);
      }
      return;
    }
    setDrawStreak(0);
    if (outcome === 1) {
      setStreak(s => s + 1);
    } else {
      const r = getJankenFinalRewards(streak, perWin, drawBonusCount);
      setRewards(r);
      onResolve(r, { streak, drawBonus: drawBonusCount });
    }
  };

  const outcomeText = !last ? '手を選んでください'
    : bonusJustTriggered ? '以心伝心！あいこ3連続で特殊効果発動！'
      : last.outcome === 1 ? '勝ち！続けて勝負！'
        : last.outcome === 0 ? 'あいこ！もう一度！' : '負け…';

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <div className="text-xs text-slate-400">連勝数</div>
        <div className="text-4xl font-black text-amber-300" data-testid="janken-streak">{streak}</div>
      </div>
      <div className="flex items-center justify-center gap-6 h-20">
        <div className="text-center">
          <div className="text-5xl">{last ? HAND_EMOJI[last.player] : '❔'}</div>
          <div className="text-[10px] text-slate-400 mt-1">あなた</div>
        </div>
        <div className="text-slate-500 font-bold">VS</div>
        <div className="text-center">
          <div className="text-5xl">{last ? HAND_EMOJI[last.cpu] : '❔'}</div>
          <div className="text-[10px] text-slate-400 mt-1">相手</div>
        </div>
      </div>
      <p
        data-testid="janken-message"
        className={`text-center text-sm font-bold ${bonusJustTriggered ? 'text-fuchsia-300 animate-pulse' : last?.outcome === 1 ? 'text-amber-300' : last?.outcome === -1 ? 'text-red-400' : 'text-slate-200'}`}
      >
        {outcomeText}
      </p>
      {drawBonusCount > 0 && !rewards && (
        <p className="text-center text-[11px] text-fuchsia-300 font-bold -mt-2">以心伝心 ×{drawBonusCount}（終了時に効果追加）</p>
      )}
      {rewards ? (
        <ResultBox title={streak > 0 ? `${streak}連勝！` : '1回も勝てなかった…'} rewards={rewards} />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {['rock', 'scissors', 'paper'].map(h => (
            <button
              key={h}
              data-testid={`janken-${h}`}
              onClick={() => play(h)}
              className="bg-slate-700 hover:bg-slate-600 border border-white/10 rounded-xl py-3 flex flex-col items-center active:scale-95"
            >
              <span className="text-3xl">{HAND_EMOJI[h]}</span>
              <span className="text-[10px] text-slate-300 font-bold mt-1">{HAND_LABEL[h]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 釣り
// ---------------------------------------------------------------------------
const FishingGame = ({ onResolve }) => {
  // idle → waiting → bite → caught
  const [phase, setPhase] = useState('idle');
  const [fish, setFish] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const cast = () => {
    if (phase !== 'idle') return;
    setPhase('waiting');
    timerRef.current = setTimeout(() => setPhase('bite'), 1000 + Math.random() * 1500);
  };

  const reel = () => {
    if (phase !== 'bite') return;
    const f = rollFish();
    setFish(f);
    setPhase('caught');
    onResolve(f.rewards, { fish: f.id });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-b from-sky-900 to-blue-950 border border-white/10 flex items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-sky-300/30" />
        {phase === 'idle' && <span className="text-slate-300 text-sm">竿を投げよう</span>}
        {phase === 'waiting' && (
          <div className="flex flex-col items-center">
            <span className="text-3xl animate-bounce">🎣</span>
            <span className="text-xs text-sky-200 mt-2">待っています…</span>
          </div>
        )}
        {phase === 'bite' && (
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-amber-300 animate-pulse">！</span>
            <span className="text-xs text-amber-200 mt-1">ヒット！</span>
          </div>
        )}
        {phase === 'caught' && fish && (
          <span className="text-6xl" data-testid="fishing-catch">{fish.icon}</span>
        )}
      </div>
      {phase === 'caught' && fish ? (
        <ResultBox title={`${fish.name}が釣れた！`} rewards={fish.rewards} />
      ) : phase === 'bite' ? (
        <button data-testid="fishing-reel" onClick={reel} className="bg-amber-500 text-slate-900 py-3 rounded-xl font-bold active:scale-95 shadow-lg animate-pulse">
          引き上げる！
        </button>
      ) : (
        <button data-testid="fishing-cast" onClick={cast} disabled={phase !== 'idle'} className="bg-sky-600 text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg disabled:opacity-50">
          {phase === 'idle' ? '竿を投げる' : '待機中…'}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 的当て
// ---------------------------------------------------------------------------
const TargetGame = ({ state, onResolve }) => {
  // 強化版「精密射撃」（target_pro）は、ど真ん中のさらに中心に「真芯」がある
  const isPro = state.type === 'target_pro';
  const bullseyeMult = getLevelValue(state.values, state.level, 2);
  const coreMult = getLevelValue(state.effectValues, state.level, 8);
  const aimFn = isPro ? getPrecisionAimPosition : getAimPosition;
  const [aim, setAim] = useState({ x: 0.8, y: -0.6 });
  const [shot, setShot] = useState(null); // { x, y, result }
  const aimRef = useRef(aim);
  const startRef = useRef(null);

  useEffect(() => {
    if (shot) return undefined;
    let raf;
    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const p = aimFn(now - startRef.current);
      aimRef.current = p;
      setAim(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot]);

  const fire = () => {
    if (shot) return;
    const { x, y } = aimRef.current;
    const d = Math.hypot(x, y);
    const result = isPro ? getPrecisionTargetResult(d, bullseyeMult, coreMult) : getTargetResult(d, bullseyeMult);
    setShot({ x, y, result });
    onResolve(result.rewards, { result: result.id, distance: Math.round(Math.hypot(x, y) * 100) / 100 });
  };

  const pos = shot || aim;
  // 的の半径 = コンテナの 40%（-1.1〜1.1 の照準座標がはみ出さないように）
  const toPct = (v) => 50 + v * 40;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative mx-auto w-56 h-56 rounded-xl bg-slate-900 border border-white/10 overflow-hidden select-none"
        onPointerDown={fire}
        style={{ touchAction: 'manipulation' }}
      >
        {[
          { r: 1, cls: 'bg-slate-200' },
          { r: 0.65, cls: 'bg-sky-500' },
          { r: 0.35, cls: 'bg-red-500' },
          { r: 0.12, cls: 'bg-amber-300' },
          ...(isPro ? [{ r: TARGET_CORE_RADIUS, cls: 'bg-fuchsia-500' }] : []),
        ].map(({ r, cls }) => (
          <div
            key={r}
            className={`absolute rounded-full ${cls}`}
            style={{ width: `${r * 80}%`, height: `${r * 80}%`, left: `${50 - r * 40}%`, top: `${50 - r * 40}%` }}
          />
        ))}
        <div
          className="absolute pointer-events-none"
          style={{ left: `${toPct(pos.x)}%`, top: `${toPct(pos.y)}%`, transform: 'translate(-50%, -50%)' }}
        >
          {shot ? (
            <div className="w-4 h-4 rounded-full bg-slate-950 border-2 border-white shadow" />
          ) : (
            <span className="material-icons-round text-4xl text-emerald-400 drop-shadow">add_circle_outline</span>
          )}
        </div>
      </div>
      {shot ? (
        <ResultBox title={shot.result.name} titleClass={shot.result.color} rewards={shot.result.rewards} />
      ) : (
        <button data-testid="target-fire" onClick={fire} className="bg-red-500 text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">
          撃つ！
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 連打
// ---------------------------------------------------------------------------
const MashGame = ({ state, onResolve }) => {
  const perTap = getLevelValue(state.values, state.level, 0.2);
  // ready → countdown → playing → done
  const [phase, setPhase] = useState('ready');
  const [count, setCount] = useState(3);
  const [taps, setTaps] = useState(0);
  const [remaining, setRemaining] = useState(MASH_DURATION_MS);
  const [rewards, setRewards] = useState(null);
  const tapsRef = useRef(0);
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
      const left = Math.max(0, MASH_DURATION_MS - (performance.now() - start));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        const total = tapsRef.current;
        const r = getMashRewards(total, perTap);
        setRewards(r);
        setPhase('done');
        onResolveRef.current(r, { taps: total });
      }
    }, 50);
    return () => clearInterval(id);
  }, [phase, perTap]);

  const tap = (e) => {
    e.preventDefault();
    if (phase !== 'playing') return;
    tapsRef.current += 1;
    setTaps(tapsRef.current);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="text-xs text-slate-400">連打数</div>
          <div className="text-4xl font-black text-amber-300" data-testid="mash-count">{taps}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">残り</div>
          <div className="text-2xl font-bold text-white">{(remaining / 1000).toFixed(1)}秒</div>
        </div>
      </div>
      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400" style={{ width: `${(remaining / MASH_DURATION_MS) * 100}%` }} />
      </div>
      <p className="text-[11px] text-slate-400 text-center">
        {taps < MASH_FAIL_THRESHOLD
          ? `${MASH_FAIL_THRESHOLD}回未満は代償あり！`
          : `コンボ +${Math.floor(taps * perTap + 1e-9)}`}（{MASH_ENERGY_THRESHOLD}回でエネルギー+3／{MASH_MULT_THRESHOLD}回で倍率×2）
      </p>
      {phase === 'done' && rewards ? (
        <ResultBox title={`${taps}回連打！`} rewards={rewards} />
      ) : phase === 'ready' ? (
        <button data-testid="mash-start" onClick={() => setPhase('countdown')} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">
          スタート
        </button>
      ) : (
        <button
          data-testid="mash-button"
          onPointerDown={tap}
          disabled={phase !== 'playing'}
          className="h-32 rounded-2xl font-black text-3xl text-white bg-gradient-to-b from-rose-500 to-rose-700 border-4 border-rose-300/60 shadow-lg active:scale-95 disabled:opacity-60 select-none"
          style={{ touchAction: 'manipulation' }}
        >
          {phase === 'countdown' ? (count > 0 ? count : 'GO!') : '連打！'}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// サイコロ
// ---------------------------------------------------------------------------
const DIE_FACE_CHARS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const DiceGame = ({ state, onResolve }) => {
  const maxRerolls = getLevelValue(state.values, state.level, 0);
  const [face, setFace] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [rerollsLeft, setRerollsLeft] = useState(maxRerolls);
  const [confirmed, setConfirmed] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => () => timersRef.current.forEach(clearInterval), []);

  const finalize = (f) => {
    setConfirmed(true);
    onResolve(getDiceRewards(f), { face: f });
  };

  const roll = () => {
    if (rolling || confirmed) return;
    const isReroll = face !== null;
    if (isReroll) setRerollsLeft(n => n - 1);
    setRolling(true);
    const result = rollDie();
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      if (ticks >= 10) {
        clearInterval(id);
        setFace(result);
        setRolling(false);
        // 振り直しが残っていなければ、その場で確定
        if ((isReroll ? rerollsLeft - 1 : rerollsLeft) <= 0) finalize(result);
      } else {
        setFace(rollDie());
      }
    }, 70);
    timersRef.current.push(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center">
        <div className={`text-8xl leading-none text-white ${rolling ? 'animate-spin' : ''}`} data-testid="dice-face" style={{ animationDuration: '0.4s' }}>
          {face ? DIE_FACE_CHARS[face] : '🎲'}
        </div>
        {!rolling && face && <div className="text-sm text-slate-300 mt-2 font-bold">{face}の目</div>}
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className={`rounded px-1 py-1 text-center border ${!rolling && face === n ? 'border-amber-300 bg-amber-500/20 text-amber-200' : 'border-white/5 bg-slate-900/50 text-slate-400'}`}>
            {n}: {DICE_FACES[n].label}
          </div>
        ))}
      </div>
      {confirmed ? (
        <ResultBox title={`${face}の目！`} rewards={getDiceRewards(face)} />
      ) : face === null ? (
        <button data-testid="dice-roll" onClick={roll} disabled={rolling} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg disabled:opacity-50">
          {rolling ? '…' : 'サイコロを振る'}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button data-testid="dice-confirm" onClick={() => finalize(face)} disabled={rolling} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg disabled:opacity-50">
            この目で決定
          </button>
          <button data-testid="dice-reroll" onClick={roll} disabled={rolling || rerollsLeft <= 0} className="bg-slate-700 text-white py-3 rounded-xl font-bold active:scale-95 disabled:opacity-50">
            振り直す（残り{rerollsLeft}）
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const GAMES = {
  janken: JankenGame,
  fishing: FishingGame,
  target: TargetGame,
  mash: MashGame,
  dice: DiceGame,
  target_pro: TargetGame,
  fishing_big: BigFishingGame,
  demon: DemonGame,
  mash_duo: DuoMashGame,
  dice_duo: DoubleDiceGame,
  highlow: HighLowGame,
  running: RunningGame,
};

const MinigameModal = ({ state, onResolve, onClose }) => {
  if (!state) return null;
  const Game = GAMES[state.type];
  if (!Game) return null;
  return (
    <div className="fixed inset-0 z-[320] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl" data-testid={`minigame-${state.type}`}>
        <h3 className="text-xl font-bold font-display text-white mb-4 text-center italic">
          {state.tokenName || TITLES[state.type]}
        </h3>
        <Game state={state} onResolve={onResolve} />
        {state.resolved && (
          <button data-testid="minigame-close" onClick={onClose} className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg">
            閉じる
          </button>
        )}
      </div>
    </div>
  );
};

export default MinigameModal;
