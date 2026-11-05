import { describe, it, expect } from 'vitest';
import { parseFontFaces } from './swUpdate.js';

describe('parseFontFaces', () => {
  it('@font-face を family/style/weight/unicode-range のキーで URL に対応付ける', () => {
    const css = `
/* latin */
@font-face {
  font-family: 'Material Icons Round';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/icons.woff2) format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 700;
  src: url("https://fonts.gstatic.com/s/inter-latin.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+4??;
}`;
    const map = parseFontFaces(css);
    expect(map.size).toBe(2);
    // FontFace オブジェクト側の表記（ゼロ詰めなし）でも同じキーになる
    expect(map.get('Material Icons Round|normal|400|0-1114111')).toBe('https://fonts.gstatic.com/s/icons.woff2');
    expect(map.get('Inter|normal|100 700|0-255,305-305,1024-1279')).toBe('https://fonts.gstatic.com/s/inter-latin.woff2');
  });

  it('url の無いブロックは無視する', () => {
    expect(parseFontFaces("@font-face { font-family: 'X'; }").size).toBe(0);
  });
});
