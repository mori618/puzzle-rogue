import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Star as StarIcon,
} from "lucide-react";
import ShopScreen from "./ShopScreen";
import TitleScreen from "./TitleScreen";
import PauseScreen from "./PauseScreen";
import HelpScreen from "./HelpScreen";
import StatsScreen from "./StatsScreen";
import CreditsScreen from "./CreditsScreen";
import SettingsScreen from "./SettingsScreen";

// --- Utils ---
const formatNum = (n) => Math.round(n * 100) / 100;

// --- Constants (RPG) ---
const ALL_TOKEN_BASES = [
  // --- Skills: Conversion ---
  { id: "fired", name: "焔の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "wood", to: "fire" }, rarity: 1, price: 2, desc: "風を炎に変換。消費E:{cost}" },
  { id: "waterd", name: "氷の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "water" }, rarity: 1, price: 2, desc: "炎を雨に変換。消費E:{cost}" },
  { id: "woodd", name: "嵐の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "water", to: "wood" }, rarity: 1, price: 2, desc: "雨を風に変換。消費E:{cost}" },
  { id: "lightd", name: "雷の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "dark", to: "light" }, rarity: 1, price: 2, desc: "月を雷に変換。消費E:{cost}" },
  { id: "darkd", name: "影の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "light", to: "dark" }, rarity: 1, price: 2, desc: "雷を月に変換。消費E:{cost}" },
  { id: "heartd", name: "癒の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "heart" }, rarity: 1, price: 2, desc: "炎をハートに変換。消費E:{cost}" },
  { id: "conv_h_f", name: "癒の劫炎", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "fire" }, rarity: 1, price: 2, desc: "ハートを炎に変換。消費E:{cost}" },
  { id: "conv_h_w", name: "癒の奔流", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "water" }, rarity: 1, price: 2, desc: "ハートを雨に変換。消費E:{cost}" },
  { id: "conv_h_g", name: "癒の深風", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "wood" }, rarity: 1, price: 2, desc: "ハートを風に変換。消費E:{cost}" },
  { id: "conv_h_l", name: "癒の聖雷", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "light" }, rarity: 1, price: 2, desc: "ハートを雷に変換。消費E:{cost}" },
  { id: "conv_h_d", name: "癒の呪法", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "dark" }, rarity: 1, price: 2, desc: "ハートを月に変換。消費E:{cost}" },

  // ==========================================
  // --- Skills: Board Change (3-Color) ---
  // 指定の3色組み合わせ(8種)
  // ==========================================
  { id: "board_tri_fdw", name: "三色の真理・業水", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "water"] }, rarity: 1, price: 3, desc: "盤面を炎/月/雨に変更。消費E:{cost}" },
  { id: "board_tri_fdl", name: "三色の真理・炎光", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark", "light"] }, rarity: 1, price: 3, desc: "盤面を炎/月/雷に変更。消費E:{cost}" },
  { id: "board_tri_whf", name: "三色の真理・紅蓮", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "fire"] }, rarity: 1, price: 3, desc: "盤面を雨/ハート/炎に変更。消費E:{cost}" },
  { id: "board_tri_whg", name: "三色の真理・蒼木", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart", "wood"] }, rarity: 1, price: 3, desc: "盤面を雨/ハート/風に変更。消費E:{cost}" },
  { id: "board_tri_gld", name: "三色の真理・神緑", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "dark"] }, rarity: 1, price: 3, desc: "盤面を風/雷/月に変更。消費E:{cost}" },
  { id: "board_tri_glh", name: "三色の真理・天恵", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "heart"] }, rarity: 1, price: 3, desc: "盤面を風/雷/ハートに変更。消費E:{cost}" },
  { id: "board_tri_fwg", name: "三色の真理・天地", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "wood"] }, rarity: 1, price: 3, desc: "盤面を炎/雨/風に変更。消費E:{cost}" },
  { id: "board_tri_ldh", name: "三色の真理・黄昏", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "dark", "heart"] }, rarity: 1, price: 3, desc: "盤面を雷/月/ハートに変更。消費E:{cost}" },

  // ==========================================
  // --- Skills: Board Change (2-Color) ---
  // 指定の2色組み合わせ(6種)
  // ==========================================
  { id: "board_bi_fd", name: "炎月の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark"] }, rarity: 1, price: 4, desc: "盤面を炎/月の2色に変更。消費E:{cost}" },
  { id: "board_bi_wh", name: "蒼海の至宝", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart"] }, rarity: 1, price: 4, desc: "盤面を雨/ハートの2色に変更。消費E:{cost}" },
  { id: "board_bi_gl", name: "風雷の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light"] }, rarity: 1, price: 4, desc: "盤面を風/雷の2色に変更。消費E:{cost}" },
  { id: "board_bi_wd", name: "雨月の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "dark"] }, rarity: 1, price: 4, desc: "盤面を雨/月の2色に変更。消費E:{cost}" },
  { id: "board_bi_gh", name: "風癒の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "heart"] }, rarity: 1, price: 4, desc: "盤面を風/ハートの2色に変更。消費E:{cost}" },
  { id: "board_bi_fl", name: "炎雷の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "light"] }, rarity: 1, price: 4, desc: "盤面を炎/雷の2色に変更。消費E:{cost}" },


  // --- Skills: Board Change (1-Color) ---
  { id: "board_mono1", name: "真・紅蓮の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["fire"] }, rarity: 2, price: 6, desc: "盤面すべてを炎に変更。消費E:{cost}" },
  { id: "board_mono2", name: "真・閃雷の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["light"] }, rarity: 2, price: 6, desc: "盤面すべてを雷に変更。消費E:{cost}" },
  { id: "board_mono3", name: "真・蒼海の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["water"] }, rarity: 2, price: 6, desc: "盤面すべてを雨に変更。消費E:{cost}" },
  { id: "board_mono4", name: "真・深翠の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["wood"] }, rarity: 2, price: 6, desc: "盤面すべてを風に変更。消費E:{cost}" },
  { id: "board_mono5", name: "真・常月の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["dark"] }, rarity: 2, price: 6, desc: "盤面すべてを月に変更。消費E:{cost}" },
  { id: "board_mono6", name: "真・生命の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["heart"] }, rarity: 2, price: 6, desc: "盤面すべてをハートに変更。消費E:{cost}" },

  // --- Skills: Bomb Generation ---
  { id: "gen_bomb_rand", name: "爆発の種", type: "skill", cost: 3, costLevels: true, action: "spawn_bomb_random", params: { count: 1 }, rarity: 1, price: 2, desc: "ランダムなドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [3, 2, 1] },
  { id: "conv_bomb_target_fire", name: "紅炎の火薬", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "fire" }, rarity: 2, price: 3, desc: "炎ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2] },
  { id: "conv_bomb_target_dark", name: "暗黒の火薬", type: "skill", cost: 4, costLevels: true, action: "convert_bomb_targeted", params: { count: 1, type: "dark" }, rarity: 2, price: 3, desc: "月ドロップ1つをボムドロップにする。消費E:{cost}", levelsConfig: [4, 3, 2] },

  // --- Skills: Random Generation ---
  { id: "gen_rand_fire", name: "炎の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "fire", count: 5 }, rarity: 1, price: 2, desc: "炎ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_water", name: "雨の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "water", count: 5 }, rarity: 1, price: 2, desc: "雨ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_wood", name: "森の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "wood", count: 5 }, rarity: 1, price: 2, desc: "風ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_light", name: "雷の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "light", count: 5 }, rarity: 1, price: 2, desc: "雷ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_dark", name: "月の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "dark", count: 5 }, rarity: 1, price: 2, desc: "月ドロップをランダムに5個生成。消費E:{cost}" },

  // --- Skills: Fixed Distribution ---
  { id: "board_bal_5", name: "五行の理", type: "skill", cost: 5, costLevels: true, action: "board_balance", rarity: 2, price: 5, desc: "全ドロップを5属性各6個に変化させる。消費E:{cost}" },

  // --- Skills: Skyfall Manipulation ---
  { id: "sky_f1", name: "紅蓮の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、炎がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_w1", name: "蒼海の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雨がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_g1", name: "深翠の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、風がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_l1", name: "閃雷の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雷がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_d1", name: "常月の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、月がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_h1", name: "癒の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 5, duration: 3 }, rarity: 1, price: 3, desc: "3手番、ハートがかなり落ちやすくなる。消費E:{cost}" },

  // ==========================================
  // --- 2-Color Skyfall Boost (波紋) ---
  // 指定の2色組み合わせ(6種)
  // ==========================================
  { id: "sky_fd_2", name: "炎月の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と月が落ちやすくなる。消費E:{cost}" },
  { id: "sky_wh_2", name: "蒼海の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨とハートが落ちやすくなる。消費E:{cost}" },
  { id: "sky_gl_2", name: "風雷の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風と雷が落ちやすくなる。消費E:{cost}" },
  { id: "sky_wd_2", name: "雨月の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨と月が落ちやすくなる。消費E:{cost}" },
  { id: "sky_gh_2", name: "風癒の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風とハートが落ちやすくなる。消費E:{cost}" },
  { id: "sky_fl_2", name: "炎雷の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 3, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と雷が落ちやすくなる. 消費E:{cost}" },


  // --- 1-Color Skyfall Stop (静寂) ---
  { id: "sky_f_stop", name: "紅蓮の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、炎が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_w_stop", name: "蒼海の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雨が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_g_stop", name: "深翠の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、風が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_l_stop", name: "閃雷の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、雷が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_d_stop", name: "常月の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、月が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_h_stop", name: "癒の静寂", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 0, duration: 3 }, rarity: 1, price: 3, desc: "3手番、ハートが落ちてこなくなる。消費E:{cost}" },

  // ==========================================
  // --- 2-Color Skyfall Stop (凪) ---
  // 指定の2色組み合わせ(6種)
  // ==========================================
  { id: "sky_fd_stop", name: "炎月の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と月が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_wh_stop", name: "蒼海の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "heart"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨とハートが落ちてこなくなる。消費E:{cost}" },
  { id: "sky_gl_stop", name: "風雷の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風と雷が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_wd_stop", name: "雨月の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、雨と月が落ちてこなくなる。消費E:{cost}" },
  { id: "sky_gh_stop", name: "風癒の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "heart"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、風とハートが落ちてこなくなる。消費E:{cost}" },
  { id: "sky_fl_stop", name: "炎雷の凪", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 0, duration: 2 }, rarity: 1, price: 3, desc: "2手番、炎と雷が落ちてこなくなる. 消費E:{cost}" },


  { id: "sky_limit", name: "三色の結界", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["fire", "water", "wood"], duration: 3 }, rarity: 1, price: 4, desc: "3手番、炎/雨/風しか落ちてこなくなる。消費E:{cost}" },
  { id: "sky_limit_ldh", name: "三界の結界", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["light", "dark", "heart"], duration: 3 }, rarity: 1, price: 4, desc: "3手番、雷/月/ハートしか落ちてこなくなる。消費E:{cost}" },

  // ==========================================
  // --- Skills: Multi-Conversion ---
  // 指定の3色組み合わせに対応した変換(8種)
  // ==========================================
  { id: "conv_m_fd_w", name: "業水の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "water" }, rarity: 1, price: 3, desc: "炎と月を雨に変換。消費E:{cost}" },
  { id: "conv_m_fd_l", name: "炎雷の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "light" }, rarity: 1, price: 3, desc: "炎と月を雷に変換。消費E:{cost}" },
  { id: "conv_m_wh_f", name: "紅蓮の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "fire" }, rarity: 1, price: 3, desc: "雨とハートを炎に変換。消費E:{cost}" },
  { id: "conv_m_wh_g", name: "蒼風の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "wood" }, rarity: 1, price: 3, desc: "雨とハートを風に変換。消費E:{cost}" },
  { id: "conv_m_gl_d", name: "神緑の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "dark" }, rarity: 1, price: 3, desc: "風と雷を月に変換。消費E:{cost}" },
  { id: "conv_m_gl_h", name: "天恵の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "light"], to: "heart" }, rarity: 1, price: 3, desc: "風と雷をハートに変換。消費E:{cost}" },
  { id: "conv_m_fw_g", name: "天地の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water"], to: "wood" }, rarity: 1, price: 3, desc: "炎と雨を風に変換。消費E:{cost}" },
  { id: "conv_m_ld_h", name: "黄昏の洗礼", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "heart" }, rarity: 1, price: 3, desc: "雷と月をハートに変換。消費E:{cost}" },


  // --- Skills: Row Fix ---
  { id: "row_f", name: "烈炎の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "fire" }, rarity: 1, price: 3, desc: "上段をすべて炎に。消費E:{cost}" },
  { id: "row_w", name: "清流の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "water" }, rarity: 1, price: 3, desc: "上段をすべて雨に。消費E:{cost}" },
  { id: "row_g", name: "深翠の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "wood" }, rarity: 1, price: 3, desc: "上段をすべて風に。消費E:{cost}" },
  { id: "row_l", name: "閃雷の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "light" }, rarity: 1, price: 3, desc: "上段をすべて雷に。消費E:{cost}" },
  { id: "row_d", name: "常月の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "dark" }, rarity: 1, price: 3, desc: "上段をすべて月に。消費E:{cost}" },
  { id: "row_h", name: "生命の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "heart" }, rarity: 1, price: 3, desc: "上段をすべてハートに。消費E:{cost}" },
  { id: "row_b_f", name: "烈炎の底陣", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: -1, type: "fire" }, rarity: 1, price: 3, desc: "下段をすべて炎に。消費E:{cost}" },
  { id: "row_c_h", name: "生命の帯", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: "center", type: "heart" }, rarity: 1, price: 3, desc: "中央行をすべてハートに。消費E:{cost}" },

  // --- Skills: Col Fix ---
  { id: "col_l_l", name: "閃雷の縦一閃", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: 0, type: "light" }, rarity: 1, price: 3, desc: "左端列をすべて雷に。消費E:{cost}" },
  { id: "col_r_d", name: "常月の縦一閃", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: -1, type: "dark" }, rarity: 1, price: 3, desc: "右端列をすべて月に。消費E:{cost}" },


  {
    id: "refresh",
    name: "次元の再編",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "force_refresh",
    rarity: 1, price: 2,
    desc: "全消去して再落下。落ちコンあり。消費E:{cost}",
  },

  // --- Skills: Charge Boost ---
  {
    id: "charge_boost",
    name: "練気の波動",
    type: "skill",
    cost: 3,
    action: "charge_boost",
    values: [1, 2, 3],
    rarity: 1, price: 3,
    desc: "他のスキルのエネルギーを1/2/3チャージ。消費E:3",
  },
  {
    id: "collector",
    name: "黄金の収集者",
    type: "passive",
    effect: "star_gain",
    values: [4, 2, 1],
    rarity: 1, price: 5,
    desc: "★獲得に必要なコンボ数を4/2/1に短縮。",
  },
  {
    id: "time_ext",
    name: "時の砂",
    type: "passive",
    effect: "time_permanent",
    price: 4,
    rarity: 1,
    desc: "操作時間を2秒延長。（購入するごとに累積し、トークン枠を消費しない）",
  },
  {
    id: "power_up",
    name: "力の鼓動",
    type: "passive",
    effect: "base_add",
    values: [2, 3, 5],
    rarity: 1, price: 4,
    desc: "コンボ加算に2/3/5の固定値を追加。",
  },
  {
    id: "forbidden",
    name: "禁忌の儀式",
    type: "passive",
    effect: "forbidden",
    values: [2, 3, 5],
    rarity: 2, price: 7,
    desc: "常時落ちコン停止。コンボ加算2/3/5倍。",
  },
  {
    id: "bargain",
    name: "商談の極意",
    type: "passive",
    effect: "sale_boost",
    values: [2, 4, 6],
    rarity: 1, price: 6,
    desc: "ショップに並ぶセール品（半額）の数を2/4/6個に増加させる。",
  },
  {
    id: "enchant_boost",
    name: "魔道の極意",
    type: "passive",
    effect: "enchant_grant_boost",
    values: [1, 2, 3],
    rarity: 2, price: 8,
    desc: "ショップに並ぶエンチャントの数を1/2/3個増加させる。",
  },
  {
    id: "shop_expand",
    name: "陳列の極意",
    type: "passive",
    effect: "shop_expand",
    values: [1, 2, 3],
    rarity: 1, price: 8,
    desc: "ショップに並ぶ通常商品の枠を1/2/3枠拡張する。",
  },
  {
    id: "skip_master",
    name: "時短の心得",
    type: "passive",
    effect: "skip_bonus_multiplier",
    values: [6, 8, 10],
    rarity: 2, price: 6,
    desc: "目標達成後のスキップボーナスを6/8/10倍にする。",
  },
  {
    id: "dual_match",
    name: "双連の極意",
    type: "passive",
    effect: "min_match",
    values: [0.8, 1.2, 1.5],
    rarity: 3, price: 15,
    desc: "2つ以上でドロップが消える。コンボ倍率x[0.8/1.2/1.5]。",
  },

  // --- Passive: Combo Multiplier (Color) ---
  {
    id: "bonus_1c_fire", name: "炎の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "炎を消しているとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_1c_water", name: "雨の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["water"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "雨を消しているとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_1c_wood", name: "風の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "風を消しているとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_1c_light", name: "雷の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["light"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "雷を消しているとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_1c_dark", name: "月の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["dark"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "月を消しているとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_1c_heart", name: "癒の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["heart"] }, values: [1.5, 2, 3], rarity: 1, price: 6,
    desc: "ハートを消しているとコンボ数x[1.5/2/3]倍。",
  },
  // ==========================================
  // --- Passive: Combo Multiplier (2-Color) ---
  // 指定の2色組み合わせ(6種)
  // ==========================================
  { id: "bonus_2c_fd", name: "炎月の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "炎/月を同時に消すとコンボ数x[1.8/2.5/4]倍。" },
  { id: "bonus_2c_wh", name: "蒼海の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "雨/ハートを同時に消すとコンボ数x[1.8/2.5/4]倍。" },
  { id: "bonus_2c_gl", name: "風雷の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "風/雷を同時に消すとコンボ数x[1.8/2.5/4]倍。" },
  { id: "bonus_2c_wd", name: "雨月の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "dark"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "雨/月を同時に消すとコンボ数x[1.8/2.5/4]倍。" },
  { id: "bonus_2c_gh", name: "風癒の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "heart"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "風/ハートを同時に消すとコンボ数x[1.8/2.5/4]倍。" },
  { id: "bonus_2c_fl", name: "炎雷の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "light"] }, values: [1.8, 2.5, 4], rarity: 2, price: 8, desc: "炎/雷を同時に消すとコンボ数x[1.8/2.5/4]倍。" },

  // ==========================================
  // --- Passive: Combo Multiplier (3-Color) ---
  // 指定の3色組み合わせ(8種)
  // ==========================================
  { id: "bonus_3c_fdw", name: "業水の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "water"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/月/雨を同時に消すとコンボ数x[2/3/5]倍。" },
  { id: "bonus_3c_fdl", name: "炎雷月の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "dark", "light"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/月/雷を同時に消すとコンボ数x[2/3/5]倍。" },
  { id: "bonus_3c_whf", name: "紅蓮の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "fire"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雨/ハート/炎を同時に消すとコンボ数x[2/3/5]倍。" },
  { id: "bonus_3c_whg", name: "蒼風の律動", type: "passive", effect: "color_multiplier", params: { colors: ["water", "heart", "wood"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雨/ハート/風を同時に消すとコンボ数x[2/3/5]倍。" },
  { id: "bonus_3c_gld", name: "神緑の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "dark"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "風/雷/月を同時に消すとコンボ数x[2/3/5]倍。" },
  { id: "bonus_3c_glh", name: "天恵の律動", type: "passive", effect: "color_multiplier", params: { colors: ["wood", "light", "heart"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "風/雷/ハートを同時に消すとコンボ数x[2/3/5]倍。" },
  { id: "bonus_3c_fwg", name: "天地の律動", type: "passive", effect: "color_multiplier", params: { colors: ["fire", "water", "wood"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "炎/雨/風を同時に消すとコンボ数x[2/3/5]倍。" },
  { id: "bonus_3c_ldh", name: "黄昏の律動", type: "passive", effect: "color_multiplier", params: { colors: ["light", "dark", "heart"] }, values: [2, 3, 5], rarity: 2, price: 9, desc: "雷/月/ハートを同時に消すとコンボ数x[2/3/5]倍。" },

  {
    id: "bonus_4c_fwlh", name: "四天の秘儀", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "water", "light", "heart"] }, values: [2.5, 4, 6], rarity: 2, price: 10,
    desc: "炎/雨/雷/ハートを同時に消すとコンボ数x[2.5/4/6]倍。",
  },
  {
    id: "bonus_5c", name: "五色の秘儀", type: "passive", effect: "color_multiplier",
    params: { count: 5 }, values: [3, 5, 8], rarity: 2, price: 12,
    desc: "5色以上を同時に消すとコンボ数x[3/5/8]倍。",
  },
  {
    id: "bonus_6c", name: "六色の秘儀", type: "passive", effect: "color_multiplier",
    params: { count: 6 }, values: [4, 7, 12], rarity: 2, price: 15,
    desc: "6色すべてを同時に消すとコンボ数x[4/7/12]倍。",
  },

  // --- Passive: Skyfall Bonus ---
  {
    id: "bonus_skyfall", name: "天恵の追撃", type: "passive", effect: "skyfall_bonus",
    values: [5, 8, 12], rarity: 3, price: 8,
    desc: "落ちコン発生時にコンボ+[5/8/12]。",
  },

  // --- Passive: Drops Erased Requirement Bonus ---
  { id: "req_6_fire", name: "炎の真髄", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "炎を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。" },
  { id: "req_6_water", name: "雨の真髄", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "雨を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。" },
  { id: "req_6_wood", name: "風の真髄", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "風を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。" },
  { id: "req_6_light", name: "雷の真髄", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "雷を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。" },
  { id: "req_6_dark", name: "月の真髄", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "月を合計で6個以上消しているとコンボ数x[2/2.5/3]倍。" },
  { id: "req_6_heart", name: "癒の真髄", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 6 }, values: [2, 2.5, 3], rarity: 1, price: 9, desc: "ハートを合計で6個以上消しているとコンボ数x[2/2.5/3]倍。" },

  { id: "req_12_fire", name: "炎の極致", type: "passive", effect: "color_count_bonus", params: { color: "fire", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "炎を合計で12個以上消しているとコンボ数x[3/4/5]倍。" },
  { id: "req_12_water", name: "雨の極致", type: "passive", effect: "color_count_bonus", params: { color: "water", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "雨を合計で12個以上消しているとコンボ数x[3/4/5]倍。" },
  { id: "req_12_wood", name: "風の極致", type: "passive", effect: "color_count_bonus", params: { color: "wood", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "風を合計で12個以上消しているとコンボ数x[3/4/5]倍。" },
  { id: "req_12_light", name: "雷の極致", type: "passive", effect: "color_count_bonus", params: { color: "light", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "雷を合計で12個以上消しているとコンボ数x[3/4/5]倍。" },
  { id: "req_12_dark", name: "月の極致", type: "passive", effect: "color_count_bonus", params: { color: "dark", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "月を合計で12個以上消しているとコンボ数x[3/4/5]倍。" },
  { id: "req_12_heart", name: "癒の極致", type: "passive", effect: "color_count_bonus", params: { color: "heart", count: 12 }, values: [3, 4, 5], rarity: 2, price: 12, desc: "ハートを合計で12個以上消しているとコンボ数x[3/4/5]倍。" },

  // --- Passive: Exact Combo Bonus ---
  {
    id: "combo_exact_3",
    name: "三連の巧技",
    type: "passive",
    effect: "combo_if_exact",
    params: { combo: 3 },
    values: [10, 15, 25],
    rarity: 1, price: 6,
    desc: "3コンボちょうどでコンボ+[10/15/25]。",
  },
  {
    id: "combo_exact_10",
    name: "十連の極み",
    type: "passive",
    effect: "combo_if_exact",
    params: { combo: 10 },
    values: [15, 25, 40],
    rarity: 2, price: 9,
    desc: "10コンボちょうどでコンボ+[15/25/40]。",
  },
  // --- Passive: Combo Threshold Multiplier ---
  {
    id: "combo_ge_7",
    name: "七連の闘気",
    type: "passive",
    effect: "combo_if_ge",
    params: { combo: 7 },
    values: [2, 3, 5],
    rarity: 2, price: 10,
    desc: "7コンボ以上で最終コンボ[2/3/5]倍。",
  },

  // --- Passive: Shape Bonus（特殊消しボーナス） ---
  {
    id: "len4", name: "四連の術", type: "passive", effect: "shape_bonus",
    params: { shape: "len4" }, values: [2, 4, 6], rarity: 1, price: 5,
    desc: "4個ちょうど連結でコンボ+[2/4/6]。",
  },
  {
    id: "row_clear", name: "横一閃", type: "passive", effect: "shape_bonus",
    params: { shape: "row" }, values: [5, 10, 15], rarity: 1, price: 8,
    desc: "横1列消しでコンボ+[5/10/15]。",
  },
  {
    id: "square", name: "四方の型", type: "passive", effect: "shape_bonus",
    params: { shape: "square" }, values: [2, 3, 5], rarity: 1, price: 9,
    desc: "3x3正方形消しでコンボ×[2/3/5]倍。",
  },
  {
    id: "len5", name: "五星の印", type: "passive", effect: "shape_bonus",
    params: { shape: "len5" }, values: [1.5, 2, 3], rarity: 1, price: 7,
    desc: "5個以上連結で次手の操作時間[1.5/2/3]倍。",
  },
  {
    id: "cross", name: "十字の祈り", type: "passive", effect: "shape_bonus",
    params: { shape: "cross" }, values: [2, 3, 5], rarity: 1, price: 9,
    desc: "十字型消しで次手の操作時間[2/3/5]倍。",
  },
  {
    id: "l_shape", name: "鉤十字の型", type: "passive", effect: "shape_bonus",
    params: { shape: "l_shape" }, values: [3, 6, 9], rarity: 1, price: 9,
    desc: "L字消しでコンボ+[3/6/9]。",
  },
  {
    id: "bonus_heart", name: "癒の波動", type: "passive", effect: "heart_combo_bonus",
    values: [3, 5, 7], rarity: 1, price: 6,
    desc: "ハートドロップを消したコンボ数分、追加でコンボ+[3/5/7]。",
  },
  {
    id: "giant",
    name: "巨人の領域",
    type: "passive",
    effect: "expand_board",
    values: [1.2, 1.5, 2],
    rarity: 3, price: 9,
    desc: "装備中、盤面が7x6に拡張。コンボ倍率[1.2/1.5/2]倍。",
  },

  // --- Skills: Enhance Color ---
  { id: "enh_f", name: "星の導き・炎", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["fire"] }, rarity: 1, price: 4, desc: "盤面の炎を全て強化。消費E:{cost}" },
  { id: "enh_w", name: "星の導き・雨", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["water"] }, rarity: 1, price: 4, desc: "盤面の雨を全て強化。消費E:{cost}" },
  { id: "enh_g", name: "星の導き・風", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["wood"] }, rarity: 1, price: 4, desc: "盤面の風を全て強化。消費E:{cost}" },
  { id: "enh_l", name: "星の導き・雷", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["light"] }, rarity: 1, price: 4, desc: "盤面の雷を全て強化。消費E:{cost}" },
  { id: "enh_d", name: "星の導き・月", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["dark"] }, rarity: 1, price: 4, desc: "盤面の月を全て強化。消費E:{cost}" },
  { id: "enh_h", name: "星の導き・ハート", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["heart"] }, rarity: 1, price: 4, desc: "盤面のハートを全て強化。消費E:{cost}" },
  // ==========================================
  // --- Skills: Enhance Color (2-Color) ---
  // 指定の2色組み合わせ(6種)
  // ==========================================
  { id: "enh_fd", name: "星の導き・炎月", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "dark"] }, rarity: 2, price: 5, desc: "盤面の炎/月を全て強化。消費E:{cost}" },
  { id: "enh_wh", name: "星の導き・雨癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "heart"] }, rarity: 2, price: 5, desc: "盤面の雨/ハートを全て強化。消費E:{cost}" },
  { id: "enh_gl", name: "星の導き・風雷", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "light"] }, rarity: 2, price: 5, desc: "盤面の風/雷を全て強化。消費E:{cost}" },
  { id: "enh_wd", name: "星の導き・雨月", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "dark"] }, rarity: 2, price: 5, desc: "盤面の雨/月を全て強化. 消費E:{cost}" },
  { id: "enh_gh", name: "星の導き・風癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "heart"] }, rarity: 2, price: 5, desc: "盤面の風/ハートを全て強化. 消費E:{cost}" },
  { id: "enh_fl", name: "星の導き・炎雷", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "light"] }, rarity: 2, price: 5, desc: "盤面の炎/雷を全て強化. 消費E:{cost}" },


  // --- Skills: Special ---
  { id: "chrono", name: "クロノス・ストップ", type: "skill", cost: 6, costLevels: true, action: "chronos_stop", params: { duration: 10000 }, rarity: 2, price: 7, desc: "10秒間、自由に操作可能になる。消費E:{cost}" },

  // --- Passive: Enhanced Drop ---
  {
    id: "mana_crystal", name: "マナの結晶化", type: "passive", effect: "enhance_chance",
    values: [0.05, 0.1, 0.2], rarity: 1, price: 4,
    desc: "落下ドロップの[5/10/20]%が強化ドロップになる。",
  },
  {
    id: "enhance_amp", name: "強化増幅", type: "passive", effect: "enhanced_orb_bonus",
    values: [2, 4, 6], rarity: 2, price: 8,
    desc: "強化1個あたりのコンボ加算を+[2/4/6]する。",
  },
  {
    id: "over_link", name: "過剰結合", type: "passive", effect: "enhanced_link_multiplier",
    params: { count: 5 }, values: [2, 3, 5], rarity: 2, price: 9,
    desc: "強化5個以上を消したら倍率x[2/3/5]。",
  },

  // --- Passive: High Risk / High Return ---
  {
    id: "desperate_stance", name: "背水の陣", type: "passive", effect: "desperate_stance",
    values: [4, 6, 8], rarity: 3, price: 12,
    desc: "操作時間が常に4秒固定。最終コンボ倍率x[4/6/8]倍。",
  },
  {
    id: "greed_power", name: "金満の暴力", type: "passive", effect: "greed_power",
    values: [7, 5, 3], rarity: 1, price: 10,
    desc: "★[7/5/3]個につきコンボ倍率+1加算。",
  },
  {
    id: "picky_eater", name: "偏食家", type: "passive", effect: "picky_eater",
    params: { excludeColors: ["heart", "light", "dark"] },
    values: [-2, -1, 0], rarity: 3, price: 9,
    desc: "ハート/雷/月が出現しなくなる。手番[−2/−1/±0]。",
  },
  {
    id: "cursed_power", name: "呪われた力", type: "passive", effect: "cursed_power",
    values: [15, 25, 40], rarity: 1, price: 10,
    desc: "常にコンボ+[15/25/40]。操作時間−2秒。",
  },
  {
    id: "critical_passive",
    name: "会心の一撃",
    type: "passive",
    effect: "critical_strike",
    values: [15, 30, 50],
    rarity: 3, price: 10,
    desc: "20%の確率で、最終コンボ倍率が[15/30/50]倍になる。",
  },
  {
    id: "shape_master",
    name: "百般の型の極意",
    type: "passive",
    effect: "shape_variety_mult",
    values: [3, 4, 5],
    rarity: 2, price: 12,
    desc: "1ターンの間に異なる特殊消しを2種類以上発動させると、コンボ数x[3/4/5]倍。",
  },
  {
    id: "zero_charge",
    name: "静寂の瞑想",
    type: "passive",
    effect: "zero_combo_charge",
    values: [3, 5, 7],
    rarity: 1, price: 9,
    desc: "0コンボの時、スキルのエネルギーを[3/5/7]チャージする。",
  },
  {
    id: "random_add",
    name: "気まぐれなダイス",
    type: "passive",
    effect: "random_add",
    values: [
      [0, 1, 2, 3, 4, 5, 10],
      [0, 2, 4, 6, 8, 10, 30],
      [0, 3, 6, 9, 12, 15, 100]
    ],
    rarity: 2, price: 6,
    desc: "コンボ加算にランダムな値を追加する",
  },
  {
    id: "star1_combo_boost", name: "一星の共鳴", type: "passive", effect: "star_count_combo_add",
    params: { rarity: 1 }, values: [1, 2, 3], rarity: 2, price: 6,
    desc: "所持している★1トークン数 × [1/2/3]をコンボ数に加算する。",
  },
  {
    id: "star2_time_boost", name: "二星の延刻", type: "passive", effect: "star_count_time_ext",
    params: { rarity: 2 }, values: [2, 3, 4], rarity: 2, price: 6,
    desc: "所持している★2トークン数 × [2/3/4]秒 操作時間を延長する。",
  },
  {
    id: "star3_mult_boost", name: "三星の極雷", type: "passive", effect: "star_count_combo_mult",
    params: { rarity: 3 }, values: [1.2, 1.5, 2], rarity: 3, price: 9,
    desc: "所持している★3トークン数 × [1.2/1.5/2]倍 コンボ倍率を乗算する。",
  },
  {
    id: "enchant_mult_boost", name: "魔導の共犯", type: "passive", effect: "enchant_count_combo_mult",
    values: [1.1, 1.2, 1.5], rarity: 3, price: 9,
    desc: "所持しているエンチャント数 × [1.1/1.2/1.5]倍 コンボ倍率を乗算する。",
  },
  // --- New Stat-Based Passives (Combo & Multiplier) ---
  {
    id: "memory_of_combo", name: "コンボの記憶", type: "passive", effect: "stat_combo_記憶",
    values: [1, 2, 3], rarity: 2, price: 6,
    desc: "現在のゲーム中の「最大コンボ数」5コンボにつき、常にコンボ加算 +[1/2/3]。",
  },
  {
    id: "echo_of_max", name: "極大の余韻", type: "passive", effect: "stat_mult_余韻",
    values: [0.1, 0.2, 0.5], rarity: 3, price: 9,
    desc: "現在のゲーム中の「最大コンボ倍率」の[10/20/50]%を、常時コンボ倍率に乗算する。",
  },
  {
    id: "thousand_arms", name: "千手観音", type: "passive", effect: "stat_mult_千手",
    values: [1.1, 1.2, 1.3], rarity: 3, price: 10,
    desc: "現在のゲーム中の「累計コンボ数」100ごとに、コンボ倍率が x[1.1/1.2/1.3] 上昇する。",
  },
  // --- New Stat-Based Passives (Shape) ---
  {
    id: "seeker_of_cross", name: "十字の求道者", type: "passive", effect: "stat_shape_cross",
    values: [1, 2, 3], rarity: 2, price: 8,
    desc: "現在のゲーム中の「十字消し累計回数」5回につき、十字消しの際に追加でコンボ加算 +[1/2/3]。",
  },
  {
    id: "seeker_of_len4", name: "四連の探求者", type: "passive", effect: "stat_shape_len4",
    values: [1, 2, 3], rarity: 2, price: 6,
    desc: "現在のゲーム中の「4個消し累計回数」20回につき、4個消しの際に追加でコンボ加算 +[1/2/3]。",
  },
  {
    id: "polishing_claw", name: "鉤爪の研鑽", type: "passive", effect: "stat_shape_l",
    values: [1, 2, 3], rarity: 2, price: 5,
    desc: "現在のゲーム中の「L字消し累計回数」1回につき、このトークンの売却値が[1/2/3]上がる。",
  },
  {
    id: "memory_of_flash", name: "一閃の記憶", type: "passive", effect: "stat_shape_row",
    values: [1.1, 1.3, 1.5], rarity: 2, price: 9,
    desc: "現在のゲーム中の「横1列消し累計回数」5回につき、横1列消しのコンボ倍率が x[1.1/1.3/1.5] 上昇する。",
  },
  {
    id: "artisan_of_square", name: "方陣の職人", type: "passive", effect: "stat_shape_square",
    values: [1.5, 2, 4], rarity: 3, price: 10,
    desc: "現在のゲーム中の「四角消し累計回数」5回につき、コンボ倍率が x[1.5/2/4] 上昇する。",
  },
  {
    id: "guide_of_fivestar", name: "五星の導き手", type: "passive", effect: "stat_shape_len5",
    values: [0.5, 1.0, 1.5], rarity: 2, price: 8,
    desc: "現在のゲーム中の「5個以上連結消し累計回数」10回につき、5個消しの次手操作時間が +[0.5/1.0/1.5]秒 される。",
  },
  // --- New Stat-Based Passives (Resource & Action) ---
  {
    id: "pride_of_spendthrift", name: "浪費家の意地", type: "passive", effect: "stat_spend_star",
    values: [1.1, 1.2, 1.3], rarity: 3, price: 10,
    desc: "現在のゲーム中の「累計消費スター数」50★につき、コンボ倍率 x[1.1/1.2/1.3] 上昇。",
  },
  // --- New Stat-Based Passives (Time & Progress) ---
  {
    id: "proof_of_veteran", name: "歴戦の証明", type: "passive", effect: "stat_progress_clear",
    values: [0.01, 0.02, 0.03], rarity: 3, price: 9,
    desc: "「現在のクリア回数」の進行ごとに、強化ドロップ確率が +[1/2/3]%。",
  },
  {
    id: "end_of_thought", name: "熟考の果て", type: "passive", effect: "stat_time_move",
    values: [0.05, 0.1, 0.15], rarity: 2, price: 7,
    desc: "「合計操作時間」1分につき、目標達成後のスキップボーナス獲得量が +[5/10/15]%。",
  },
  {
    id: "bomb_erase_mult", name: "爆熱の余韻", type: "passive", effect: "bomb_erase_mult",
    values: [1.2, 1.3, 1.5], rarity: 3, price: 9,
    desc: "ボムの効果で消えたドロップ数 × [1.2/1.3/1.5] 倍、コンボ倍率に乗算される。",
  },
  {
    id: "repeat_combo_mult", name: "連鎖の共鳴", type: "passive", effect: "repeat_combo_mult",
    values: [1.3, 1.5, 2], rarity: 3, price: 9,
    desc: "リピートドロップの消去数 × [1.3/1.5/2] 倍、コンボ倍率に乗算される。",
  },
  {
    id: "ignited_drop_fire", name: "爆炎の兆し", type: "passive", effect: "bomb_chance_color", params: { color: "fire" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 9,
    desc: "炎ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
  },
  {
    id: "ignited_drop_dark", name: "暗黒の兆し", type: "passive", effect: "bomb_chance_color", params: { color: "dark" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 9,
    desc: "月ドロップが、[3/5/10]%の確率でボムドロップとして降ってくるようになる。",
  },
  // --- New Active Skills ---
  { id: "active_mult_1", name: "覚醒の鼓動", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 2, duration: 3 }, rarity: 2, price: 6, desc: "3手番、最終コンボ倍率が2倍になる。消費E:{cost}" },
  { id: "active_mult_2", name: "一刃の極意", type: "skill", cost: 6, costLevels: true, action: "temp_mult", params: { multiplier: 5, duration: 1 }, rarity: 3, price: 10, desc: "1手番、最終コンボ倍率が5倍になる。消費E:{cost}" },
  { id: "seal_of_power", name: "力の封印", type: "skill", cost: 6, costLevels: true, action: "seal_of_power", params: { multiplier: 5, duration: 1 }, rarity: 3, price: 10, desc: "1手番、全エンチャント効果が無効になるが、コンボ倍率が5倍になる。消費E:{cost}" },
  {
    id: "contract_of_void", name: "虚無の契約", type: "passive", effect: "contract_of_void",
    values: [3, 4, 5], rarity: 3, price: 12,
    desc: "全エンチャント効果が無効になる代わりに、コンボ倍率が常にx[3/4/5]倍になる。",
  },
  { id: "gen_repeat_rand", name: "循環の理", type: "skill", cost: 3, costLevels: true, action: "spawn_repeat", params: { count: 1 }, rarity: 2, price: 5, desc: "ランダムなドロップ1つをリピートドロップ（2回消える）にする。消費E:{cost}" },
  { id: "conv_repeat_water", name: "雨鏡の輪廻", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "water" }, rarity: 3, price: 9, desc: "ランダムな雨ドロップ2つをリピートドロップにする。消費E:{cost}" },
  { id: "conv_repeat_heart", name: "生命の輪廻", type: "skill", cost: 4, costLevels: true, action: "convert_repeat", params: { count: 2, color: "heart" }, rarity: 3, price: 9, desc: "ランダムなハートドロップ2つをリピートドロップにする。消費E:{cost}" },
  {
    id: "repeat_chance_water", name: "雨波の巡り", type: "passive", effect: "repeat_chance_color", params: { color: "water" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 7,
    desc: "雨ドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
  },
  {
    id: "repeat_chance_heart", name: "生命の巡り", type: "passive", effect: "repeat_chance_color", params: { color: "heart" },
    values: [0.03, 0.05, 0.10], rarity: 2, price: 7,
    desc: "ハートドロップが、[3/5/10]%の確率でリピートドロップとして降ってくるようになる。",
  },
  {
    id: "repeat_erase_combo", name: "反響する輪舞", type: "passive", effect: "repeat_erase_combo",
    values: [2, 3, 5], rarity: 3, price: 10,
    desc: "ターン中にリピートドロップが消えた数 × [2/3/5] コンボを加算する。",
  },
  {
    id: "repeat_extra_activations", name: "無限の風霊", type: "passive", effect: "extra_repeat_activations",
    values: [1, 2, 3], rarity: 3, price: 9,
    desc: "リピートドロップ消去時、リピート効果が追加で[1/2/3]回発動する。",
  },
  // --- New Star Drop Skills ---
  { id: "gen_star_rand", name: "星の創造", type: "skill", cost: 3, costLevels: true, action: "spawn_star", params: { count: 5 }, rarity: 2, price: 6, desc: "ランダムなドロップ5つをスタードロップにする。消費E:{cost}" },
  { id: "conv_star_wood", name: "星降る森", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "wood" }, rarity: 2, price: 9, desc: "風ドロップを全てスタードロップにする。消費E:{cost}" },
  { id: "conv_star_light", name: "星降る雷", type: "skill", cost: 5, costLevels: true, action: "convert_star", params: { count: "all", color: "light" }, rarity: 2, price: 9, desc: "雷ドロップを全てスタードロップにする。消費E:{cost}" },
  {
    id: "star_chance_wood", name: "星宿る風", type: "passive", effect: "star_chance_color", params: { color: "wood" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 8,
    desc: "風ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
  },
  {
    id: "star_chance_light", name: "星宿る雷", type: "passive", effect: "star_chance_color", params: { color: "light" },
    values: [0.10, 0.30, 0.50], rarity: 2, price: 8,
    desc: "雷ドロップが、[10/30/50]%の確率でスタードロップとして降ってくるようになる。",
  },
  {
    id: "star_erase_mult", name: "星屑の共鳴", type: "passive", effect: "star_erase_mult",
    values: [0.5, 1.0, 1.5], rarity: 3, price: 10,
    desc: "ターン中にスタードロップが消えた数 × [0.5/1/1.5] 倍、コンボ倍率に乗算される。",
  },
  {
    id: "star_earn_boost", name: "星の祝福", type: "passive", effect: "star_earn_boost",
    values: [3, 5, 8], rarity: 2, price: 8,
    desc: "スタードロップが消えた時にもらえるスター（通貨）の数が3/5/8個増える。",
  },
  // --- New Rainbow Drop Skills ---
  { id: "gen_rainbow_rand", name: "虹の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_rainbow", params: { count: 1 }, rarity: 2, price: 6, desc: "ランダムなドロップ1つをカウント3の虹ドロップにする。消費E:{cost}" },
  { id: "rainbow_masterx", name: "虹の極致", type: "skill", cost: 5, costLevels: true, action: "rainbow_master", params: { count: 1, to: 5 }, rarity: 3, price: 12, desc: "ランダムに虹ドロップを1つ生成し、盤面の全ての虹ドロップのカウントを5にする。消費E:{cost}" },
  {
    id: "rainbow_chance", name: "虹の呼び声", type: "passive", effect: "rainbow_chance",
    values: [0.02, 0.04, 0.07], rarity: 2, price: 8,
    desc: "ドロップが[2/4/7]%の確率で虹ドロップとして降ってくるようになる。",
  },
  {
    id: "rainbow_bridge", name: "虹の架け橋", type: "passive", effect: "rainbow_combo_bonus",
    values: [1, 2, 5], rarity: 3, price: 10,
    desc: "虹ドロップがコンボに関与した際、コンボ加算がさらに +[1/2/5] される。",
  },
  {
    id: "total_level_boost", name: "全霊の共鳴", type: "passive", effect: "total_level_combo_add",
    values: [1, 1.5, 2], rarity: 3, price: 12,
    desc: "所持しているトークンのレベル数の合計 × [1/1.5/2] をコンボ数に加算する。",
  },
  {
    id: "level3_count_mult", name: "三魂の極致", type: "passive", effect: "level3_count_combo_mult",
    values: [1, 1.5, 2], rarity: 3, price: 15,
    desc: "所持しているレベル3トークンの数 × [1/1.5/2] 倍 コンボ倍率を乗算する。",
  },
  {
    id: "copy_token", name: "模倣の魔鏡", type: "passive", effect: "copy_left",
    values: [1], rarity: 3, price: 10,
    desc: "左隣のトークンの効果とエンチャントをコピーする。自身はレベルアップせず、エンチャントも付与されない。",
  },
  {
    id: "duration_booster", name: "刻の歯車", type: "passive", effect: "active_duration_boost",
    values: [1, 2, 3], rarity: 3, price: 15,
    desc: "効果手番があるアクティブスキルの持続時間を [+1/+2/+3] 手番延長する。",
  }
];

const ENCHANT_DESCRIPTIONS = {
  resonance: "トークンのLv分、コンボ加算値を乗算する。",
  greed: "現在の所持★数をコンボ加算値に加える。",
  chain: "コンボ加算値を一律+3する。",
  extra_turn: "目標達成までの手番が +1 される。",
  time_leap: "前のサイクルでスキップしたターン数分、次のサイクルの全ターンでコンボ加算。",
  combo_fire: "炎の1コンボにつきコンボ+1。",
  combo_water: "雨の1コンボにつきコンボ+1。",
  combo_wood: "風の1コンボにつきコンボ+1。",
  combo_light: "雷の1コンボにつきコンボ+1。",
  combo_dark: "月の1コンボにつきコンボ+1。",
  combo_heart: "ハートの1コンボにつきコンボ+1。",
  enh_drop_fire: "炎ドロップが15%強化で落下。",
  enh_drop_water: "雨ドロップが15%強化で落下。",
  enh_drop_wood: "風ドロップが15%強化で落下。",
  enh_drop_light: "雷ドロップが15%強化で落下。",
  enh_drop_dark: "月ドロップが15%強化で落下。",
  enh_drop_heart: "ハートドロップが15%強化で落下。",
  sf_up_fire: "炎ドロップが少し落ちやすくなる。",
  sf_up_water: "雨ドロップが少し落ちやすくなる。",
  sf_up_wood: "風ドロップが少し落ちやすくなる。",
  sf_up_light: "雷ドロップが少し落ちやすくなる。",
  sf_up_dark: "月ドロップが少し落ちやすくなる。",
  sf_up_heart: "ハートドロップが少し落ちやすくなる。",
  sf_down_fire: "炎ドロップが少し落ちにくくなる。",
  sf_down_water: "雨ドロップが少し落ちにくくなる。",
  sf_down_wood: "風ドロップが少し落ちにくくなる。",
  sf_down_light: "雷ドロップが少し落ちにくくなる。",
  sf_down_dark: "月ドロップが少し落ちにくくなる。",
  sf_down_heart: "ハートドロップが少し落ちにくくなる。",
  opener: "サイクルの1ターン目のみ、コンボ+20。",
  clutch: "サイクルの最終ターンのみ、コンボ倍率x2.5。",
  rainbow: "4色以上同時消しで、コンボ+5。",
  sniper: "消した色が2色以下の場合、コンボ倍率x1.8。",
  haste: "操作時間を+2秒延長する。",
  quick_charge: "スキルのチャージ速度が2倍になる。",
  critical: "20%の確率で、この補正倍率が15倍になる。",
  gamble: "ターンごとに -5〜+15 のランダムなコンボ加算。",
  rarity_up: "ショップにレア度の高いトークンが出やすくなる。",
  rarity_down_combo: "ショップにレア度の高いトークンが出にくくなるが、コンボ数+1。",
  shape_match4: "4つ消し1つにつき、コンボ倍率x1.5。",
  shape_cross: "十字消し1つにつき、コンボ倍率x1.8。",
  shape_row: "横一列消し1つにつき、コンボ倍率x2。",
  shape_l: "L字消し1つにつき、コンボ倍率x1.8。",
  shape_square: "正方形消し1つにつき、コンボ倍率x2.5。",
  efficiency: "このスキルの消費エネルギーを-1する(最小1)。",
  berserk: "操作時間-1秒、コンボ倍率x2。",
  aftershock: "落ちコン発生時、最終コンボ倍率x2。",
  investment: "このトークンの売却価格が購入価格の300%になる。",
  enc_bonus_fire: "炎を消しているとコンボ倍率x1.5。",
  enc_bonus_water: "雨を消しているとコンボ倍率x1.5。",
  enc_bonus_wood: "風を消しているとコンボ倍率x1.5。",
  enc_bonus_light: "雷を消しているとコンボ倍率x1.5。",
  enc_bonus_dark: "月を消しているとコンボ倍率x1.5。",
  enc_bonus_heart: "ハートを消しているとコンボ倍率x1.5。",
  bomb_burst_combo: "ボムドロップが消えた時、追加で3コンボ加算する。",
  accum_technique: "「合計特殊消し回数(4個+1列+L字+十字+四角)」20回につき、コンボ加算+1。",
  magic_resonance: "「スキル使用回数」10回につき、全アクティブスキルの消費エネルギー-1。"
};

const MAX_COMBO = 2147483647;
const MAX_TARGET = 4294967294;

const getEnchantDescription = (id) => ENCHANT_DESCRIPTIONS[id] || "";

const ENCHANTMENTS = [

  {
    id: "resonance",
    name: "レベル共鳴",
    effect: "lvl_mult",
    rarity: 2, price: 10,
  },
  {
    id: "greed",
    name: "強欲の輝き",
    effect: "star_add",
    rarity: 3, price: 11,
  },
  {
    id: "chain",
    name: "連鎖の刻印",
    effect: "fixed_add",
    value: 3,
    rarity: 1, price: 7,
  },
  {
    id: "extra_turn",
    name: "時の刻印",
    effect: "add_turn",
    rarity: 2, price: 9,
  },
  {
    id: "time_leap",
    name: "時の跳躍",
    effect: "skip_turn_combo",
    rarity: 2, price: 9,
  },
  // --- New: Color Combo Bonus Enchantments ---
  { id: "combo_fire", name: "炎の加護", effect: "color_combo", params: { color: "fire" }, rarity: 3, price: 8 },
  { id: "combo_water", name: "雨の加護", effect: "color_combo", params: { color: "water" }, rarity: 3, price: 8 },
  { id: "combo_wood", name: "森の加護", effect: "color_combo", params: { color: "wood" }, rarity: 3, price: 8 },
  { id: "combo_light", name: "雷の加護", effect: "color_combo", params: { color: "light" }, rarity: 3, price: 8 },
  { id: "combo_dark", name: "月の加護", effect: "color_combo", params: { color: "dark" }, rarity: 3, price: 8 },
  { id: "combo_heart", name: "癒の加護", effect: "color_combo", params: { color: "heart" }, rarity: 3, price: 8 },
  // --- Enhanced Drop Enchantments ---
  { id: "enh_drop_fire", name: "炎の強化落下", effect: "enhance_chance_color", params: { color: "fire" }, value: 0.15, rarity: 3, price: 8 },
  { id: "enh_drop_water", name: "雨の強化落下", effect: "enhance_chance_color", params: { color: "water" }, value: 0.15, rarity: 3, price: 8 },
  { id: "enh_drop_wood", name: "風の強化落下", effect: "enhance_chance_color", params: { color: "wood" }, value: 0.15, rarity: 3, price: 8 },
  { id: "enh_drop_light", name: "雷の強化落下", effect: "enhance_chance_color", params: { color: "light" }, value: 0.15, rarity: 3, price: 8 },
  { id: "enh_drop_dark", name: "月の強化落下", effect: "enhance_chance_color", params: { color: "dark" }, value: 0.15, rarity: 3, price: 8 },
  { id: "enh_drop_heart", name: "ハートの強化落下", effect: "enhance_chance_color", params: { color: "heart" }, value: 0.15, rarity: 3, price: 8 },
  // --- Skyfall Boost (Probability Up) ---
  { id: "sf_up_fire", name: "炎の呼び声", effect: "skyfall_boost", params: { color: "fire" }, rarity: 3, price: 8 },
  { id: "sf_up_water", name: "雨の呼び声", effect: "skyfall_boost", params: { color: "water" }, rarity: 3, price: 8 },
  { id: "sf_up_wood", name: "森の呼び声", effect: "skyfall_boost", params: { color: "wood" }, rarity: 3, price: 8 },
  { id: "sf_up_light", name: "雷の呼び声", effect: "skyfall_boost", params: { color: "light" }, rarity: 3, price: 8 },
  { id: "sf_up_dark", name: "月の呼び声", effect: "skyfall_boost", params: { color: "dark" }, rarity: 3, price: 8 },
  { id: "sf_up_heart", name: "癒の呼び声", effect: "skyfall_boost", params: { color: "heart" }, rarity: 3, price: 8 },
  // --- Skyfall Nerf (Probability Down) ---
  { id: "sf_down_fire", name: "炎の静寂", effect: "skyfall_nerf", params: { color: "fire" }, rarity: 3, price: 8 },
  { id: "sf_down_water", name: "雨の静寂", effect: "skyfall_nerf", params: { color: "water" }, rarity: 3, price: 8 },
  { id: "sf_down_wood", name: "森の静寂", effect: "skyfall_nerf", params: { color: "wood" }, rarity: 3, price: 8 },
  { id: "sf_down_light", name: "雷の静寂", effect: "skyfall_nerf", params: { color: "light" }, rarity: 3, price: 8 },
  { id: "sf_down_dark", name: "月の静寂", effect: "skyfall_nerf", params: { color: "dark" }, rarity: 3, price: 8 },
  { id: "sf_down_heart", name: "癒の静寂", effect: "skyfall_nerf", params: { color: "heart" }, rarity: 3, price: 8 },
  { id: "opener", name: "先制の心得", effect: "turn_1_bonus", value: 20, rarity: 3, price: 9 },
  { id: "clutch", name: "土壇場の底力", effect: "last_turn_mult", value: 2.5, rarity: 3, price: 10 },
  { id: "rainbow", name: "虹色の加護", effect: "multi_color", value: 5, rarity: 3, price: 10 },
  { id: "sniper", name: "一点突破", effect: "single_color", value: 1.8, rarity: 3, price: 9 },
  { id: "haste", name: "疾風の刻印", effect: "time_ext_enc", value: 2, rarity: 3, price: 9 },
  { id: "quick_charge", name: "急速チャージ", effect: "charge_boost_passive", rarity: 3, price: 10 },
  { id: "critical", name: "会心の一撃", effect: "critical_strike", value: 15, rarity: 3, price: 10 },
  { id: "gamble", name: "運命の悪戯", effect: "random_bonus", rarity: 2, price: 7 },

  // --- Rarity Modifier Enchantments ---
  { id: "rarity_up", name: "幸運の星", effect: "rarity_up", rarity: 1, price: 9 },
  { id: "rarity_down_combo", name: "流星の約束", effect: "rarity_down_combo", rarity: 1, price: 9 },

  // --- 形状別極意エンチャント (Geometry Split) ---
  { id: "shape_match4", name: "四連の極意", effect: "shape_match4", value: 1.5, rarity: 3, price: 8 },
  { id: "shape_cross", name: "十字の極意", effect: "shape_cross", value: 1.8, rarity: 3, price: 8 },
  { id: "shape_row", name: "一列の極意", effect: "shape_row", value: 2.0, rarity: 3, price: 8 },
  { id: "shape_l", name: "L字の極意", effect: "shape_l", value: 1.8, rarity: 3, price: 8 },
  { id: "shape_square", name: "正方形の極意", effect: "shape_square", value: 2.5, rarity: 3, price: 8 },

  { id: "efficiency", name: "魔力節約", effect: "cost_down", rarity: 3, price: 10 },
  { id: "berserk", name: "狂戦士の刻印", effect: "berserk_mode", value: 2, rarity: 3, price: 10 },
  { id: "aftershock", name: "追撃の心得", effect: "skyfall_mult", value: 2, rarity: 3, price: 9 },
  { id: "investment", name: "資産価値", effect: "high_sell", rarity: 2, price: 6 },
  // --- 色別連舞エンチャント (1.2倍) ---
  { id: "enc_bonus_fire", name: "炎の連舞", effect: "color_multiplier_enc", params: { color: "fire" }, value: 1.5, rarity: 3, price: 8 },
  { id: "enc_bonus_water", name: "雨の連舞", effect: "color_multiplier_enc", params: { color: "water" }, value: 1.5, rarity: 3, price: 8 },
  { id: "enc_bonus_wood", name: "風の連舞", effect: "color_multiplier_enc", params: { color: "wood" }, value: 1.5, rarity: 3, price: 8 },
  { id: "enc_bonus_light", name: "雷の連舞", effect: "color_multiplier_enc", params: { color: "light" }, value: 1.5, rarity: 3, price: 8 },
  { id: "enc_bonus_dark", name: "月の連舞", effect: "color_multiplier_enc", params: { color: "dark" }, value: 1.5, rarity: 3, price: 8 },
  { id: "enc_bonus_heart", name: "癒の連舞", effect: "color_multiplier_enc", params: { color: "heart" }, value: 1.5, rarity: 3, price: 8 },

  // --- New Stat-Based Enchantments ---
  { id: "bomb_burst_combo", name: "誘爆の雷管", effect: "bomb_burst_combo", rarity: 3, price: 9 },
  { id: "accum_technique", name: "技巧の蓄積", effect: "stat_shape_all", rarity: 3, price: 9 },
  { id: "magic_resonance", name: "魔力共鳴", effect: "stat_skill_use", rarity: 3, price: 10 }
];


const getEffectiveCost = (token, currentRunStats = null, currentTokens = [], currentBuffs = []) => {
  if (!token || token.type !== 'skill') return token?.cost || 0;
  const baseCost = token.cost || 0;
  if (baseCost === 0) return 0;
  const level = token.level || 1;
  const reduction = Math.max(0, level - 1);

  const isEnchantDisabled = currentTokens.some(t => t?.effect === "contract_of_void") ||
    currentBuffs.some(b => b?.action === "seal_of_power");

  let enchantReduction = 0;
  let resonanceReduction = 0;

  if (!isEnchantDisabled) {
    enchantReduction = token.enchantments?.filter(e => e.effect === "cost_down").length || 0;
    if (currentRunStats && token.enchantments?.some(e => e.effect === "stat_skill_use")) {
      resonanceReduction = Math.floor((currentRunStats.currentSkillsUsed || 0) / 10);
    }
  }

  const minCost = 1;
  return Math.max(minCost, baseCost - reduction - enchantReduction - resonanceReduction);
};

const getTokenDescription = (item, level, currentRunStats = null, currentTokens = [], currentBuffs = []) => {
  const base = ALL_TOKEN_BASES.find((b) => b.id === (item.id || item));
  if (!base) return item?.desc || "";

  const targetLv = level || item?.level || 1;
  let d = base.desc;

  if (base.costLevels) {
    const cost = getEffectiveCost({ ...item, cost: base.cost, level: targetLv, type: 'skill' }, currentRunStats, currentTokens, currentBuffs);
    d = d.replace(/{cost}/g, cost);
  }

  if (base.values) {
    const value = base.values[targetLv - 1];
    if (value !== undefined) {
      d = d.replace(/\[?([−±\-\d.]+(?:\/[−±\-\d.]+)+)\]?/g, (match, contents) => {
        const parts = contents.split('/');
        const val = parts[targetLv - 1] !== undefined ? parts[targetLv - 1] : value;
        // 小数点を含む数値の場合、フォーマット（最大小数第二位、末尾の0削除）
        if (!isNaN(parseFloat(val))) {
          return Math.round(parseFloat(val) * 100) / 100;
        }
        return val;
      });
      d = d.replace(/Lvに応じ/g, "");
      const formattedValue = !isNaN(parseFloat(value)) ? Math.round(parseFloat(value) * 100) / 100 : value;
      d = d.replace(/Lv分/g, `${formattedValue}`);
    }
  }
  return d;
};

// --- Puzzle Engine (Imperative Logic) ---
// --- Puzzle Engine (Imperative Logic) ---
class PuzzleEngine {
  constructor(container, timerBar, comboEl, options = {}) {
    this.container = container;
    this.timerBar = timerBar;
    this.comboEl = comboEl;
    this.rows = options.rows || 5;
    this.cols = options.cols || 6;
    this.timeLimit = options.timeLimit || 5000;
    this.minMatchLength = options.minMatchLength || 3;
    this.onTurnEnd = options.onTurnEnd || (() => { });
    this.onCombo = options.onCombo || (() => { });
    this.onPassiveTrigger = options.onPassiveTrigger || null;
    this.onStarErase = options.onStarErase || null;
    this.totalMoveTimeRef = options.totalMoveTimeRef || { current: 0 }; // 操作時間加算用Ref

    // Will be calculated in init()
    this.orbSize = 0;
    this.gap = 0; // Will be set relative to orb size or container

    this.types = ["fire", "water", "wood", "light", "dark", "heart"];
    this.icons = {
      fire: "local_fire_department",
      water: "water_drop",
      wood: "grass",
      light: "light_mode",
      dark: "dark_mode",
      heart: "favorite",
    };

    this.state = [];
    this.dragging = null;
    this.moveStart = null;
    this.timerId = null;
    this.processing = false;
    this.currentCombo = 0;
    this.noSkyfall = false;
    this.spawnWeights = {};
    this.types.forEach((t) => (this.spawnWeights[t] = 1));
    this.timerProgress = 1; // Added for external display

    // Bindings
    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.updateTimer = this.updateTimer.bind(this);

    this._isDestroyed = false;
    this._rafId = null; // requestAnimationFrame ID
    this.realtimeBonuses = { len4: 0, row: 0 };
    this.enhanceRates = { global: 0, colors: {} };
    this.rainbowRates = 0; // chance to spawn rainbow drop
    this.chronosStopActive = false;
    this.chronosTimerId = null;
  }

  setRealtimeBonuses(bonuses) {
    this.realtimeBonuses = { len4: 0, row: 0, l_shape: 0, ...bonuses };
  }

  setEnhanceRates(rates) {
    this.enhanceRates = rates;
  }

  setBombRates(rates) {
    this.bombRates = rates;
  }

  setRainbowRates(rates) {
    this.rainbowRates = rates;
  }

  addPlusMark(el) {
    if (el.querySelector('.enhanced-mark')) return;
    const enhancedMark = document.createElement('div');
    enhancedMark.className = "enhanced-mark absolute top-0 right-0 w-4 h-4 bg-yellow-400 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white";
    enhancedMark.innerText = '+';
    el.appendChild(enhancedMark);
  }

  /** 現在の盤面状態をシリアライズ可能なオブジェクトとして取得 */
  getState() {
    return this.state.map(row =>
      row.map(orb => {
        if (!orb) return null;
        return {
          type: orb.type,
          isEnhanced: !!orb.isEnhanced,
          isBomb: !!orb.isBomb,
          isRepeat: !!orb.isRepeat,
          isRainbow: !!orb.isRainbow,
          rainbowCount: orb.rainbowCount,
          isStar: !!orb.isStar,
        };
      })
    );
  }

  init(initialState = null) {
    if (this.processing) return;
    this._isDestroyed = false;

    this.gap = 8;
    // Calculate responsive orb size
    const rect = this.container.getBoundingClientRect();
    if (rect.width > 0) {
      this.orbSize = (rect.width - (this.cols - 1) * this.gap) / this.cols;
    } else {
      // Fallback
      this.orbSize = 60;
    }

    // Ensure height matches grid
    // Important: container height should not force layout shift if possible, but for absolute positioning we need it?
    // Actually, App.jsx sets aspect-ratio, so height is already determined by CSS.
    // We just need to make sure we don't overflow.

    this.state = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(null);
      }
      this.state.push(row);
    }
    this.container.innerHTML = "";
    this.currentCombo = 0;
    if (this.comboEl) {
      this.comboEl.innerText = "";
      this.comboEl.style.display = "none";
    }

    if (initialState && Array.isArray(initialState)) {
      // 保存された状態から復元
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const savedOrb = initialState[r] && initialState[r][c];
          if (savedOrb) {
            this.spawnOrb(r, c, false, 0, savedOrb);
          }
        }
      }
    } else {
      // 新規盤面を生成
      this.spawnInitialBoard();
    }
    this.render();

    // Resize listener with debounce
    if (!this.resizeListener) {
      this.resizeListener = this.handleResize.bind(this);
      window.addEventListener('resize', this.resizeListener);
    }
  }

  // 初期盤面を生成する（マッチを避けてオーブを配置）
  spawnInitialBoard() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.spawnOrb(r, c, false);
      }
    }
  }

  handleResize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width <= 0) return;

    this.gap = 8;
    this.orbSize = (rect.width - (this.cols - 1) * this.gap) / this.cols;
    // リサイズ時はbaseTop/baseLeftも再計算
    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb) {
          orb.baseTop = (r * (this.orbSize + this.gap));
          orb.baseLeft = (c * (this.orbSize + this.gap));
          orb.el.style.width = `${this.orbSize}px`;
          orb.el.style.height = `${this.orbSize}px`;
          orb.el.style.top = `${orb.baseTop}px`;
          orb.el.style.left = `${orb.baseLeft}px`;
          orb.el.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    });
  }



  spawnOrb(r, c, isNew, startRowOffset = 0, savedData = null) {
    let type;
    if (savedData) {
      type = savedData.type;
    } else if (!isNew) {
      let availableTypes = [...this.types];
      while (availableTypes.length > 0) {
        const idx = Math.floor(Math.random() * availableTypes.length);
        type = availableTypes[idx];
        let matchHorizontal = false;
        if (c >= this.minMatchLength - 1) {
          matchHorizontal = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            if (this.state[r][c - k]?.type !== type) {
              matchHorizontal = false;
              break;
            }
          }
        }
        let matchVertical = false;
        if (r >= this.minMatchLength - 1) {
          matchVertical = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            if (this.state[r - k][c]?.type !== type) {
              matchVertical = false;
              break;
            }
          }
        }
        if (!matchHorizontal && !matchVertical) break;
        else availableTypes.splice(idx, 1);
      }
      if (!type)
        type = this.types[Math.floor(Math.random() * this.types.length)]; // Fallback
    } else {
      // Weighted Random
      const weights = this.spawnWeights || {};
      const totalWeight = this.types.reduce(
        (acc, t) => acc + (weights[t] || 0),
        0,
      );
      let rVal = Math.random() * totalWeight;
      for (const t of this.types) {
        rVal -= weights[t] || 0;
        if (rVal <= 0) {
          type = t;
          break;
        }
      }
      if (!type) type = this.types[0];
    }

    const el = document.createElement("div");
    el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;

    const inner = document.createElement("div");
    inner.className = `orb-inner orb-${type} shadow-lg`;

    // 虹ドロップかどうか（スキル等で確定生成する場合はtypeが'rainbow'で来るか、isNewのパッシブ判定）
    let isRainbow = false;
    let rainbowCount = 3;
    if (savedData && savedData.isRainbow) {
      isRainbow = true;
      rainbowCount = savedData.rainbowCount || 3;
      type = "heart"; // 内部的なフォールバック（表示用）
      inner.className = `orb-inner orb-rainbow shadow-lg`;
    } else if (type === "rainbow") {
      isRainbow = true;
      type = "heart"; // 内部的なフォールバック（表示用）
      inner.className = `orb-inner orb-rainbow shadow-lg`;
    } else if (isNew && this.rainbowRates && Array.isArray(this.rainbowRates) && this.rainbowRates.length > 0) {
      for (const rate of this.rainbowRates) {
        if (Math.random() < rate.value) {
          isRainbow = true;
          inner.className = `orb-inner orb-rainbow shadow-lg`;
          if (this.onPassiveTrigger && rate.tokenId) {
            this.onPassiveTrigger(rate.tokenId);
          }
          break;
        }
      }
    }

    const iconSpan = document.createElement("span");
    iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
    iconSpan.innerText = isRainbow ? "" : this.icons[type];

    if (isRainbow) {
      const countSpan = document.createElement("span");
      countSpan.className = "rainbow-count-text text-white font-bold text-xl drop-shadow-md select-none";
      countSpan.innerText = rainbowCount;
      inner.appendChild(countSpan);
    } else {
      inner.appendChild(iconSpan);
    }
    el.appendChild(inner);

    // ボムかどうか
    let isBomb = false;
    if (savedData && savedData.isBomb) {
      isBomb = true;
    } else if (isNew && this.bombRates && this.bombRates.colors && this.bombRates.colors[type]) {
      const rates = this.bombRates.colors[type];
      for (const tokenRate of rates) {
        if (Math.random() < tokenRate.value) {
          isBomb = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break; // Avoid triggering multiple times if we only need one bomb
        }
      }
    }

    // リピートドロップかどうか
    let isRepeat = false;
    if (savedData && savedData.isRepeat) {
      isRepeat = true;
    } else if (isNew && this.repeatRates && this.repeatRates.colors && this.repeatRates.colors[type]) {
      const rates = this.repeatRates.colors[type];
      for (const tokenRate of rates) {
        if (Math.random() < tokenRate.value) {
          isRepeat = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break;
        }
      }
    }

    // スタードロップかどうか（スキル等で確定生成する場合はtypeが'star'で来るか、isNewのパッシブ判定）
    let isStar = false;
    if (savedData && savedData.isStar) {
      isStar = true;
    } else if (type === "star") {
      isStar = true;
      type = this.types[Math.floor(Math.random() * this.types.length)]; // ランダムな色にする
    } else if (isNew && this.starRates && this.starRates.colors && this.starRates.colors[type]) {
      const rates = this.starRates.colors[type];
      for (const tokenRate of rates) {
        if (Math.random() < tokenRate.value) {
          isStar = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break;
        }
      }
    }

    // 基準位置を設定（top/leftは一度だけ設定し、以降transformで移動）
    const baseTop = (r * (this.orbSize + this.gap));
    const baseLeft = (c * (this.orbSize + this.gap));
    el.style.width = `${this.orbSize}px`;
    el.style.height = `${this.orbSize}px`;
    el.style.top = `${baseTop}px`;
    el.style.left = `${baseLeft}px`;

    const isEnhanced = savedData ? !!savedData.isEnhanced : false;
    const orb = { type, el, r, c, isSkyfall: isNew, baseTop, baseLeft, isEnhanced, isBomb, isRepeat, isStar, isRainbow, rainbowCount };

    if (isBomb) {
      this.addBombMark(el);
    }
    if (isRepeat) {
      this.addRepeatMark(el);
    }
    if (isStar) {
      this.addStarMark(el);
    }
    if (isEnhanced) {
      this.addPlusMark(el);
    }

    const handler = (e) => {
      if (e.type === "touchstart") e.preventDefault();
      // 修正: クロージャの r, c ではなく、orb オブジェクトを直接渡す
      this.onStart(e.type === "touchstart" ? e.touches[0] : e, orb);
    };
    el.onmousedown = handler;
    el.ontouchstart = handler;

    // 強化ドロップ判定（新規生成時のみ）
    if (isNew && this.enhanceRates) {
      let enhanced = false;
      const globalRates = this.enhanceRates.global || [];
      const colorRates = this.enhanceRates.colors?.[type] || [];
      const combinedRates = [...globalRates, ...colorRates];

      for (const tokenRate of combinedRates) {
        if (Math.random() < tokenRate.value) {
          enhanced = true;
          if (this.onPassiveTrigger) this.onPassiveTrigger(tokenRate.tokenId);
          break;
        }
      }

      if (enhanced) {
        orb.isEnhanced = true;
        this.addPlusMark(el);
      }
    }

    this.state[r][c] = orb;
    this.container.appendChild(el);

    if (isNew) {
      // 新規オーブ: 盤面外(上方)からの落下アニメーション
      const offsetY = -((startRowOffset + 1) * (this.orbSize + this.gap));
      // transitionなしで上方にセット
      el.style.transition = 'none';
      el.style.transform = `translate3d(0, ${offsetY}px, 0)`;
      el.classList.add('orb-falling');
    }
  }

  render(animClass = '') {
    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb && orb !== this.dragging) {
          const targetTop = (r * (this.orbSize + this.gap));
          const targetLeft = (c * (this.orbSize + this.gap));
          // transformで移動量を計算
          const dx = targetLeft - orb.baseLeft;
          const dy = targetTop - orb.baseTop;
          // transitionを有効化してからtransformを設定
          orb.el.style.transition = '';
          if (animClass) {
            orb.el.classList.add(animClass);
          }
          orb.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
          orb.r = r;
          orb.c = c;
        }
      });
    });
  }

  onStart(e, orbOrR, c) {
    if (this.processing) return;

    let target;
    if (typeof orbOrR === 'object') {
      target = orbOrR;
    } else {
      // Fallback (old signature support)
      target = this.state[orbOrR][c];
    }

    if (!target) return;

    this.dragging = target;
    this.dragging.el.classList.add("orb-grabbing");
    this.dragging.el.style.zIndex = "100";

    if (this.comboEl) this.comboEl.style.display = "none";

    this.moveStart = null;
    this._lastMovePoint = null; // rAF用

    // クロノス・ストップ中はタイマーを起動しない
    if (!this.chronosStopActive) {
      // 通常モード
    }

    window.addEventListener("mousemove", this.onMove);
    window.addEventListener("mouseup", this.onEnd);
    window.addEventListener("touchmove", this.onMove, { passive: false });
    window.addEventListener("touchend", this.onEnd);
  }

  onMove(e) {
    if (!this.dragging) return;
    if (e.type === "touchmove") e.preventDefault();

    const point =
      e.type === "touchmove" || e.type === "touchstart" ? e.touches[0] : e;

    // rAFでドラッグ位置を更新（フレームに同期して滑らかに追従）
    this._lastMovePoint = { clientX: point.clientX, clientY: point.clientY };

    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        if (!this.dragging || !this._lastMovePoint) return;

        const rect = this.container.getBoundingClientRect();
        const x = this._lastMovePoint.clientX - rect.left;
        const y = this._lastMovePoint.clientY - rect.top;

        // ドラッグ中のオーブの位置をtransformで直接設定
        const dx = x - this.orbSize / 2 - this.dragging.baseLeft;
        const dy = y - this.orbSize / 2 - this.dragging.baseTop;
        this.dragging.el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.2)`;

        const nr = Math.max(
          0,
          Math.min(this.rows - 1, Math.floor(y / (this.orbSize + this.gap))),
        );
        const nc = Math.max(
          0,
          Math.min(this.cols - 1, Math.floor(x / (this.orbSize + this.gap))),
        );

        if (nr !== this.dragging.r || nc !== this.dragging.c) {
          // Start timer only when the orb is actually moved to another cell
          if (!this.moveStart) {
            this.moveStart = Date.now();
            this.timerId = setInterval(this.updateTimer, 20);
          }

          const target = this.state[nr][nc];
          this.state[nr][nc] = this.dragging;
          this.state[this.dragging.r][this.dragging.c] = target;

          target.r = this.dragging.r;
          target.c = this.dragging.c;
          this.dragging.r = nr;
          this.dragging.c = nc;

          // 入れ替わるオーブにスワップアニメーションクラスを付与
          if (target && target.el) {
            target.el.classList.add('orb-swapping');
            setTimeout(() => {
              if (target && target.el) target.el.classList.remove('orb-swapping');
            }, 160);
          }
          this.render(); // Update positions
        }
      });
    }
  }

  updateTimer() {
    const elapsed = Date.now() - this.moveStart;
    const remain = Math.max(0, this.timeLimit - elapsed);
    this.timerProgress = remain / this.timeLimit; // Update progress for external display
    // If timerBar exists (it might not in new design), update it
    if (this.timerBar) {
      this.timerBar.style.width = `${this.timerProgress * 100}%`;
    }
    if (remain <= 0) this.onEnd();
  }

  onEnd() {
    if (!this.dragging) return;
    clearInterval(this.timerId);
    this.timerProgress = 1; // Reset progress
    if (this.timerBar) this.timerBar.style.width = "100%";

    // rAFをキャンセル
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._lastMovePoint = null;

    this.dragging.el.classList.remove("orb-grabbing");
    this.dragging.el.style.zIndex = "";
    this.dragging = null;

    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);

    // --- 操作時間の計測と記録 ---
    if (this.moveStart) {
      const elapsed = Date.now() - this.moveStart;
      this.totalMoveTimeRef.current += elapsed;
    }

    this.render();

    // クロノス・ストップ中はprocess()に進まない
    if (this.chronosStopActive) {
      return;
    }

    // 修正: 動かしていない（スワップしていない）場合はターンを進めない
    // moveStart はスワップが発生した時点でセットされる
    if (!this.moveStart) {
      return;
    }

    this.process();
  }

  setSpawnWeights(weights) {
    this.spawnWeights = { ...weights };
  }

  // --- Skill Actions ---
  convertColor(fromType, toType) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && orb.type === fromType) {
          orb.type = toType;
          // Update shape and color
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
        }
      });
    });
  }

  convertMultiColor(types, toType) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && types.includes(orb.type)) {
          orb.type = toType;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${toType}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${toType} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[toType];
        }
      });
    });
  }

  // --- Star Drop Skills ---
  spawnStarRandom(count) {
    if (this.processing) return;
    const normalOrbs = [];
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && !orb.isStar && !orb.isBomb && !orb.isRepeat && !orb.isRainbow) {
          normalOrbs.push(orb);
        }
      });
    });

    // Shuffle and pick
    for (let i = normalOrbs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normalOrbs[i], normalOrbs[j]] = [normalOrbs[j], normalOrbs[i]];
    }

    const targets = normalOrbs.slice(0, count);
    targets.forEach(orb => {
      orb.isStar = true;
      this.addStarMark(orb.el);
    });
  }

  convertStarTargeted(count, targetColor) {
    if (this.processing) return;
    const targetOrbs = [];
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && orb.type === targetColor && !orb.isStar && !orb.isBomb && !orb.isRepeat && !orb.isRainbow) {
          targetOrbs.push(orb);
        }
      });
    });

    if (count !== "all") {
      // Shuffle and pick if limit exists
      for (let i = targetOrbs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetOrbs[i], targetOrbs[j]] = [targetOrbs[j], targetOrbs[i]];
      }
      targetOrbs.splice(count);
    }

    targetOrbs.forEach(orb => {
      orb.isStar = true;
      this.addStarMark(orb.el);
    });
  }

  async animateComboAdd(amount) {
    if (amount <= 0) return;
    const stepDelay = Math.max(50, Math.min(250, 600 / amount)); // 段階的に増えるように速度調整
    for (let i = 0; i < amount; i++) {
      if (this.currentCombo >= MAX_COMBO) break;
      this.currentCombo = Math.min(this.currentCombo + 1, MAX_COMBO);
      this.onCombo(this.currentCombo);
      if (this.comboEl) {
        this.comboEl.innerHTML = `<span class="combo-number">${this.currentCombo.toLocaleString()}</span><span class="combo-label">COMBO</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(stepDelay);
      if (this._isDestroyed) return;
    }
  }

  changeBoardColors(types) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb) {
          const type = types[Math.floor(Math.random() * types.length)];
          orb.type = type;
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
          orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
          const span = orb.el.querySelector("span");
          if (span) span.innerText = this.icons[type];
        }
      });
    });
  }

  fixRowColor(rowIdx, type) {
    if (this.processing) return;

    let targetRow = rowIdx;
    if (rowIdx === -1) {
      targetRow = this.rows - 1;
    } else if (rowIdx === 'center') {
      targetRow = Math.floor(this.rows / 2);
    }

    if (targetRow < 0 || targetRow >= this.rows) return;

    this.state[targetRow].forEach((orb) => {
      if (orb) {
        orb.type = type;
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
        const span = orb.el.querySelector("span");
        if (span) span.innerText = this.icons[type];
      }
    });
  }

  fixColColor(colIdx, type) {
    if (this.processing) return;

    let targetCol = colIdx;
    if (colIdx === -1) {
      targetCol = this.cols - 1;
    } else if (colIdx === 'center') {
      targetCol = Math.floor(this.cols / 2);
    }

    if (targetCol < 0 || targetCol >= this.cols) return;

    this.state.forEach(row => {
      const orb = row[targetCol];
      if (orb) {
        orb.type = type;
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        orb.el.querySelector(".orb-inner").className = `orb-inner orb-${type} shadow-lg`;
        const span = orb.el.querySelector("span");
        if (span) span.innerText = this.icons[type];
      }
    });
  }

  // --- Step 4: 強化ドロップ操作 ---
  enhanceColorOrbs(colors) {
    if (this.processing) return;
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb && colors.includes(orb.type) && !orb.isEnhanced) {
          orb.isEnhanced = true;
          this.addPlusMark(orb.el);
        }
      });
    });
  }

  // --- Step 4: クロノス・ストップ ---
  activateChronosStop(duration = 10000) {
    if (this.processing) return;
    this.chronosStopActive = true;
    clearInterval(this.timerId);
    this.moveStart = null;
    clearTimeout(this.chronosTimerId);
    this.chronosTimerId = setTimeout(() => {
      this.endChronosStop();
    }, duration);
  }

  endChronosStop() {
    this.chronosStopActive = false;
    clearTimeout(this.chronosTimerId);
    this.chronosTimerId = null;
    clearInterval(this.timerId);
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this.dragging) {
      this.dragging.el.classList.remove("orb-grabbing");
      this.dragging.el.style.zIndex = "";
      this.dragging = null;
    }
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);
    this.render();
    this.process();
  }

  addBombMark(el) {
    if (el.querySelector('.bomb-mark')) return;
    const bombSpan = document.createElement('span');
    bombSpan.className = 'bomb-mark material-icons-round';
    bombSpan.style.color = 'white';
    bombSpan.innerText = 'cyclone';
    el.appendChild(bombSpan);
  }

  addRepeatMark(el) {
    if (el.querySelector('.repeat-mark')) return;
    const repeatSpan = document.createElement('span');
    repeatSpan.className = 'repeat-mark material-icons-round absolute bottom-0 left-0 text-white text-xs drop-shadow-md font-bold z-10';
    repeatSpan.style.color = 'white';
    repeatSpan.innerText = 'autorenew';
    el.appendChild(repeatSpan);
  }

  addStarMark(el) {
    if (el.querySelector('.star-mark')) return;
    const starSpan = document.createElement('span');
    starSpan.className = 'star-mark material-icons-round absolute bottom-0 right-0 text-yellow-300 text-sm drop-shadow-md font-bold z-10';
    starSpan.innerText = 'star';
    el.appendChild(starSpan);
  }

  async forceRefresh() {
    if (this.processing) return;
    this.processing = true;

    // 1. Clear all orbs with animation
    this.state.forEach((row) => {
      row.forEach((orb) => {
        if (orb) orb.el.classList.add("orb-matching");
      });
    });

    await this.sleep(300);
    if (this._isDestroyed) return;

    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
        if (orb) {
          orb.el.remove();
          this.state[r][c] = null;
        }
      });
    });

    await this.sleep(100);
    if (this._isDestroyed) return;

    // 2. Gravity naturally spawns new orbs
    await this.simultaneousGravity();
    if (this._isDestroyed) return;
    await this.sleep(450);
    if (this._isDestroyed) return;

    this.processing = false;
    this.process(); // Start natural combo sequence
  }

  async process() {
    this.processing = true;
    this.currentCombo = 0;
    if (this.comboEl) {
      this.comboEl.innerText = "";
      this.comboEl.style.display = "block";
    }
    const colorComboCounts = {};
    const erasedColorCounts = {};
    this.types.forEach(t => {
      colorComboCounts[t] = 0;
      erasedColorCounts[t] = 0;
    });
    let hasSkyfallCombo = false;
    const shapes = []; // 特殊消し形状判定結果を蓄積
    let overLinkMultiplier = 1; // 過剰結合倍率

    // --- 全消し判定用のカウンター ---
    const initialOrbCount = this.state.flat().filter(orb => orb !== null).length;
    let clearedInitialOrbs = 0;

    // --- ボムで消えたドロップ数のカウンター ---
    let erasedByBombTotal = 0;

    // --- リピートドロップで消えた回数のカウンター ---
    let erasedByRepeatTotal = 0;

    // --- スタードロップで消えた数のカウンター ---
    let erasedByStarTotal = 0;

    while (true) {
      const groups = this.findCombos();
      if (groups.length === 0) break;

      // --- ボム処理を一番初めに行う ---
      const bombGroups = groups.filter(g => g.some(o => o.isBomb));
      if (bombGroups.length > 0) {
        // ボムの起爆色をすべて収集
        const targetColors = new Set();
        bombGroups.forEach(g => {
          if (g.length > 0 && g.groupType) { // Access virt type for bombs
            targetColors.add(g.groupType);
          } else if (g.length > 0) {
            targetColors.add(g[0].type); // Fallback
          }
        });

        // 盤面から起爆色のドロップをすべて収集
        const bombTargets = [];
        this.state.forEach(row => {
          row.forEach(orb => {
            if (orb && targetColors.has(orb.type)) {
              bombTargets.push(orb);
            }
          });
        });

        if (bombTargets.length > 0) {
          erasedByBombTotal += bombTargets.length;
          erasedByStarTotal += bombTargets.filter(o => o.isStar).length;

          const enhancedBonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);

          for (const targetOrb of bombTargets) {
            targetOrb.el.classList.add("orb-matching");
            await this.sleep(100);
            if (this._isDestroyed) return;

            let addition = 1;
            // プラスドロップ効果は発動する（特殊消し効果は乗らない）
            if (targetOrb.isEnhanced) {
              addition += enhancedBonusPerOrb;
            }
            this.animateComboAdd(addition);

            await this.sleep(200);
            if (this._isDestroyed) return;

            targetOrb.el.remove();
            this.state[targetOrb.r][targetOrb.c] = null;

            const type = targetOrb.type;
            if (colorComboCounts[type] !== undefined) {
              colorComboCounts[type]++;
              erasedColorCounts[type]++; // NOTE: This adds +1 per orb, not per group. Compatible with color combo.
            }
            if (!targetOrb.isSkyfall) clearedInitialOrbs++;
          }
          await this.sleep(50);
          if (this._isDestroyed) return;

          // --- ボム消去ボーナス (エンチャント) ---
          const destroyedBombsCount = bombTargets.filter(o => o.isBomb).length;
          const bombBurstCombo = this.realtimeBonuses?.bomb_burst_combo || 0;
          if (destroyedBombsCount > 0 && bombBurstCombo > 0) {
            await this.animateComboAdd(destroyedBombsCount * bombBurstCombo);
          }

          // ボム処理後の落下処理
          if (this.noSkyfall) {
            await this.gravityOnly();
            if (this._isDestroyed) return;
            await this.sleep(450);
            if (this._isDestroyed) return;
          } else {
            await this.simultaneousGravity();
            if (this._isDestroyed) return;
            await this.sleep(450);
            if (this._isDestroyed) return;
          }
        }

        // ボム処理を行った場合、盤面が変わったので最初からコンボ判定をやり直す
        continue;
      }

      // To handle Rainbow drops being matched in multiple color combos at the same time,
      // we need to gather all drops scheduled for matching in this turn, reduce their counts,
      // and defer actual deletion from the DOM/state until all combos for this turn are processed.
      const orbsToEraseThisTurn = new Set();
      const rainbowOrbsToUpdate = new Set();
      const groupComboPromises = [];

      for (const group of groups) {
        // Find if this group has a meaningful property
        const hasRainbow = group.some(o => o.isRainbow);

        // Calculate count decrement rules.
        // We do this per group. So one group = one "hit".
        if (hasRainbow) {
          group.filter(o => o.isRainbow).forEach(o => {
            // Mark for decrement
            o._pendingRainbowHits = (o._pendingRainbowHits || 0) + 1;
            rainbowOrbsToUpdate.add(o);
          });
        }

        // グループ内のリピートドロップ数をカウント
        const repeatCount = group.filter(o => o.isRepeat).length;
        // リピート回数は最低1回（通常の消去）＋リピートドロップ数
        let extraRepeat = 0;
        if (repeatCount > 0 && this.realtimeBonuses?.extra_repeat_activations) {
          extraRepeat = this.realtimeBonuses.extra_repeat_activations;
          if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.extra_repeat_activations) {
            this.realtimeBonuses.tokenIds.extra_repeat_activations.forEach(id => this.onPassiveTrigger(id));
          }
        }
        const totalClears = 1 + repeatCount + extraRepeat;

        for (let clearNum = 0; clearNum < totalClears; clearNum++) {
          if (clearNum > 0) {
            // 2回目以降の消去時：復活アニメーション（アイコンを消して再度準備）
            group.forEach((o) => {
              o.isRepeat = false;
              if (o.el) {
                o.el.classList.remove("orb-matching"); // 前回のアニメーションを解除
                const repeatMark = o.el.querySelector('.repeat-mark');
                if (repeatMark) repeatMark.remove();
              }
            });
            // 復活後のわずかな待機
            await this.sleep(100);
            if (this._isDestroyed) return;
            erasedByRepeatTotal += repeatCount; // 消えたリピートドロップ数を加算
          }
          const starsMatched = group.filter(o => o.isStar).length;
          erasedByStarTotal += starsMatched; // スタードロップ消去数を加算
          if (starsMatched > 0 && this.onStarErase) {
            this.onStarErase(starsMatched);
          }

          // 消した色とコンボ数を記録
          const type = group.groupType || (group.length > 0 ? group[0].type : null);
          if (type) {
            if (colorComboCounts[type] !== undefined) {
              colorComboCounts[type]++;
              erasedColorCounts[type] += group.length;
            }
          }

          // 落ちコンで消えたグループかチェック（skyfall_bonus判定用、1回目のみ判定）
          if (clearNum === 0 && group.some(o => o.isSkyfall)) {
            hasSkyfallCombo = true;
          }

          // --- カウント：初期盤のドロップがどれだけ消えたか ---
          if (clearNum === 0) { // 1回目だけカウント
            const nonSkyfallCount = group.filter(o => !o.isSkyfall).length;
            clearedInitialOrbs += nonSkyfallCount;
          }

          const shape = this.classifyShape(group);
          if (shape && clearNum === 0) shapes.push(shape);

          // --- 特殊消しリアルタイム加算 ---
          let addition = 1;

          // Rainbow Combo Bonus
          if (hasRainbow && this.realtimeBonuses?.rainbow_combo_bonus) {
            addition += this.realtimeBonuses.rainbow_combo_bonus;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.rainbow_combo_bonus) {
              this.realtimeBonuses.tokenIds.rainbow_combo_bonus.forEach(id => this.onPassiveTrigger(id));
            }
          }

          // 強化ドロップボーナス（1回目のみ加算するのが自然だが、リピートという性質上毎回適用する）
          const enhancedCount = group.filter(o => o.isEnhanced).length;
          const enhancedBonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);
          if (enhancedCount > 0 && this.realtimeBonuses?.enhancedOrbBonus > 0 && this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.enhancedOrbBonus) {
            this.realtimeBonuses.tokenIds.enhancedOrbBonus.forEach(id => this.onPassiveTrigger(id));
          }
          addition += enhancedCount * enhancedBonusPerOrb;

          // 過剰結合チェック
          if (enhancedCount >= (this.realtimeBonuses?.overLink?.count || 999)) {
            if (!overLinkMultiplier || overLinkMultiplier < (this.realtimeBonuses?.overLink?.value || 1)) {
              overLinkMultiplier = this.realtimeBonuses?.overLink?.value || 1;
              if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.overLink) {
                this.realtimeBonuses.tokenIds.overLink.forEach(id => this.onPassiveTrigger(id));
              }
            }
          }

          // Base Bonuses
          if (shape === "len5") addition += 1;
          if (shape === "l_shape") addition += 1;
          if (shape === "cross") addition += 2;
          if (shape === "row") addition += 2;

          if (shape === "len4" && this.realtimeBonuses?.len4) {
            addition += this.realtimeBonuses.len4;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.len4) {
              this.realtimeBonuses.tokenIds.len4.forEach(id => this.onPassiveTrigger(id));
            }
          }
          if (shape === "row" && this.realtimeBonuses?.row) {
            addition += this.realtimeBonuses.row;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.row) {
              this.realtimeBonuses.tokenIds.row.forEach(id => this.onPassiveTrigger(id));
            }
          }
          if (shape === "l_shape" && this.realtimeBonuses?.l_shape) {
            addition += this.realtimeBonuses.l_shape;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.l_shape) {
              this.realtimeBonuses.tokenIds.l_shape.forEach(id => this.onPassiveTrigger(id));
            }
          }

          // Color Combo Bonus (Enchantment)
          if (type && this.realtimeBonuses?.color_combo?.[type]) {
            addition += this.realtimeBonuses.color_combo[type];
          }

          // Heart Combo Bonus (Passive)
          if (type === 'heart' && this.realtimeBonuses?.heart_combo) {
            addition += this.realtimeBonuses.heart_combo;
            if (this.onPassiveTrigger && this.realtimeBonuses.tokenIds?.heart_combo) {
              this.realtimeBonuses.tokenIds.heart_combo.forEach(id => this.onPassiveTrigger(id));
            }
          }

          group.forEach((o) => {
            if (o.el) {
              void o.el.offsetWidth; // force reflow
              o.el.classList.add("orb-matching");
            }
            if (!o.isRainbow) {
              orbsToEraseThisTurn.add(o); // Mark for deferred deletion
            }
          });

          // Queue combo animations instead of waiting serially if possible (though existing logic awaits)
          groupComboPromises.push(this.animateComboAdd(addition));

          await this.sleep(300);
          if (this._isDestroyed) return;
          // We no longer remove DOM immediately here!

          await groupComboPromises[groupComboPromises.length - 1]; // Wait for this specific combo
          await this.sleep(50);
          if (this._isDestroyed) return;
        }
      }

      // Defer DOM/State cleanup for Rainbow drops
      for (const ro of rainbowOrbsToUpdate) {
        if (ro._pendingRainbowHits) {
          ro.rainbowCount -= ro._pendingRainbowHits;
          ro._pendingRainbowHits = 0; // Reset

          if (ro.rainbowCount <= 0) {
            orbsToEraseThisTurn.add(ro); // It's completely destroyed, queue for normal deletion
          } else if (ro.el) {
            // Survive: update UI
            const countText = ro.el.querySelector('.rainbow-count-text');
            if (countText) countText.innerText = ro.rainbowCount;
            ro.el.classList.remove("orb-matching"); // Undo the matching animation state visually so it can be matched again

            // Add a hit animation (pulse) instead of deletion
            ro.el.classList.add("rainbow-hit-pulse");
            setTimeout(() => { if (ro && ro.el) ro.el.classList.remove("rainbow-hit-pulse") }, 300);
          }
        }
      }

      // Proceed with actual deletion
      for (const orb of orbsToEraseThisTurn) {
        if (orb.el) {
          orb.el.remove();
        }
        // Safeguard: only nullify if the reference is still matching, to avoid overlaps
        if (this.state[orb.r][orb.c] === orb) {
          this.state[orb.r][orb.c] = null;
        }
      }

      // noSkyfall時はオーブを落下させるが新規オーブは生成しない
      // noSkyfall時はオーブを落下させるが新規オーブは生成しない
      if (this.noSkyfall) {
        await this.gravityOnly();
        if (this._isDestroyed) return;
        await this.sleep(450);
        if (this._isDestroyed) return;
        // ループを継続し、落下後の配置でコンボ判定を行う
        continue;
      }

      await this.simultaneousGravity();
      if (this._isDestroyed) return;
      await this.sleep(450);
      if (this._isDestroyed) return;
    }

    // noSkyfallの場合、コンボ連鎖が完全に終了した後で盤面を補充する
    if (this.noSkyfall) {
      await this.simultaneousGravity();
      if (this._isDestroyed) return;
      await this.sleep(200);
    }

    // --- Special Bonus: All Initial Orbs Cleared ---
    const allInitialOrbsCleared = initialOrbCount > 0 && clearedInitialOrbs >= initialOrbCount;
    if (allInitialOrbsCleared && this.currentCombo > 0) {
      this.currentCombo = Math.min(this.currentCombo * 2, MAX_COMBO);
      if (this.comboEl) {
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ ALL CLEAR ✦</div><span class="combo-number combo-number-final">${this.currentCombo.toLocaleString()}</span><span class="combo-label">×2</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(1000);
      if (this._isDestroyed) return;
    }


    // --- Special Bonus: Perfect Clear ---
    const isPerfect = this.state.every((row) =>
      row.every((orb) => orb === null),
    );
    if (isPerfect && this.currentCombo > 0) {
      // 全消しボーナス: +10コンボ
      this.currentCombo = Math.min(this.currentCombo + 10, MAX_COMBO);
      this.currentCombo = Math.min(this.currentCombo * 2, MAX_COMBO);
      if (this.comboEl) {
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ PERFECT CLEAR ✦</div><span class="combo-number combo-number-final">${this.currentCombo.toLocaleString()}</span><span class="combo-label">+10 & ×2</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(1000);
      if (this._isDestroyed) return;
    }

    this.processing = false;
    if (this.onTurnEnd) {
      this.onTurnEnd(this.currentCombo, colorComboCounts, erasedColorCounts, hasSkyfallCombo, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isPerfect || allInitialOrbsCleared);
    }
  }

  findCombos() {
    // Instead of matching by exact type, we check for each basic color
    const basicTypes = ["fire", "water", "wood", "light", "dark", "heart"];
    const allGroups = [];

    // Keep track of visited nodes per color to avoid duplicate groups per color
    const visitedPerColor = {};
    basicTypes.forEach(t => {
      visitedPerColor[t] = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    });

    for (const color of basicTypes) {
      const matched = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

      // Horizontal
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c <= this.cols - this.minMatchLength; c++) {
          const orb = this.state[r][c];
          if (!orb) continue;
          if (orb.type !== color && !orb.isRainbow) continue;

          let isMatch = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            const nextOrb = this.state[r][c + k];
            if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            for (let k = 0; k < this.minMatchLength; k++) matched[r][c + k] = true;
            let k = c + this.minMatchLength;
            while (k < this.cols && this.state[r][k] && (this.state[r][k].type === color || this.state[r][k].isRainbow)) {
              matched[r][k++] = true;
            }
          }
        }
      }

      // Vertical
      for (let c = 0; c < this.cols; c++) {
        for (let r = 0; r <= this.rows - this.minMatchLength; r++) {
          const orb = this.state[r][c];
          if (!orb) continue;
          if (orb.type !== color && !orb.isRainbow) continue;

          let isMatch = true;
          for (let k = 1; k < this.minMatchLength; k++) {
            const nextOrb = this.state[r + k][c];
            if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            for (let k = 0; k < this.minMatchLength; k++) matched[r + k][c] = true;
            let k = r + this.minMatchLength;
            while (k < this.rows && this.state[k][c] && (this.state[k][c].type === color || this.state[k][c].isRainbow)) {
              matched[k++][c] = true;
            }
          }
        }
      }

      // Extract groups for this color
      const visited = visitedPerColor[color];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (matched[r][c] && !visited[r][c]) {
            const group = [];
            const q = [{ r, c }];
            visited[r][c] = true;
            let hasBaseColor = false; // A valid group must contain at least one non-rainbow orb of the target color, or be pure rainbows

            while (q.length > 0) {
              const curr = q.shift();
              const orb = this.state[curr.r][curr.c];
              group.push(orb);
              if (!orb.isRainbow && orb.type === color) hasBaseColor = true;

              [
                [0, 1], [0, -1], [1, 0], [-1, 0]
              ].forEach(([dr, dc]) => {
                const nr = curr.r + dr, nc = curr.c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                  if (matched[nr][nc] && !visited[nr][nc] && (this.state[nr][nc].type === color || this.state[nr][nc].isRainbow)) {
                    visited[nr][nc] = true;
                    q.push({ r: nr, c: nc });
                  }
                }
              });
            }

            // A group is only valid if it contains at least one base color orb, OR if we are processing "heart"
            // and the entire group is pure rainbow drops (we process pure rainbows only once under "heart" to avoid 6x duplication).
            if (hasBaseColor) {
              // Assign a virtual groupType so we know which color combo this was
              group.groupType = color;
              allGroups.push(group);
            } else if (color === "heart") {
              // Pure rainbow group, counts as heart combo for processing to not give 6x combos for free
              group.groupType = "heart";
              allGroups.push(group);
            }
          }
        }
      }
    }

    return allGroups;
  }

  // グループの形状を判定する
  classifyShape(group) {
    const checkShape = (coords) => {
      const len = coords.length;
      const rows = new Set(coords.map(c => c.r));
      const cols = new Set(coords.map(c => c.c));
      const coordSet = new Set(coords.map(c => `${c.r},${c.c}`));

      // 十字型: ちょうど5個で、中心があり上下左右がある
      if (len === 5) {
        for (const { r, c } of coords) {
          if (coordSet.has(`${r - 1},${c}`) && coordSet.has(`${r + 1},${c}`) &&
            coordSet.has(`${r},${c - 1}`) && coordSet.has(`${r},${c + 1}`)) {
            return "cross";
          }
        }
      }

      // L字型: ちょうど5個で、3x3の範囲に収まり、十字ではない
      if (len === 5 && rows.size === 3 && cols.size === 3) {
        return "l_shape";
      }

      // 3x3正方形: ちょうど9個で3行3列
      if (len === 9 && rows.size === 3 && cols.size === 3) {
        const minR = Math.min(...rows);
        const minC = Math.min(...cols);
        let isSquare = true;
        for (let dr = 0; dr < 3; dr++)
          for (let dc = 0; dc < 3; dc++)
            if (!coordSet.has(`${minR + dr},${minC + dc}`)) isSquare = false;
        if (isSquare) return "square";
      }

      // 横1列: 盤面幅分のオーブが同じ行にある
      if (len === this.cols && rows.size === 1) return "row";

      // 4個ちょうど
      if (len === 4) return "len4";

      // 5個以上連結（L字含む）
      if (len >= 5) return "len5";

      return null;
    };

    // 1. 全体での判定 (虹ドロップを含めて形を作るケース)
    let shape = checkShape(group.map(o => ({ r: o.r, c: o.c })));
    if (shape) return shape;

    // 2. 虹ドロップを除外したサブセットでの判定 (純粋な色ドロップのみで形ができているケース)
    const baseColorOrbs = group.filter(o => !o.isRainbow);
    if (baseColorOrbs.length > 0 && baseColorOrbs.length < group.length) {
      shape = checkShape(baseColorOrbs.map(o => ({ r: o.r, c: o.c })));
    }

    return shape;
  }

  spawnRandom(type, count) {
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Exclude cells that are already of the target type
        // Also check if state exists (it should)
        if (this.state[r][c]?.type && this.state[r][c].type !== type) {
          candidates.push({ r, c });
        }
      }
    }
    // Shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    // Select
    const targets = candidates.slice(0, count);
    targets.forEach(({ r, c }) => {
      const orb = this.state[r][c];
      orb.type = type;
      // Update DOM directly for performance and visual effect
      if (orb.el) {
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-${type} shadow-lg`;
          // Preserve marking if present (e.g. enhanced)
          const star = inner.querySelector('.enhanced-mark');
          // For rainbow drops, we need to create/preserve the count instead of an icon
          inner.innerHTML = '';
          if (type === "rainbow") {
            inner.className = `orb-inner orb-rainbow shadow-lg`;
            orb.isRainbow = true;
            orb.rainbowCount = 5; // By default rainbow_master sets count to 5
            const countSpan = document.createElement("span");
            countSpan.className = "rainbow-count-text text-white font-bold text-xl drop-shadow-md select-none";
            countSpan.innerText = orb.rainbowCount;
            inner.appendChild(countSpan);
          } else {
            orb.isRainbow = false; // in case it was a rainbow, reset it
            const iconSpan = document.createElement("span");
            iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
            iconSpan.innerText = this.icons[type];
            inner.appendChild(iconSpan);
          }
          if (star) inner.appendChild(star);
        }
      }
    });
  }

  changeBoardBalanced() {
    const basicTypes = ["fire", "water", "wood", "light", "dark"];
    let deck = [];
    basicTypes.forEach(t => {
      for (let i = 0; i < 6; i++) deck.push(t);
    });

    // Fill remainder with random types if board is larger than 30
    const totalSlots = this.rows * this.cols;
    while (deck.length < totalSlots) {
      deck.push(basicTypes[Math.floor(Math.random() * basicTypes.length)]);
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const type = deck[idx++] || "heart"; // Fallback to heart if deck empty (shouldn't happen)
        const orb = this.state[r][c];
        orb.type = type;
        orb.isBomb = false;

        if (orb.el) {
          orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
          const inner = orb.el.querySelector('.orb-inner');
          if (inner) {
            inner.className = `orb-inner orb-${type} shadow-lg`;
            const star = inner.querySelector('.enhanced-mark');
            inner.innerHTML = '';
            const iconSpan = document.createElement("span");
            iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
            iconSpan.innerText = this.icons[type];
            inner.appendChild(iconSpan);
            if (star) inner.appendChild(star);
          }
          const bombMark = orb.el.querySelector('.bomb-mark');
          if (bombMark) bombMark.remove();
        }
      }
    }
  }

  spawnBombRandom(count) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isBomb) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      // ランダムな色に変更してボム化
      const type = this.types[Math.floor(Math.random() * this.types.length)];
      orb.type = type;
      orb.isBomb = true;

      if (orb.el) {
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-${type} shadow-lg`;
          const star = inner.querySelector('.enhanced-mark');
          inner.innerHTML = '';
          const iconSpan = document.createElement("span");
          iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
          iconSpan.innerText = this.icons[type];
          inner.appendChild(iconSpan);
          if (star) inner.appendChild(star);
        }
        this.addBombMark(orb.el);
      }
    });
  }

  convertBombTargeted(count, targetType) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isBomb && (!targetType || orb.type === targetType)) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      // 色は維持したままボム化
      orb.isBomb = true;
      if (orb.el) {
        this.addBombMark(orb.el);
      }
    });
  }

  spawnRepeatRandom(count) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isRepeat) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      orb.isRepeat = true;
      if (orb.el) {
        this.addRepeatMark(orb.el);
      }
    });
  }

  convertRepeatTargeted(count, targetType) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isRepeat && (!targetType || orb.type === targetType)) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      orb.isRepeat = true;
      if (orb.el) {
        this.addRepeatMark(orb.el);
      }
    });
  }

  spawnRainbowRandom(count) {
    if (this.processing) return;
    const candidates = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && !orb.isRainbow) {
          candidates.push(orb);
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const targets = candidates.slice(0, count);
    targets.forEach((orb) => {
      orb.isRainbow = true;
      orb.rainbowCount = 3; // Basic gen sets it to 3
      orb.type = "heart"; // internal fallback type for rainbow rendering

      if (orb.el) {
        orb.el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-heart`;
        const inner = orb.el.querySelector('.orb-inner');
        if (inner) {
          inner.className = `orb-inner orb-rainbow shadow-lg`;
          const star = inner.querySelector('.enhanced-mark');
          inner.innerHTML = '';
          const countSpan = document.createElement("span");
          countSpan.className = "rainbow-count-text text-white font-bold text-xl drop-shadow-md select-none";
          countSpan.innerText = orb.rainbowCount;
          inner.appendChild(countSpan);
          if (star) inner.appendChild(star);
        }
      }
    });
  }

  setAllRainbowCounts(count) {
    if (this.processing) return;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const orb = this.state[r][c];
        if (orb && orb.isRainbow) {
          orb.rainbowCount = count;
          if (orb.el) {
            const countText = orb.el.querySelector('.rainbow-count-text');
            if (countText) countText.innerText = orb.rainbowCount;
          }
        }
      }
    }
  }

  // 重力処理のみ（新規オーブ生成なし）- noSkyfall時に使用
  async gravityOnly() {
    for (let c = 0; c < this.cols; c++) {
      let emptySlots = 0;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.state[r][c] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          const orb = this.state[r][c];
          this.state[r + emptySlots][c] = orb;
          this.state[r][c] = null;
          orb.r = r + emptySlots;
        }
      }
      // noSkyfall: 空きスロットは null のまま（新規オーブを生成しない）
    }
    // 強制的にリフローを発生させ、既存のstyle変更をブラウザに認識させる
    void this.container.offsetHeight;

    // 落下アニメーションクラスを付与してrender
    await this.sleep(10);
    if (this._isDestroyed) return;
    this.render('orb-falling');
  }

  async simultaneousGravity() {
    for (let c = 0; c < this.cols; c++) {
      let emptySlots = 0;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.state[r][c] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          const orb = this.state[r][c];
          this.state[r + emptySlots][c] = orb;
          this.state[r][c] = null;
          orb.r = r + emptySlots;
        }
      }
      for (let i = 0; i < emptySlots; i++) {
        this.spawnOrb(i, c, true, emptySlots - 1 - i);
      }
    }
    // 強制的にリフローを発生させ、初期のtransform位置をブラウザに確実に認識させる
    void this.container.offsetHeight;

    // 少し待ってから落下アニメーションを開始
    await this.sleep(10);
    if (this._isDestroyed) return;
    this.render('orb-falling');
  }

  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  destroy() {
    this._isDestroyed = true;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);
  }
}

// --- React App ---
const SAVE_KEY = 'puzzle_rogue_save';
const SETTINGS_KEY = 'puzzle_rogue_settings';

/** 設定のデフォルト値 */
const DEFAULT_SETTINGS = {
  comboAnimationMode: 'step', // 'instant' | 'step'
};

const App = () => {
  // Game State
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [tokens, setTokens] = useState(Array(6).fill(null));
  const [sandsOfTimeSeconds, setSandsOfTimeSeconds] = useState(0); // 永続強化: 時の砂
  const [isGameOver, setIsGameOver] = useState(false);
  const [target, setTarget] = useState(100);
  const [goalReached, setGoalReached] = useState(false);
  const [message, setMessage] = useState(null); // Centralized message toast
  const [shopItems, setShopItems] = useState([]);
  const [turn, setTurn] = useState(1);
  const [cycleTotalCombo, setCycleTotalCombo] = useState(0);
  const [shopRerollBasePrice, setShopRerollBasePrice] = useState(1);
  const [shopRerollPrice, setShopRerollPrice] = useState(1);
  const [stars, setStars] = useState(5);
  /* const [energy, setEnergy] = useState(0); // REMOVED: Global Energy */
  /* const [maxEnergy] = useState(10); // REMOVED: Global Energy */

  const [activeBuffs, setActiveBuffs] = useState([]);
  const [skippedTurnsBonus, setSkippedTurnsBonus] = useState(0);
  const [nextTurnTimeMultiplier, setNextTurnTimeMultiplier] = useState(1);
  const [lastTurnCombo, setLastTurnCombo] = useState(0);
  const [lastErasedColorCounts, setLastErasedColorCounts] = useState({});

  // Shop choice state
  const [pendingShopItem, setPendingShopItem] = useState(null);

  // UI State
  const [showTitle, setShowTitle] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [savedBoard, setSavedBoard] = useState(null);

  // --- ゲーム設定 ---
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  /** 設定を変更し localStorage に即時保存 */
  const handleSettingsChange = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Stats State
  const [currentRunTotalCombo, setCurrentRunTotalCombo] = useState(0);
  const [stats, setStats] = useState({
    lifetimeTotalCombo: 0,
    maxComboAllTime: 0,
    maxComboMultiplierAllTime: 1,
    maxEnchantsAllTime: 0,
    lifetimeTotalMoveTime: 0, // 累計操作時間(ms)
    lifetimePlays: 0,         // 累計プレイ回数
    lifetimeClears: 0,        // 累計サイクルクリア回数
    lifetimeStarsSpent: 0,    // 累計消費スター数
    lifetimeSkillsUsed: 0,    // 累計スキル使用回数
    lifetimeShapeLen4: 0,     // 4個消し累計回数
    lifetimeShapeCross: 0,    // 十字消し累計回数
    lifetimeShapeRow: 0,      // 1列消し累計回数
    lifetimeShapeLShape: 0,   // L字消し累計回数
    lifetimeShapeSquare: 0,   // 四角消し(2x2)累計回数
    lifetimeShapesLen5: 0,     // 5個消し累計回数
    maxCycleAllTime: 0,       // 歴代最大到達サイクル
  });
  const initialCurrentRunStats = {
    currentTotalCombo: 0,
    maxCombo: 0,
    maxComboMultiplier: 1,
    maxEnchants: 0,
    currentTotalMoveTime: 0,
    currentPlays: 0,
    currentClears: 0,
    currentStarsSpent: 0,
    currentSkillsUsed: 0,
    currentShapeLen4: 0,
    currentShapeLen5: 0,
    currentShapeCross: 0,
    currentShapeRow: 0,
    currentShapeLShape: 0,
    currentShapeSquare: 0,
  };
  const [currentRunStats, setCurrentRunStats] = useState(initialCurrentRunStats);
  const [isLuxury, setIsLuxury] = useState(false);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalStarsSpent, setTotalStarsSpent] = useState(0);
  const [triggeredPassives, setTriggeredPassives] = useState([]); // Visual feedback state

  const triggerPassive = (tokenId) => {
    if (!tokenId) return;
    setTriggeredPassives(prev => [...prev, tokenId]);
    setTimeout(() => {
      setTriggeredPassives(prev => prev.filter(id => id !== tokenId));
    }, 500);
  };

  const [targetPulse, setTargetPulse] = useState(false);
  const targetComboRef = useRef(null);

  // Refs
  const boardRef = useRef(null);

  const [isEndlessMode, setIsEndlessMode] = useState(false); // New: Endless Mode state
  const [starProgress, setStarProgress] = useState(0); // 累積スター進捗
  const [selectedTokenDetail, setSelectedTokenDetail] = useState(null);
  const [selectedEnchantDetail, setSelectedEnchantDetail] = useState(null);
  const [tokenMoveInput, setTokenMoveInput] = useState(''); // 並び替え用の入力値
  const [showGameClear, setShowGameClear] = useState(false); // 全画面クリア画面の表示フラグ

  // --- 覚醒ショップ State ---
  const [isEnchantShopUnlocked, setIsEnchantShopUnlocked] = useState(false); // エンチャントショップ解放フラグ
  const [tokenSlotExpansionCount, setTokenSlotExpansionCount] = useState(0);  // トークン枠拡張回数
  const [isAwakeningLevelUpBought, setIsAwakeningLevelUpBought] = useState(false); // 覚醒ショップ: ランダムレベルアップ購入済みフラグ
  // トークンベルトのページネーション用 State
  const [passiveTokenPage, setPassiveTokenPage] = useState(0);
  const [activeTokenPage, setActiveTokenPage] = useState(0);
  // スワイプ座標の管理（useRef でレンダー外管理）
  const passiveSwipeRef = useRef(null);
  const activeSwipeRef = useRef(null);


  const timerRef = useRef(null);
  const comboRef = useRef(null);
  const engineRef = useRef(null);
  const handleTurnEndRef = useRef(null);
  const totalMoveTimeRef = useRef(0); // エンジン内での操作時間累積用
  const skipTurnProgressRef = useRef(false);

  // Derived
  const hasGiantDomain = tokens.some((t) => t?.id === "giant" || t?.enchantments?.some(e => e.effect === "expand_board"));
  // NOTE: Changing board size forces re-init.
  const rows = hasGiantDomain ? 6 : 5;
  const cols = hasGiantDomain ? 7 : 6;

  const maxTurns = Math.max(1, 3
    + tokens.reduce((acc, t) => acc + (t?.enchantments?.filter(e => e.effect === "add_turn").length || 0), 0)
    + tokens.reduce((acc, t) => {
      if (t?.effect === "picky_eater") return acc + (t.values[(t.level || 1) - 1] || 0);
      return acc;
    }, 0)
  );

  const minMatchLength = tokens.some(t => t?.effect === "min_match") ? 2 : 3;

  // --- Load Save Data ---
  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTurn(parsed.turn || 1);
        setCycleTotalCombo(parsed.cycleTotalCombo || 0);
        setTarget(parsed.target || 8);
        setGoalReached(parsed.goalReached || false);
        setStars(parsed.stars || 0);
        setSandsOfTimeSeconds(parsed.sandsOfTimeSeconds || 0);

        // tokens は配列として復元
        if (parsed.tokens && Array.isArray(parsed.tokens)) {
          setTokens(parsed.tokens);
        }

        setTotalPurchases(parsed.totalPurchases || 0);
        setTotalStarsSpent(parsed.totalStarsSpent || 0);
        setIsGameOver(parsed.isGameOver || false);
        setShopRerollBasePrice(parsed.shopRerollBasePrice || 1);
        setShopRerollPrice(parsed.shopRerollPrice || 1);
        setCurrentRunTotalCombo(parsed.currentRunTotalCombo || 0);
        // 覚醒ショップのセーブデータを復元
        setIsEnchantShopUnlocked(parsed.isEnchantShopUnlocked || false);
        setTokenSlotExpansionCount(parsed.tokenSlotExpansionCount || 0);
        setIsAwakeningLevelUpBought(parsed.isAwakeningLevelUpBought || false);
        if (parsed.shopItems) {
          setShopItems(parsed.shopItems);
        } else if (!parsed.isGameOver) {
          // セーブデータはあるがショップ情報がない（古いデータ）場合のみ生成
          // (tokens等がセットされた後の次のサイクルで実行される必要があるため、ここではフラグを立てるかsetTimeout等で対応)
          setTimeout(() => {
            setShopItems(prev => {
              if (prev.length === 0) {
                return generateShop();
              }
              return prev;
            });
          }, 0);
        }
        if (parsed.board) setSavedBoard(parsed.board);
        setHasSaveData(true);
      } catch (e) {
        console.error("Save data corrupted:", e);
      }
    } else {
      // セーブデータが全くない場合のみ、初期ショップを生成
      generateShop();
    }

    // Load Stats
    const savedStats = localStorage.getItem('puzzle_rogue_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Stats data corrupted:", e);
      }
    }

    // 設定のロード
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error("Settings data corrupted:", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // --- Auto Save ---
  useEffect(() => {
    if (!isLoaded) return; // ロード完了前はセーブしない

    if (isGameOver) {
      // ゲームオーバー時はセーブデータを消去
      localStorage.removeItem(SAVE_KEY);
      setHasSaveData(false);
      return;
    }

    const saveObj = {
      turn,
      cycleTotalCombo,
      target,
      goalReached,
      stars,
      tokens,
      totalPurchases,
      totalStarsSpent,
      isGameOver,
      sandsOfTimeSeconds,
      shopRerollBasePrice,
      shopRerollPrice,
      currentRunTotalCombo,
      shopItems,
      // 覚醒ショップのセーブデータ
      isEnchantShopUnlocked,
      tokenSlotExpansionCount,
      isAwakeningLevelUpBought,
      board: engineRef.current ? engineRef.current.getState() : (savedBoard || null)
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveObj));
    setHasSaveData(true);

  }, [turn, cycleTotalCombo, target, goalReached, stars, tokens, isGameOver, isLoaded, totalPurchases, totalStarsSpent, sandsOfTimeSeconds, shopRerollBasePrice, shopRerollPrice, currentRunTotalCombo, shopItems, savedBoard, isEnchantShopUnlocked, tokenSlotExpansionCount, isAwakeningLevelUpBought]);

  // --- Auto Save Stats ---
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('puzzle_rogue_stats', JSON.stringify(stats));
  }, [stats, isLoaded]);

  // --- Skyfall Weight Management ---
  useEffect(() => {
    if (!engineRef.current) return;
    const weights = {};
    const ALL_COLORS = ["fire", "water", "wood", "light", "dark", "heart"];
    ALL_COLORS.forEach((c) => (weights[c] = 1));
    const isEnchantDisabled = tokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");

    // 偏食家: 指定色の出現率を0にする
    tokens.forEach((t) => {
      if (t?.effect === "picky_eater" && t.params?.excludeColors) {
        t.params.excludeColors.forEach((c) => { weights[c] = 0; });
      }

      // エンチャントによる出現率変動
      if (!isEnchantDisabled && t?.enchantments) {
        t.enchantments.forEach(e => {
          if (e.effect === "skyfall_boost" && e.params?.color) {
            weights[e.params.color] += 0.5; // 加算 (Boost)
          } else if (e.effect === "skyfall_nerf" && e.params?.color) {
            weights[e.params.color] *= 0.5; // 乗算 (Nerf)
          }
        });
      }
    });

    activeBuffs.forEach((buff) => {
      if (buff.action === "skyfall") {
        buff.params.colors.forEach((c) => {
          weights[c] *= buff.params.weight;
        });
      } else if (buff.action === "skyfall_limit") {
        ALL_COLORS.forEach((c) => {
          if (!buff.params.colors.includes(c)) {
            weights[c] = 0;
          }
        });
      }
    });
    engineRef.current.setSpawnWeights(weights);
  }, [activeBuffs, tokens]);

  const getTimeLimit = useCallback(() => {
    const isEnchantDisabled = tokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
    // 背水の陣: 他の延長効果をすべて無視して4秒固定
    const hasDesperateStance = tokens.some(t => t?.effect === "desperate_stance");
    if (hasDesperateStance) {
      return 4000;
    }
    let base = 5000 + (sandsOfTimeSeconds * 1000);
    tokens.forEach((t) => {
      if (t?.effect === "time") base += (t.values[(t.level || 1) - 1] * 1000);
      // 呪われた力: 操作時間-2秒
      if (t?.effect === "cursed_power") base -= 2000;

      // --- 追加: エンチャントによる時間変動 ---
      if (!isEnchantDisabled) {
        t?.enchantments?.forEach(enc => {
          if (enc.effect === "time_ext_enc") base += (enc.value || 1) * 1000;
          if (enc.effect === "berserk_mode") base -= 1000; // 狂戦士: -1秒
        });
      }

      // --- 新規: 星2トークン数×操作時間延長 ---
      if (t?.effect === "star_count_time_ext") {
        const rarity2Count = tokens.filter(tok => tok?.rarity === 2).length;
        base += (t.values[(t.level || 1) - 1] * 1000) * rarity2Count;
      }

      // --- 五星の導き手 ---
      if (t?.effect === "stat_shape_len5") {
        const v = t.values[(t.level || 1) - 1]; // 0.5/1.0/1.5
        const count = Math.floor((currentRunStats.currentShapeLen5 || 0) / 10);
        if (count > 0) base += (v * 1000) * count;
      }
    });
    // 特殊消しボーナスによる操作時間延長（五星の印・十字の祈り）
    base *= nextTurnTimeMultiplier;
    return Math.max(1000, base); // 最低1秒
  }, [tokens, sandsOfTimeSeconds, nextTurnTimeMultiplier, currentRunStats.currentShapeLen5, activeBuffs]);

  // --- Init Engine ---
  useEffect(() => {
    if (!boardRef.current || !timerRef.current) return;

    const engine = new PuzzleEngine(
      boardRef.current,
      timerRef.current,
      comboRef.current,
      {
        rows,
        cols,
        timeLimit: getTimeLimit(),
        minMatchLength,
        onCombo: () => {
          // No-op for now to avoid re-renders
        },
        onTurnEnd: (total, colorComboCounts, erasedColorCounts, skyfall, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isAllClear) => {
          if (handleTurnEndRef.current) {
            handleTurnEndRef.current(total, colorComboCounts, erasedColorCounts, skyfall, shapes, overLinkMultiplier, erasedByBombTotal, erasedByRepeatTotal, erasedByStarTotal, isAllClear);
          }
        },
        onPassiveTrigger: (tokenId) => {
          triggerPassive(tokenId);
        },
        onStarErase: (count) => {
          // スタードロップ消去時の即時獲得処理
          // 獲得量の計算（handleTurnEnd内のロジックと同様のボーナスを適用）
          const effectiveTokens = tokens.map((t, index) => {
            if (!t) return t;
            if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
              return { ...tokens[index - 1], instanceId: t.instanceId };
            }
            return t;
          });

          let extraStarsPerStarDropErase = 0;
          effectiveTokens.forEach((t) => {
            if (t && t.effect === "star_earn_boost") {
              extraStarsPerStarDropErase += t.values?.[(t.level || 1) - 1] || 0;
            }
          });
          const amount = (2 + extraStarsPerStarDropErase) * count;
          setStars((s) => s + amount);
          notify(`+ ${amount} STARS!`);

          // スターブースト効果を持つトークンを跳ねさせる
          effectiveTokens.forEach(t => {
            if (t && t.effect === "star_earn_boost") {
              triggerPassive(t.instanceId || t.id);
            }
          });
        }
      },
    );

    engine.init(savedBoard);
    engineRef.current = engine;

    return () => {
      if (engineRef.current) {
        setSavedBoard(engineRef.current.getState());
      }
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, showTitle, showHelp, showStats, showCredits, showSettings]);

  // Update time limit and realtime bonuses live
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.timeLimit = getTimeLimit();
      engineRef.current.minMatchLength = minMatchLength;

      const effectiveTokens = tokens.map((t, index) => {
        if (!t) return t;
        if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
          return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
        }
        return t;
      });

      const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");

      // Calculate realtime bonuses from tokens
      const bonuses = {
        len4: 0, row: 0, l_shape: 0, color_combo: {}, heart_combo: 0, enhancedOrbBonus: 0, overLink: null,
        extra_repeat_activations: 0,
        tokenIds: { len4: [], row: [], l_shape: [], heart_combo: [], enhancedOrbBonus: [], overLink: [], rainbow_combo_bonus: [], extra_repeat_activations: [] }
      };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tId = t.instanceId || t.id;

        if (t.effect === 'shape_bonus') {
          const val = t.values[lv - 1];
          if (t.params?.shape === 'len4') {
            bonuses.len4 += val;
            bonuses.tokenIds.len4.push(tId);
          }
          if (t.params?.shape === 'row') {
            bonuses.row += val;
            bonuses.tokenIds.row.push(tId);
          }
          if (t.params?.shape === 'l_shape') {
            bonuses.l_shape += val;
            bonuses.tokenIds.l_shape.push(tId);
          }
        }

        if (t.effect === 'heart_combo_bonus') {
          const val = t.values[lv - 1];
          bonuses.heart_combo += val;
          bonuses.tokenIds.heart_combo.push(tId);
        }

        if (t.effect === 'enhanced_orb_bonus') {
          bonuses.enhancedOrbBonus += t.values[lv - 1] || 0;
          bonuses.tokenIds.enhancedOrbBonus.push(tId);
        }

        if (t.effect === 'enhanced_link_multiplier') {
          if (!bonuses.overLink || t.values[lv - 1] > bonuses.overLink.value) {
            bonuses.overLink = { count: t.params.count, value: t.values[lv - 1] };
          }
          bonuses.tokenIds.overLink.push(tId);
        }

        if (t.effect === 'rainbow_combo_bonus') {
          bonuses.rainbow_combo_bonus = (bonuses.rainbow_combo_bonus || 0) + (t.values[lv - 1] || 0);
          bonuses.tokenIds.rainbow_combo_bonus.push(tId);
        }

        if (t.effect === 'extra_repeat_activations') {
          bonuses.extra_repeat_activations += t.values[lv - 1] || 0;
          bonuses.tokenIds.extra_repeat_activations.push(tId);
        }

        // Add color combo enchantments to realtime bonuses
        const enchList = isEnchantDisabled ? [] : (t.enchantments || []);
        enchList.forEach(enc => {
          if (enc.effect === 'color_combo' && enc.params?.color) {
            const color = enc.params.color;
            bonuses.color_combo[color] = (bonuses.color_combo[color] || 0) + 1; // +1 per combo
          }
          if (enc.effect === 'bomb_burst_combo') {
            bonuses.bomb_burst_combo = (bonuses.bomb_burst_combo || 0) + 3;
          }
        });
      });
      engineRef.current.setRealtimeBonuses(bonuses);

      // 強化ドロップ確率の計算
      const rates = { global: [], colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'enhance_chance') {
          rates.global.push({ value: t.values[lv - 1] || 0, tokenId });
        }

        const enchList = t.enchantments || [];
        enchList.forEach(enc => {
          if (enc.effect === 'enhance_chance_color' && enc.params?.color) {
            const color = enc.params.color;
            if (!rates.colors[color]) rates.colors[color] = [];
            rates.colors[color].push({ value: enc.value || 0.1, tokenId });
          }
        });
      });
      engineRef.current.setEnhanceRates(rates);

      // ボムドロップ確率の計算
      const bombRates = { colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'bomb_chance_color' && t.params?.color) {
          const color = t.params.color;
          if (!bombRates.colors[color]) bombRates.colors[color] = [];
          bombRates.colors[color].push({ value: t.values[lv - 1] || 0, tokenId });
        }
      });
      engineRef.current.setBombRates(bombRates);

      // リピートドロップ確率の計算
      const repeatRates = { colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'repeat_chance_color' && t.params?.color) {
          const color = t.params.color;
          if (!repeatRates.colors[color]) repeatRates.colors[color] = [];
          repeatRates.colors[color].push({ value: t.values[lv - 1] || 0, tokenId });
        }
      });
      engineRef.current.repeatRates = repeatRates;

      // スタードロップ確率の計算
      const starRates = { colors: {} };
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        const tokenId = t.instanceId || t.id;

        if (t.effect === 'star_chance_color' && t.params?.color) {
          const color = t.params.color;
          if (!starRates.colors[color]) starRates.colors[color] = [];
          starRates.colors[color].push({ value: t.values[lv - 1] || 0, tokenId });
        }
      });
      engineRef.current.starRates = starRates;

      // 虹ドロップ生成確率の計算
      let rainbowRate = [];
      effectiveTokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        if (t.effect === 'rainbow_chance') {
          rainbowRate.push({ value: t.values[lv - 1] || 0, tokenId: t.instanceId || t.id });
        }
      });
      engineRef.current.setRainbowRates(rainbowRate);
    }
  }, [tokens, getTimeLimit, minMatchLength, activeBuffs]);

  // --- Init Shop on Start ---
  // (Removed separate useEffect to avoid race conditions with loading)

  // --- Game Logic ---
  // Debug State
  // const [debugLog, setDebugLog] = useState(null);

  const handleTurnEnd = async (turnCombo, colorComboCounts, erasedColorCounts, hasSkyfallCombo, shapes = [], overLinkMultiplier = 1, erasedByBombTotal = 0, erasedByRepeatTotal = 0, erasedByStarTotal = 0, isAllClear = false) => {
    const tc = Number(turnCombo) || 0;
    setLastTurnCombo(tc);
    setLastErasedColorCounts(erasedColorCounts);
    let bonus = 0;
    let multiplier = 1;
    let timeMultiplier = 1; // 次手の操作時間倍率
    const matchedColorSet = new Set(Object.keys(colorComboCounts).filter(k => colorComboCounts[k] > 0));

    const effectiveTokens = tokens.map((t, index) => {
      if (!t) return t;
      if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
        return { ...tokens[index - 1], instanceId: t.instanceId, name: `模倣(${tokens[index - 1].name})` };
      }
      return t;
    });

    const isEnchantDisabled = effectiveTokens.some(tok => tok?.effect === "contract_of_void") || activeBuffs.some(b => b?.action === "seal_of_power");
    const animationMode = settings?.comboAnimationMode || 'instant';
    const isInstant = animationMode === 'instant';

    const logData = {
      tokens: effectiveTokens,
      matchedColors: Array.from(matchedColorSet),
      colorComboCounts,
      erasedColorCounts,
      turnCombo: tc,
      shapes,
      isAllClear,
      bonuses: [],
      multipliers: [],
      // 段階度演出用: { label, value } のステップリスト
      bonusSteps: [],    // コンボ加算ステップ
      multiplierSteps: [], // コンボ倍率ステップ
    };

    if (isAllClear) {
      multiplier *= 2;
      logData.multipliers.push(`all_clear_multiplier:x2`);
      logData.multiplierSteps.push({ label: '全消しボーナス', value: 2 });
    }

    effectiveTokens.forEach((t) => {
      if (!t) return;

      const lv = t.level || 1;
      const enchList = isEnchantDisabled ? [] : (t.enchantments || []);

      // --- 共通処理関数 (トークン効果とエンチャント効果の両方をチェック) ---
      const checkEffect = (effect, params, val, tokenName, tokenId) => {
        // 1. 先制の心得 (Opener)
        if (effect === "turn_1_bonus" && turn === 1) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 10;
          bonus += v;
          logData.bonuses.push(`opener:+${v}`);
          logData.bonusSteps.push({ label: tokenName || '先制の心得', value: v, tokenId });
        }
        // 2. 土壇場の底力 (Clutch)
        if (effect === "last_turn_mult" && turn === maxTurns) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.5;
          multiplier *= v;
          logData.multipliers.push(`clutch:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '土壇場の底力', value: v, tokenId });
        }
        // 3. 虹色の加護 (Rainbow)
        if (effect === "multi_color" && matchedColorSet.size >= 4) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 3;
          bonus += v;
          logData.bonuses.push(`rainbow:+${v}`);
          logData.bonusSteps.push({ label: tokenName || '虹色の加護', value: v, tokenId });
        }
        // 4. 一点突破 (Sniper)
        if (effect === "single_color" && matchedColorSet.size > 0 && matchedColorSet.size <= 2) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.3;
          multiplier *= v;
          logData.multipliers.push(`sniper:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '一点突破', value: v, tokenId });
        }
        // 5. 形状の達人 (Geometry) -> 削除済み (代わりに個別形状エンチャント)
        // shapes: ["len4", "cross", "row", "l_shape", "square", ...]
        const shapeMap = {
          "shape_match4": "len4",
          "shape_cross": "cross",
          "shape_row": "row",
          "shape_l": "l_shape",
          "shape_square": "square"
        };
        const targetShape = shapeMap[effect];
        if (targetShape) {
          const count = shapes.filter(s => s === targetShape).length;
          if (count > 0) {
            // 個数分だけ倍率を乗算 (例: 1.2のcount乗)
            const totalMult = Math.pow(val || 1.0, count);
            multiplier *= totalMult;
            logData.multipliers.push(`${effect}:${val}^${count}=x${totalMult.toFixed(2)}`);
            logData.multiplierSteps.push({ label: tokenName || effect, value: totalMult, tokenId });
          }
        }
        // 6. 運命の悪戯 (Gamble)
        if (effect === "random_bonus") {
          if (isInstant) triggerPassive(tokenId);
          const rand = Math.floor(Math.random() * 21) - 5; // -5 to +15
          bonus += rand;
          logData.bonuses.push(`gamble:${rand > 0 ? '+' : ''}${rand}`);
          if (rand !== 0) logData.bonusSteps.push({ label: tokenName || '運命の悪戯', value: rand, tokenId });
        }
        // 7. 狂戦士 (Berserk)
        if (effect === "berserk_mode") {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.5;
          multiplier *= v;
          logData.multipliers.push(`berserk:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '狂戦士', value: v, tokenId });
        }
        // 8. 追撃 (Aftershock)
        if (effect === "skyfall_mult" && hasSkyfallCombo) {
          if (isInstant) triggerPassive(tokenId);
          const v = val || 1.4;
          multiplier *= v;
          logData.multipliers.push(`aftershock:x${v}`);
          logData.multiplierSteps.push({ label: tokenName || '追撃', value: v, tokenId });
        }
        // 9. 会心の一撃 (Critical) - トークン/エンチャント共通
        if (effect === "critical_strike") {
          if (Math.random() < 0.2) { // 20%
            multiplier *= val;
            logData.multipliers.push(`CRITICAL!:x${val}`);
            logData.multiplierSteps.push({ label: tokenName || '会心の一撃!', value: val, tokenId });
            notify("会心の一撃！"); // 演出
          }
        }
        // 10. 色別連舞 (Color Multiplier Enchantment)
        if (effect === "color_multiplier_enc") {
          const color = params?.color;
          if (color && matchedColorSet.has(color)) {
            if (isInstant) triggerPassive(tokenId);
            const v = val || 1.2;
            multiplier *= v;
            logData.multipliers.push(`color_enc_${color}:x${v}`);
            logData.multiplierSteps.push({ label: tokenName || `色別連舞(${color})`, value: v, tokenId });
          }
        }

        // 11. 形状別極意 (Shape Split Enchantments)
        // shapes: ["len4", "cross", "row", "l_shape", "square", ...]
        let shapeType = null;
        if (effect === "shape_match4") shapeType = "len4";
        if (effect === "shape_cross") shapeType = "cross";
        if (effect === "shape_row") shapeType = "row";
        if (effect === "shape_l") shapeType = "l_shape";
        if (effect === "shape_square") shapeType = "square";

        if (shapeType) {
          const count = shapes.filter(s => s === shapeType).length;
          if (count > 0) {
            if (isInstant) {
              // 消した回数分だけ跳ねさせる (見た目が壊れない程度に少しディレイを入れる)
              for (let i = 0; i < count; i++) {
                setTimeout(() => triggerPassive(tokenId), i * 150);
              }
            }
            // 個数分だけ倍率を乗算 (例: 1.2のcount乗)
            const totalMult = Math.pow(val || 1.0, count);
            multiplier *= totalMult;
            logData.multipliers.push(`${effect}:${val}^${count}=x${totalMult.toFixed(2)}`);
            logData.multiplierSteps.push({ label: tokenName || effect, value: totalMult, tokenId });
          }
        }
      };

      const tId = t.instanceId || t.id;

      // トークン自体の効果をチェック
      if (t.type === 'passive') {
        // valuesから現在レベルの値を取得
        const val = t.values ? t.values[lv - 1] : t.value;
        checkEffect(t.effect, t.params, val, t.name, tId);
      }

      // エンチャントの効果をチェック
      enchList.forEach(enc => {
        checkEffect(enc.effect, enc.params, enc.value, t.name, tId);
      });

      // Base bonuses
      // エンチャント効果（複数対応）
      enchList.forEach(enc => {
        if (enc.effect === "fixed_add") { const v = enc.value || 3; bonus += v; logData.bonuses.push(`fixed_add:${v}`); logData.bonusSteps.push({ label: t.name || '固定加算', value: v, tokenId: tId }); }
        if (enc.effect === "star_add") { bonus += stars; logData.bonuses.push("star_add"); logData.bonusSteps.push({ label: t.name || 'スター加算', value: stars, tokenId: tId }); }
        if (enc.effect === "skip_turn_combo") { bonus += skippedTurnsBonus; logData.bonuses.push("skip_add"); if (skippedTurnsBonus > 0) logData.bonusSteps.push({ label: t.name || 'スキップボーナス', value: skippedTurnsBonus, tokenId: tId }); }
        if (enc.effect === "rarity_down_combo") { bonus += 1; logData.bonuses.push("rarity_down_combo:1"); logData.bonusSteps.push({ label: t.name || 'レア度下げ', value: 1, tokenId: tId }); }
      });
      if (t.effect === "base_add") {
        const v = t.values?.[lv - 1] || 0;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          bonus += v;
          logData.bonuses.push(`base_add:${v}`);
          logData.bonusSteps.push({ label: t.name || 'ベース加算', value: v, tokenId: tId });
        }
      }
      if (t.effect === "contract_of_void") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`contract_of_void:x${v.toFixed(2)}`);
        logData.multiplierSteps.push({ label: t.name || '契約の虚無', value: v, tokenId: tId });
      }
      if (t.effect === "random_add") {
        const pool = t.values?.[lv - 1] || [0];
        const v = pool[Math.floor(Math.random() * pool.length)];
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`random_add:${v}`);
        if (v !== 0) logData.bonusSteps.push({ label: t.name || 'ランダム加算', value: v, tokenId: tId });
      }

      // --- 新規: 星1トークン数×コンボ加算 ---
      if (t.effect === "star_count_combo_add") {
        const rarity1Count = tokens.filter(tok => tok?.rarity === 1).length;
        const v = (t.values?.[lv - 1] || 1) * rarity1Count;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          bonus += v;
          logData.bonuses.push(`star1_combo_boost:${v}`);
          logData.bonusSteps.push({ label: t.name || '星1コンボ加算', value: v, tokenId: tId });
        }
      }

      // --- 新規: 星3トークン数×コンボ倍率 ---
      if (t.effect === "star_count_combo_mult") {
        const rarity3Count = tokens.filter(tok => tok?.rarity === 3).length;
        const v = Math.pow(t.values?.[lv - 1] || 1, rarity3Count);
        if (v > 1) {
          multiplier *= v;
          logData.multipliers.push(`star3_mult_boost:x${v.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || '星3コンボ倍率', value: v, tokenId: tId });
        }
      }

      // --- 新規: 全レベル合計×コンボ加算 ---
      if (t.effect === "total_level_combo_add") {
        const totalLevel = tokens.reduce((sum, tok) => sum + (tok?.level || 0), 0);
        const v = (t.values?.[lv - 1] || 1) * totalLevel;
        if (v > 0) {
          if (isInstant) triggerPassive(tId);
          bonus += v;
          logData.bonuses.push(`total_level_boost:${v.toFixed(1)}`);
          logData.bonusSteps.push({ label: t.name || '全レベル加算', value: v, tokenId: tId });
        }
      }

      // --- 新規: レベル3トークン数×コンボ倍率 ---
      if (t.effect === "level3_count_combo_mult") {
        const level3Count = tokens.filter(tok => tok?.level === 3).length;
        const base = t.values?.[lv - 1] || 1;
        const v = level3Count * base;
        if (v > 1) {
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`level3_count_mult:x${v.toFixed(2)}`);
          logData.multiplierSteps.push({ label: t.name || 'レベル3数倍率', value: v, tokenId: tId });
        }
      }

      // --- 新規: スタードロップ消去数×倍率 (パッシブ) ---
      if (workToken.effect === "star_erase_mult" && erasedByStarTotal > 0) {
        const baseMult = workToken.values?.[lv - 1] || 1.0;
        const multVal = erasedByStarTotal * baseMult;
        if (multVal > 1) {
          if (isInstant) triggerPassive(tId);
          multiplier *= multVal;
          logData.multipliers.push(`star_erase_mult:x${multVal.toFixed(2)}`);
          logData.multiplierSteps.push({ label: workToken.name || 'スター消去倍率', value: multVal, tokenId: tId });
        } else if (multVal > 0 && multVal <= 1) {
          if (isInstant) triggerPassive(tId);
          const m = Math.max(1, multVal);
          multiplier *= m;
          logData.multipliers.push(`star_erase_mult:x${m.toFixed(2)}`);
          if (m > 1) logData.multiplierSteps.push({ label: workToken.name || 'スター消去倍率', value: m, tokenId: tId });
        }
      }

      // エンチャントによる倍率アップ（全トークンのエンチャント数をカウントして適用）
      if (workToken.effect === "enchant_count_mult") {
        const enchantCount = isEnchantDisabled ? 0 : tokens.reduce((sum, tok) => sum + (tok?.enchantments?.length || 0), 0);
        const v = Math.pow(workToken.values?.[lv - 1] || 1, enchantCount);
        if (v > 1) {
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`enchant_mult_boost:x${formatNum(v)}`);
          logData.multiplierSteps.push({ label: workToken.name || 'エンチャント数倍率', value: v, tokenId: tId });
        }
      }

      // --- 新規: ボム消去数×倍率 (パッシブ) ---
      if (t.effect === "bomb_erase_mult" && erasedByBombTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.2;
        const v = erasedByBombTotal * baseMult;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`bomb_erase_mult:x${formatNum(v)}`);
        logData.multiplierSteps.push({ label: t.name || 'ボム消去倍率', value: v, tokenId: tId });
      }

      // --- 新規: リピートドロップ消去数×倍率 (パッシブ) ---
      if (t.effect === "repeat_combo_mult" && erasedByRepeatTotal > 0) {
        const baseMult = t.values?.[lv - 1] || 1.3;
        const v = erasedByRepeatTotal * baseMult;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`repeat_combo_mult:x${formatNum(v)}`);
        logData.multiplierSteps.push({ label: t.name || 'リピート消去倍率', value: v, tokenId: tId });
      }

      // Skyfall bonus
      if (t.effect === "skyfall_bonus" && hasSkyfallCombo) {
        const v = t.values?.[lv - 1] || 0;
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`skyfall:${v}`);
        if (v > 0) logData.bonusSteps.push({ label: t.name || 'スカイフォール', value: v, tokenId: tId });
      }

      // New: Exact Combo Bonus
      if (t.effect === "combo_if_exact" && turnCombo === t.params?.combo) {
        const v = t.values?.[lv - 1] || 0;
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`combo_exact_${t.params.combo}:${v}`);
        if (v > 0) logData.bonusSteps.push({ label: t.name || `丁度${t.params.combo}コンボ`, value: v, tokenId: tId });
      }

      // New: Combo Threshold Multiplier
      if (t.effect === "combo_if_ge" && turnCombo >= t.params?.combo) {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`combo_ge_${t.params.combo}:${v}`);
        logData.multiplierSteps.push({ label: t.name || `${t.params.combo}コンボ以上`, value: v, tokenId: tId });
      }

      // --- 追加: Skill Combo Bonus (Active Skill Lv3 Effect) ---
      if (t.action === "skill_combo_bonus") {
        const val = t.params?.value || 0;
        bonus += val;
        logData.bonuses.push(`skill_lv3_bonus:+${val}`);
        if (val > 0) logData.bonusSteps.push({ label: t.name || 'スキルボーナス', value: val, tokenId: tId });
      }

      // --- 特殊消しボーナス（Shape Bonus） ---
      if (t.effect === "shape_bonus" && shapes.length > 0) {
        const shape = t.params?.shape;
        const v = t.values?.[lv - 1] || 0;
        // 該当形状が今回のターンで出現した回数分ボーナスを適用
        const matchCount = shapes.filter(s => s === shape).length;
        if (matchCount > 0) {
          if (isInstant) {
            // 消した回数分だけ跳ねさせる
            for (let i = 0; i < matchCount; i++) {
              setTimeout(() => triggerPassive(t.instanceId || t.id), i * 150);
            }
          }
          if (shape === "square") {
            // 四方の型: コンボ倍率
            const totalMult = Math.pow(v, matchCount);
            multiplier *= totalMult;
            logData.multipliers.push(`shape_square:mult_x${v}_count_${matchCount}`);
            logData.multiplierSteps.push({ label: t.name || '四方の型', value: totalMult, tokenId: tId });
          } else if (shape === "len5") {
            // 五星の印: 次手操作延長 (重複適用)
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_len5:time_x${v}_count_${matchCount}`);
            // 操作時間延長はコンボ表示には出さないが、跳ねる演出は上記で行っている
          } else if (shape === "cross") {
            // 十字の祈り: 次手操作延長 (重複適用)
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_cross:time_x${v}_count_${matchCount}`);
          } else {
            // len4 / row: すでに PuzzleEngine 内でリアルタイム加算済み
            // ここでの v は集計ロジック用であり、段階的演出（演出データ）には追加しない（リアルタイムで跳ねるため）
            logData.bonuses.push(`shape_${shape}:${v}x${matchCount}(applied)`);
          }
        }
      }

      // Multipliers
      if (t.id === "forbidden") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(t.instanceId || t.id);
        multiplier *= v;
        logData.multipliers.push(`forbidden:${v}`);
        logData.multiplierSteps.push({ label: t.name || '禁忌', value: v, tokenId: tId });
      }
      if (t.action === "forbidden_temp" && engineRef.current?.noSkyfall) {
        if (isInstant) triggerPassive(t.instanceId || t.id);
        multiplier *= 3;
        logData.multipliers.push("forbidden_temp:3");
        logData.multiplierSteps.push({ label: t.name || '禁忌(一時)', value: 3, tokenId: tId });
      }
      enchList.forEach(enc => {
        if (enc.effect === "lvl_mult") {
          multiplier *= lv;
          logData.multipliers.push(`lvl_mult:${lv}`);
        }
        if (enc.effect === "stat_shape_all") {
          const totalShape = (currentRunStats.currentShapeLen4 || 0) +
            (currentRunStats.currentShapeRow || 0) +
            (currentRunStats.currentShapeLShape || 0) +
            (currentRunStats.currentShapeCross || 0) +
            (currentRunStats.currentShapeSquare || 0) +
            (currentRunStats.currentShapeLen5 || 0); // Include len5!
          const b = Math.floor(totalShape / 20) * 1;
          if (b > 0) {
            if (isInstant) triggerPassive(t.instanceId || t.id);
            bonus += b;
            logData.bonuses.push(`stat_shape_all(enc):+${b}`);
            logData.bonusSteps.push({ label: t.name || '万形の極意', value: b, tokenId: tId });
          }
        }
      });

      // Color multiplier
      if (t.effect === "color_multiplier") {
        const colors = t.params?.colors;
        const count = t.params?.count;
        let match = false;
        if (colors && colors.every(c => matchedColorSet.has(c))) {
          match = true;
          logData.multipliers.push(`color_match:${t.id}`);
        } else if (count && matchedColorSet.size >= count) {
          match = true;
          logData.multipliers.push(`count_match:${t.id}`);
        }

        if (match) {
          if (isInstant) triggerPassive(tId);
          const mv = t.values?.[lv - 1] || 1;
          multiplier *= mv;
          logData.multiplierSteps.push({ label: t.name || '色倍率', value: mv, tokenId: tId });
        }
      }

      // Color Drop Count Multiplier
      if (t.effect === "color_count_bonus") {
        const color = t.params?.color;
        const requiredCount = t.params?.count || 0;
        if (color && erasedColorCounts[color] >= requiredCount) {
          const v = t.values?.[lv - 1] || 1;
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`color_count_bonus_${color}_${requiredCount}:${v}`);
          logData.multiplierSteps.push({ label: t.name || `色倍率(${color})`, value: v, tokenId: tId });
        }
      }

      // Shape Variety Multiplier (2+ unique shapes)
      if (t.effect === "shape_variety_mult") {
        const uniqueShapes = new Set(shapes).size;
        if (uniqueShapes >= 2) {
          const v = t.values?.[lv - 1] || 1;
          if (isInstant) triggerPassive(tId);
          multiplier *= v;
          logData.multipliers.push(`shape_variety_mult_${uniqueShapes}:${v}`);
          logData.multiplierSteps.push({ label: t.name || '形状多様性', value: v, tokenId: tId });
        }
      }

      // Giant Domain Multiplier
      if (t.id === "giant") {
        const v = t.values?.[lv - 1] || 1;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`giant:${v}`);
        logData.multiplierSteps.push({ label: t.name || '巨人の領域', value: v, tokenId: tId });
      }

      // 背水の陣: 固定倍率
      if (t.effect === "desperate_stance") {
        const v = t.values?.[lv - 1] || 3;
        if (isInstant) triggerPassive(tId);
        multiplier *= v;
        logData.multipliers.push(`desperate_stance:${v}`);
        logData.multiplierSteps.push({ label: t.name || '背水の陣', value: v, tokenId: tId });
      }

      // 金満の暴力: スター数に依存した倍率加算
      if (t.effect === "greed_power") {
        const threshold = t.values?.[lv - 1] || 10;
        const greedBonus = Math.floor(stars / threshold);
        if (greedBonus > 0) {
          if (isInstant) triggerPassive(tId);
          multiplier += greedBonus;
          logData.multipliers.push(`greed_power:+${greedBonus}(stars:${stars}/threshold:${threshold})`);
          logData.multiplierSteps.push({ label: t.name || '金満の暴力', value: greedBonus, tokenId: tId });
        }
      }

      // 呪われた力: 固定コンボ加算
      if (t.effect === "cursed_power") {
        const v = t.values?.[lv - 1] || 10;
        if (isInstant) triggerPassive(tId);
        bonus += v;
        logData.bonuses.push(`cursed_power:${v}`);
        logData.bonusSteps.push({ label: t.name || '呪われた力', value: v, tokenId: tId });
      }

      // --- 実績参照系パッシブ ---
      if (t.effect === "stat_combo_記憶") {
        const v = t.values?.[lv - 1] || 1;
        const b = Math.floor((currentRunStats.maxCombo || 0) / 5) * v;
        if (b > 0) {
          if (isInstant) triggerPassive(t.instanceId || t.id);
          bonus += b;
          logData.bonuses.push(`stat_combo_記憶:+${b}`);
          logData.bonusSteps.push({ label: t.name || '記憶', value: b, tokenId: tId });
        }
      }
      if (t.effect === "stat_mult_余韻") {
        const v = t.values?.[lv - 1] || 0.1;
        const maxMult = currentRunStats.maxComboMultiplier || 1;
        if (maxMult > 1) {
          const m = 1 + (maxMult * v);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_mult_余韻:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '余韻', value: m, tokenId: tId });
        }
      }
      if (t.effect === "stat_mult_千手") {
        const v = t.values?.[lv - 1] || 1.1;
        const count = Math.floor((currentRunStats.currentTotalCombo || 0) / 100);
        if (count > 0) {
          const m = Math.pow(v, count);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_mult_千手:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '千手', value: m, tokenId: tId });
        }
      }
      if (t.effect === "stat_shape_cross" && shapes.includes("cross")) {
        const v = t.values?.[lv - 1] || 1;
        const b = Math.floor((currentRunStats.currentShapeCross || 0) / 5) * v;
        if (b > 0) {
          if (isInstant) triggerPassive(t.instanceId || t.id);
          bonus += b;
          logData.bonuses.push(`stat_shape_cross:+${b}`);
          logData.bonusSteps.push({ label: t.name || '十字の叡智', value: b, tokenId: tId });
        }
      }
      if (t.effect === "stat_shape_len4" && shapes.includes("len4")) {
        const v = t.values?.[lv - 1] || 1;
        const b = Math.floor((currentRunStats.currentShapeLen4 || 0) / 20) * v;
        if (b > 0) {
          if (isInstant) triggerPassive(t.instanceId || t.id);
          bonus += b;
          logData.bonuses.push(`stat_shape_len4:+${b}`);
          logData.bonusSteps.push({ label: t.name || '連鎖の叡智', value: b, tokenId: tId });
        }
      }
      if (t.effect === "stat_shape_row" && shapes.includes("row")) {
        const v = t.values?.[lv - 1] || 1.1;
        const rowCountInTurn = shapes.filter(s => s === "row").length;
        const count = Math.floor((currentRunStats.currentShapeRow || 0) / 5);
        if (count > 0 && rowCountInTurn > 0) {
          const m = Math.pow(Math.pow(v, count), rowCountInTurn);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_shape_row:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '一列の叡智', value: m, tokenId: tId });
        }
      }
      if (t.effect === "stat_shape_square") {
        const v = t.values?.[lv - 1] || 1.5;
        const count = Math.floor((currentRunStats.currentShapeSquare || 0) / 5);
        if (count > 0) {
          const m = Math.pow(v, count);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_shape_square:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '四方の叡智', value: m, tokenId: tId });
        }
      }
      if (t.effect === "stat_spend_star") {
        const v = t.values?.[lv - 1] || 1.1;
        const count = Math.floor((currentRunStats.currentStarsSpent || 0) / 50);
        if (count > 0) {
          const m = Math.pow(v, count);
          if (isInstant) triggerPassive(t.instanceId || t.id);
          multiplier *= m;
          logData.multipliers.push(`stat_spend_star:x${formatNum(m)}`);
          logData.multiplierSteps.push({ label: t.name || '富の余韻', value: m, tokenId: tId });
        }
      }
    });

    // 12. Min Match Multiplier (Dual Match)
    tokens.forEach((t) => {
      if (t?.effect === "min_match") {
        const lv = t.level || 1;
        const v = t.values?.[lv - 1] || 1;
        const tId2 = t.instanceId || t.id;
        if (isInstant) triggerPassive(tId2);
        multiplier *= v;
        logData.multipliers.push(`min_match:${v}`);
        logData.multiplierSteps.push({ label: t.name || 'デュアルマッチ', value: v, tokenId: tId2 });
      }
    });

    // 強化ドロップ overLink 倍率を適用
    if (overLinkMultiplier > 1) {
      multiplier *= overLinkMultiplier;
      logData.multipliers.push(`overlink:${overLinkMultiplier}`);
    }

    // 次手の操作時間倍率を設定（1ならリセット）
    setNextTurnTimeMultiplier(timeMultiplier);

    // アクティブスキル（時限コンボ倍率）Buffの適用
    activeBuffs.forEach(buff => {
      if (buff.action === "temp_mult") {
        multiplier *= buff.params.multiplier;
        logData.multipliers.push(`temp_mult:${buff.params.multiplier}`);
        logData.multiplierSteps.push({ label: 'スキル倍率', value: buff.params.multiplier });
      } else if (buff.action === "seal_of_power") {
        multiplier *= buff.params.multiplier;
        logData.multipliers.push(`seal_of_power:x${buff.params.multiplier}`);
        logData.multiplierSteps.push({ label: '封印の力', value: buff.params.multiplier });
      }
    });

    logData.finalMultiplier = multiplier;
    logData.finalBonus = bonus;
    // setDebugLog(logData);

    // turnCombo（盤面でのマッチ数）が0なら強制的に最終0コンボにする
    const effectiveCombo = (tc > 0) ? Math.min(Math.floor((tc + Number(bonus || 0)) * Number(multiplier || 1)), MAX_COMBO) : 0;

    // --- Update Stats ---
    setCurrentRunTotalCombo(prev => prev + effectiveCombo);

    const currentEnchantCount = isEnchantDisabled ? 0 : tokens.reduce((sum, tok) => sum + (tok?.enchantments?.length || 0), 0);
    const measuredTime = totalMoveTimeRef.current;
    totalMoveTimeRef.current = 0; // 次のターンのためにリセット

    const countLen4 = shapes.filter(s => s === 'len4').length;
    const countCross = shapes.filter(s => s === 'cross').length;
    const countRow = shapes.filter(s => s === 'row').length;
    const countLShape = shapes.filter(s => s === 'l_shape').length;
    const countSquare = shapes.filter(s => s === 'square').length;

    setStats(prev => {
      return {
        ...prev,
        lifetimeTotalCombo: (prev.lifetimeTotalCombo || 0) + effectiveCombo,
        maxComboAllTime: Math.max(prev.maxComboAllTime || 0, effectiveCombo),
        maxComboMultiplierAllTime: Math.max(prev.maxComboMultiplierAllTime || 1, multiplier),
        maxEnchantsAllTime: Math.max(prev.maxEnchantsAllTime || 0, currentEnchantCount),
        lifetimeTotalMoveTime: (prev.lifetimeTotalMoveTime || 0) + measuredTime,
        lifetimeShapeLen4: (prev.lifetimeShapeLen4 || 0) + countLen4,
        lifetimeShapeCross: (prev.lifetimeShapeCross || 0) + countCross,
        lifetimeShapeRow: (prev.lifetimeShapeRow || 0) + countRow,
        lifetimeShapeLShape: (prev.lifetimeShapeLShape || 0) + countLShape,
        lifetimeShapeSquare: (prev.lifetimeShapeSquare || 0) + countSquare,
      };
    });
    setCurrentRunStats(prev => ({
      ...prev,
      currentTotalCombo: (prev.currentTotalCombo || 0) + effectiveCombo,
      maxCombo: Math.max(prev.maxCombo || 0, effectiveCombo),
      maxComboMultiplier: Math.max(prev.maxComboMultiplier || 1, multiplier),
      maxEnchants: Math.max(prev.maxEnchants || 0, currentEnchantCount),
      currentTotalMoveTime: (prev.currentTotalMoveTime || 0) + measuredTime,
      currentShapeLen4: (prev.currentShapeLen4 || 0) + countLen4,
      currentShapeCross: (prev.currentShapeCross || 0) + countCross,
      currentShapeRow: (prev.currentShapeRow || 0) + countRow,
      currentShapeLShape: (prev.currentShapeLShape || 0) + countLShape,
      currentShapeSquare: (prev.currentShapeSquare || 0) + countSquare,
    }));

    // --- effectiveCombo の段階的演出 ---
    // comboRefを使って、ボーナス加算・倍率適用を盤面上に表示
    const showComboBreakdown = async () => {
      const el = comboRef.current;
      if (!el) return;

      const mode = settings?.comboAnimationMode || 'instant';

      if (mode === 'step' && turnCombo > 0) {
        // --- 段階的演出 ---
        // 現在加算済みコンボ数を表示しながら段階的に積み上げる

        // ステップ1: コンボ加算を1つずつ表示
        let currentVal = tc;
        for (const step of logData.bonusSteps) {
          if (!comboRef.current) break;
          // トークン跳ねるアニメーションをトリガー
          if (step.tokenId) triggerPassive(step.tokenId);
          currentVal = Math.min(currentVal + step.value, MAX_COMBO);
          const eEl = comboRef.current;
          const sign = step.value >= 0 ? '+' : '';
          const prevVal = Math.max(0, currentVal - step.value);
          eEl.innerHTML = `<span class="combo-number">${prevVal.toLocaleString()}</span><span class="combo-bonus-add">${sign}${step.value.toLocaleString()}<span class="combo-step-label"> ${step.label}</span></span>`;
          eEl.classList.remove('animate-combo-pop');
          void eEl.offsetWidth;
          eEl.classList.add('animate-combo-pop');
          await new Promise(r => setTimeout(r, 900));
        }

        // ステップ2: コンボ倍率を1つずつ表示
        let currentMult = 1;
        for (const step of logData.multiplierSteps) {
          if (!comboRef.current) break;
          // トークン跳ねるアニメーションをトリガー
          if (step.tokenId) triggerPassive(step.tokenId);
          const prevVal = currentVal;
          currentVal = Math.min(Math.floor(currentVal * step.value), MAX_COMBO);
          const eEl = comboRef.current;
          const roundedV = formatNum(step.value);
          eEl.innerHTML = `<span class="combo-number">${prevVal.toLocaleString()}</span><span class="combo-bonus-mult">×${roundedV}<span class="combo-step-label"> ${step.label}</span></span>`;
          eEl.classList.remove('animate-combo-pop');
          void eEl.offsetWidth;
          eEl.classList.add('animate-combo-pop');
          await new Promise(r => setTimeout(r, 900));
        }

        // ステップ3: 最終値をパルス演出で表示
        await new Promise(r => setTimeout(r, 300));
        if (comboRef.current) {
          comboRef.current.innerHTML = `<span class="combo-number combo-number-final">${effectiveCombo.toLocaleString()}</span><span class="combo-label">COMBO</span>`;
          comboRef.current.classList.remove('animate-combo-pop');
          comboRef.current.classList.add('animate-combo-pulse');
          void comboRef.current.offsetWidth;
        }

      } else {
        // --- 一括演出（従来通り）---

        // ステップ1: 素コンボ → ボーナス加算表示
        if (turnCombo > 0 && bonus > 0) {
          await new Promise(r => setTimeout(r, 400));
          el.innerHTML = `<span class="combo-number">${turnCombo}</span><span class="combo-bonus-add">+${bonus}</span>`;
          el.classList.remove('animate-combo-pop');
          void el.offsetWidth;
          el.classList.add('animate-combo-pop');
        }

        // ステップ2: 倍率表示
        if (turnCombo > 0 && multiplier > 1) {
          await new Promise(r => setTimeout(r, 500));
          const baseVal = turnCombo + bonus;
          const roundedMultiplier = formatNum(multiplier);
          el.innerHTML = `<span class="combo-number">${baseVal}</span><span class="combo-bonus-mult">×${roundedMultiplier}</span>`;
          el.classList.remove('animate-combo-pop');
          void el.offsetWidth;
          el.classList.add('animate-combo-pop');
        }

        // ステップ3: 最終値をパルス演出で表示
        if (turnCombo > 0 && (bonus > 0 || multiplier > 1)) {
          await new Promise(r => setTimeout(r, 600));
          el.innerHTML = `<span class="combo-number combo-number-final">${effectiveCombo}</span><span class="combo-label">COMBO</span>`;
          el.classList.remove('animate-combo-pop');
          el.classList.add('animate-combo-pulse');
          void el.offsetWidth;
        } else if (turnCombo === 0 && effectiveCombo === 0) {
          // 0コンボ時の表示
          await new Promise(r => setTimeout(r, 400));
          el.innerHTML = `<span class="combo-number combo-number-final">0</span><span class="combo-label">COMBO</span>`;
          el.classList.remove('animate-combo-pop');
          el.classList.add('animate-combo-pulse');
          void el.offsetWidth;
        }
      }

      // ターゲットコンボの数値パルス
      await new Promise(r => setTimeout(r, 400));
      setTargetPulse(true);
      setTimeout(() => setTargetPulse(false), 800);

      // 一定時間後にコンボ表示を消す
      setTimeout(() => {
        if (comboRef.current) {
          comboRef.current.classList.remove('animate-combo-pulse');
          comboRef.current.classList.add('animate-fade-out');
          setTimeout(() => {
            if (comboRef.current) comboRef.current.innerHTML = '';
          }, 500);
        }
      }, 1000);
    };

    await showComboBreakdown();

    let totalReduction = 0;
    let extraStarsPerStarDropErase = 0;
    tokens.forEach((t) => {
      if (!t) return;
      if (t.id === "collector") {
        const threshold = t.values?.[(t.level || 1) - 1] || 5;
        totalReduction += (5 - threshold);
      }
      if (t.effect === "star_earn_boost") {
        extraStarsPerStarDropErase += t.values?.[(t.level || 1) - 1] || 0;
      }
    });
    const starThreshold = Math.max(1, 5 - totalReduction);

    // 累積方式に変更
    const currentProgress = starProgress + effectiveCombo;
    let totalStarsEarned = starThreshold > 0 ? Math.floor(currentProgress / starThreshold) : 0;
    const nextProgress = starThreshold > 0 ? currentProgress % starThreshold : 0;

    setStarProgress(nextProgress);

    if (totalStarsEarned > 0) {
      setStars((s) => s + totalStarsEarned);
      notify(`+ ${totalStarsEarned} STARS!`);

      // 黄金の収集者を跳ねさせる
      tokens.forEach(t => {
        if (t && t.id === "collector") {
          triggerPassive(t.instanceId || t.id);
        }
      });
    }

    const newCycleTotalCombo = cycleTotalCombo + effectiveCombo;
    setCycleTotalCombo(newCycleTotalCombo);

    /* setEnergy((prev) => Math.min(maxEnergy, prev + 2)); // REMOVED */

    // --- Charge Skills ---
    // Zero Combo Charge check
    let zeroComboBonusCharge = 0;
    if (effectiveCombo === 0) {
      tokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;
        if (t.effect === "zero_combo_charge") {
          const chargeVal = t.values?.[lv - 1] || 0;
          if (chargeVal > 0) {
            triggerPassive(t.instanceId || t.id); // これは0コンボ時なので常に跳ねて良い（演出がないため）
            zeroComboBonusCharge += chargeVal;
          }
        }
      });
    }

    setTokens(prevTokens => {
      return prevTokens.map(t => {
        if (!t || t.type !== 'skill') return t;
        const currentCharge = t.charge || 0;
        const maxCharge = t.cost || 0;
        // Increment charge by 1 per turn, up to max cost

        // --- 変更: 急速チャージ (Quick Charge) ---
        const chargeBoostCount = t.enchantments?.filter(e => e.effect === "charge_boost_passive").length || 0;
        const chargeAmount = 1 + chargeBoostCount + zeroComboBonusCharge;

        const nextCharge = Math.min(maxCharge, currentCharge + chargeAmount);
        return { ...t, charge: nextCharge };
      });
    });

    if (!skipTurnProgressRef.current) {
      setActiveBuffs((prev) =>
        prev
          .map((b) => ({ ...b, duration: b.duration - 1 }))
          .filter((b) => b.duration > 0),
      );
    }

    if (newCycleTotalCombo >= target) {
      if (!goalReached) {
        setShopRerollPrice(shopRerollBasePrice);
      }
      setGoalReached(true);
    }

    if (!skipTurnProgressRef.current) {
      setTurn((prev) => prev + 1);
    }

    // Reset or persist noSkyfall based on passive tokens
    if (engineRef.current) {
      const hasForbiddenLiteral = tokens.some((t) => t?.id === "forbidden");
      engineRef.current.noSkyfall = hasForbiddenLiteral;
    }

    skipTurnProgressRef.current = false;
  };

  // Keep handleTurnEndRef current
  useEffect(() => {
    handleTurnEndRef.current = handleTurnEnd;
  });

  // Sanitize tokens on mount/update to remove nulls if any exist from legacy state
  useEffect(() => {
    if (tokens.some(t => t === null)) {
      setTokens(prev => prev.filter(t => t !== null));
    }
  }, [tokens]);

  // REMOVED: Automatic turn transition watcher
  /*******************************************************
   useEffect(() => {
     // エンドレスモードならターン制限によるゲームオーバー/クリア判定をスキップ
     if (isEndlessMode) return;
  
     if (turn > maxTurns) {
       if (goalReached) {
         handleCycleClear(0);
       } else {
         handleGameOver();
       }
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [turn, goalReached, maxTurns, isEndlessMode]);
  ********************************************************/

  // Also watch for game over state manually handled in render now
  useEffect(() => {
    if (isEndlessMode) return;
    if (turn > maxTurns && !goalReached && !isGameOver) {
      setIsGameOver(true);
    }
  }, [turn, goalReached, maxTurns, isEndlessMode, isGameOver]);

  // 詳細モーダルを開いたとき、並び替え入力欄をそのトークンの現在位置で初期化する
  useEffect(() => {
    if (!selectedTokenDetail) {
      setTokenMoveInput('');
      return;
    }
    const t = selectedTokenDetail.token;
    if (!t) return;
    const isSkill = t.type === 'skill';
    const sameTypeTokens = tokens.filter(tok => tok != null && (isSkill ? tok.type === 'skill' : tok.type !== 'skill'));
    const currentPos = sameTypeTokens.findIndex(tok => tok.instanceId === t.instanceId) + 1;
    if (currentPos > 0) setTokenMoveInput(String(currentPos));
  }, [selectedTokenDetail]);

  const startNextCycle = () => {
    setTurn(1);
    setCycleTotalCombo(0);
    setTarget((t) => Math.min(Math.floor(t * 1.5) + 2, MAX_TARGET));
    setGoalReached(false);
    setSkippedTurnsBonus(0);
    setStarProgress(0); // Reset progress if needed or keep it? Keeping it feels better but usually resets per cycle

    // Update shop reroll prices
    const nextBase = Math.ceil(shopRerollBasePrice * 1.5);
    setShopRerollBasePrice(nextBase);
    setShopRerollPrice(nextBase);

    generateShop();
    setShowShop(false);

    // エンドレスモードでない場合のみ統計を更新
    if (!isEndlessMode) {
      setStats(prev => {
        const nextCycle = Math.ceil(turn / maxTurns) + 1; // App.jsxでのCycle表示ロジックに合わせる
        return {
          ...prev,
          lifetimeClears: (prev.lifetimeClears || 0) + 1,
          maxCycleAllTime: Math.max(prev.maxCycleAllTime || 0, nextCycle)
        };
      });
      setCurrentRunStats(prev => ({ ...prev, currentClears: (prev.currentClears || 0) + 1 }));
    }

    notify("NEXT CYCLE STARTED!");
  };

  const skipTurns = () => {
    const remainingTurns = maxTurns - turn + 1;
    if (remainingTurns <= 0) return; // Do nothing if already over

    let bonusMultiplier = 3;
    const skipTokens = tokens.filter(t => t?.id === 'skip_master');
    if (skipTokens.length > 0) {
      bonusMultiplier = skipTokens.reduce((acc, t) => acc + (t.values[(t.level || 1) - 1] || 0), 0);
    }

    // --- 熟考の果て ---
    const endOfThoughtTokens = tokens.filter(t => t?.effect === 'stat_time_move');
    if (endOfThoughtTokens.length > 0) {
      const timeBonusPct = endOfThoughtTokens.reduce((acc, t) => {
        const v = t.values[(t.level || 1) - 1] || 0.05;
        const minutes = Math.floor((currentRunStats.currentTotalMoveTime || 0) / 60000);
        return acc + (minutes * v);
      }, 0);
      bonusMultiplier = Math.floor(bonusMultiplier * (1 + timeBonusPct));
    }

    const bonus = remainingTurns * bonusMultiplier;
    setStars((s) => s + bonus);
    notify(`SKIP BONUS: +${bonus} STARS!`);
    setSkippedTurnsBonus(prev => prev + remainingTurns);

    // Force turn to end state to trigger Clear Overlay
    setTurn(maxTurns + 1);
  };



  const resetGame = () => {
    setStars(5);
    setTarget(8);
    setTurn(1);
    setCycleTotalCombo(0);
    setCurrentRunTotalCombo(0);
    setShopRerollBasePrice(1);
    setShopRerollPrice(1);
    setTokens([]);
    setSandsOfTimeSeconds(0);
    /* setEnergy(0); // REMOVED */
    setActiveBuffs([]);
    setSkippedTurnsBonus(0);
    setPendingShopItem(null);
    setGoalReached(false);
    setShowShop(false);
    setShowGameClear(false); // Game Clear画面をリセット
    setIsGameOver(false);
    setIsEndlessMode(false); // Reset endless mode
    setStarProgress(0); // Reset progress
    setTotalPurchases(0);
    setTotalStarsSpent(0);
    setShopItems([]);
    setSavedBoard(null);
    setHasSaveData(false); // 新規ゲーム時はセーブデータなし状態へ
    // 覚醒ショップのリセット（解放フラグは新規ゲーム開始時にリセット）
    setIsEnchantShopUnlocked(false);
    setTokenSlotExpansionCount(0);
    setIsAwakeningLevelUpBought(false);
    generateShop();
    if (engineRef.current) {
      engineRef.current.init(null);
    }
    setStats(prev => {
      const nextStats = { ...prev, lifetimePlays: (prev.lifetimePlays || 0) + 1 };
      // 新規ゲーム開始時、エンドレスでない場合は少なくともCycle 1を記録
      if (!isEndlessMode) {
        nextStats.maxCycleAllTime = Math.max(nextStats.maxCycleAllTime || 0, 1);
      }
      return nextStats;
    });
    setCurrentRunStats(initialCurrentRunStats);
    setCurrentRunStats(prev => ({ ...prev, currentPlays: 1 })); // Plays is always 1 for the current run
    notify("NEW GAME STARTED!");
  };


  const handleEndlessMode = () => {
    setIsGameOver(false);
    setIsEndlessMode(true);
    notify("ENDLESS MODE START!");
  };

  const handleGiveUp = () => {
    setIsGameOver(false);
    resetGame();
  };

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const generateShop = () => {
    const isLuxury = totalPurchases >= 6;

    let saleBonus = 0;
    let enchantGrantBonus = 0;
    let shopExpandBonus = 0;
    tokens.forEach((t) => {
      if (t?.id === "bargain") {
        const value = t.values[(t.level || 1) - 1];
        saleBonus += (value - 1);
      }
      if (t?.effect === "enchant_grant_boost") {
        const value = t.values[(t.level || 1) - 1];
        enchantGrantBonus += value;
      }
      if (t?.effect === "shop_expand") {
        const value = t.values[(t.level || 1) - 1];
        shopExpandBonus += value;
      }
    });

    // Determine target counts
    const upgradeCount = 1;
    const basePassiveCount = 3 + shopExpandBonus;
    const baseActiveCount = 4 + shopExpandBonus;
    const enchantCount = 3;
    const extraEnchantCount = enchantGrantBonus + (isLuxury ? 1 : 0);
    const saleCount = 1 + saleBonus;

    setIsAwakeningLevelUpBought(false);

    // Define rarity probabilities based on cycleCount
    const getRarityProbabilities = (cycle) => {
      if (cycle <= 5) return { 1: 0.60, 2: 0.30, 3: 0.10 };
      if (cycle <= 9) return { 1: 0.40, 2: 0.40, 3: 0.20 };
      return { 1: 0.30, 2: 0.40, 3: 0.30 }; // cycle 10+
    };

    const cycleCount = Math.ceil(turn / maxTurns);
    let probs = getRarityProbabilities(cycleCount);

    let rarityUpCount = 0;
    let rarityDownCount = 0;
    tokens.forEach((t) => {
      if (t?.enchantments) {
        t.enchantments.forEach((enc) => {
          if (enc.effect === "rarity_up") rarityUpCount++;
          if (enc.effect === "rarity_down_combo") rarityDownCount++;
        });
      }
    });

    const adjustProb = (base, upRate, downRate, max) =>
      Math.max(0, Math.min(max, base + upRate * rarityUpCount - downRate * rarityDownCount));

    let p3 = adjustProb(probs[3] || 0, 0.10, 0.10, 1);
    let p2 = adjustProb(probs[2] || 0, 0.10, 0.10, 1 - p3);
    let p1 = Math.max(0, 1 - p2 - p3);

    probs = { 1: p1, 2: p2, 3: p3 };

    const getRarity = () => {
      const rand = Math.random();
      if (rand < probs[1]) return 1;
      if (rand < probs[1] + probs[2]) return 2;
      return 3;
    };

    // Pool setup
    const passivesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "passive" && (t.rarity || 1) === 1),
      2: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 2),
      3: ALL_TOKEN_BASES.filter(t => t.type === "passive" && t.rarity === 3),
    };
    if (passivesPools[2].length === 0) passivesPools[2] = passivesPools[1];
    if (passivesPools[3].length === 0) passivesPools[3] = passivesPools[2];

    const activesPools = {
      1: ALL_TOKEN_BASES.filter(t => t.type === "skill" && (t.rarity || 1) === 1),
      2: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 2),
      3: ALL_TOKEN_BASES.filter(t => t.type === "skill" && t.rarity === 3),
    };
    if (activesPools[2].length === 0) activesPools[2] = activesPools[1];
    if (activesPools[3].length === 0) activesPools[3] = activesPools[2];

    const createTokenItem = (pools) => {
      const rarity = getRarity();
      const pool = pools[rarity];
      const base = pool[Math.floor(Math.random() * pool.length)];
      const item = { ...base, level: 1, charge: base.cost || 0 };
      item.desc = getTokenDescription(item, 1, currentRunStats, tokens, activeBuffs);
      // エンチャント付きでのトークン販売は廃止
      return item;
    };


    // 2. Passives
    const passiveItems = Array.from({ length: basePassiveCount }).map(() => createTokenItem(passivesPools));

    // 3. Enchants（エンチャントショップ専用。常時生成する）
    const enchantItems = [];
    {
      // 基本は常に2種類生成
      for (let i = 0; i < enchantCount; i++) {
        const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        const encDesc = getEnchantDescription(enc.id);
        enchantItems.push({
          ...enc,
          type: "enchant_random",
          name: enc.name,
          originalName: enc.name,
          // 効果説明をdescに直接含める
          desc: encDesc || `所持トークンにランダムに「${enc.name}」を付与する。`,
        });
      }

      // 「魔道の極意」等によるボーナス枠
      for (let i = 0; i < extraEnchantCount; i++) {
        const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        const encDesc = getEnchantDescription(enc.id);
        enchantItems.push({
          ...enc,
          type: "enchant_random",
          name: enc.name,
          originalName: enc.name,
          price: Math.max(1, enc.price - 2),
          desc: encDesc || `所持トークンにランダムに「${enc.name}」を付与する。`,
        });
      }
    }

    // 4. Actives
    const activeItems = Array.from({ length: baseActiveCount }).map(() => createTokenItem(activesPools));

    // Apply Sales only to Passives and Actives
    const candidatesForSale = [...passiveItems, ...activeItems];
    const saleIndices = Array.from({ length: candidatesForSale.length }, (_, i) => i);

    for (let i = 0; i < saleCount && saleIndices.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * saleIndices.length);
      const targetIdx = saleIndices.splice(randIdx, 1)[0];
      candidatesForSale[targetIdx].isSale = true;
      candidatesForSale[targetIdx].originalPrice = candidatesForSale[targetIdx].price;
      candidatesForSale[targetIdx].price = Math.floor(candidatesForSale[targetIdx].price / 2);
    }

    // Combine all in required order
    // Order: passive, enchant, active
    const finalItems = [...passiveItems, ...enchantItems, ...activeItems];
    setShopItems(finalItems);
    return finalItems;
  };

  const buyItem = (item) => {
    if (stars < item.price) return notify("★が足りません");

    // 永続強化: 時の砂
    if (item.id === "time_ext") {
      setSandsOfTimeSeconds(prev => prev + 2);
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      return notify("操作時間が2秒延長されました！");
    }

    if (item.type === "upgrade_random") {
      // Filter only tokens that are not max level (Max Lv 3) and not copy tokens
      const upgradeableTokens = tokens.filter(t => (t.level || 1) < 3 && t.effect !== 'copy_left');

      if (upgradeableTokens.length === 0) return notify("強化可能なトークンがありません");

      // Randomly select one from upgradeable tokens
      const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];
      // Find index in original array to update
      const targetIdx = tokens.findIndex(t => t.instanceId === targetToken.instanceId);

      setTokens((prev) => {
        const next = [...prev];
        const nextLevel = (next[targetIdx].level || 1) + 1;
        next[targetIdx] = {
          ...next[targetIdx],
          level: nextLevel,
          desc: getTokenDescription(next[targetIdx], nextLevel, currentRunStats, next, activeBuffs)
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify(`${targetToken.name} が強化されました! (Lv${(targetToken.level || 1) + 1})`);

    } else if (item.type === "enchant_random") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), { id: item.id, effect: item.effect, name: item.originalName, params: item.params }],
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify(`${targetToken.name} に「${item.originalName}」を付与!`);

    } else if (item.type === "enchant_grant") {
      const enchantableTokens = tokens.filter(t => t.effect !== 'copy_left');
      if (enchantableTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = enchantableTokens[Math.floor(Math.random() * enchantableTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), { id: item.id, effect: item.effect, name: item.name, params: item.params }],
        };
        return next;
      });
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify("購入完了!");
    } else {
      // Normal Token Purchase
      const isActive = item.type === 'skill';
      const activeCount = tokens.filter(t => t?.type === 'skill').length;
      const passiveCount = tokens.filter(t => t && t?.type !== 'skill').length;
      const maxSlots = 5 + tokenSlotExpansionCount;
      if (isActive && activeCount >= maxSlots) return notify(`アクティブスキルは${maxSlots}個までです`);
      if (!isActive && passiveCount >= maxSlots) return notify(`パッシブアイテムは${maxSlots}個までです`);

      const existingIdx = tokens.findIndex((t) => t?.id === item.id);
      if (existingIdx !== -1) {
        // Double check if max level (Use values.length as reference, default to 3)
        const maxLv = tokens[existingIdx].values?.length || 3;
        if ((tokens[existingIdx].level || 1) >= maxLv) {
          return notify(`これ以上強化できません (Max Lv${maxLv})`);
        }
        setPendingShopItem(item);
      } else {
        setTokens((prev) => [
          ...prev,
          { ...item, instanceId: Date.now() + Math.random() } // Add unique instance ID
        ]);
        setStars((s) => s - item.price);
        setTotalPurchases((p) => p + 1);
        setTotalStarsSpent((prev) => prev + item.price);
        setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + item.price }));
        setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + item.price }));
        setShopItems((prev) => prev.filter((i) => i !== item));
        notify("購入完了!");
      }
    }
  };

  // --- \u899a\u9192\u30b7\u30e7\u30c3\u30d7\u306e\u8cfc\u5165\u51e6\u7406 ---
  const AWAKENING_TOKEN_SLOT_BASE_PRICE = 100; // \u30c8\u30fc\u30af\u30f3\u67a0\u62e1\u5f35\u306e\u521d\u671f\u4fa1\u683c
  const AWAKENING_TOKEN_SLOT_PRICE_STEP = 50;  // \u8cfc\u5165\u3054\u3068\u306b\u4e0a\u6607\u3059\u308b\u91d1\u984d

  const getTokenSlotExpandPrice = () =>
    AWAKENING_TOKEN_SLOT_BASE_PRICE + tokenSlotExpansionCount * AWAKENING_TOKEN_SLOT_PRICE_STEP;

  const buyAwakeningItem = (type) => {
    switch (type) {
      case 'random_levelup': {
        const price = 5;
        if (stars < price) return notify('\u2605\u304c\u8db3\u308a\u307e\u305b\u3093');
        const upgradeableTokens = tokens.filter(t => (t?.level || 1) < 3);
        if (upgradeableTokens.length === 0) return notify('\u5f37\u5316\u53ef\u80fd\u306a\u30c8\u30fc\u30af\u30f3\u304c\u3042\u308a\u307e\u305b\u3093 (Max Lv3)');
        const targetToken = upgradeableTokens[Math.floor(Math.random() * upgradeableTokens.length)];
        const targetIdx = tokens.findIndex(t => t?.instanceId === targetToken.instanceId);
        setTokens(prev => {
          const next = [...prev];
          const nextLevel = (next[targetIdx].level || 1) + 1;
          next[targetIdx] = {
            ...next[targetIdx],
            level: nextLevel,
            desc: getTokenDescription(next[targetIdx], nextLevel, currentRunStats, next, activeBuffs)
          };
          return next;
        });
        setStars(s => s - price);
        setTotalPurchases(p => p + 1);
        setTotalStarsSpent(prev => prev + price);
        setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + price }));
        setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + price }));
        setIsAwakeningLevelUpBought(true);
        notify(`${targetToken.name} \u304c\u5f37\u5316\u3055\u308c\u307e\u3057\u305f! (Lv${(targetToken.level || 1) + 1})`);
        break;
      }
      case 'unlock_enchant_shop': {
        const price = 10;
        if (stars < price) return notify('\u2605\u304c\u8db3\u308a\u307e\u305b\u3093');
        if (isEnchantShopUnlocked) return notify('\u30a8\u30f3\u30c1\u30e3\u30f3\u30c8\u30b7\u30e7\u30c3\u30d7\u306f\u3059\u3067\u306b\u89e3\u653e\u6e08\u307f\u3067\u3059');
        setIsEnchantShopUnlocked(true);
        setStars(s => s - price);
        notify('\u30a8\u30f3\u30c1\u30e3\u30f3\u30c8\u30b7\u30e7\u30c3\u30d7\u304c\u89e3\u653e\u3055\u308c\u307e\u3057\u305f!');
        break;
      }
      case 'expand_token_slots': {
        const price = getTokenSlotExpandPrice();
        if (stars < price) return notify('\u2605\u304c\u8db3\u308a\u307e\u305b\u3093');
        setTokenSlotExpansionCount(prev => prev + 1);
        setStars(s => s - price);
        notify(`\u30c8\u30fc\u30af\u30f3\u67a0\u304c ${5 + tokenSlotExpansionCount + 1} / ${5 + tokenSlotExpansionCount + 1} \u306b\u62e1\u5f35\u3055\u308c\u307e\u3057\u305f!`);
        break;
      }
      default:
        break;
    }
  };

  const handleChoice = (choice) => {
    if (!pendingShopItem) return;
    const item = pendingShopItem;

    if (choice === "upgrade") {
      setTokens((prev) => {
        const next = [...prev];
        const idx = next.findIndex((t) => t?.id === item.id);
        if (idx !== -1) {
          const currentLevel = next[idx].level || 1;
          if (currentLevel >= 3) {
            // Should verify in UI but safe check here
            return next;
          }
          const nextLevel = currentLevel + 1;
          next[idx] = {
            ...next[idx],
            level: nextLevel,
            desc: getTokenDescription(next[idx], nextLevel, currentRunStats, next, activeBuffs)
          };
        }
        return next;
      });
      notify(`${item.name} を強化しました!`);
    } else {

      // "Equip Second" logic - check limits again
      const isActive = item.type === 'skill';
      const activeCount = tokens.filter(t => t.type === 'skill').length;
      const passiveCount = tokens.filter(t => t.type !== 'skill').length;

      if ((isActive && activeCount >= 5) || (!isActive && passiveCount >= 5)) {
        notify("スロットがいっぱいです。代わりに強化します。");
        setTokens((prev) => {
          const next = [...prev];
          const idx = next.findIndex((t) => t?.id === item.id);
          if (idx !== -1) {
            const nextLevel = (next[idx].level || 1) + 1;
            next[idx] = {
              ...next[idx],
              level: nextLevel,
              desc: getTokenDescription(next[idx], nextLevel, currentRunStats, next, activeBuffs)
            };
          }
          return next;
        });
      } else {
        setTokens((prev) => [
          ...prev,
          { ...item, instanceId: Date.now() + Math.random() }
        ]);
        notify("2つ目のトークンを装備しました。");
      }
    }

    setStars((s) => s - item.price);
    setTotalPurchases((p) => p + 1);
    setTotalStarsSpent((prev) => prev + item.price);
    setShopItems((prev) => prev.filter((i) => i !== item));
    setPendingShopItem(null);
  };

  const activateSkill = (token) => {
    if (!token || token.type !== "skill") return;

    // オーバーレイ表示時はスキル発動不可
    if (isGameOver) return notify("ゲームオーバー時は使用できません");
    if (turn > maxTurns && goalReached) return notify("クリア時は使用できません");
    if (showShop) return notify("ショップ画面では使用できません");

    // Check individual charge
    const currentCharge = token.charge || 0;
    const cost = getEffectiveCost(token, currentRunStats, tokens, activeBuffs);

    if (currentCharge < cost) {
      return notify(`チャージ不足です (${currentCharge}/${cost})`);
    }

    if (engineRef.current?.processing) return notify("処理中です");

    const engine = engineRef.current;
    if (!engine) return;

    setStats(prev => ({ ...prev, lifetimeSkillsUsed: (prev.lifetimeSkillsUsed || 0) + 1 }));
    setCurrentRunStats(prev => ({ ...prev, currentSkillsUsed: (prev.currentSkillsUsed || 0) + 1 }));

    console.log("Using skill:", token);

    // --- 効果時間延長パッシブの計算 ---
    let extraDuration = 0;
    // calculateComboと同様、この時点でのtokens（またはリファクタリング後のeffectiveTokens相当）から取得
    tokens.forEach((t, index) => {
      if (!t) return;
      // コピートークンも考慮
      let workToken = t;
      if (t.effect === 'copy_left' && index > 0 && tokens[index - 1] && tokens[index - 1].effect !== 'copy_left') {
        workToken = tokens[index - 1];
      }
      if (workToken.effect === 'active_duration_boost') {
        const lv = workToken.level || 1;
        extraDuration += (workToken.values?.[lv - 1] || 0);
      }
    });

    switch (token.action) {
      case "refresh":
        engine.init();
        break;
      case "force_refresh":
        skipTurnProgressRef.current = true;
        engine.forceRefresh();
        break;
      case "convert":
        engine.convertColor(token.params.from, token.params.to);
        break;
      case "convert_multi":
        engine.convertMultiColor(token.params.types, token.params.to);
        break;
      case "board_change":
        engine.changeBoardColors(token.params.colors);
        break;
      case "spawn_random":
        engine.spawnRandom(token.params.color, token.params.count);
        break;
      case "board_balance":
        engine.changeBoardBalanced();
        break;
      case "spawn_bomb_random":
        engine.spawnBombRandom(token.params.count);
        break;
      case "convert_bomb_targeted":
        engine.convertBombTargeted(token.params.count, token.params.type);
        break;
      case "spawn_repeat":
        engine.spawnRepeatRandom(token.params.count);
        break;
      case "convert_repeat":
        engine.convertRepeatTargeted(token.params.count, token.params.color);
        break;
      case "spawn_rainbow":
        engine.spawnRainbowRandom(token.params.count);
        break;
      case "rainbow_master":
        engine.spawnRainbowRandom(token.params.count);
        engine.setAllRainbowCounts(token.params.to);
        break;
      case "spawn_star":
        engine.spawnStarRandom(token.params.count);
        break;
      case "convert_star":
        engine.convertStarTargeted(token.params.count, token.params.color);
        break;
      case "skyfall":
      case "skyfall_limit":
      case "temp_mult":
      case "seal_of_power": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            action: token.action,
            params: token.params,
            duration: finalDuration,
            maxDuration: finalDuration,
            tokenId: token.instanceId || token.id,
            name: token.name,
          },
        ]);
        notify(`${token.name} 発動！ (${finalDuration}手番)`);
        break;
      }
      case "row_fix":
        engine.fixRowColor(token.params.row, token.params.type);
        break;
      case "col_fix":
        engine.fixColColor(token.params.col, token.params.type);
        break;
      case "forbidden_temp":
        engine.noSkyfall = true;
        notify("禁忌の儀式発動！(落ちコン停止)");
        break;
      case "enhance_color":
        engine.enhanceColorOrbs(token.params.colors);
        break;
      case "chronos_stop": {
        const finalDuration = (token.params.duration || 1) + extraDuration;
        engine.activateChronosStop(finalDuration);
        notify(`${token.name} 発動！ (${finalDuration}手番)`);
        break;
      }
      case "charge_boost": {
        const boostAmount = token.values?.[(token.level || 1) - 1] || 1;
        // 他のスキルトークンのchargeを加算し、自身のchargeを0にリセット
        setTokens(prev => prev.map(t => {
          if (!t) return t;
          // 自身のchargeを0にリセット
          if (t === token) return { ...t, charge: 0 };
          // 他のスキルトークンのchargeを加算
          if (t.type !== 'skill') return t;
          const newCharge = Math.min(t.cost || 0, (t.charge || 0) + boostAmount);
          return { ...t, charge: newCharge };
        }));
        notify(`他スキルのエネルギー +${boostAmount}!`);
        return; // 共通のchargeリセット処理をスキップ
      }
      default:
        break;
    }

    // --- 追加: Lv3以上なら基礎コンボ値プラス効果 (Next Turn Bonus) ---
    // アクティブスキルをレベル3にすると基礎コンボ値プラスの効果がつく
    // 値は「基礎コンボ値プラスはレベル１時点でのエネルギー数分増やす」
    if ((token.level || 1) >= 3) {
      const bonusValue = token.cost || 0; // レベル1時点でのエネルギー数 = 基本コスト
      if (bonusValue > 0) {
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now() + 1, // ユニークIDずらす
            action: "skill_combo_bonus",
            params: { value: bonusValue },
            duration: 1, // 1ターン (このターン終了時)
            name: `Lv3ボーナス(+${bonusValue})`
          },
        ]);
        notify(`Lv3ボーナス: コンボ+${bonusValue} (次ターン)`);
      }
    }

    // Consume Charge
    setTokens(prev => prev.map(t => {
      if (t === token) {
        return { ...t, charge: 0 };
      }
      return t;
    }));
    /* setEnergy((prev) => prev - (token.cost || 0)); // REMOVED */
    notify(`${token.name} 発動!`);
  };

  const sellToken = (token) => {
    if (!token) return;

    // --- 変更: 資産価値 (Investment) ---
    let sellRate = 0.5;
    if (token.enchantments?.some(e => e.effect === "high_sell")) {
      sellRate = 3.0; // 300%
    }
    let sellPrice = Math.floor(token.price * sellRate);

    // --- 追加: 鉤爪の研鑽 (polishing_claw) ---
    if (token.effect === "stat_shape_l") {
      const v = token.values?.[(token.level || 1) - 1] || 1;
      const lCount = currentRunStats.currentShapeLShape || 0;
      sellPrice += (lCount * v);
    }

    setStars(s => s + sellPrice);

    setTokens(prev => prev.filter(t => t.instanceId !== token.instanceId));

    setSelectedTokenDetail(null);
    notify(`${token.name} を売却しました (+${sellPrice} ★)`);
  };

  // トークンを同一タイプの中で指定番号の位置に移動する
  const moveToken = (token, targetPos) => {
    if (!token) return;
    const isSkill = token.type === 'skill';

    setTokens(prev => {
      // スキルとパッシブを分離
      const sameType = prev.filter(t => t != null && (isSkill ? t.type === 'skill' : t.type !== 'skill'));
      const otherType = prev.filter(t => t == null || (isSkill ? t.type !== 'skill' : t.type === 'skill'));
      // 対象トークンを取り除いた同タイプリスト
      const withoutSelf = sameType.filter(t => t.instanceId !== token.instanceId);
      // 指定位置（1始まり）に挿入
      const clampedPos = Math.max(0, Math.min(targetPos - 1, withoutSelf.length));
      withoutSelf.splice(clampedPos, 0, token);
      // 同タイプを前に、別タイプを後ろに結合
      return [...withoutSelf, ...otherType];
    });

    setSelectedTokenDetail(null);
    notify(`${token.name} を ${targetPos} 番目に移動しました`);
  };

  const openShop = () => {
    if (shopItems.length === 0) {
      generateShop();
    }
    setShowShop(true);
  };

  const refreshShop = () => {
    if (stars < shopRerollPrice) return notify("★が足りません");
    setStars(s => s - shopRerollPrice);
    setTotalStarsSpent((prev) => prev + shopRerollPrice);
    setStats(prev => ({ ...prev, lifetimeStarsSpent: (prev.lifetimeStarsSpent || 0) + shopRerollPrice }));
    setCurrentRunStats(prev => ({ ...prev, currentStarsSpent: (prev.currentStarsSpent || 0) + shopRerollPrice }));
    setShopRerollPrice(prev => Math.ceil(prev * 1.5));
    generateShop();
    notify("商品を入荷しました");
  };

  // ロード中の画面
  if (!isLoaded) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-primary font-bold">
        Loading...
      </div>
    );
  }

  if (showHelp) {
    return (
      <HelpScreen onClose={() => setShowHelp(false)} />
    );
  }

  if (showCredits) {
    return (
      <CreditsScreen onClose={() => setShowCredits(false)} />
    );
  }

  if (showSettings) {
    return (
      <SettingsScreen
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  if (showStats) {
    return (
      <StatsScreen
        stats={stats}
        currentRunStats={currentRunStats}
        isActiveGame={!showTitle}
        onClose={() => setShowStats(false)}
      />
    );
  }

  if (showTitle) {
    return (
      <TitleScreen
        hasSaveData={hasSaveData}
        onContinue={() => {
          setShowTitle(false);
          // if (engineRef.current && savedBoard) engineRef.current.init(savedBoard);
        }}
        onStart={() => {
          localStorage.removeItem(SAVE_KEY);
          setHasSaveData(false);
          resetGame();
          setShowTitle(false);
        }}
        onHelp={() => setShowHelp(true)}
        onStats={() => setShowStats(true)}
        onCredits={() => setShowCredits(true)}
        onSettings={() => setShowSettings(true)}
      />
    );
  }

  const toggleEnchantStatus = (tokenInstanceId, enchantIndex) => {
    setTokens(prev => {
      const next = [...prev];
      const tIdx = next.findIndex(t => t.instanceId === tokenInstanceId);
      if (tIdx === -1) return next;
      const newEnchants = [...(next[tIdx].enchantments || [])];
      if (newEnchants[enchantIndex]) {
        newEnchants[enchantIndex] = {
          ...newEnchants[enchantIndex],
          disabled: !newEnchants[enchantIndex].disabled
        };
      }
      next[tIdx] = { ...next[tIdx], enchantments: newEnchants };
      return next;
    });
  };

  return (
    <div className="bg-background-dark font-display text-slate-100 h-screen overflow-hidden flex justify-center w-full">
      {/* Mobile Container */}
      <div className="w-full max-w-md h-full flex flex-col relative bg-background-dark shadow-2xl overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* --- Top Area Swipe Handler --- */}
        <div
          className="flex-none flex flex-col relative z-30"
          onTouchStart={(e) => {
            // パズル盤面など必要な部分に影響しないように、画面上部のコンテナにのみ適用
            timerRef.current && (timerRef.current._swipeStartX = e.touches[0].clientX);
            timerRef.current && (timerRef.current._swipeStartY = e.touches[0].clientY);
            timerRef.current && (timerRef.current._swipeStartTime = Date.now());
          }}
          onTouchEnd={(e) => {
            if (!timerRef.current || !timerRef.current._swipeStartX) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - timerRef.current._swipeStartX;
            const dy = touchEndY - timerRef.current._swipeStartY;
            const dt = Date.now() - timerRef.current._swipeStartTime;

            // X方向（右）への移動量が十分大きく、Y方向のズレが少なく、短時間でのフリック判定
            // ※ shop画面を開くのは条件満たしている、かつ現在開いていない場合のみ（openShop内にロジックあり）
            if (dx < -50 && Math.abs(dy) < 50 && dt < 300) { // 右から左（左フリック）で開く？いや、「右フリックでショップ画面に」
              // ...要求は「画面上部を右フリックでショップ画面に」
              // dx > 50 が右フリック
            }
            if (dx > 50 && Math.abs(dy) < 50 && dt < 300) {
              openShop();
            }
            timerRef.current._swipeStartX = null;
          }}
        >
          {/* Top Status Bar */}
          <header className="relative z-10 px-4 pt-6 pb-2 flex justify-between items-center glass-panel border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Current Stage</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Cycle {Math.ceil(turn / maxTurns)}</span>
                <span className="text-primary font-bold">/</span>
                <span className="text-lg font-bold text-white">Turn {turn}{isEndlessMode ? ' (∞)' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded-full border border-white/10">
                <span className="material-icons-round text-yellow-400 text-sm">star</span>
                <span className="font-bold text-sm tracking-wide">{stars.toLocaleString()}</span>
              </div>
              <button
                onClick={openShop}
                className="flex items-center gap-1 bg-slate-800/50 hover:bg-slate-700/50 px-3 py-1 rounded-full border border-white/10 cursor-pointer active:scale-95 transition-all text-sm font-bold text-white"
              >
                <span className="material-icons-round text-primary text-sm">storefront</span>
                <span>Shop</span>
              </button>
            </div>
          </header>

          {/* Main Stats Area */}
          <section className="relative z-10 px-6 py-3 flex-none">
            <div className="flex justify-between items-center">
              {/* Target Combo テキスト表示 */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-primary">
                  <span className="material-icons-round text-xl">whatshot</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Target Combo</span>
                  <span
                    ref={targetComboRef}
                    className={`text-xl font-mono font-bold text-white inline-block ${targetPulse ? 'animate-target-pulse' : ''}`}
                  >
                    {cycleTotalCombo}<span className="text-slate-500 text-lg">/{target}</span>
                  </span>
                </div>
              </div>
              {/* 操作時間テキスト */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-primary">
                  <span className="material-icons-round text-xl">timer</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Move Time</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {Math.round((getTimeLimit() / 1000) * 100) / 100}<span className="text-xs text-slate-500 ml-0.5">s</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Token/Skill Belt */}
          {(() => {
            const TOKENS_PER_PAGE = 5;
            const maxSlots = 5 + (tokenSlotExpansionCount || 0);
            const passiveTokens = tokens.filter(t => t && t.type !== 'skill');
            const activeTokens = tokens.filter(t => t && t.type === 'skill');
            const passivePages = Math.ceil(Math.max(maxSlots, passiveTokens.length) / TOKENS_PER_PAGE);
            const activePages = Math.ceil(Math.max(maxSlots, activeTokens.length) / TOKENS_PER_PAGE);
            const safePassivePage = Math.min(passiveTokenPage, passivePages - 1);
            const safeActivePage = Math.min(activeTokenPage, activePages - 1);

            return (
              <section className="relative z-30 px-6 py-2 flex-none mb-4 flex flex-col gap-2">

                {/* Passive Tokens Row */}
                <div>
                  <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider flex justify-between items-center">
                    <span>Passive Artifacts</span>
                    <div className="flex items-center gap-1">
                      {passivePages > 1 && (
                        <>
                          <button onClick={() => setPassiveTokenPage(p => Math.max(p - 1, 0))} disabled={safePassivePage === 0}
                            className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                            <span className="material-icons-round text-[12px]">chevron_left</span>
                          </button>
                          <span className="text-[9px] text-slate-600">{safePassivePage + 1}/{passivePages}</span>
                          <button onClick={() => setPassiveTokenPage(p => Math.min(p + 1, passivePages - 1))} disabled={safePassivePage === passivePages - 1}
                            className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                            <span className="material-icons-round text-[12px]">chevron_right</span>
                          </button>
                        </>
                      )}
                      <span className="text-[9px] ml-1">{passiveTokens.length}/{maxSlots}</span>
                    </div>
                  </h3>
                  <div className="overflow-hidden"
                    onTouchStart={e => { passiveSwipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                    onTouchEnd={e => {
                      if (!passiveSwipeRef.current) return;
                      const dx = e.changedTouches[0].clientX - passiveSwipeRef.current.x;
                      const dy = e.changedTouches[0].clientY - passiveSwipeRef.current.y;
                      passiveSwipeRef.current = null;
                      if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
                      if (dx < 0) setPassiveTokenPage(p => Math.min(p + 1, passivePages - 1));
                      else setPassiveTokenPage(p => Math.max(p - 1, 0));
                    }}
                    onMouseDown={e => {
                      const startX = e.clientX;
                      const onUp = eu => {
                        window.removeEventListener('mouseup', onUp);
                        const dx = eu.clientX - startX;
                        if (Math.abs(dx) < 30) return;
                        if (dx < 0) setPassiveTokenPage(p => Math.min(p + 1, passivePages - 1));
                        else setPassiveTokenPage(p => Math.max(p - 1, 0));
                      };
                      window.addEventListener('mouseup', onUp);
                    }}
                  >
                    <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${safePassivePage * 100}%)` }}>
                      {Array.from({ length: passivePages }).map((_, pageIdx) => (
                        <div key={pageIdx} className="grid grid-cols-5 gap-2 flex-shrink-0 w-full">
                          {Array.from({ length: TOKENS_PER_PAGE }).map((_, slotIdx) => {
                            const globalSlot = pageIdx * TOKENS_PER_PAGE + slotIdx;
                            const t = passiveTokens[globalSlot];
                            const isLocked = globalSlot >= maxSlots;
                            let borderColor = isLocked ? 'border-slate-800' : (t ? (t.rarity === 3 ? 'border-yellow-400/60' : t.rarity === 2 ? 'border-sky-400/60' : 'border-white/20') : 'border-white/5');
                            let shadowClass = '';
                            let animClass = '';
                            if (t && triggeredPassives.includes(t.instanceId || t.id)) {
                              animClass = 'animate-bounce';
                              shadowClass = 'shadow-[0_0_15px_rgba(255,255,255,0.8)]';
                            }
                            if (t && !animClass) {
                              let conditionMet = false;
                              switch (t.effect) {
                                case 'color_count_bonus': {
                                  const countReq = t.params?.count || 0;
                                  const cColor = t.params?.color;
                                  conditionMet = cColor && (lastErasedColorCounts[cColor] || 0) >= countReq;
                                  break;
                                }
                                case 'combo_if_ge':
                                  conditionMet = lastTurnCombo >= (t.params?.combo || 0);
                                  break;
                                case 'combo_if_exact':
                                  conditionMet = lastTurnCombo === (t.params?.combo || 0);
                                  break;
                                default:
                                  break;
                              }
                              if (conditionMet) {
                                borderColor = 'border-green-400/80';
                                shadowClass = 'shadow-[0_0_15px_rgba(74,222,128,0.5)]';
                              }
                            }
                            return (
                              <div
                                key={`passive-p${pageIdx}-${slotIdx}`}
                                onClick={() => !isLocked && t && setSelectedTokenDetail({ token: t })}
                                className={`aspect-square rounded-xl flex items-center justify-center relative border transition-all duration-300 ${animClass} ${shadowClass} ${isLocked ? 'bg-slate-950/50 border-slate-800 opacity-40 cursor-not-allowed' : (t ? `bg-slate-800 ${borderColor} cursor-pointer hover:bg-white/5 hover:scale-105` : 'bg-slate-900/30 border-white/5 border-dashed')}`}
                              >
                                {isLocked ? (
                                  <span className="material-icons-round text-slate-700 text-lg">lock</span>
                                ) : t ? (
                                  <>
                                    <span className={`material-icons-round text-2xl relative z-10 ${animClass ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : shadowClass ? 'text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-slate-400'}`}>
                                      auto_awesome
                                    </span>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20">
                                      {t.level || 1}
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  {passivePages > 1 && (
                    <div className="flex justify-center gap-1 mt-1">
                      {Array.from({ length: passivePages }).map((_, i) => (
                        <button key={i} onClick={() => setPassiveTokenPage(i)}
                          className={`h-1 rounded-full transition-all duration-200 ${i === safePassivePage ? 'bg-primary w-3' : 'bg-slate-600 w-1'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Tokens Row */}
                <div>
                  <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider flex justify-between items-center">
                    <span>Active Spells</span>
                    <div className="flex items-center gap-1">
                      {activePages > 1 && (
                        <>
                          <button onClick={() => setActiveTokenPage(p => Math.max(p - 1, 0))} disabled={safeActivePage === 0}
                            className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                            <span className="material-icons-round text-[12px]">chevron_left</span>
                          </button>
                          <span className="text-[9px] text-slate-600">{safeActivePage + 1}/{activePages}</span>
                          <button onClick={() => setActiveTokenPage(p => Math.min(p + 1, activePages - 1))} disabled={safeActivePage === activePages - 1}
                            className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors active:scale-90">
                            <span className="material-icons-round text-[12px]">chevron_right</span>
                          </button>
                        </>
                      )}
                      <span className="text-[9px] ml-1">{activeTokens.length}/{maxSlots}</span>
                    </div>
                  </h3>
                  <div className="overflow-hidden"
                    onTouchStart={e => { activeSwipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                    onTouchEnd={e => {
                      if (!activeSwipeRef.current) return;
                      const dx = e.changedTouches[0].clientX - activeSwipeRef.current.x;
                      const dy = e.changedTouches[0].clientY - activeSwipeRef.current.y;
                      activeSwipeRef.current = null;
                      if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
                      if (dx < 0) setActiveTokenPage(p => Math.min(p + 1, activePages - 1));
                      else setActiveTokenPage(p => Math.max(p - 1, 0));
                    }}
                    onMouseDown={e => {
                      const startX = e.clientX;
                      const onUp = eu => {
                        window.removeEventListener('mouseup', onUp);
                        const dx = eu.clientX - startX;
                        if (Math.abs(dx) < 30) return;
                        if (dx < 0) setActiveTokenPage(p => Math.min(p + 1, activePages - 1));
                        else setActiveTokenPage(p => Math.max(p - 1, 0));
                      };
                      window.addEventListener('mouseup', onUp);
                    }}
                  >
                    <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${safeActivePage * 100}%)` }}>
                      {Array.from({ length: activePages }).map((_, pageIdx) => (
                        <div key={pageIdx} className="grid grid-cols-5 gap-2 flex-shrink-0 w-full">
                          {Array.from({ length: TOKENS_PER_PAGE }).map((_, slotIdx) => {
                            const globalSlot = pageIdx * TOKENS_PER_PAGE + slotIdx;
                            const t = activeTokens[globalSlot];
                            const isLocked = globalSlot >= maxSlots;
                            const isSkill = t?.type === 'skill';
                            const charge = t?.charge || 0;
                            const cost = getEffectiveCost(t, currentRunStats, tokens, activeBuffs);
                            const progress = isSkill ? Math.min(100, (charge / cost) * 100) : 100;
                            const isReady = isSkill && charge >= cost;
                            const relatedBuffs = t ? activeBuffs.filter(b => b.tokenId === (t.instanceId || t.id)) : [];
                            const activeBuff = relatedBuffs.length > 0 ? relatedBuffs[0] : null;
                            const stackCount = relatedBuffs.length;
                            const buffProgress = activeBuff ? Math.min(100, (activeBuff.duration / activeBuff.maxDuration) * 100) : 0;
                            let animClass = '';
                            let triggeredShadow = '';
                            if (t && triggeredPassives.includes(t.instanceId || t.id)) {
                              animClass = 'animate-bounce';
                              triggeredShadow = 'shadow-[0_0_15px_rgba(255,255,255,0.8)]';
                            }
                            const readyBorder = t && t.rarity === 3 ? 'border-yellow-400/60 shadow-[0_0_10px_rgba(250,204,21,0.25)]' : t && t.rarity === 2 ? 'border-sky-400/60 shadow-[0_0_10px_rgba(56,189,248,0.25)]' : 'border-primary/50 shadow-[0_0_10px_rgba(91,19,236,0.25)]';
                            const notReadyBorder = t && t.rarity === 3 ? 'border-yellow-400/30' : t && t.rarity === 2 ? 'border-sky-400/30' : 'border-white/10';
                            const buffBorder = stackCount > 1 ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse' : stackCount === 1 ? 'border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : '';
                            let containerClasses = isLocked
                              ? 'bg-slate-950/50 border-slate-800 opacity-40 cursor-not-allowed'
                              : (t
                                ? (stackCount > 0 ? `bg-slate-800 ${buffBorder} cursor-pointer group hover:scale-105` : (isReady ? `bg-slate-800 ${readyBorder} cursor-pointer group hover:scale-105` : `bg-slate-900 ${notReadyBorder} opacity-80 cursor-pointer`))
                                : 'bg-slate-900/30 border-white/5 border-dashed');
                            containerClasses = `${containerClasses} ${animClass} ${triggeredShadow}`;
                            return (
                              <div
                                key={`active-p${pageIdx}-${slotIdx}`}
                                onClick={() => !isLocked && t && setSelectedTokenDetail({ token: t })}
                                className={`aspect-square rounded-xl flex items-center justify-center relative border transition-all duration-300 ${containerClasses}`}
                              >
                                {isLocked ? (
                                  <span className="material-icons-round text-slate-700 text-lg">lock</span>
                                ) : t ? (
                                  <>
                                    <div className="absolute inset-0 bg-primary/10 rounded-xl overflow-hidden">
                                      {isSkill && <div className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-500" style={{ height: `${progress}%` }}></div>}
                                      {stackCount > 0 && activeBuff && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/60 to-blue-400/30 transition-all duration-500" style={{ height: `${buffProgress}%` }}></div>}
                                    </div>
                                    <span className={`material-icons-round text-2xl drop-shadow-md relative z-10 ${animClass ? 'text-white' : stackCount > 0 ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : isReady ? 'text-primary' : 'text-slate-500'}`}>
                                      sports_martial_arts
                                    </span>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20">
                                      {t.level || 1}
                                    </div>
                                    {isSkill && t.cost > 0 && (
                                      <div className="absolute top-[2px] right-1 z-20">
                                        <span className="text-[10px] text-slate-300 font-mono font-bold drop-shadow-md">{charge}/{cost}</span>
                                      </div>
                                    )}
                                    {stackCount > 0 && activeBuff && (
                                      <div className="absolute top-[2px] left-1 z-20">
                                        <span className="text-[10px] text-cyan-300 font-bold drop-shadow-md">{activeBuff.duration}t</span>
                                      </div>
                                    )}
                                    {stackCount > 1 && (
                                      <div className="absolute top-[14px] left-1 bg-cyan-600/80 text-white rounded-sm px-0.5 flex items-center justify-center text-[8px] font-black z-20 shadow-sm border border-white/10">
                                        x{stackCount}
                                      </div>
                                    )}
                                  </>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  {activePages > 1 && (
                    <div className="flex justify-center gap-1 mt-1">
                      {Array.from({ length: activePages }).map((_, i) => (
                        <button key={i} onClick={() => setActiveTokenPage(i)}
                          className={`h-1 rounded-full transition-all duration-200 ${i === safeActivePage ? 'bg-primary w-3' : 'bg-slate-600 w-1'}`} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })()}



          {/* 操作時間ゲージ（トークンの下） */}
          <div className="relative z-30 px-6 mb-2">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
              <div ref={timerRef} className="h-full bg-gradient-to-r from-green-400 to-emerald-600 w-full transition-all duration-0 ease-linear shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-full"></div>
            </div>
          </div>

          {/* Contextual Action Button (Floating) */}
          <div className="absolute bottom-[50%] left-0 right-0 z-30 px-6 flex justify-center pointer-events-none">
            {goalReached && turn <= maxTurns && (
              <button
                onClick={skipTurns}
                className="pointer-events-auto bg-primary text-white font-bold py-3 px-8 rounded-full shadow-[0_4px_20px_rgba(91,19,236,0.5)] border border-white/20 flex items-center gap-2 transform transition hover:scale-105 active:scale-95 animate-bounce"
              >
                <span>NEXT GOAL REACHED</span>
                <span className="material-icons-round">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Puzzle Grid Area */}
          <section className="relative z-20 flex-1 bg-slate-900 rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Grid Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black opacity-90"></div>



            <div className="relative w-full h-full p-4 pt-4 flex flex-col justify-start">
              {/* コンボ表示 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex justify-center w-full">
                <div ref={comboRef} className="combo-display"></div>
              </div>

              {/* Timer Bar はトークンベルトの下に移動済み */}

              {/* The 6x5 Grid Container with Overlays */}
              <div className="w-full relative" style={{ aspectRatio: `${cols} / ${rows}` }}>

                {/* Layer 1: Puzzle Board (Always rendered behind) */}
                <div
                  ref={boardRef}
                  className="w-full h-full absolute inset-0 z-0"
                  style={{ touchAction: "none" }}
                >
                  {/* PuzzleEngine renders orbs here */}
                </div>

                {/* Layer 2: Cycle Clear Overlay */}
                {turn > maxTurns && goalReached && !isGameOver && (
                  <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in px-8 text-center">
                    <h2 className="text-4xl text-yellow-400 font-black mb-2 tracking-widest font-display italic drop-shadow-glow w-full">CLEARED!</h2>
                    <p className="text-slate-300 text-sm mb-8 font-bold leading-relaxed">
                      目標達成！<br />装備を整えて次のサイクルへ挑もう
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                      <button
                        onClick={() => setShowShop(true)}
                        className="group bg-slate-800 text-white py-4 rounded-2xl font-bold border border-white/10 hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-3 w-full"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                          <span className="material-icons-round text-yellow-400 text-lg">storefront</span>
                        </div>
                        <span>ショップで強化</span>
                      </button>
                      <button
                        onClick={startNextCycle}
                        className="bg-gradient-to-r from-primary to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 w-full animate-pulse-slow"
                      >
                        <span>次のエリアへ</span>
                        <span className="material-icons-round">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Layer 3: Game Over Overlay */}
                {isGameOver && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in px-8 text-center">
                    <span className="material-icons-round text-7xl text-red-500 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">broken_image</span>
                    <h2 className="text-4xl font-black font-display text-white mb-2 tracking-tighter">GAME OVER</h2>
                    <p className="text-slate-400 mb-8 text-sm font-medium">目標未達成...<br />リトライして再挑戦しよう</p>

                    <div className="flex flex-col gap-3 w-full">
                      <button onClick={handleEndlessMode} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 w-full">
                        <span className="material-icons-round">all_inclusive</span>
                        エンドレスモードで継続
                      </button>
                      <button onClick={handleGiveUp} className="bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold text-sm active:scale-95 hover:bg-slate-700 transition-colors w-full border border-white/5">
                        リトライ
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Touch Guide hint */}
              <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-50">
                <span className="text-[10px] text-white uppercase tracking-widest">Drag to connect</span>
              </div>
            </div>
          </section>

          {/* Shop Overlay */}
          {
            showShop && (
              <div className="absolute inset-0 z-50 bg-background-dark">
                <ShopScreen
                  items={shopItems}
                  stars={stars}
                  onBuy={buyItem}
                  onClose={() => setShowShop(false)}
                  onRefresh={refreshShop}
                  goalReached={goalReached}
                  rerollPrice={shopRerollPrice}
                  onPause={() => setShowPause(true)}
                  isEnchantShopUnlocked={isEnchantShopUnlocked}
                  tokenSlotExpansionCount={tokenSlotExpansionCount}
                  onAwakeningBuy={buyAwakeningItem}
                  isAwakeningLevelUpBought={isAwakeningLevelUpBought}
                />
              </div>
            )
          }

          {
            showPause && (
              <div className="absolute inset-0 z-[400] bg-background-dark">
                <PauseScreen
                  onResume={() => setShowPause(false)}
                  onTitle={() => {
                    setShowPause(false);
                    setShowShop(false);
                    setShowTitle(true);
                  }}
                  onHelp={() => setShowHelp(true)}
                  onStats={() => setShowStats(true)}
                  onCredits={() => setShowCredits(true)}
                  onSettings={() => setShowSettings(true)}
                />
              </div>
            )
          }

          {/* 設定画面 (ポーズ画面より上) */}
          {
            showSettings && (
              <div className="absolute inset-0 z-[450] bg-background-dark">
                <SettingsScreen
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  onClose={() => setShowSettings(false)}
                />
              </div>
            )
          }

          {
            showCredits && (
              <div className="absolute inset-0 z-[500] bg-background-dark">
                <CreditsScreen onClose={() => setShowCredits(false)} />
              </div>
            )
          }

          {/* Layer 0: Game Clear Screen (Full Overlay) */}
          {(showGameClear || (turn > maxTurns && goalReached && target >= MAX_TARGET)) && (
            <div className="absolute inset-0 z-[1100] bg-slate-950/98 backdrop-blur-xl animate-fade-in flex flex-col items-center justify-start overflow-y-auto custom-scrollbar pt-12 pb-24 px-6 select-none shadow-2xl">
              <div className="flex flex-col items-center mb-10 mt-4 shrink-0">
                <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mb-6 border border-yellow-400/30 shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                  <span className="material-icons-round text-6xl text-yellow-400 drop-shadow-glow animate-pulse-slow">emoji_events</span>
                </div>
                <h1 className="text-5xl text-yellow-400 font-black tracking-widest font-display italic drop-shadow-glow text-center">GAME CLEARED!</h1>
                <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Max Target Reached</p>
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-4 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
              </div>

              {/* Statistics Card */}
              <div className="w-full max-w-sm bg-slate-900/60 rounded-3xl p-8 mb-10 border border-white/10 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-icons-round text-6xl rotate-12">trending_up</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs font-black tracking-wider uppercase">End Game Result</span>
                  <span className="bg-yellow-400/10 text-yellow-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-yellow-400/20">UNBELIEVABLE</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-end justify-between border-b border-white/5 pb-4">
                    <span className="text-slate-500 text-xs font-bold">Total Combo Score</span>
                    <span className="text-3xl text-white font-black font-mono tracking-tighter drop-shadow-sm">{cycleTotalCombo.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-bold">Target Reached</span>
                    <span className="text-sm text-slate-300 font-mono font-bold">MAX ({MAX_TARGET.toLocaleString()})</span>
                  </div>
                </div>
              </div>

              {/* Token Summary Header */}
              <div className="w-full max-w-sm flex items-center gap-3 mb-6 shrink-0 opacity-80">
                <span className="material-icons-round text-primary text-xl">workspace_premium</span>
                <h3 className="text-xs font-black text-slate-300 tracking-widest uppercase">Victory Artifacts</h3>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>

              {/* Tokens Collection Grid */}
              <div className="grid grid-cols-1 gap-4 w-full max-w-sm mb-12 shrink-0">
                {tokens.filter(t => t !== null).map((t, idx) => {
                  const lv = t.level || 1;
                  const isSkill = t.type === 'skill';
                  return (
                    <div key={idx} className="bg-slate-900/40 rounded-3xl p-4 border border-white/5 flex items-center gap-5 backdrop-blur-sm group hover:border-white/20 transition-all active:scale-[0.98]">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isSkill ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600/30' : 'bg-purple-600/20 text-purple-400 border border-purple-500/20 group-hover:bg-purple-600/30'}`}>
                        <span className="material-icons-round text-3xl">
                          {isSkill ? 'sports_martial_arts' : 'auto_awesome'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white truncate italic group-hover:text-primary transition-colors">{t.name}</h4>
                          <span className="text-xs font-black text-amber-400">Lv.{lv}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex text-gold text-[10px]">
                            {Array.from({ length: t.rarity || 1 }).map((_, i) => (
                              <span key={i} className="material-icons-round drop-shadow-glow">star</span>
                            ))}
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${isSkill ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {isSkill ? 'Skill' : 'Passive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Victory Actions */}
              <div className="flex flex-col gap-4 w-full max-w-sm mt-auto mb-10 shrink-0">
                <button
                  onClick={() => {
                    setShowGameClear(false);
                    startNextCycle();
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-5 rounded-3xl font-black shadow-[0_15px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.4)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 w-full"
                >
                  <span className="material-icons-round">all_inclusive</span>
                  <span className="font-display italic tracking-widest text-lg">Continue Playing</span>
                </button>
                <button
                  onClick={() => {
                    setShowGameClear(false);
                    setShowTitle(true);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/5"
                >
                  <span className="material-icons-round">home</span>
                  <span>Title Menu</span>
                </button>
              </div>
            </div>
          )}

          {/* Pending Shop Item Modal */}
          {
            pendingShopItem && (
              <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <h3 className="text-xl font-bold font-display text-white mb-1 text-center italic">{pendingShopItem.name}</h3>
                  <div className="flex justify-center text-gold text-sm mb-2">
                    {Array.from({ length: pendingShopItem.rarity || 1 }).map((_, i) => (
                      <span key={i} className="material-icons-round drop-shadow-md">star</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 text-center mb-6">既に所持しています。</p>

                  <div className="flex flex-col gap-3">
                    <button onClick={() => handleChoice("upgrade")} className="bg-primary text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg shadow-primary/25">
                      強化 (Lv UP)
                    </button>
                    <button onClick={() => handleChoice("new")} className="bg-slate-700 text-white py-3 rounded-xl font-bold active:scale-95">
                      2つ目を装備
                    </button>
                    <button onClick={() => setPendingShopItem(null)} className="text-slate-400 text-xs font-bold py-2 mt-2">
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {/* Token Detail Modal */}
          {
            selectedTokenDetail && (() => {
              const snapshotToken = selectedTokenDetail.token;
              const t = tokens.find(tok => tok.instanceId === snapshotToken.instanceId) || snapshotToken;
              const lv = t.level || 1;
              const isSkill = t.type === 'skill';
              const charge = t.charge || 0;
              const cost = getEffectiveCost(t);
              const isReady = isSkill && charge >= cost;
              const enchList = t.enchantments || [];
              return (
                <div className="fixed inset-0 z-[350] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedTokenDetail(null)}>
                  <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border border-primary/30 shadow-[0_0_40px_rgba(91,19,236,0.15)]" onClick={e => e.stopPropagation()}>
                    {/* ヘッダー */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSkill ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-purple-500/20 border border-purple-500/30'}`}>
                        <span className={`material-icons-round text-2xl ${isSkill ? 'text-blue-400' : 'text-purple-400'}`}>
                          {isSkill ? 'sports_martial_arts' : 'auto_awesome'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold font-display text-white italic leading-tight">{t.name}</h3>
                        <div className="flex text-gold text-[10px] mt-0.5">
                          {Array.from({ length: t.rarity || 1 }).map((_, i) => (
                            <span key={i} className="material-icons-round drop-shadow-md">star</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSkill ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {isSkill ? 'スキル' : 'パッシブ'}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400">Lv.{lv}</span>
                        </div>
                      </div>
                    </div>

                    {/* 効果説明 */}
                    <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                      <p className="text-xs text-slate-300 leading-relaxed">{getTokenDescription(t, lv, currentRunStats, tokens, activeBuffs)}</p>
                    </div>

                    {/* スキルチャージ状態 */}
                    {isSkill && (
                      <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">チャージ</span>
                          <span className={`text-xs font-bold ${isReady ? 'text-green-400' : 'text-orange-400'}`}>{charge} / {cost}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${isReady ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, (charge / cost) * 100)}%` }}></div>
                        </div>
                      </div>
                    )}

                    {/* エンチャント情報（複数表示対応） */}
                    {enchList.length > 0 ? (
                      enchList.map((enc, encIdx) => {
                        const enchDef = ENCHANTMENTS.find(e => e.id === enc.id);
                        const encIsDisabled = enc.disabled;
                        return (
                          <div
                            key={encIdx}
                            onClick={() => setSelectedEnchantDetail({ tokenInstanceId: t.instanceId, enchantIndex: encIdx })}
                            className={`rounded-xl p-3 mb-3 border cursor-pointer hover:scale-[1.02] transition-transform ${encIsDisabled ? 'bg-slate-700/50 border-slate-600/50' : 'bg-amber-500/10 border-amber-500/20'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`material-icons-round text-sm ${encIsDisabled ? 'text-slate-400' : 'text-amber-400'}`}>auto_fix_high</span>
                              <span className={`text-xs font-bold ${encIsDisabled ? 'text-slate-400' : 'text-amber-400'}`}>{enc.name}</span>
                              {encIsDisabled && <span className="ml-auto text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-sm">無効</span>}
                            </div>
                            <p className={`text-[11px] leading-relaxed ${encIsDisabled ? 'text-slate-500' : 'text-amber-200/70'}`}>{getEnchantDescription(enc.id)}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-slate-900/40 rounded-xl p-3 mb-3 border border-dashed border-white/10">
                        <p className="text-[11px] text-slate-600 text-center">エンチャントなし</p>
                      </div>
                    )}

                    {/* 並び替えセクション */}
                    {(() => {
                      const sameTypeTokens = tokens.filter(tok => tok && (isSkill ? tok.type === 'skill' : tok.type !== 'skill'));
                      const currentPos = sameTypeTokens.findIndex(tok => tok.instanceId === t.instanceId) + 1;
                      const total = sameTypeTokens.length;
                      if (total <= 1) return null;
                      return (
                        <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">並び替え</span>
                            <span className="text-[10px] text-slate-600">現在: <span className="text-slate-300 font-bold">{currentPos}</span> / {total} 番目</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              max={total}
                              value={tokenMoveInput}
                              onChange={e => setTokenMoveInput(e.target.value)}
                              onFocus={e => e.target.select()}
                              placeholder={`1〜${total}`}
                              className="flex-1 bg-slate-700 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors text-center font-mono"
                            />
                            <button
                              onClick={() => {
                                const pos = parseInt(tokenMoveInput, 10);
                                if (!isNaN(pos) && pos >= 1 && pos <= total) {
                                  moveToken(t, pos);
                                  setTokenMoveInput('');
                                }
                              }}
                              disabled={(() => {
                                const pos = parseInt(tokenMoveInput, 10);
                                return isNaN(pos) || pos < 1 || pos > total || pos === currentPos;
                              })()}
                              className="px-4 py-2 rounded-lg bg-primary/80 hover:bg-primary text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              移動
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ボタン群 */}
                    <div className="flex flex-col gap-2 mt-4">
                      {isSkill && (
                        <button
                          onClick={() => { setSelectedTokenDetail(null); activateSkill(t, selectedTokenDetail.index); }}
                          disabled={!isReady}
                          className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${isReady ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                        >
                          {isReady ? 'スキル発動' : 'チャージ不足'}
                        </button>
                      )}
                      <button
                        onClick={() => sellToken(t)}
                        className="w-full text-center bg-red-600/20 hover:bg-red-600/40 text-red-300 py-3 rounded-lg font-bold transition-colors"
                      >
                        売却 (+{Math.floor(t.price * (t.enchantments?.some(e => e.effect === "high_sell") ? 3.0 : 0.5))} ★)
                      </button>
                      <button onClick={() => setSelectedTokenDetail(null)} className="text-slate-400 text-xs font-bold py-2">
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          }

          {/* Enchant Detail Modal */}
          {
            selectedEnchantDetail && (() => {
              const t = tokens.find(tok => tok.instanceId === selectedEnchantDetail.tokenInstanceId);
              if (!t) {
                // schedule close
                setTimeout(() => setSelectedEnchantDetail(null), 0);
                return null;
              }
              const enc = t.enchantments?.[selectedEnchantDetail.enchantIndex];
              if (!enc) {
                setTimeout(() => setSelectedEnchantDetail(null), 0);
                return null;
              }
              const encIsDisabled = enc.disabled;

              return (
                <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedEnchantDetail(null)}>
                  <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border shadow-[0_0_40px_rgba(245,158,11,0.15)] border-amber-500/30" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${encIsDisabled ? 'bg-slate-700 border-slate-600' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                        <span className={`material-icons-round text-2xl ${encIsDisabled ? 'text-slate-400' : 'text-amber-400'}`}>
                          auto_fix_high
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold font-display italic leading-tight ${encIsDisabled ? 'text-slate-300' : 'text-amber-400'}`}>{enc.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${encIsDisabled ? 'bg-slate-700 text-slate-400' : 'bg-amber-500/20 text-amber-500'}`}>
                            {encIsDisabled ? '無効' : '有効'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-3 mb-6 border border-white/5">
                      <p className="text-xs text-slate-300 leading-relaxed">{getEnchantDescription(enc.id)}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          toggleEnchantStatus(selectedEnchantDetail.tokenInstanceId, selectedEnchantDetail.enchantIndex);
                        }}
                        className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${encIsDisabled
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/25'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                          }`}
                      >
                        {encIsDisabled ? '有効にする' : '無効にする'}
                      </button>

                      <button onClick={() => setSelectedEnchantDetail(null)} className="text-slate-400 text-xs font-bold py-2">
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          }

          {/* Premium Notification Toast */}
          {
            message && (
              <div className="premium-toast">
                <div className="premium-toast-glow"></div>
                <div className="premium-toast-inner">
                  <span className="material-icons-round text-primary text-xl">info</span>
                  <div className="premium-toast-text">{message}</div>
                </div>
              </div>
            )
          }

        </div >

      </div >
    </div>
  );
};

export { PuzzleEngine, ALL_TOKEN_BASES };
export default App;
