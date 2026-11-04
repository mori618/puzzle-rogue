// フルラン・シミュレーション（ショップでの購入はランダム寄りの方針）
// 使い方: node run.cjs <並列数> <ラン数> <出力dir> [option]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAR = +process.argv[2] || 3;
const RUNS = +process.argv[3] || 3;
const OUT = process.argv[4] || 'out';
const OPTION = process.argv[5] || 'mix';
const MAX_CYCLE = 25;
const SCORE = Object.fromEntries(require(path.join(__dirname, '../results/sumA.json')).rows.map(r => [r.id, Math.max(-50, Math.min(r.median ? (r.median / 7.94 - 1) * 100 : r.gainPct, 1000))])); // 彼岸手前で打ち切り
fs.mkdirSync(OUT, { recursive: true });
const botSrc = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const snapshot = () => {
  const g = window.__gs; const e = window.__engine;
  if (!g) return null;
  return {
    showTitle: g.showTitle, isGameOver: g.isGameOver, goalReached: g.goalReached, turn: g.turn, maxTurns: g.maxTurns,
    showShop: g.showShop, pending: !!g.pendingShopItem, gamble: g.gambleState ? { picked: g.gambleState.pickedIndex, dbl: g.gambleState.doubleUpOffered, n: g.gambleState.chests?.length } : null,
    processing: !!e?.processing, dragging: !!e?.dragging, stars: g.stars, cycle: (g.currentRunStats?.currentClears || 0) + 1,
    target: g.target, cyc: g.cycleTotalCombo, warp: g.showMaxComboWarpDialog, clear: g.showGameClear,
    turnEvents: (window.__playLog?.getCurrent()?.events || []).filter(x => x.k === 'turn').length,
    timeLimit: g.getTimeLimit ? g.getTimeLimit() : 5000,
  };
};

// ショップでの購入（ページ内で実行）
const shopRoutine = async (SCORE) => {
  const val = (t) => (SCORE[t.id] ?? 0);
  const wait = (n = 3) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const G = () => window.__gs;
  const log = [];
  G().setShowShop(true); await wait(); G().openShop(); await wait(4);
  const slotsMax = () => 4 + (G().tokenSlotExpansionCount || 0);
  const isCurse = (t) => t && (t.type === 'curse' || t.isCurse);
  let rerolls = 0;
  for (let iter = 0; iter < 25; iter++) {
    const g = G();
    const tokens = (g.tokens || []).filter(Boolean);
    const nAct = tokens.filter(t => t.type === 'skill').length;
    const nPas = tokens.filter(t => t.type !== 'skill').length;
    // 枠拡張: 満杯で余裕があれば
    const expPrice = g.getTokenSlotExpandPrice ? g.getTokenSlotExpandPrice() : 1e9;
    if ((nPas >= slotsMax() || nAct >= slotsMax()) && g.stars >= expPrice + 5 && (g.tokenSlotExpansionCount || 0) < 6) {
      g.buyAwakeningItem('expand_token_slots'); log.push(['expand', expPrice]); await wait(); continue;
    }
    const cands = [];
    for (const it of (g.shopItems || [])) {
      if (!it || it.price > g.stars) continue;
      if (it.type === 'grant_random_curse' || isCurse(it)) continue;
      let w = 1;
      if (it.type === 'skill' || it.type === 'passive') {
        const owned = tokens.find(t => t.id === it.id);
        const full = it.type === 'skill' ? nAct >= slotsMax() : nPas >= slotsMax();
        if (owned) {
          if (it.noLevelUp) continue;
          const maxLv = owned.values?.length || 3;
          if ((owned.level || 1) >= maxLv) continue;
          w = Math.pow(Math.max(1, val(it) + 20), 2) * 1.2;
        } else if (full) {
          // 売却して入れ替え: 自分より低レア（または同レアで確率的に）のパッシブがあるなら
          const sellable = tokens.filter(t => (it.type === 'skill' ? t.type === 'skill' : t.type !== 'skill') && !isCurse(t) && !(t.curseSeal > 0) && !t.isLocked && val(t) + 10 < val(it));
          if (sellable.length === 0) continue;
          w = Math.pow(Math.max(1, val(it) + 20), 2) * 0.8;
        } else {
          w = Math.pow(Math.max(1, val(it) + 20), 2);
        }
      } else {
        w = 200; // 時の砂・ランダム強化など
      }
      cands.push({ it, w });
    }
    if (cands.length === 0) {
      const rp = g.effectiveRerollPrice ?? g.shopRerollPrice;
      if (rerolls < 2 && g.stars >= rp + 8 && rp <= g.stars * 0.3) { g.refreshShop(); rerolls++; log.push(['reroll', rp]); await wait(4); continue; }
      break;
    }
    let x = Math.random() * cands.reduce((s, c) => s + c.w, 0);
    let pick = cands[0];
    for (const c of cands) { x -= c.w; if (x <= 0) { pick = c; break; } }
    const it = pick.it;
    if (it.type === 'skill' || it.type === 'passive') {
      const owned = tokens.find(t => t.id === it.id);
      const full = it.type === 'skill' ? nAct >= slotsMax() : nPas >= slotsMax();
      if (!owned && full) {
        const sellable = tokens.filter(t => (it.type === 'skill' ? t.type === 'skill' : t.type !== 'skill') && !isCurse(t) && !(t.curseSeal > 0) && !t.isLocked && val(t) + 10 < val(it));
        sellable.sort((a, b) => val(a) - val(b));
        g.sellToken(sellable[0]); log.push(['sell', sellable[0].id]); await wait();
      }
    }
    G().buyItem(it); await wait();
    if (G().pendingShopItem) { G().handleChoice('upgrade'); await wait(); }
    log.push(['buy', it.id, it.price]);
    await wait();
  }
  G().setShowShop(false); await wait();
  return log;
};

