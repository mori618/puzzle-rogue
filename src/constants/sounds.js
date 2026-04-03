/**
 * Sound IDs and direct file paths.
 * 実際のファイルは public/sounds/ フォルダなどに配置されることを想定しています。
 */

export const BGM_IDS = {
  TITLE: 'bgm_title',
  GAME: 'bgm_game',
  SHOP: 'bgm_shop',
  GAMEOVER: 'bgm_gameover',
  BEYOND: 'bgm_beyond',
};

export const SE_IDS = {
  // 1. パズル操作・盤面ギミック
  DRAG_START: 'se_drag_start',     // ドロップを掴む: 「ポッ」
  DRAG_MOVE: 'se_drag_move',       // ドロップの移動・入れ替え: 「カチャ」「シュッ」
  DRAG_END: 'se_drag_end',         // ドロップを離す: 「カチッ」
  TIME_TICK: 'se_time_tick',       // 操作時間のカウントダウン: 「チッ、チッ」
  TIME_OVER: 'se_time_over',       // タイムアップ: 「カンッ！」

  // 2. コンボ・特殊消去・ドロップ効果
  MATCH_NORMAL: 'se_match_normal',   // 通常ドロップの消去: 「ポンッ」（ピッチ上昇対応）
  MATCH_PLUS: 'se_match_plus',       // 強化ドロップ (+) の消去: 「キランッ」
  BOMB_EXPLODE: 'se_bomb_explode',   // ボムドロップの爆発
  ORB_REVIVE: 'se_orb_revive',       // リピートドロップの復活: 「シュイィン」
  MATCH_STAR: 'se_match_star',       // スタードロップの消去: 「チャリン！」「キラキラ」
  MATCH_RAINBOW: 'se_match_rainbow', // 虹ドロップの消去: 「シャララーン」
  SHAPE_BONUS: 'se_shape_bonus',     // 形状ボーナス成立: 「キュイン！」「ピシュン！」
  PERFECT_CLEAR: 'se_perfect_clear', // 全消しボーナス: 「ファンファーレ」

  // 3. スキル・トークン・呪い
  SKILL_READY: 'se_skill_ready',     // アクティブスキル チャージ完了: 「ピコーン」
  SKILL_USE: 'se_skill_use',         // アクティブスキル 使用 (発動)
  CONVERT: 'se_convert',             // 変換系 / 盤面変更: 「シュワァァ」
  CHRONOS_STOP: 'se_chronos_stop',   // クロノス・ストップ (時間停止): 「ガシャン！」
  PASSIVE_TRIGGER: 'se_passive_trigger', // パッシブスキル・エンチャント 発動通知: 「ピシュッ」
  CURSE_GET: 'se_curse_get',         // 呪いトークン 獲得・発動: 「ドロドロ…」「ガーン」
  CURSE_BREAK: 'se_curse_break',     // 呪い 解除条件達成: 「パリーン！」

  // 4. ゲーム進行・サイクル管理
  GOAL_REACHED: 'se_goal_reached',   // 目標コンボ数 到達: 「ピロリロリン！」
  SKIP_TURNS: 'se_skip_turns',       // スキップボーナス実行: 「キュルルルッ」
  CYCLE_CLEAR: 'se_cycle_clear',     // サイクルクリア: ジングル
  GAME_OVER: 'se_game_over',         // ゲームオーバー: 「ドゥーゥゥン…」
  BEYOND_START: 'se_beyond_start',   // エンドレスモード開始: 歓声やゴング

  // 5. ショップ・UI操作
  UI_HOVER: 'se_ui_hover',           // ボタンホバー / スワイプ: 「サッ」
  UI_CLICK: 'se_ui_click',           // ボタンクリック: 「カチッ」
  SHOP_REFRESH: 'se_shop_refresh',   // ショップ 商品リフレッシュ (更新): 「バサバサッ」
  BUY_STAR: 'se_buy_star',           // トークン購入: 「チャリンッ」
  SELL_STAR: 'se_sell_star',         // トークン売却: 「シュンッ」
  AWAKEN_BUY: 'se_awaken_buy',       // 覚醒ショップ 購入: 「ゴゴゴ…ピシャーン！」
  EQUIP_TOKEN: 'se_equip_token',     // トークンの装備・入れ替え・Lvアップ: 「カチャ」
  ERROR: 'se_error',                 // エラー音 (操作無効): 「ブブッ」
};

/**
 * Sound ID to File Path mapping.
 * ユーザーが後からファイル構成を変えやすいようにここに集約します。
 */
