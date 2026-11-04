// ゲーム設定を管理するカスタムフック
import { useState, useEffect, useCallback } from "react";
import { SETTINGS_KEY, DEFAULT_SETTINGS } from "../constants/gameConstants.js";
import soundManager from "../utils/SoundManager";
import { safeSetItem } from "../utils/safeStorage.js";

export const useGameSettings = () => {
  // 初期ロード時に設定を localStorage から復元（useStateの初期値関数を使用）
  const [settings, setSettings] = useState(() => {
    let savedSettings = null;
    try {
      savedSettings = localStorage.getItem(SETTINGS_KEY);
    } catch (e) {
      console.error("設定データの読み込みに失敗しました:", e);
    }
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        soundManager.updateSettings(parsed);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error("設定データの読み込みに失敗しました:", e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // settings ステートの変更を soundManager に自動同期
  useEffect(() => {
    soundManager.updateSettings(settings);
  }, [settings]);

  /** 設定を変更し localStorage に即時保存 */
  const handleSettingsChange = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      safeSetItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    settings,
    setSettings,
    handleSettingsChange,
  };
};
