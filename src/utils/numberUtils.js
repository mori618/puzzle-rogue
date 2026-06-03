// 日本語大数単位テーブル（4桁区切り、10^4 から）
// [単位名, 10の何乗か]
const JP_UNITS = [
  ["無量大数", 68],
  ["不可思議", 64],
  ["那由他",   60],
  ["阿僧祇",   56],
  ["恒河沙",   52],
  ["極",       48],
  ["載",       44],
  ["正",       40],
  ["澗",       36],
  ["溝",       32],
  ["穰",       28],
  ["秭",       24],
  ["垓",       20],
  ["京",       16],
  ["兆",       12],
  ["億",        8],
  ["万",        4],
];

export function formatJapaneseNumber(num) {
  if (num == null) return "0";
  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(Number(num));

  if (isNaN(absNum) || absNum < 1) return sign + Math.floor(absNum).toString();
  if (absNum < 10000) return sign + Math.floor(absNum).toString();

  // 最上位の単位を探す
  for (let i = 0; i < JP_UNITS.length; i++) {
    const [unitName, exp] = JP_UNITS[i];
    const unitVal = Math.pow(10, exp);

    if (absNum >= unitVal) {
      const upper = Math.floor(absNum / unitVal);

      // 2文字以上の単位 → 「X単位」だけ表示（下位省略）
      if (unitName.length >= 2) {
        return sign + upper + unitName;
      }

      // 1文字単位 → 「X単位Y下位単位」（下位ゼロなら省略）
      const nextUnit = JP_UNITS[i + 1];
      if (nextUnit) {
        const [nextName, nextExp] = nextUnit;
        const nextVal = Math.pow(10, nextExp);
        const lower = Math.floor((absNum % unitVal) / nextVal);
        if (lower > 0) {
          return sign + upper + unitName + lower + nextName;
        }
      } else {
        // 万が最下位単位 → 万以下の端数（1〜9999）を直接表示
        const rest = Math.floor(absNum % unitVal);
        if (rest > 0) {
          return sign + upper + unitName + rest;
        }
      }
      return sign + upper + unitName;
    }
  }

  // 万未満（1〜9999）
  return sign + Math.floor(absNum).toString();
}