export const SOUND_FILES = {
  // --- BGMs ---
  [BGM_IDS.TITLE]: '/sounds/bgm_title.mp3',       // タイトル画面
  [BGM_IDS.GAME]: '/sounds/bgm_game.mp3',         // ゲームプレイ中
  [BGM_IDS.SHOP]: '/sounds/bgm_shop.mp3',         // ショップ画面
  [BGM_IDS.GAMEOVER]: '/sounds/bgm_gameover.mp3', // ゲームオーバー
  [BGM_IDS.BEYOND]: '/sounds/bgm_beyond.mp3',     // 彼岸（エンドレス）モード

  // --- SEs (システム・操作) ---
  [SE_IDS.DRAG_START]: '/sounds/se_drag_start.mp3',     // ドロップを掴む
  [SE_IDS.DRAG_MOVE]: '/sounds/se_drag_move.mp3',       // ドロップの移動・入れ替え
  [SE_IDS.DRAG_END]: '/sounds/se_drag_end.mp3',         // ドロップを離す（確定音）
  [SE_IDS.TIME_TICK]: '/sounds/se_time_tick.mp3',       // カウントダウン（チッ、チッ）
  [SE_IDS.TIME_OVER]: '/sounds/se_time_over.mp3',       // タイムアップ（終了音）

  // --- SEs (パズル・コンボ) ---
  [SE_IDS.MATCH_NORMAL]: '/sounds/se_match_normal.mp3',   // 通常ドロップ消去
  [SE_IDS.MATCH_PLUS]: '/sounds/se_match_plus.mp3',       // 強化ドロップ消去
  [SE_IDS.BOMB_EXPLODE]: '/sounds/se_bomb_explode.mp3',   // ボム爆発
  [SE_IDS.ORB_REVIVE]: '/sounds/se_orb_revive.mp3',       // リピート復活
  [SE_IDS.MATCH_STAR]: '/sounds/se_match_star.mp3',       // スター獲得
  [SE_IDS.MATCH_RAINBOW]: '/sounds/se_match_rainbow.mp3', // 虹消去
  [SE_IDS.SHAPE_BONUS]: '/sounds/se_shape_bonus.mp3',     // 形状ボーナス成立
  [SE_IDS.PERFECT_CLEAR]: '/sounds/se_perfect_clear.mp3', // 全消しファンファーレ

  // --- SEs (スキル・特殊) ---
  [SE_IDS.SKILL_READY]: '/sounds/se_skill_ready.mp3',     // スキルチャージ完了
  [SE_IDS.SKILL_USE]: '/sounds/se_skill_use.mp3',         // スキル発動
  [SE_IDS.CONVERT]: '/sounds/se_convert.mp3',             // 盤面変換
  [SE_IDS.CHRONOS_STOP]: '/sounds/se_chronos_stop.mp3',   // 時間停止
  [SE_IDS.PASSIVE_TRIGGER]: '/sounds/se_passive_trigger.mp3', // パッシブ発動
  [SE_IDS.CURSE_GET]: '/sounds/se_curse_get.mp3',         // 呪い獲得
  [SE_IDS.CURSE_BREAK]: '/sounds/se_curse_break.mp3',     // 呪い解除

  // --- SEs (進行) ---
  [SE_IDS.GOAL_REACHED]: '/sounds/se_goal_reached.mp3',   // 目標到達
  [SE_IDS.SKIP_TURNS]: '/sounds/se_skip_turns.mp3',       // スキップ演出
  [SE_IDS.CYCLE_CLEAR]: '/sounds/se_cycle_clear.mp3',     // サイクルクリア
  [SE_IDS.GAME_OVER]: '/sounds/se_game_over.mp3',         // ゲームオーバー音
  [SE_IDS.BEYOND_START]: '/sounds/se_beyond_start.mp3',   // 彼岸モード開始

  // --- SEs (UI・ショップ) ---
  [SE_IDS.UI_HOVER]: '/sounds/se_ui_hover.mp3',           // カーソル合わせ
  [SE_IDS.UI_CLICK]: '/sounds/se_ui_click.mp3',           // ボタンクリック
  [SE_IDS.SHOP_REFRESH]: '/sounds/se_shop_refresh.mp3',   // 商品更新（リロール）
  [SE_IDS.BUY_STAR]: '/sounds/se_buy_star.mp3',           // アイテム購入
  [SE_IDS.SELL_STAR]: '/sounds/se_sell_star.mp3',         // トークン売却
  [SE_IDS.AWAKEN_BUY]: '/sounds/se_awaken_buy.mp3',       // 覚醒購入
  [SE_IDS.EQUIP_TOKEN]: '/sounds/se_equip_token.mp3',     // 装備・入れ替え
  [SE_IDS.ERROR]: '/sounds/se_error.mp3',                 // エラー（購入不可等）
};
