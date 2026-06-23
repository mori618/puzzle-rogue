import { ALL_TOKEN_BASES } from '../src/constants/tokens.js';

// カテゴリ判定ロジック
function classifyToken(t) {
  const desc = t.desc || "";
  const categories = [];

  // 1. ドロップ変換・生成
  if (
    t.action && (t.action.includes("convert") || t.action.includes("generate")) ||
    desc.includes("変換") || desc.includes("生成") || desc.includes("創造") || desc.includes("プラスドロップ化")
  ) {
    categories.push("変換・生成");
  }

  // 2. ドロップ消去・消滅
  if (
    t.action && t.action.includes("erase") ||
    desc.includes("消去") || desc.includes("消滅") || desc.includes("削除") || desc.includes("全消し")
  ) {
    categories.push("消去・消滅");
  }

  // 3. コンボ・倍率強化
  if (
    desc.includes("コンボ数") || desc.includes("コンボ倍率") || desc.includes("基礎コンボ") ||
    desc.includes("コンボ+") || desc.includes("コンボ加算") || desc.includes("コンボ倍率に") ||
    desc.includes("コンボが")
  ) {
    categories.push("コンボ・倍率バフ");
  }

  // 4. 操作時間
  if (desc.includes("操作時間") || desc.includes("秒")) {
    categories.push("操作時間");
  }

  // 5. スター・経済 (売買・ショップ)
  if (
    desc.includes("スター") || desc.includes("価格") || desc.includes("割引") || 
    desc.includes("売却") || desc.includes("購入") || desc.includes("ショップ") || desc.includes("商品")
  ) {
    categories.push("スター・経済");
  }

  // 6. 手番・サイクル
  if (desc.includes("手番") || desc.includes("サイクル")) {
    categories.push("手番・サイクル");
  }

  // 7. トークン・レベル・エネルギー・チャージ
  if (
    desc.includes("レベル") || desc.includes("エネルギー") || desc.includes("チャージ") ||
    desc.includes("トークンを") || desc.includes("スロット")
  ) {
    categories.push("トークン・システム系");
  }

  // 8. 確率・ランダム
  if (
    desc.includes("確率") || desc.includes("%") || desc.includes("％") ||
    desc.includes("ランダム") || desc.includes("ダイス") || desc.includes("コイントス")
  ) {
    categories.push("確率・ランダム");
  }

  // 9. 特殊消し
  if (
    desc.includes("L字") || desc.includes("十字") || desc.includes("T字") ||
    desc.includes("正方形") || desc.includes("横列") || desc.includes("縦列") ||
    desc.includes("列消し") || desc.includes("連結消し") || desc.includes("個消し") || desc.includes("個消")
  ) {
    categories.push("特殊消し");
  }

  if (categories.length === 0) {
    categories.push("その他");
  }

  return categories;
}

// データの分類・集計
const total = ALL_TOKEN_BASES.length;
const categoryCounts = {};
const typeCategoryCounts = { skill: {}, passive: {}, curse: {} };
const attributeCategoryCounts = {
  fire: {}, water: {}, wood: {}, light: {}, dark: {}, heart: {}, none: {}
};

ALL_TOKEN_BASES.forEach(t => {
  const cats = classifyToken(t);
  cats.forEach(cat => {
    // 全体集計
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // タイプ別集計
    typeCategoryCounts[t.type][cat] = (typeCategoryCounts[t.type][cat] || 0) + 1;

    // 属性別集計 (複数ある場合はそれぞれにカウント、無ければnone)
    const attrs = (t.attributes && t.attributes.length > 0) ? t.attributes : ["none"];
    attrs.forEach(attr => {
      attributeCategoryCounts[attr][cat] = (attributeCategoryCounts[attr][cat] || 0) + 1;
    });
  });
});

console.log("=== カテゴリ分布（全体） ===");
Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`- ${cat.padEnd(12)} : ${String(count).padStart(3)} 件 (${((count / total) * 100).toFixed(1)}%)`);
});

console.log("\n=== タイプ別カテゴリ分布 ===");
console.log("カテゴリ | Skill (Active) | Passive | Curse");
console.log("-----------------------------------------");
Object.keys(categoryCounts).sort().forEach(cat => {
  const skillVal = typeCategoryCounts.skill[cat] || 0;
  const passiveVal = typeCategoryCounts.passive[cat] || 0;
  const curseVal = typeCategoryCounts.curse[cat] || 0;
  console.log(`${cat.padEnd(10)} | ${String(skillVal).padStart(14)} | ${String(passiveVal).padStart(7)} | ${String(curseVal).padStart(5)}`);
});

console.log("\n=== 属性別カテゴリ分布 ===");
const attrsList = ["fire", "water", "wood", "light", "dark", "heart", "none"];
console.log("カテゴリ | fire | water | wood | light | dark | heart | none");
console.log("---------------------------------------------------------------");
Object.keys(categoryCounts).sort().forEach(cat => {
  const rowVals = attrsList.map(attr => String(attributeCategoryCounts[attr][cat] || 0).padStart(5));
  console.log(`${cat.padEnd(8)} | ${rowVals.join(" | ")}`);
});

// 各属性（Fire, Water, Wood, Light, Dark, Heart）の全トークンから、属性固有の傾向があるか分析
console.log("\n=== 属性ごとのキーワード分析 ===");
attrsList.slice(0, 6).forEach(attr => {
  const tokensOfAttr = ALL_TOKEN_BASES.filter(t => t.attributes && t.attributes.includes(attr));
  console.log(`\n> 【${attr.toUpperCase()}】のトークン数: ${tokensOfAttr.length}`);
  
  // 例として上位のactionやeffectを表示
  const sample = tokensOfAttr.slice(0, 5).map(t => `${t.name}(★${t.rarity})`);
  console.log(`  サンプル: ${sample.join(", ")}`);
  
  // この属性のトークンに含まれる特徴ワードを抽出
  const totalCount = tokensOfAttr.length;
  const matchWords = {
    "変換・生成": tokensOfAttr.filter(t => classifyToken(t).includes("変換・生成")).length,
    "消去・消滅": tokensOfAttr.filter(t => classifyToken(t).includes("消去・消滅")).length,
    "コンボ強化": tokensOfAttr.filter(t => classifyToken(t).includes("コンボ・倍率バフ")).length,
    "確率要素": tokensOfAttr.filter(t => classifyToken(t).includes("確率・ランダム")).length,
    "特殊消し": tokensOfAttr.filter(t => classifyToken(t).includes("特殊消し")).length,
  };
  Object.entries(matchWords).forEach(([word, count]) => {
    console.log(`  - ${word}: ${count}件 (${((count/totalCount)*100).toFixed(1)}%)`);
  });
});
