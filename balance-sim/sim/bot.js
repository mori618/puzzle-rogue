// ページ内で動くプレイボット。addInitScript で注入する。
(() => {
  // --- 仮想時計: ドラッグ1マスごとに人間の操作速度ぶん時間を進める ---
  const realNow = Date.now.bind(Date);
  let offset = 0;
  Date.now = () => realNow() + offset;
  const STEP_MS = +(localStorage.getItem('__sim_step_ms') || 200); // 1マス移動にかかる想定時間（人間の上手いプレイヤー相当）

  // --- 演出待ちの setTimeout を短縮（ロジックは変えずに待ち時間だけ縮める）---
  const SPEED = 12;
  const origSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = (fn, ms, ...a) => origSetTimeout(fn, Math.max(0, (ms || 0) / SPEED), ...a);

  // 描画負荷を下げる（アニメーション・ぼかしを無効化。ロジックには影響しない）
  const injectCss = () => {
    const st = document.createElement('style');
    st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;backdrop-filter:none!important;filter:none!important;box-shadow:none!important;text-shadow:none!important}';
    (document.head || document.documentElement).appendChild(st);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectCss); else injectCss();
  // 音は不要
  try {
    localStorage.setItem('puzzle_rogue_settings', JSON.stringify({ comboAnimationMode: 'instant', bgmVolume: 0, seVolume: 0, bgmMuted: true, seMuted: true, speedMultiplier: 10 }));
  } catch { /* noop */ }

  const COLORS = { fire: 0, water: 1, wood: 2, light: 3, dark: 4, heart: 5 };
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));

  // 所持トークンから、ボットが狙う形のボーナス重みを決める
  const shapeWeights = (tokens) => {
    const w = { len4: 0, len5: 0, cross: 0, l_shape: 0, row: 0, column: 0, square: 0 };
    (tokens || []).forEach(t => {
      if (!t || t.type === 'skill') return;
      const s = `${t.id} ${t.effect || ''} ${t.params ? JSON.stringify(t.params) : ''}`.toLowerCase();
      if (/len4|four|4match|_4_/.test(s)) w.len4 += 1;
      if (/len5|five|_5_/.test(s)) w.len5 += 1;
      if (/cross/.test(s)) w.cross += 1;
      if (/l_shape|lshape/.test(s)) w.l_shape += 1;
      if (/row/.test(s)) w.row += 1;
      if (/col(umn)?[_ ]/.test(s) || /column/.test(s)) w.column += 1;
      if (/square/.test(s)) w.square += 1;
    });
    return w;
  };

  // --- 盤面評価: 連鎖込みのコンボ数（落ちコンなし）と形ボーナス ---
  function evaluate(b, R, C, m, noErase, sw) {
    const g = b.slice();
    let combos = 0, shapeScore = 0, first = 0, wave = 0;
    const matched = new Uint8Array(R * C);
    const seen = new Uint8Array(R * C);
    const q = new Int32Array(R * C);
    for (;;) {
      matched.fill(0);
      let any = false;
      for (let r = 0; r < R; r++) for (let c = 0; c <= C - m; c++) {
        const v = g[r * C + c]; if (v < 0 || noErase[v]) continue;
        let k = 1; while (c + k < C && g[r * C + c + k] === v) k++;
        if (k >= m) { for (let j = 0; j < k; j++) matched[r * C + c + j] = 1; any = true; }
      }
      for (let c = 0; c < C; c++) for (let r = 0; r <= R - m; r++) {
        const v = g[r * C + c]; if (v < 0 || noErase[v]) continue;
        let k = 1; while (r + k < R && g[(r + k) * C + c] === v) k++;
        if (k >= m) { for (let j = 0; j < k; j++) matched[(r + j) * C + c] = 1; any = true; }
      }
      if (!any) break;
      seen.fill(0);
      for (let i = 0; i < R * C; i++) {
        if (!matched[i] || seen[i]) continue;
        const v = g[i]; let h = 0, t = 0; q[t++] = i; seen[i] = 1;
        let minR = 99, maxR = -1, minC = 99, maxC = -1, n = 0;
        while (h < t) {
          const x = q[h++]; n++;
          const r = (x / C) | 0, c = x % C;
          if (r < minR) minR = r; if (r > maxR) maxR = r; if (c < minC) minC = c; if (c > maxC) maxC = c;
          const nb = [r > 0 ? x - C : -1, r < R - 1 ? x + C : -1, c > 0 ? x - 1 : -1, c < C - 1 ? x + 1 : -1];
          for (const y of nb) if (y >= 0 && matched[y] && !seen[y] && g[y] === v) { seen[y] = 1; q[t++] = y; }
        }
        combos++;
        if (wave === 0) first++;
        const hr = maxR - minR + 1, wc = maxC - minC + 1;
        if (n === 4) shapeScore += sw.len4;
        else if (n === 5 && hr === 3 && wc === 3) shapeScore += sw.cross + sw.l_shape; // 十字/L字（大まかに）
        if (n >= 5) shapeScore += sw.len5;
        if (n === C && hr === 1) shapeScore += sw.row;
        if (n === R && wc === 1) shapeScore += sw.column;
        if (n === 9 && hr === 3 && wc === 3) shapeScore += sw.square;
        for (let j = 0; j < t; j++) g[q[j]] = -1;
      }
      // 重力（下方向）
      for (let c = 0; c < C; c++) {
        let w = R - 1;
        for (let r = R - 1; r >= 0; r--) { const v = g[r * C + c]; if (v >= 0) { g[w * C + c] = v; if (w !== r) g[r * C + c] = -1; w--; } }
        for (; w >= 0; w--) g[w * C + c] = -1;
      }
      wave++;
    }
    // 隣接ペアの数（未完成でもコンボに近い盤面を少し評価）
    let pairs = 0;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const v = b[r * C + c]; if (v < 0) continue;
      if (c + 1 < C && b[r * C + c + 1] === v) pairs++;
      if (r + 1 < R && b[(r + 1) * C + c] === v) pairs++;
    }
    return combos * 100 + shapeScore * 60 + first * 2 + pairs * 0.5;
  }

  function solve(maxSteps, beamWidth = 240) {
    const e = window.__engine;
    const R = e.rows, C = e.cols, m = e.minMatchLength || 3;
    const base = new Int8Array(R * C);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const o = e.state[r][c];
      // 虹ドロップは「その場で何色にもなる」が、評価簡略化のため固有の色(6)として扱う
      base[r * C + c] = !o ? -1 : (o.isRainbow ? 6 : (COLORS[o.type] ?? -1));
    }
    const noErase = new Uint8Array(8);
    (e.noEraseColors || []).forEach(col => { if (COLORS[col] !== undefined) noErase[COLORS[col]] = 1; });
    const sw = shapeWeights(window.__gs?.tokens);
    const oneStroke = !!e.hasOneStrokeSeal;
    let beam = [];
    for (let i = 0; i < R * C; i++) beam.push({ b: base, pos: i, prev: -1, path: [i], vis: oneStroke ? new Set([i]) : null });
    let best = { score: evaluate(base, R, C, m, noErase, sw), path: null };
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let d = 0; d < maxSteps; d++) {
      const next = [];
      for (const s of beam) {
        const r = (s.pos / C) | 0, c = s.pos % C;
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          const np = nr * C + nc;
          if (np === s.prev) continue;
          if (oneStroke && s.vis.has(np)) continue;
          const nb = s.b.slice();
          const t = nb[np]; nb[np] = nb[s.pos]; nb[s.pos] = t;
          const score = evaluate(nb, R, C, m, noErase, sw);
          const path = s.path.concat(np);
          const vis = oneStroke ? new Set(s.vis).add(np) : null;
          next.push({ b: nb, pos: np, prev: s.pos, path, score, vis });
          if (score > best.score) best = { score, path };
        }
      }
      next.sort((a, b2) => b2.score - a.score);
      // 同一盤面の重複を軽く除く
      const seenKey = new Set();
      beam = [];
      for (const s of next) {
        const key = s.pos + ':' + s.b.join('');
        if (seenKey.has(key)) continue;
        seenKey.add(key);
        beam.push(s);
        if (beam.length >= beamWidth) break;
      }
    }
    if (!best.path) {
      // どうやってもコンボが作れない場合は適当に1マス動かす
      best.path = [0, 1];
    }
    return { path: best.path.map(i => [(i / C) | 0, i % C]), score: best.score };
  }

  // 盤面で実際に成立したコンボ（グループ）数を数える（トークンの加算を含まない「素のコンボ」）
  function hookEngine() {
    const e = window.__engine;
    if (!e || e.__hooked) return;
    e.__hooked = true;
    const orig = e.findCombos.bind(e);
    e.findCombos = function () { const g = orig(); window.__pureCount = (window.__pureCount || 0) + g.length; return g; };
  }
  async function drag(path) {
    const e = window.__engine;
    hookEngine();
    window.__pureCount = 0;
    const [r0, c0] = path[0];
    const orb = e.state[r0][c0];
    if (!orb) return false;
    e.onStart({ type: 'mousedown' }, orb);
    const rect = e.container.getBoundingClientRect();
    const cell = e.orbSize + e.gap;
    for (let i = 1; i < path.length; i++) {
      if (!e.dragging) break; // 時間切れ
      const [r, c] = path[i];
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: rect.left + (c + 0.5) * cell, clientY: rect.top + (r + 0.5) * cell }));
      await raf(); await raf();
      offset += STEP_MS;
    }
    if (e.dragging) window.dispatchEvent(new MouseEvent('mouseup'));
    return true;
  }

  window.__bot = { solve, drag, shapeWeights, STEP_MS, addOffset: (ms) => { offset += ms; } };
})();
