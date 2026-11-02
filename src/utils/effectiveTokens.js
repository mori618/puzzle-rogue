/**
 * 効果計算に使うトークン一覧（effectiveTokens）を作るヘルパー。
 *
 * 次の「複製・コピー」をまとめて反映する（以前は useGameState.js の4か所に同じ処理があった）:
 *   - 模倣の魔鏡（copy_left）   : パッシブ欄の左隣のトークンの効果をコピー
 *   - 合わせ鏡（copy_right）     : パッシブ欄の右隣のトークンの効果をコピー
 *   - 先導（element_lead）       : 1番目のトークンが先導なら、同じ属性のパッシブを2回発動
 *   - 殿の構え（rearguard）      : パッシブ欄の最後にあるとき、パッシブ欄の1番目のトークンをもう1回発動
 *   - 呪印（curseSeal）          : 呪印を刻まれたパッシブは curseSeal 回発動
 *   - 二つ名「苦行者」           : 抽選で選ばれたパッシブを2回発動
 *   - 試練（trial_stage_active / trial_success）
 */

const isCopyEffect = (t) => !!t && (t.effect === 'copy_left' || t.effect === 'copy_right');

/** パッシブ欄（アクティブ以外）の並び順で、tokens 配列のインデックスを返す */
export const getPassiveSlotIndices = (list = []) => {
  const indices = [];
  list.forEach((t, i) => { if (t && t.type !== 'skill') indices.push(i); });
  return indices;
};

/**
 * index のトークンがコピー系なら、コピー先のトークン（tokens 側の元データ）を返す。
 * コピーできない場合は null。コピー系でなければ effectTokens[index] をそのまま返す。
 *   effectTokens: 二つ名の封印を反映した一覧（封印されたパッシブは null）
 *   tokens      : 元の所持トークン一覧（コピー元の効果はこちらから取る）
 * 隣は「パッシブ欄の並び」（画面に表示される並び。アクティブは数えない）で決める。
 * コピー系どうしはコピーできない（模倣の魔鏡と合わせ鏡が互いを参照して止まらないようにする）。
 * 「合わせ鏡・トークン・模倣の魔鏡」と並べると、真ん中のトークンが3回発動する。
 */
export const resolveCopiedToken = (effectTokens, tokens, index) => {
  const t = effectTokens[index];
  if (!t) return t;
  if (!isCopyEffect(t)) return t;
  const order = getPassiveSlotIndices(tokens);
  const pos = order.indexOf(index);
  if (pos === -1) return null;
  const srcPos = t.effect === 'copy_left' ? pos - 1 : pos + 1;
  if (srcPos < 0 || srcPos >= order.length) return null;
  const srcIdx = order[srcPos];
  const src = effectTokens[srcIdx];
  if (!src || isCopyEffect(src)) return null;
  return tokens[srcIdx] || null;
};

/** コピー系トークンを、コピー先の効果を持つトークンに置き換えた一覧 */
export const buildBaseEffectiveTokens = (effectTokens = [], tokens = []) => effectTokens.map((t, index) => {
  if (!t) return t;
  if (!isCopyEffect(t)) return t;
  const src = resolveCopiedToken(effectTokens, tokens, index);
  if (!src || isCopyEffect(src)) return t;
  const label = t.effect === 'copy_left' ? '模倣' : '合わせ鏡';
  return { ...src, instanceId: t.instanceId, name: `${label}(${src.name})` };
});

/**
 * 殿の構え: パッシブ欄の最後にあるとき、パッシブ欄の1番目のトークンのインデックスを返す（発動しないなら -1）
 */
export const getRearguardTargetIndex = (effectTokens = [], tokens = []) => {
  const order = getPassiveSlotIndices(tokens);
  if (order.length < 2) return -1;
  const lastIdx = order[order.length - 1];
  const last = effectTokens[lastIdx];
  if (!last || last.effect !== 'rearguard') return -1;
  const firstIdx = order[0];
  const first = effectTokens[firstIdx];
  if (!first || first.type === 'curse' || first.isCurse || first.effect === 'rearguard') return -1;
  return firstIdx;
};

/**
 * 効果計算に使うトークン一覧を作る。
 * @param {object} p
 * @param {Array} p.effectTokens          二つ名の封印を反映した一覧
 * @param {Array} p.tokens                元の所持トークン一覧
 * @param {Array} [p.activeBuffs]         発動中のバフ
 * @param {Set}   [p.titleDoubledPassiveIds] 二つ名「苦行者」で2回発動するパッシブの instanceId
 */
export const buildEffectiveTokens = ({ effectTokens = [], tokens = [], activeBuffs = [], titleDoubledPassiveIds = new Set() }) => {
  const isTrialActive = activeBuffs.some(b => b?.action === 'trial_stage_active');
  if (isTrialActive) return [];
  const hasTrialSuccess = activeBuffs.some(b => b?.action === 'trial_success');

  const baseEffective = buildBaseEffectiveTokens(effectTokens, tokens);

  const leadToken = effectTokens[0];
  const leadColor = (leadToken && leadToken.effect === 'element_lead') ? leadToken.params?.color : null;

  const rearguardTargetIdx = getRearguardTargetIndex(effectTokens, tokens);
  // 殿の構えのコピー先が先導なら、先導の効果（同属性パッシブの複製）がもう1回発動する
  const rearguardOnLead = rearguardTargetIdx === 0 && !!leadColor;
  const leadCopies = leadColor ? (rearguardOnLead ? 2 : 1) : 0;

  const effectiveTokens = [];
  baseEffective.forEach((t, index) => {
    if (!t) return;
    const id = t.instanceId || t.id;
    effectiveTokens.push(t);
    if (titleDoubledPassiveIds.has(id)) {
      effectiveTokens.push({ ...t, instanceId: `${id}_title_dup` });
    }
    if (leadColor && t.type === 'passive') {
      const isMatched = (t.attributes && t.attributes.includes(leadColor)) || (t.params?.color === leadColor);
      if (isMatched) {
        for (let i = 0; i < leadCopies; i++) {
          effectiveTokens.push({ ...t, instanceId: i === 0 ? `${id}_dup` : `${id}_dup${i + 1}` });
        }
      }
    }
    // 呪印: 元のトークン（コピーではない）に刻まれた回数だけ発動する
    const original = effectTokens[index];
    const sealCount = original && original.type === 'passive' ? Math.floor(original.curseSeal || 0) : 0;
    for (let i = 1; i < sealCount; i++) {
      effectiveTokens.push({ ...t, instanceId: `${id}_seal_dup${i}` });
    }
    if (index === rearguardTargetIdx && !rearguardOnLead) {
      effectiveTokens.push({ ...t, instanceId: `${id}_rear_dup` });
    }
  });

  if (hasTrialSuccess) {
    const duplicated = effectiveTokens.map(t => ({ ...t, instanceId: `${t.instanceId || t.id}_trial_dup` }));
    effectiveTokens.push(...duplicated);
  }
  return effectiveTokens;
};
