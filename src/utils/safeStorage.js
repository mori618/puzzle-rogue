// localStorage への書き込みを安全に行うヘルパー
// 容量超過（QuotaExceededError）やプライベートモード・ストレージ無効化環境では
// localStorage が例外を投げるため、ゲーム進行を止めないように握りつぶしてログだけ残す。

/**
 * localStorage.setItem を例外なしで実行する
 * @returns {boolean} 保存に成功したら true
 */
export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`Failed to save "${key}" to localStorage:`, e);
    return false;
  }
};

/**
 * localStorage.removeItem を例外なしで実行する
 * @returns {boolean} 削除に成功したら true
 */
export const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Failed to remove "${key}" from localStorage:`, e);
    return false;
  }
};
