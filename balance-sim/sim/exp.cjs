// 単体効果テスト: トークン1個だけ持った状態で T 手番プレイし、手番ごとの結果を記録する
// 使い方: node exp.cjs <並列数> <出力dir> <turns> <level> [ids(カンマ区切り) | all] [baselineRepeats]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAR = +process.argv[2] || 3;
const OUT = process.argv[3] || 'exp';
const TURNS = +process.argv[4] || 15;
const LEVEL = +process.argv[5] || 1;
const IDS = process.argv[6] || 'all';
const BASE_REP = +(process.argv[7] || 8);
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

async function job(browser, tokenId, rep) {
  const { ctx, page } = await newPage(browser);
  await page.evaluate(() => window.__gs.handleStartOptionSelection('solid'));
  await page.waitForFunction(() => window.__engine && !window.__gs.showTitle, null, { timeout: 30000 });
  await sleep(200);
  const setup = await page.evaluate(async ({ tokenId, LEVEL }) => {
    const mod = await import('/src/constants/tokens.js');
    const g = window.__gs;
    const toks = [];
    if (tokenId !== '__none__') {
      const base = mod.ALL_TOKEN_BASES.find(t => t.id === tokenId);
      if (!base) return { err: 'notfound' };
      const maxLv = base.values?.length || 3;
      const lv = Math.min(LEVEL, maxLv);
      const inst = { ...base, level: lv, instanceId: Date.now() + Math.random(), charge: base.cost || 0, startValue: 0 };
      if ((base.type === 'curse' || base.isCurse) && base.action && String(base.action).startsWith('curse_')) inst.curseUses = 0;
      toks.push(inst);
      if (base.id === 'curse_multiply') {
        const d = mod.ALL_TOKEN_BASES.find(t => t.id === 'curse_multiplied_p');
        toks.push({ ...d, instanceId: Date.now() + Math.random(), parentId: inst.instanceId, level: 1, charge: 0 });
      }
    }
    g.setTokens(toks);
    g.setStars(30);
    g.setTarget(1e15);
    return { ok: true, name: toks[0]?.name, type: toks[0]?.type, rarity: toks[0]?.rarity, price: toks[0]?.price, lv: toks[0]?.level };
  }, { tokenId, LEVEL });
  if (setup.err) { await ctx.close(); return { tokenId, err: setup.err }; }
  await sleep(150);
  const turns = [];
  let skillUses = 0;
  for (let i = 0; i < TURNS; i++) {
    // 手番を1に戻し、ゲームオーバー/ゴールにならないようにする
    await page.evaluate(() => { const g = window.__gs; if (g.turn !== 1) g.setTurn(1); if (g.isGameOver) g.setIsGameOver(false); });
    await sleep(40);
    await page.evaluate(async () => {
      const g = window.__gs;
      if (g.gambleState) { if (g.gambleState.pickedIndex === null) g.pickGambleChest(0); await new Promise(r => setTimeout(r, 30)); window.__gs.closeGamble(); }
      for (const t of (g.tokens || [])) {
        const pr = t && g.getCurseProgress ? g.getCurseProgress(t) : null;
        if (pr && pr.percent >= 100) { window.__purified = (window.__purified || 0) + 1; }
      }
    });
    const used = await page.evaluate(async () => {
      let used = 0;
      const g = window.__gs;
      const sk = (g.tokens || []).find(t => t && t.type === 'skill' && (t.charge || 0) >= (t.cost || 0) && (t.cost || 0) > 0);
      if (sk) {
        g.activateSkill(sk); used++;
        await new Promise(r => setTimeout(r, 400));
        for (let w = 0; w < 100 && window.__engine?.processing; w++) await new Promise(r => setTimeout(r, 30));
      }
      return used;
    });
    skillUses += used;
    await page.waitForFunction(() => !window.__engine?.processing && Date.now() >= (window.__engine?.convertAnimUntil || 0), null, { timeout: 20000 }).catch(() => {});
    const before = await page.evaluate(() => ({ n: (window.__playLog?.getCurrent()?.events || []).filter(x => x.k === 'turn').length, stars: window.__gs.stars, tl: window.__gs.getTimeLimit() }));
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
      return { eff: e.effCombo, raw: e.rawCombo, base: e.turnBaseCombo, pure: window.__pureCount || 0, stars: window.__gs.stars - b.stars, tl: e.timeLimitMs, mult: e.finalMult, bonus: e.bonus, b: e.bSteps, m: e.mSteps, d: e.dSteps };
    }, before);
    turns.push(t);
  }
  const trig = await page.evaluate(() => (window.__playLog?.getCurrent()?.events || []).filter(x => x.k === 'trig').length);
  const errs = page.__errors.slice(0, 5);
  await ctx.close();
  return { tokenId, rep, setup, turns, skillUses, trig, errs };
}

(async () => {
  const browser = await chromium.launch();
  // トークン一覧を取得
  const { page, ctx } = await newPage(browser);
  const all = await page.evaluate(async () => (await import('/src/constants/tokens.js')).ALL_TOKEN_BASES.map(t => ({ id: t.id, type: t.type, isCurse: !!t.isCurse })));
  await ctx.close();
  let ids = IDS === 'all' ? all.filter(t => t.id !== 'curse_multiplied_p' && t.id !== 'curse_multiplied_a').map(t => t.id) : IDS.split(',');
  const jobs = [];
  for (let r = 0; r < BASE_REP; r++) jobs.push(['__none__', r]);
  ids.forEach(id => jobs.push([id, 0]));
  let k = 0;
  const worker = async () => {
    while (k < jobs.length) {
      const [id, rep] = jobs[k++];
      const f = path.join(OUT, `${id}__${rep}.json`);
      if (fs.existsSync(f)) continue;
      try {
        const r = await job(browser, id, rep);
        fs.writeFileSync(f, JSON.stringify(r));
        const ok = (r.turns || []).filter(Boolean);
        const avg = ok.reduce((s, x) => s + (x.eff || 0), 0) / Math.max(1, ok.length);
        console.log(`[${k}/${jobs.length}] ${id} avgEff=${avg.toFixed(1)} n=${ok.length} errs=${(r.errs || []).length}`);
      } catch (e) { console.log('fail', id, e.message.slice(0, 150)); }
    }
  };
  await Promise.all(Array.from({ length: PAR }, worker));
  await browser.close();
})();
