// ランごとのショップの「傾向」
// ---------------------------------------------------------------------------
// ラン開始時に1つだけ裏でこっそり抽選され、そのラン中ずっと、ショップに並ぶトークンの
// 出やすさに偏りをつける（プレイヤーには表示しない）。
//
// 各傾向で指定できるもの（どれも「重みの倍率」。1 より大きいと出やすく、小さいと出にくい）
//   tags:     タグ（tokenTags.js）ごとの倍率
//   attrs:    属性（fire / water / wood / light / dark / heart）ごとの倍率
//   keywords: 説明文に含まれる文字列ごとの倍率（タグより細かく狙いたいとき用）
//   random:   true にすると、ラン開始時にいくつかのタグをランダムに選んで偏らせる
//   weight:   この傾向自体が選ばれやすさ（省略時 1）
//
// 1つのトークンに複数の項目が当たったときは、各グループ（tags / attrs / keywords）ごとに
// 「一番大きい上昇」×「一番大きい低下」を取り、グループ同士は掛け算する。
// ---------------------------------------------------------------------------
import { getTokenTags, TOKEN_TAG_IDS } from "./tokenTags.js";

export const RUN_TRENDS = [
  // --- 属性 ---
  { id: "attr_fire", name: "紅蓮の市", attrs: { fire: 3 } },
  { id: "attr_water", name: "蒼雨の市", attrs: { water: 3 } },
  { id: "attr_wood", name: "翠風の市", attrs: { wood: 3 } },
  { id: "attr_light", name: "閃雷の市", attrs: { light: 3 } },
  { id: "attr_dark", name: "常月の市", attrs: { dark: 3 } },
  { id: "attr_heart", name: "癒しの市", attrs: { heart: 3 } },
  { id: "attr_fire_dark", name: "炎月の市", attrs: { fire: 2.2, dark: 2.2 } },
  { id: "attr_water_heart", name: "雨癒の市", attrs: { water: 2.2, heart: 2.2 } },
  { id: "attr_wood_light", name: "風雷の市", attrs: { wood: 2.2, light: 2.2 } },
  { id: "attr_none", name: "無色の市", tags: { attribute: 0.4 } },

  // --- 効果の系統 ---
  { id: "tag_multiplier", name: "倍率の市", tags: { multiplier: 2.5, combo_add: 0.7 } },
  { id: "tag_combo_add", name: "加算の市", tags: { combo_add: 3, multiplier: 0.7 } },
  { id: "tag_probability", name: "運試しの市", tags: { probability: 3 } },
  { id: "tag_fun", name: "道化の市", tags: { fun: 4 } },
  { id: "tag_board", name: "錬成の市", tags: { board: 2.5 } },
  { id: "tag_skyfall", name: "天候の市", tags: { skyfall: 3 } },
  { id: "tag_special_drop", name: "奇石の市", tags: { special_drop: 2.5 } },
  { id: "tag_shape", name: "型の市", tags: { shape: 3 } },
  { id: "tag_economy", name: "商人の市", tags: { economy: 3 } },
  { id: "tag_time", name: "刻の市", tags: { time: 3, energy: 1.5 } },
  { id: "tag_energy", name: "魔力の市", tags: { energy: 3, time: 1.5 } },
  { id: "tag_growth", name: "積み上げの市", tags: { growth: 4 } },
  { id: "tag_build", name: "編成の市", tags: { build: 4 } },

  // --- 特殊ドロップを細かく狙う ---
  { id: "kw_bomb", name: "火薬の市", keywords: { "ボム": 5 } },
  { id: "kw_repeat", name: "輪廻の市", keywords: { "リピート": 5 } },
  { id: "kw_star", name: "星降る市", keywords: { "スタードロップ": 4, "スター": 1.8 } },

  // --- 組み合わせ ---
  { id: "combo_shape_mult", name: "型破りの市", tags: { shape: 2, multiplier: 1.8 } },
  { id: "combo_prob_special", name: "博徒の市", tags: { probability: 2, special_drop: 2 } },

  // --- その他 ---
  { id: "random", name: "気まぐれの市", random: true },
  { id: "plain", name: "いつもの市", weight: 0.5 },
];

const DEFAULT_TREND_ID = "plain";

/** 傾向の定義を、セーブできる形（重みだけ）に確定させる */
export const resolveRunTrend = (def, rng = Math.random) => {
  if (!def) return null;
  const resolved = {
    id: def.id,
    name: def.name,
    tags: { ...(def.tags || {}) },
    attrs: { ...(def.attrs || {}) },
    keywords: { ...(def.keywords || {}) },
  };
  if (def.random) {
    // 2〜3個のタグを出やすく、1個のタグを出にくくする
    const pool = [...TOKEN_TAG_IDS];
    const pick = () => pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const upCount = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < upCount && pool.length > 0; i++) {
      resolved.tags[pick()] = Math.round((1.8 + rng() * 1.2) * 10) / 10;
    }
    if (pool.length > 0) resolved.tags[pick()] = 0.5;
  }
  return resolved;
};

/** ラン開始時に傾向を1つ抽選する（セーブできる形で返す） */
export const pickRunTrend = (rng = Math.random) => {
  const total = RUN_TRENDS.reduce((s, t) => s + (t.weight ?? 1), 0);
  let r = rng() * total;
  let picked = RUN_TRENDS[RUN_TRENDS.length - 1];
  for (const t of RUN_TRENDS) {
    r -= (t.weight ?? 1);
    if (r <= 0) { picked = t; break; }
  }
  return resolveRunTrend(picked, rng);
};

/** id から傾向を確定させる（テスト・デバッグ用） */
export const getRunTrendById = (id) =>
  resolveRunTrend(RUN_TRENDS.find(t => t.id === id) || RUN_TRENDS.find(t => t.id === DEFAULT_TREND_ID));

// 当たった倍率のうち「一番大きい上昇」×「一番大きい低下」
const combine = (values) => {
  if (values.length === 0) return 1;
  const up = Math.max(1, ...values);
  const down = Math.min(1, ...values);
  return up * down;
};

/** 傾向によるトークンの出現重みの倍率 */
export const getTrendWeight = (token, trend) => {
  if (!token || !trend) return 1;

  const tags = getTokenTags(token);
  const tagVals = tags.filter(t => trend.tags?.[t] !== undefined).map(t => Number(trend.tags[t]) || 1);

  // 5〜6色すべてに関わるトークン（五色の秘儀など）は、特定属性の傾向の対象にしない
  const attrs = token.attributes || [];
  const attrVals = (attrs.length <= 4 ? attrs : [])
    .filter(a => trend.attrs?.[a] !== undefined)
    .map(a => Number(trend.attrs[a]) || 1);

  const desc = token.desc || "";
  const kwVals = Object.entries(trend.keywords || {})
    .filter(([kw]) => desc.includes(kw))
    .map(([, w]) => Number(w) || 1);

  return combine(tagVals) * combine(attrVals) * combine(kwVals);
};