async function playRun(browser, runIdx) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
  await ctx.addInitScript(botSrc);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:5180/');
  await page.waitForFunction(() => window.__gs, null, { timeout: 30000 });
  const option = OPTION === 'mix' ? ['safety', 'solid', 'challenge'][runIdx % 3] : OPTION;
  await page.evaluate((o) => window.__gs.handleStartOptionSelection(o), option);
  await page.waitForFunction(() => window.__engine && !window.__gs.showTitle, null, { timeout: 30000 });
  await sleep(300);
  const t0 = Date.now();
  let stuck = 0, lastSig = '', result = 'unknown', shopLogs = [], moves = 0;
  while (true) {
    if (Date.now() - t0 > 25 * 60 * 1000) { result = 'timeout'; break; }
    const s = await page.evaluate(snapshot);
    if (!s) { await sleep(200); continue; }
    const sig = JSON.stringify([s.turn, s.cycle, s.turnEvents, s.goalReached, s.isGameOver, s.processing, s.showShop, s.gamble]);
    if (sig === lastSig) stuck++; else { stuck = 0; lastSig = sig; }
    if (stuck > 150) { result = 'stuck'; break; }
    if (s.isGameOver) { result = 'gameover'; break; }
    if (s.gamble) {
      await page.evaluate((gm) => { const g = window.__gs; if (gm.picked === null) g.pickGambleChest(Math.floor(Math.random() * (gm.n || 3))); else if (gm.dbl && Math.random() < 0.5) g.startGambleDoubleUp(); else g.closeGamble(); }, s.gamble);
      await sleep(80); continue;
    }
    if (s.warp) { await page.evaluate(() => window.__gs.setShowMaxComboWarpDialog(false)); await sleep(50); continue; }
    if (s.processing || s.dragging) { await sleep(40); continue; }
    if (s.goalReached && s.turn <= s.maxTurns) { await page.evaluate(() => window.__gs.skipTurns()); await sleep(60); continue; }
    if (s.turn > s.maxTurns && s.goalReached) {
      if (s.cycle >= MAX_CYCLE) { result = 'clear25'; break; }
      const lg = await page.evaluate(shopRoutine, SCORE);
      shopLogs.push({ cycle: s.cycle, log: lg });
      await page.evaluate(() => window.__gs.startNextCycle());
      await sleep(150);
      continue;
    }
    // パズル手番: 呪いの解呪 → スキル使用 → 盤面操作
    await page.evaluate(async () => {
      const g = window.__gs;
      for (const t of (g.tokens || [])) {
        const pr = t && g.getCurseProgress ? g.getCurseProgress(t) : null;
        if (pr && pr.percent >= 100) { g.purifyCurse(t); await new Promise(r => setTimeout(r, 30)); }
      }
    });
    const usedSkills = await page.evaluate(async () => {
      const used = [];
      for (let k = 0; k < 4; k++) {
        const g = window.__gs;
        const sk = (g.tokens || []).find(t => t && t.type === 'skill' && !used.includes(t.instanceId) && (t.charge || 0) >= (t.cost || 0) && (t.cost || 0) > 0);
        if (!sk) break;
        used.push(sk.instanceId);
        g.activateSkill(sk);
        await new Promise(r => setTimeout(r, 400));
        for (let w = 0; w < 100 && window.__engine?.processing; w++) await new Promise(r => setTimeout(r, 30));
      }
      return used.length;
    });
    // スキルで盤面処理が入った場合は待つ
    await page.waitForFunction(() => !window.__engine?.processing && Date.now() >= (window.__engine?.convertAnimUntil || 0), null, { timeout: 20000 }).catch(() => {});
    const s2 = await page.evaluate(snapshot);
    if (s2.isGameOver || s2.goalReached || s2.turn !== s.turn || s2.turnEvents !== s.turnEvents) continue;
    const before = s2.turnEvents;
    await page.evaluate(async (tl) => {
      const steps = Math.max(2, Math.min(40, Math.floor((tl - 300) / window.__bot.STEP_MS)));
      const { path } = window.__bot.solve(steps);
      await window.__bot.drag(path);
    }, s2.timeLimit);
    moves++;
    await page.waitForFunction((b) => {
      const ev = (window.__playLog?.getCurrent()?.events || []).filter(x => x.k === 'turn').length;
      return (ev > b && !window.__engine?.processing) || window.__gs?.isGameOver;
    }, before, { timeout: 60000, polling: 50 }).catch(() => {});
    await sleep(30);
  }
  const final = await page.evaluate(() => {
    const g = window.__gs;
    return { cycle: (g.currentRunStats?.currentClears || 0) + 1, stars: g.stars, tokens: (g.tokens || []).filter(Boolean).map(t => ({ id: t.id, n: t.name, lv: t.level || 1, r: t.rarity, ty: t.type })), runStats: g.currentRunStats };
  });
  const log = await page.evaluate(() => window.__playLog?.getCurrent());
  const rec = { runIdx, option, result, ms: Date.now() - t0, moves, final, shopLogs, errors: errors.slice(0, 20), log };
  fs.writeFileSync(path.join(OUT, `run_${String(runIdx).padStart(4, '0')}.json`), JSON.stringify(rec));
  console.log(`run ${runIdx} ${option} -> ${result} cycle=${final.cycle} moves=${moves} ${((Date.now() - t0) / 1000).toFixed(0)}s errs=${errors.length}`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  let next = +(process.env.START || 0);
  const end = next + RUNS;
  const worker = async () => {
    while (next < end) {
      const i = next++;
      if (fs.existsSync(path.join(OUT, `run_${String(i).padStart(4, '0')}.json`))) continue;
      try { await playRun(browser, i); } catch (e) { console.log('run fail', i, e.message.slice(0, 200)); }
    }
  };
  await Promise.all(Array.from({ length: PAR }, worker));
  await browser.close();
})();
