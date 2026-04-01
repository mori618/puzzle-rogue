export function formatJapaneseNumber(num) {
  if (num == null) return "0";
  const sign = num < 0 ? "-" : "";
  const absNum = Math.floor(Math.abs(Number(num)));
  
  if (isNaN(absNum)) return "0";
  if (absNum < 10000) return sign + absNum.toString();

  const oku = Math.floor(absNum / 100000000);
  const man = Math.floor((absNum % 100000000) / 10000);
  const rest = absNum % 10000;

  let result = "";
  if (oku > 0) result += oku + "億";
  
  if (oku > 0) {
    if (man > 0 || rest > 0) result += man.toString().padStart(4, '0') + "万";
  } else if (man > 0) {
    result += man + "万";
  }
  
  if (oku > 0 || man > 0) {
    if (rest > 0) result += rest.toString().padStart(4, '0');
  } else {
    if (rest > 0) result += rest.toString();
  }
  
  return sign + result;
}
