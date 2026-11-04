// 組み合わせテスト: 指定したトークン一式（並び順・レベル・ラン中の累計値つき）で T 手番プレイし、手番ごとの結果を記録する
// 使い方: node combo.cjs <並列数> <出力dir> <手番数> <繰り返し> [ケースのキー(カンマ区切り) | all] [基準の回数]
// ケースは combo-cases.cjs に定義する。トークンの並び順はそのまま枠の順番になる（先導・殿・コピー系に影響）。
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CASES = require('./combo-cases.cjs');

const PAR = +process.argv[2] || 3;
const OUT = process.argv[3] || 'combo';
const TURNS = +process.argv[4] || 15;
const REPS = +process.argv[5] || 2;
const KEYS = process.argv[6] || 'all';
const BASE_REP = +(process.argv[7] || 4);
fs.mkdirSync(OUT, { recursive: true });
const botSrc = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
  await ctx.addInitScript(botSrc);
  const page = await ctx.newPage();
  page.__errors = [];
  page.on('pageerror', e => page.__errors.push(e.message));
  await page.goto('http://localhost:5180/');
  await page.waitForFunction(() => window.__gs, null, { timeout: 30000 });
  return { ctx, page };
}

async function job(browser, c, rep) {
  const { ctx, page } = await newPage(browser);
  await page.evaluate(() => window.__gs.handleStartOptionSelection('solid'));
  await page.waitForFunction(() => window.__engine && !window.__gs.showTitle, null, { timeout: 30000 });
  await sleep(200);
  const setup = await page.evaluate(async (c) => {
    const mod = await import('/src/constants/tokens.js');
    const g = window.__gs;
    const toks = [];
    for (const spec of c.tokens) {
      const base = mod.ALL_TOKEN_BASES.find(t => t.id === spec.id);
      if (!base) return { err: 'notfound:' + spec.id };
      const maxLv = base.values?.length || 3;
      const lv = Math.min(spec.lv || 1, Math.max(1, maxLv));
      const inst = { ...base, level: lv, instanceId: Date.now() + Math.random(), charge: base.cost || 0, startValue: 0 };
      if ((base.type === 'curse' || base.isCurse) && base.action && String(base.action).startsWith('curse_')) inst.curseUses = 0;
      toks.push(inst);
    }
    g.setTokens(toks);
    g.setStars(c.stars ?? 30);
    g.setTarget(1e15);
    if (c.runStats) g.setCurrentRunStats(prev => ({ ...prev, ...c.runStats }));
    return { ok: true, tokens: toks.map(t => ({ id: t.id, name: t.name, type: t.type, rarity: t.rarity, lv: t.level })) };
  }, c);
  if (setup.err) { await ctx.close(); return { key: c.key, err: setup.err }; }
  await sleep(150);
  const turns = [];
  for (let i = 0; i < TURNS; i++) {
    await page.evaluate((c) => {
      const g = window.__gs;
      if (g.turn !== 1) g.setTurn(1);
      if (g.isGameOver) g.setIsGameOver(false);
      // 所持スターを固定（金満の暴力など、スター残高で変わる効果の条件をそろえる）
      if (c.fixStars) g.setStars(c.stars ?? 30);
    }, c);
    await sleep(40);
    await page.evaluate(async () => {
      const g = window.__gs;
      if (g.gambleState) { if (g.gambleState.pickedIndex === null) g.pickGambleChest(0); await new Promise(r => setTimeout(r, 30)); window.__gs.closeGamble(); }
    });
    await page.evaluate(async () => {
      const g = window.__gs;
      const sk = (g.tokens || []).find(t => t && t.type === 'skill' && (t.charge || 0) >= (t.cost || 0) && (t.cost || 0) > 0);
      if (sk) {
        g.activateSkill(sk);
        await new Promise(r => setTimeout(r, 400));
        for (let w = 0; w < 100 && window.__engine?.processing; w++) await new Promise(r => setTimeout(r, 30));
      }
    });
    await page.waitForFunction(() => !window.__engine?.processing && Date.now() >= (window.__engine?.convertAnimUntil || 0), null, { timeout: 20000 }).catch(() => {});
    const before = await page.evaluate(() => ({ n: (window.__playLog?.getCurrent()?.events || []).filter(x => x.k === 'turn').length, tl: window.__gs.getTimeLimit() }));
    await page.evaluate(async (tl) => {
      const steps = Math.max(2, Math.min(40, Math.floor((tl - 300) / window.__bot.STEP_MS)));
      const { path } = window.__bot.solve(steps);
      await window.__bot.drag(path);
    }, before.tl);
    await page.waitForFunction((b) => {
      const ev = (window.__playLog?.getCurrent()?.events || []).filter(x => x.k === 'turn').length;
      return (ev > b && !window.__engine?.processing);
    }, before.n, { timeout: 60000, polling: 50 }).catch(() => {});
    await sleep(60);
    const t = await page.evaluate((b) => {
      const evs = (window.__playLog?.getCurrent()?.events || []).filter(x => x.k === 'turn');
      const e = evs[evs.length - 1];
      if (!e || evs.length <= b.n) return null;
      return { eff: e.effCombo, raw: e.rawCombo, base: e.turnBaseCombo, mult: e.finalMult, bonus: e.bonus, m: e.mSteps };
    }, before);
    turns.push(t);
  }
  const errs = page.__errors.slice(0, 5);
  await ctx.close();
  return { key: c.key, rep, setup, turns, errs };
}

(async () => {
  const browser = await chromium.launch();
  const list = KEYS === 'all' ? CASES : CASES.filter(c => KEYS.split(',').includes(c.key));
  const jobs = [];
  for (let r = 0; r < BASE_REP; r++) jobs.push([{ key: '__none__', tokens: [] }, r]);
  for (const c of list) for (let r = 0; r < REPS; r++) jobs.push([c, r]);
  let k = 0;
  const worker = async () => {
    while (k < jobs.length) {
      const [c, rep] = jobs[k++];
      const f = path.join(OUT, `${c.key}__${rep}.json`);
      if (fs.existsSync(f)) continue;
      try {
        const r = await job(browser, c, rep);
        fs.writeFileSync(f, JSON.stringify(r));
        const ok = (r.turns || []).filter(Boolean);
        const avg = ok.reduce((s, x) => s + (x.eff || 0), 0) / Math.max(1, ok.length);
        console.log(`[${k}/${jobs.length}] ${c.key} avgEff=${avg.toFixed(1)} n=${ok.length} errs=${(r.errs || []).length}${r.err ? ' ERR ' + r.err : ''}`);
      } catch (e) { console.log('fail', c.key, e.message.slice(0, 150)); }
    }
  };
  await Promise.all(Array.from({ length: PAR }, worker));
  await browser.close();
})();
