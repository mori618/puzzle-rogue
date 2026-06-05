import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const useGameStatePath = path.join(__dirname, '../src/hooks/useGameState.js');
let code = fs.readFileSync(useGameStatePath, 'utf8');

// 1. インポート文の追加
code = code.replace(
  "import soundManager from '../utils/SoundManager';",
  "import soundManager from '../utils/SoundManager';\nimport { useGameSettings } from './useGameSettings';\nimport { usePuzzleBoard } from './usePuzzleBoard';\nimport { useShop } from './useShop';"
);

// 2. 設定関連 of useGameState.js
const settingsToReplace = `  // --- ゲーム設定 ---
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  /** 設定を変更し localStorage に即時保存 */
  const handleSettingsChange = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);`;

code = code.replace(settingsToReplace, "\n  // settings と handleSettingsChange は useGameSettings フックから取得します");

// 3. 設定監視の useEffect 削除
const useEffectToReplace = `  useEffect(() => {
    soundManager.updateSettings(settings);
  }, [settings]);`;

code = code.replace(useEffectToReplace, "");

// 重複するステート定義の削除
code = code.replace("  const [shopItems, setShopItems] = useState([]);\n", "");
code = code.replace("  const [shopRerollBasePrice, setShopRerollBasePrice] = useState(1);\n", "");
code = code.replace("  const [shopRerollPrice, setShopRerollPrice] = useState(1);\n", "");
code = code.replace("  const [pendingShopItem, setPendingShopItem] = useState(null);\n", "");
code = code.replace("  const [tokenSlotExpansionCount, setTokenSlotExpansionCount] = useState(0);  // トークン枠拡張回数\n", "");
code = code.replace("  const [draggedToken, setDraggedToken] = useState(null);\n", "");
code = code.replace("  const [tokenMoveInput, setTokenMoveInput] = useState(''); // 並び替え用の入力値\n", "");

// フック呼び出しコード
const hookCalls = `
  // --- 各種機能のカスタムフックの呼び出し ---
  const settingsHook = useGameSettings();
  const { settings, setSettings, handleSettingsChange } = settingsHook;

  const boardHook = usePuzzleBoard({ tokens, setTokens, notify: (text) => addTokenToast(null, text) });
  const {
    draggedToken,
    setDraggedToken,
    tokenMoveInput,
    setTokenMoveInput,
    rows,
    cols,
    moveToken,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = boardHook;

  const shopHook = useShop({
    tokens,
    setTokens,
    stars,
    setStars,
    activeBuffs,
    isBeyondMode,
    totalPurchases,
    setTotalPurchases,
    totalStarsSpent,
    setTotalStarsSpent,
    stats,
    setStats,
    currentRunStats,
    setCurrentRunStats,
    notify,
    addTokenToast,
    triggerLevelUp,
    spawnParticles,
    getStatByCondition,
    setSelectedTokenDetail,
    setIsAwakeningLevelUpBought,
    isEnchantShopUnlocked,
    setIsEnchantShopUnlocked,
    setSandsOfTimeSeconds,
    hasSaintToken,
  });
  const {
    shopItems,
    setShopItems,
    shopRerollBasePrice,
    setShopRerollBasePrice,
    shopRerollPrice,
    setShopRerollPrice,
    pendingShopItem,
    setPendingShopItem,
    tokenSlotExpansionCount,
    setTokenSlotExpansionCount,
    generateShop,
    purifyCurse,
    sellToken,
    buyItem,
    buyAwakeningItem,
    handleChoice,
    openShop,
    refreshShop,
    getTokenSlotExpandPrice,
  } = shopHook;
`;

// effectiveTarget の定義の直後にフック呼び出しを挿入
code = code.replace(
  `  const effectiveTarget = hasDoubleTargetCurse ? target * 2 : target;`,
  `  const effectiveTarget = hasDoubleTargetCurse ? target * 2 : target;\n` + hookCalls
);

// 4. 重複定義関数の削除（先読み正規表現を使用し、中括弧のバランスバグを回避）
code = code.replace(
  /  const generateShop = \(overrideCycleCount = null\) => {[\s\S]*?(?=  const activateSkill =)/g,
  "  // generateShop, buyItem, handleChoice 等は useShop フックへ移行されました\n"
);

code = code.replace(
  /  const purifyCurse = \(token\) => {[\s\S]*?(?=  const sellToken =)/g,
  "  // purifyCurse は useShop フックへ移行されました\n"
);

code = code.replace(
  /  const sellToken = \(token\) => {[\s\S]*?(?=  const moveToken =)/g,
  "  // sellToken は useShop フックへ移行されました\n"
);

code = code.replace(
  /  const moveToken = \(token, targetPos\) => {[\s\S]*?(?=  const openShop =)/g,
  "  // moveToken, handleDrag/Drop 等は usePuzzleBoard フックへ移行されました\n"
);

code = code.replace(
  /  const openShop = \(\) => {[\s\S]*?(?=  const toggleEnchantStatus =)/g,
  "  // openShop, refreshShop は useShop フックへ移行されました\n\n"
);

// hasGiantDomain の定義のみを削除
code = code.replace(
  "  const hasGiantDomain = tokens.some((t) => t?.id === \"giant\" || t?.enchantments?.some(e => e.effect === \"expand_board\"));",
  "  // hasGiantDomain は usePuzzleBoard フックへ移行されました"
);

// rows, cols の定義のみを削除
code = code.replace(
  /  const rows = hasGiantDomain \? 6 : 5;\s+const cols = hasGiantDomain \? 7 : 6;/g,
  "  // rows, cols は usePuzzleBoard フックへ移行されました"
);

fs.writeFileSync(useGameStatePath, code, 'utf8');
console.log('useGameState.js Refactoring Completed with Correct Hook Call Insertion!');
