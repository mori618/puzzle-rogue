import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Star as StarIcon,
} from "lucide-react";
import ShopScreen from "./ShopScreen";

// --- Constants (RPG) ---
const ALL_TOKEN_BASES = [
  // --- Skills: Conversion ---
  { id: "fired", name: "焔の変換", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "wood", to: "fire" }, price: 2, desc: "木を火に変換。消費E:{cost}" },
  { id: "waterd", name: "氷の変換", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "fire", to: "water" }, price: 2, desc: "火を水に変換。消費E:{cost}" },
  { id: "woodd", name: "嵐の変換", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "water", to: "wood" }, price: 2, desc: "水を木に変換。消費E:{cost}" },
  { id: "lightd", name: "雷の変換", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "dark", to: "light" }, price: 2, desc: "闇を光に変換。消費E:{cost}" },
  { id: "darkd", name: "影の変換", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "light", to: "dark" }, price: 2, desc: "光を闇に変換。消費E:{cost}" },
  { id: "heartd", name: "癒の変換", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "fire", to: "heart" }, price: 2, desc: "火を回復に変換。消費E:{cost}" },
  { id: "conv_h_f", name: "癒しの劫火", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "heart", to: "fire" }, price: 2, desc: "回復を火に変換。消費E:{cost}" },
  { id: "conv_h_w", name: "癒しの奔流", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "heart", to: "water" }, price: 2, desc: "回復を水に変換。消費E:{cost}" },
  { id: "conv_h_w", name: "癒しの深緑", type: "skill", cost: 3, costLevels: true, action: "convert", params: { from: "heart", to: "wood" }, price: 2, desc: "回復を木に変換。消費E:{cost}" },

  // --- Skills: Board Change (3-Color) ---
  { id: "board_tri1", name: "三色の真理・紅蓮", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "wood"] }, price: 3, desc: "盤面を火/水/木に変更。消費E:{cost}" },
  { id: "board_tri2", name: "三色の真理・天地", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["light", "dark", "heart"] }, price: 3, desc: "盤面を光/闇/回復に変更。消費E:{cost}" },
  { id: "board_tri3", name: "三色の真理・黄昏", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "dark"] }, price: 3, desc: "盤面を火/水/闇に変更。消費E:{cost}" },
  { id: "board_tri4", name: "三色の真理・神緑", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["light", "wood", "heart"] }, price: 3, desc: "盤面を光/木/回復に変更。消費E:{cost}" },
  { id: "board_tri5", name: "三色の真理・炎光", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["fire", "light", "dark"] }, price: 3, desc: "盤面を火/光/闇に変更。消費E:{cost}" },
  { id: "board_tri6", name: "三色の真理・水光", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["water", "light", "dark"] }, price: 3, desc: "盤面を水/光/闇に変更。消費E:{cost}" },
  { id: "board_tri7", name: "三色の真理・木光", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "dark"] }, price: 3, desc: "盤面を木/光/闇に変更。消費E:{cost}" },
  { id: "board_tri8", name: "三色の真理・炎木", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["fire", "wood", "light"] }, price: 3, desc: "盤面を火/木/光に変更。消費E:{cost}" },
  { id: "board_tri9", name: "三色の真理・炎闇", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["fire", "wood", "dark"] }, price: 3, desc: "盤面を火/木/闇に変更。消費E:{cost}" },
  { id: "board_tri10", name: "三色の真理・水木", type: "skill", cost: 7, costLevels: true, action: "board_change", params: { colors: ["water", "wood", "light"] }, price: 3, desc: "盤面を水/木/光に変更。消費E:{cost}" },

  // --- Skills: Board Change (2-Color) ---
  { id: "board_bi1", name: "双龍の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["fire", "water"] }, price: 4, desc: "盤面を火/水の2色に変更。消費E:{cost}" },
  { id: "board_bi2", name: "明暗の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["light", "dark"] }, price: 4, desc: "盤面を光/闇の2色に変更。消費E:{cost}" },
  { id: "board_bi3", name: "風癒の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["wood", "heart"] }, price: 4, desc: "盤面を木/回復の2色に変更。消費E:{cost}" },
  { id: "board_bi4", name: "炎光の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["fire", "light"] }, price: 4, desc: "盤面を火/光の2色に変更。消費E:{cost}" },
  { id: "board_bi5", name: "炎闇の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["fire", "dark"] }, price: 4, desc: "盤面を火/闇の2色に変更。消費E:{cost}" },
  { id: "board_bi6", name: "水光の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["water", "light"] }, price: 4, desc: "盤面を水/光の2色に変更。消費E:{cost}" },
  { id: "board_bi7", name: "水闇の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["water", "dark"] }, price: 4, desc: "盤面を水/闇の2色に変更。消費E:{cost}" },
  { id: "board_bi8", name: "木光の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["wood", "light"] }, price: 4, desc: "盤面を木/光の2色に変更。消費E:{cost}" },
  { id: "board_bi9", name: "木闇の陣", type: "skill", cost: 8, costLevels: true, action: "board_change", params: { colors: ["wood", "dark"] }, price: 4, desc: "盤面を木/闇の2色に変更。消費E:{cost}" },

  // --- Skills: Board Change (1-Color) ---
  { id: "board_mono1", name: "真・紅蓮の極致", type: "skill", cost: 10, costLevels: true, action: "board_change", params: { colors: ["fire"] }, price: 6, desc: "盤面すべてを火に変更。消費E:{cost}" },
  { id: "board_mono2", name: "真・閃光の極致", type: "skill", cost: 10, costLevels: true, action: "board_change", params: { colors: ["light"] }, price: 6, desc: "盤面すべてを光に変更。消費E:{cost}" },

  // --- Skills: Skyfall Manipulation ---
  { id: "sky_f1", name: "紅蓮の目覚め", type: "skill", cost: 4, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 5, duration: 3 }, price: 3, desc: "3手番、火がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_w2", name: "双流の波紋", type: "skill", cost: 4, costLevels: true, action: "skyfall", params: { colors: ["water", "wood"], weight: 3, duration: 2 }, price: 3, desc: "2手番、水と木が落ちやすくなる。消費E:{cost}" },
  { id: "sky_limit", name: "三色の結界", type: "skill", cost: 6, costLevels: true, action: "skyfall_limit", params: { colors: ["fire", "water", "wood"], duration: 3 }, price: 4, desc: "3手番、火/水/木しか落ちてこなくなる。消費E:{cost}" },

  // --- Skills: Multi-Conversion ---
  { id: "conv_m1", name: "大地の恵み", type: "skill", cost: 5, costLevels: true, action: "convert_multi", params: { types: ["fire", "water"], to: "wood" }, price: 3, desc: "火と水を木に変換。消費E:{cost}" },
  { id: "conv_m2", name: "福音の祈り", type: "skill", cost: 5, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "heart" }, price: 3, desc: "光と闇を回復に変換。消費E:{cost}" },
  { id: "conv_m3", name: "冥風の烈火", type: "skill", cost: 5, costLevels: true, action: "convert_multi", params: { types: ["water", "dark"], to: "fire" }, price: 3, desc: "水と闇を火に変換。消費E:{cost}" },
  { id: "conv_m4", name: "天啓の閃光", type: "skill", cost: 5, costLevels: true, action: "convert_multi", params: { types: ["wood", "heart"], to: "light" }, price: 3, desc: "木と回復を光に変換。消費E:{cost}" },
  { id: "conv_m5", name: "三原色の福音", type: "skill", cost: 6, costLevels: true, action: "convert_multi", params: { types: ["fire", "water", "wood"], to: "heart" }, price: 4, desc: "火/水/木を回復に変換。消費E:{cost}" },

  // --- Skills: Row Fix ---
  { id: "row_f", name: "烈火の横一文字", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: 0, type: "fire" }, price: 3, desc: "上段をすべて火に。消費E:{cost}" },
  { id: "row_w", name: "清流の横一文字", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: 0, type: "water" }, price: 3, desc: "上段をすべて水に。消費E:{cost}" },
  { id: "row_g", name: "深翠の横一文字", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: 0, type: "wood" }, price: 3, desc: "上段をすべて木に。消費E:{cost}" },
  { id: "row_l", name: "閃光の横一文字", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: 0, type: "light" }, price: 3, desc: "上段をすべて光に。消費E:{cost}" },
  { id: "row_d", name: "常闇の横一文字", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: 0, type: "dark" }, price: 3, desc: "上段をすべて闇に。消費E:{cost}" },
  { id: "row_h", name: "生命の横一文字", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: 0, type: "heart" }, price: 3, desc: "上段をすべて回復に。消費E:{cost}" },
  { id: "row_b_f", name: "烈火の底陣", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: -1, type: "fire" }, price: 3, desc: "下段をすべて火に。消費E:{cost}" },
  { id: "row_c_h", name: "生命の帯", type: "skill", cost: 5, costLevels: true, action: "row_fix", params: { row: "center", type: "heart" }, price: 3, desc: "中央行をすべて回復に。消費E:{cost}" },

  // --- Skills: Col Fix ---
  { id: "col_l_l", name: "閃光の縦一閃", type: "skill", cost: 5, costLevels: true, action: "col_fix", params: { col: 0, type: "light" }, price: 3, desc: "左端列をすべて光に。消費E:{cost}" },
  { id: "col_r_d", name: "常闇の縦一閃", type: "skill", cost: 5, costLevels: true, action: "col_fix", params: { col: -1, type: "dark" }, price: 3, desc: "右端列をすべて闇に。消費E:{cost}" },

  // --- Skills: Enhance Orbs ---
  { id: "enh_f", name: "星の導き・火", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire"] }, price: 4, desc: "盤面の火を全て強化。消費E:{cost}" },
  { id: "enh_w", name: "星の導き・水", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water"] }, price: 4, desc: "盤面の水を全て強化。消費E:{cost}" },
  { id: "enh_fw", name: "星の導き・双色", type: "skill", cost: 7, costLevels: true, action: "enhance_color", params: { colors: ["fire", "water"] }, price: 5, desc: "盤面の火と水を全て強化。消費E:{cost}" },
  { id: "enh_ld", name: "星の導き・双色", type: "skill", cost: 7, costLevels: true, action: "enhance_color", params: { colors: ["light", "dark"] }, price: 5, desc: "盤面の光と闇を全て強化。消費E:{cost}" },

  // --- Skills: Special ---
  { id: "chrono", name: "クロノス・ストップ", type: "skill", cost: 7, costLevels: true, action: "chronos_stop", params: { duration: 10000 }, price: 7, desc: "10秒間、自由に操作可能になる。消費E:{cost}" },


  {
    id: "refresh",
    name: "次元の再編",
    type: "skill",
    cost: 3,
    costLevels: true,
    action: "force_refresh",
    price: 2,
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
    price: 2,
    desc: "他のスキルのエネルギーを1/2/3チャージ。消費E:3",
  },
  {
    id: "collector",
    name: "黄金の収集者",
    type: "passive",
    effect: "star_gain",
    values: [4, 3, 1],
    price: 3,
    desc: "★獲得に必要なコンボ数を4/3/1に短縮。",
  },
  {
    id: "time_ext",
    name: "時の砂",
    type: "passive",
    effect: "time",
    values: [1, 2, 3],
    price: 2,
    desc: "操作時間を1/2/3秒延長。",
  },
  {
    id: "power_up",
    name: "力の鼓動",
    type: "passive",
    effect: "base_add",
    values: [1, 2, 3],
    price: 2,
    desc: "コンボ加算に1/2/3の固定値を追加。",
  },
  {
    id: "forbidden",
    name: "禁忌の儀式",
    type: "passive",
    effect: "forbidden",
    values: [1.5, 2, 3],
    price: 5,
    desc: "常時落ちコン停止。コンボ加算1.5/2/3倍。",
  },
  {
    id: "bargain",
    name: "商談の極意",
    type: "passive",
    effect: "sale_boost",
    values: [2, 3, 4],
    price: 4,
    desc: "ショップに並ぶセール品（半額）の数を2/3/4個に増加させる。",
  },
  {
    id: "skip_master",
    name: "時短の心得",
    type: "passive",
    effect: "skip_bonus_multiplier",
    values: [4, 5, 6],
    price: 4,
    desc: "目標達成後のスキップボーナスを4/5/6倍にする。",
  },
  {
    id: "mana_crystal",
    name: "マナの結晶化",
    type: "passive",
    effect: "enhance_chance",
    values: [0.05, 0.1, 0.2], // 5%, 10%, 20%
    price: 5,
    desc: "降ってくるドロップの[5/10/20]%が強化状態で出現する。",
  },
  {
    id: "enhanced_amp",
    name: "強化増幅",
    type: "passive",
    effect: "enhanced_orb_bonus",
    values: [1, 2, 3],
    price: 6,
    desc: "強化ドロップ1個消去時のコンボ加算を+[1/2/3]する。",
  },
  {
    id: "over_link",
    name: "過剰結合",
    type: "passive",
    effect: "enhanced_link_multiplier",
    params: { count: 5 },
    values: [1.5, 2, 3],
    price: 8,
    desc: "強化ドロップを5個以上つなげて消すと最終コンボx[1.5/2/3]倍。",
  },

  // --- Passive: Combo Multiplier (Color) ---
  {
    id: "bonus_1c_fire", name: "炎の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire"] }, values: [1.3, 1.5, 2], price: 4,
    desc: "火を消しているとコンボ数x[1.3/1.5/2]倍。",
  },
  {
    id: "bonus_1c_water", name: "水の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["water"] }, values: [1.3, 1.5, 2], price: 4,
    desc: "水を消しているとコンボ数x[1.3/1.5/2]倍。",
  },
  {
    id: "bonus_1c_wood", name: "木の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood"] }, values: [1.3, 1.5, 2], price: 4,
    desc: "木を消しているとコンボ数x[1.3/1.5/2]倍。",
  },
  {
    id: "bonus_1c_light", name: "光の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["light"] }, values: [1.3, 1.5, 2], price: 4,
    desc: "光を消しているとコンボ数x[1.3/1.5/2]倍。",
  },
  {
    id: "bonus_1c_dark", name: "闇の連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["dark"] }, values: [1.3, 1.5, 2], price: 4,
    desc: "闇を消しているとコンボ数x[1.3/1.5/2]倍。",
  },
  {
    id: "bonus_1c_heart", name: "癒しの連舞", type: "passive", effect: "color_multiplier",
    params: { colors: ["heart"] }, values: [1.3, 1.5, 2], price: 4,
    desc: "回復を消しているとコンボ数x[1.3/1.5/2]倍。",
  },
  {
    id: "bonus_2c_fw", name: "双龍の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "water"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "火/水を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_ld", name: "明暗の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["light", "dark"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "光/闇を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_wh", name: "風癒の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood", "heart"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "木/回復を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_fl", name: "炎光の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "light"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "火/光を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_fd", name: "炎闇の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "dark"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "火/闇を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_wl", name: "水光の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["water", "light"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "水/光を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_wd", name: "水闇の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["water", "dark"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "水/闇を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_gl", name: "木光の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood", "light"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "木/光を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_2c_gd", name: "木闇の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["wood", "dark"] }, values: [1.4, 1.8, 2.5], price: 5,
    desc: "木/闇を同時に消すとコンボ数x[1.4/1.8/2.5]倍。",
  },
  {
    id: "bonus_3c_fwh", name: "三源の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "water", "heart"] }, values: [1.5, 2, 3], price: 6,
    desc: "火/水/回復を同時に消すとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_3c_ldw", name: "三界の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["light", "dark", "wood"] }, values: [1.5, 2, 3], price: 6,
    desc: "光/闇/木を同時に消すとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_3c_fwl", name: "新緑の律動", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "wood", "light"] }, values: [1.5, 2, 3], price: 6,
    desc: "火/木/光を同時に消すとコンボ数x[1.5/2/3]倍。",
  },
  {
    id: "bonus_4c_fwlh", name: "四天の秘儀", type: "passive", effect: "color_multiplier",
    params: { colors: ["fire", "water", "light", "heart"] }, values: [1.8, 2.5, 4], price: 7,
    desc: "火/水/光/回復を同時に消すとコンボ数x[1.8/2.5/4]倍。",
  },
  {
    id: "bonus_5c", name: "五色の秘儀", type: "passive", effect: "color_multiplier",
    params: { count: 5 }, values: [2, 3, 5], price: 8,
    desc: "5色以上を同時に消すとコンボ数x[2/3/5]倍。",
  },
  {
    id: "bonus_6c", name: "六色の秘儀", type: "passive", effect: "color_multiplier",
    params: { count: 6 }, values: [3, 5, 8], price: 10,
    desc: "6色すべてを同時に消すとコンボ数x[3/5/8]倍。",
  },

  // --- Passive: Skyfall Bonus ---
  {
    id: "bonus_skyfall", name: "天恵の追撃", type: "passive", effect: "skyfall_bonus",
    values: [3, 5, 8], price: 5,
    desc: "落ちコン発生時にコンボ+[3/5/8]。",
  },

  // --- Passive: Exact Combo Bonus ---
  {
    id: "combo_exact_3",
    name: "三連の巧技",
    type: "passive",
    effect: "combo_if_exact",
    params: { combo: 3 },
    values: [5, 10, 15],
    price: 4,
    desc: "3コンボちょうどでコンボ+[5/10/15]。",
  },
  {
    id: "combo_exact_10",
    name: "十連の極み",
    type: "passive",
    effect: "combo_if_exact",
    params: { combo: 10 },
    values: [10, 15, 20],
    price: 6,
    desc: "10コンボちょうどでコンボ+[10/15/20]。",
  },
  // --- Passive: Combo Threshold Multiplier ---
  {
    id: "combo_ge_7",
    name: "七連の闘気",
    type: "passive",
    effect: "combo_if_ge",
    params: { combo: 7 },
    values: [1.5, 2, 3],
    price: 7,
    desc: "7コンボ以上で最終コンボ[1.5/2/3]倍。",
  },

  // --- Passive: Shape Bonus（特殊消しボーナス） ---
  {
    id: "len4", name: "四連の術", type: "passive", effect: "shape_bonus",
    params: { shape: "len4" }, values: [1, 2, 3], price: 3,
    desc: "4個ちょうど連結でコンボ+[1/2/3]。",
  },
  {
    id: "row_clear", name: "横一閃", type: "passive", effect: "shape_bonus",
    params: { shape: "row" }, values: [3, 6, 9], price: 5,
    desc: "横1列消しでコンボ+[3/6/9]。",
  },
  {
    id: "square", name: "四方の型", type: "passive", effect: "shape_bonus",
    params: { shape: "square" }, values: [1.5, 2, 3], price: 6,
    desc: "3x3正方形消しでコンボ×[1.5/2/3]倍。",
  },
  {
    id: "len5", name: "五星の印", type: "passive", effect: "shape_bonus",
    params: { shape: "len5" }, values: [1.2, 1.5, 2], price: 5,
    desc: "5個以上連結で次手の操作時間[1.2/1.5/2]倍。",
  },
  {
    id: "cross", name: "十字の祈り", type: "passive", effect: "shape_bonus",
    params: { shape: "cross" }, values: [1.5, 2, 3], price: 6,
    desc: "十字型消しで次手の操作時間[1.5/2/3]倍。",
  },
  {
    id: "l_shape", name: "鉤十字の型", type: "passive", effect: "shape_bonus",
    params: { shape: "l_shape" }, values: [2, 4, 6], price: 6,
    desc: "L字消しでコンボ+[2/4/6]。",
  },
  {
    id: "bonus_heart", name: "癒しの波動", type: "passive", effect: "heart_combo_bonus",
    values: [2, 3, 4], price: 4,
    desc: "回復ドロップを消したコンボ数分、追加でコンボ+[2/3/4]。",
  },
  {
    id: "giant",
    name: "巨人の領域",
    type: "passive",
    effect: "expand_board",
    values: [1, 1.2, 1.5],
    price: 6,
    desc: "装備中、盤面が7x6に拡張。コンボ倍率[1/1.2/1.5]倍。",
  },
];

const ENCHANTMENTS = [

  {
    id: "resonance",
    name: "レベル共鳴",
    effect: "lvl_mult",
    price: 8,
    desc: "トークンのLv分、コンボ加算値を乗算する。",
  },
  {
    id: "greed",
    name: "強欲の輝き",
    effect: "star_add",
    price: 9,
    desc: "現在の所持★数をコンボ加算値に加える。",
  },
  {
    id: "chain",
    name: "連鎖の刻印",
    effect: "fixed_add",
    value: 2,
    price: 5,
    desc: "コンボ加算値を一律+2する。",
  },
  {
    id: "extra_turn",
    name: "時の刻印",
    effect: "add_turn",
    price: 7,
    desc: "目標達成までの手番が +1 される。",
  },
  {
    id: "time_leap",
    name: "時の跳躍",
    effect: "skip_turn_combo",
    price: 7,
    desc: "前のサイクルでスキップしたターン数分、次のサイクルの全ターンでコンボ加算。",
  },
  // --- New: Color Combo Bonus Enchantments ---
  { id: "combo_fire", name: "炎の加護", effect: "color_combo", params: { color: "fire" }, price: 6, desc: "火の1コンボにつきコンボ+1。" },
  { id: "combo_water", name: "水の加護", effect: "color_combo", params: { color: "water" }, price: 6, desc: "水の1コンボにつきコンボ+1。" },
  { id: "combo_wood", name: "森の加護", effect: "color_combo", params: { color: "wood" }, price: 6, desc: "木の1コンボにつきコンボ+1。" },
  { id: "combo_light", name: "光の加護", effect: "color_combo", params: { color: "light" }, price: 6, desc: "光の1コンボにつきコンボ+1。" },
  { id: "combo_dark", name: "闇の加護", effect: "color_combo", params: { color: "dark" }, price: 6, desc: "闇の1コンボにつきコンボ+1。" },
  { id: "combo_heart", name: "癒しの加護", effect: "color_combo", params: { color: "heart" }, price: 6, desc: "回復の1コンボにつきコンボ+1。" },
  // --- New: Enhanced Orb Drop Chance Enchantments ---
  { id: "enhance_f", name: "火の強化落下", effect: "enhance_chance_color", params: { color: "fire" }, value: 0.1, price: 7, desc: "火ドロップが10%の確率で強化状態で出現する。" },
  { id: "enhance_w", name: "水の強化落下", effect: "enhance_chance_color", params: { color: "water" }, value: 0.1, price: 7, desc: "水ドロップが10%の確率で強化状態で出現する。" },
  { id: "enhance_g", name: "木の強化落下", effect: "enhance_chance_color", params: { color: "wood" }, value: 0.1, price: 7, desc: "木ドロップが10%の確率で強化状態で出現する。" },
  { id: "enhance_l", name: "光の強化落下", effect: "enhance_chance_color", params: { color: "light" }, value: 0.1, price: 7, desc: "光ドロップが10%の確率で強化状態で出現する。" },
  { id: "enhance_d", name: "闇の強化落下", effect: "enhance_chance_color", params: { color: "dark" }, value: 0.1, price: 7, desc: "闇ドロップが10%の確率で強化状態で出現する。" },
  { id: "enhance_h", name: "癒しの強化落下", effect: "enhance_chance_color", params: { color: "heart" }, value: 0.1, price: 7, desc: "回復ドロップが10%の確率で強化状態で出現する。" },
];

const getEffectiveCost = (token) => {
  if (!token || token.type !== 'skill') return token?.cost || 0;
  const baseCost = token.cost || 0;
  if (baseCost === 0) return 0;
  const level = token.level || 1;
  const reduction = Math.max(0, level - 1);
  const minCost = Math.max(1, Math.floor(baseCost / 2));
  return Math.max(minCost, baseCost - reduction);
};

const getTokenDescription = (item, level) => {
    const base = ALL_TOKEN_BASES.find((b) => b.id === (item.id || item));
    if (!base) return item?.desc || "";
    
    const targetLv = level || item?.level || 1;
    let d = base.desc;

    // {cost} の置換
    if (base.costLevels) {
      // getEffectiveCost には level と cost, type があれば良い
      const cost = getEffectiveCost({ cost: base.cost, level: targetLv, type: 'skill' });
      d = d.replace(/{cost}/g, cost);
    }

    // 既存のvaluesの置換
    if (base.values) {
      const value = base.values[targetLv - 1];
      // 1/2/3 や [1.3/1.5/2] のようなパターンを現在のレベルの値で置換
      if (value !== undefined) {
          d = d.replace(/(\[?[\d.]+(?:\/[\d.]+)+\]?)/g, value);
          // 「Lvに応じ」や「Lv分」といった文言を調整
          d = d.replace(/Lvに応じ/g, "");
          d = d.replace(/Lv分/g, `${value}`);
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
    this.onTurnEnd = options.onTurnEnd || (() => { });
    this.onCombo = options.onCombo || (() => { });

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
    this.chronosStopActive = false;
    this.chronosTimerId = null;
  }

  addPlusMark(orbEl) {
      if (!orbEl.querySelector('.enhanced-mark')) {
        const enhancedMark = document.createElement("div");
        enhancedMark.className = "enhanced-mark absolute top-0 right-0 w-4 h-4 bg-yellow-400 text-black text-xs font-bold flex items-center justify-center rounded-full border-2 border-white";
        enhancedMark.innerText = "+";
        orbEl.appendChild(enhancedMark);
      }
  }


  setRealtimeBonuses(bonuses) {
    this.realtimeBonuses = { len4: 0, row: 0, l_shape: 0, ...bonuses };
  }

  setEnhanceRates(rates) {
    this.enhanceRates = { global: 0, colors: {}, ...rates };
  }

  init() {
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

    // Spawn initial orbs without matches
    this.spawnInitialBoard();
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
          orb.baseTop = (r * (this.orbSize + this.gap)) + (this.gap / 2);
          orb.baseLeft = (c * (this.orbSize + this.gap)) + (this.gap / 2);
          orb.el.style.width = `${this.orbSize}px`;
          orb.el.style.height = `${this.orbSize}px`;
          orb.el.style.top = `${orb.baseTop}px`;
          orb.el.style.left = `${orb.baseLeft}px`;
          orb.el.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    });
  }



  spawnOrb(r, c, isNew, startRowOffset = 0) {
    let type;
    if (!isNew) {
      let availableTypes = [...this.types];
      while (availableTypes.length > 0) {
        const idx = Math.floor(Math.random() * availableTypes.length);
        type = availableTypes[idx];
        const matchHorizontal =
          c >= 2 &&
          this.state[r][c - 1]?.type === type &&
          this.state[r][c - 2]?.type === type;
        const matchVertical =
          r >= 2 &&
          this.state[r - 1][c]?.type === type &&
          this.state[r - 2][c]?.type === type;
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

    let isEnhanced = false;
    // Global chance
    if (Math.random() < (this.enhanceRates.global || 0)) {
      isEnhanced = true;
    }
    // Color-specific chance
    const colorRate = this.enhanceRates.colors?.[type] || 0;
    if (Math.random() < colorRate) {
      isEnhanced = true;
    }

    const el = document.createElement("div");
    el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;

    const inner = document.createElement("div");
    inner.className = `orb-inner orb-${type} shadow-lg`;

    const iconSpan = document.createElement("span");
    iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
    iconSpan.innerText = this.icons[type];

    inner.appendChild(iconSpan);
    el.appendChild(inner);

    if (isEnhanced) {
      this.addPlusMark(el);
    }

    const handler = (e) => {
      if (e.type === "touchstart") e.preventDefault();
      this.onStart(e.type === "touchstart" ? e.touches[0] : e, r, c);
    };
    el.onmousedown = handler;
    el.ontouchstart = handler;

    // 基準位置を設定（top/leftは一度だけ設定し、以降transformで移動）
    const baseTop = (r * (this.orbSize + this.gap)) + (this.gap / 2);
    const baseLeft = (c * (this.orbSize + this.gap)) + (this.gap / 2);
    el.style.width = `${this.orbSize}px`;
    el.style.height = `${this.orbSize}px`;
    el.style.top = `${baseTop}px`;
    el.style.left = `${baseLeft}px`;

    const orb = { type, el, r, c, isSkyfall: isNew, baseTop, baseLeft, isEnhanced };
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
          const targetTop = (r * (this.orbSize + this.gap)) + (this.gap / 2);
          const targetLeft = (c * (this.orbSize + this.gap)) + (this.gap / 2);
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

  onStart(e, r, c) {
    if (this.processing) return;
    const target = this.state[r][c];
    if (!target) return;

    this.dragging = target;
    this.dragging.el.classList.add("orb-grabbing");
    this.dragging.el.style.zIndex = "100";

    if (this.comboEl) this.comboEl.style.display = "none";

    this.moveStart = null;
    this._lastMovePoint = null; // rAF用

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
          if (!this.moveStart && !this.chronosStopActive) {
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

    if (this.chronosStopActive) {
      // クロノス中は、ドラッグ状態だけ解除して再操作を待つ
      this.dragging.el.classList.remove("orb-grabbing");
      this.dragging.el.style.zIndex = "";
      this.dragging = null;

      window.removeEventListener("mousemove", this.onMove);
      window.removeEventListener("mouseup", this.onEnd);
      window.removeEventListener("touchmove", this.onMove);
      window.removeEventListener("touchend", this.onEnd);
      
      this.render();
      return; // process()に進まない
    }

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

    this.render();
    this.process();
  }

  setSpawnWeights(weights) {
    this.spawnWeights = { ...weights };
  }

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

  async animateComboAdd(amount) {
    if (amount <= 0) return;
    const stepDelay = Math.max(50, Math.min(250, 600 / amount)); // 段階的に増えるように速度調整
    for (let i = 0; i < amount; i++) {
      this.currentCombo++;
      this.onCombo(this.currentCombo);
      if (this.comboEl) {
        this.comboEl.innerHTML = `<span class="combo-number">${this.currentCombo}</span><span class="combo-label">COMBO</span>`;
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
    this.state.forEach((row, r) => {
      row.forEach((orb, c) => {
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
    this.types.forEach(t => colorComboCounts[t] = 0);
    let hasSkyfallCombo = false;
    const shapes = []; // 特殊消し形状判定結果を蓄積
    let overLinkMultiplier = 1; // 過剰結合ボーナス用

    // --- 全消し判定用のカウンター ---
    const initialOrbCount = this.state.flat().filter(orb => orb !== null).length;
    let clearedInitialOrbs = 0;

    while (true) {
      const groups = this.findCombos();
      if (groups.length === 0) break;

      for (const group of groups) {
        // 消した色とコンボ数を記録
        if (group.length > 0 && group[0].type) {
          const type = group[0].type;
          if (colorComboCounts[type] !== undefined) {
            colorComboCounts[type]++;
          }
        }
        // 落ちコンで消えたグループかチェック（skyfall_bonus判定用）
        if (group.some(o => o.isSkyfall)) {
          hasSkyfallCombo = true;
        }

        // --- カウント：初期盤のドロップがどれだけ消えたか ---
        const nonSkyfallCount = group.filter(o => !o.isSkyfall).length;
        clearedInitialOrbs += nonSkyfallCount;

        const shape = this.classifyShape(group);
        if (shape) shapes.push(shape);

        // 消えたオーブの色を取得
        const type = group.length > 0 ? group[0].type : null;

        // --- 特殊消しリアルタイム加算 ---
        let addition = 1;

        // Base Bonuses
        if (shape === "len5") addition += 1;
        if (shape === "l_shape") addition += 1;
        if (shape === "cross") addition += 2;

        if (shape === "len4" && this.realtimeBonuses?.len4) addition += this.realtimeBonuses.len4;
        if (shape === "row" && this.realtimeBonuses?.row) addition += this.realtimeBonuses.row;
        if (shape === "l_shape" && this.realtimeBonuses?.l_shape) addition += this.realtimeBonuses.l_shape;
        
        // Color Combo Bonus (Enchantment)
        if (type && this.realtimeBonuses?.color_combo?.[type]) {
          addition += this.realtimeBonuses.color_combo[type];
        }

        // Heart Combo Bonus (Passive)
        if (type === 'heart' && this.realtimeBonuses?.heart_combo) {
          addition += this.realtimeBonuses.heart_combo;
        }
        
        // --- 強化ドロップボーナス ---
        const enhancedCount = group.filter(o => o.isEnhanced).length;
        if (enhancedCount > 0) {
          const bonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);
          addition += enhancedCount * bonusPerOrb;

          // 過剰結合チェック
          if (this.realtimeBonuses?.overLink && enhancedCount >= this.realtimeBonuses.overLink.count) {
            overLinkMultiplier = Math.max(overLinkMultiplier, this.realtimeBonuses.overLink.value);
          }
        }

        group.forEach((o) => o.el.classList.add("orb-matching"));
        await this.sleep(300);
        if (this._isDestroyed) return;
        group.forEach((o) => {
          o.el.remove();
          this.state[o.r][o.c] = null;
        });
        await this.sleep(50);
        if (this._isDestroyed) return;

        // --- Special Bonus: Monocolor Full Board ---
        if (group.length === this.rows * this.cols) {
          await this.animateComboAdd(10);
        } else {
          await this.animateComboAdd(addition);
        }
      }

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
      this.currentCombo *= 2;
      if (this.comboEl) {
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ ALL CLEAR ✦</div><span class="combo-number combo-number-final">${this.currentCombo}</span><span class="combo-label">×2</span>`;
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
    if (isPerfect && this.currentCombo > 0 && !allInitialOrbsCleared) {
      this.currentCombo *= 2;
      if (this.comboEl) {
        this.comboEl.innerHTML = `<div class="combo-perfect-label">✦ PERFECT CLEAR ✦</div><span class="combo-number combo-number-final">${this.currentCombo}</span><span class="combo-label">×2</span>`;
        this.comboEl.classList.remove('animate-combo-pop');
        void this.comboEl.offsetWidth;
        this.comboEl.classList.add('animate-combo-pop');
      }
      await this.sleep(1000);
      if (this._isDestroyed) return;
    }

    this.processing = false;
    this.onTurnEnd(this.currentCombo, colorComboCounts, hasSkyfallCombo, shapes, overLinkMultiplier);
  }

  findCombos() {
    const matched = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false),
    );
    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const t = this.state[r][c]?.type;
        if (
          t &&
          this.state[r][c + 1]?.type === t &&
          this.state[r][c + 2]?.type === t
        ) {
          matched[r][c] = matched[r][c + 1] = matched[r][c + 2] = true;
          let k = c + 3;
          while (k < this.cols && this.state[r][k]?.type === t)
            matched[r][k++] = true;
        }
      }
    }
    // Vertical
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const t = this.state[r][c]?.type;
        if (
          t &&
          this.state[r + 1][c]?.type === t &&
          this.state[r + 2][c]?.type === t
        ) {
          matched[r][c] = matched[r + 1][c] = matched[r + 2][c] = true;
          let k = r + 3;
          while (k < this.rows && this.state[k][c]?.type === t)
            matched[k++][c] = true;
        }
      }
    }

    const groups = [];
    const visited = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false),
    );

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (matched[r][c] && !visited[r][c]) {
          const group = [];
          const q = [{ r, c }];
          const type = this.state[r][c].type;
          visited[r][c] = true;
          while (q.length > 0) {
            const curr = q.shift();
            group.push(this.state[curr.r][curr.c]);
            [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
            ].forEach(([dr, dc]) => {
              const nr = curr.r + dr,
                nc = curr.c + dc;
              if (
                nr >= 0 &&
                nr < this.rows &&
                nc >= 0 &&
                nc < this.cols &&
                matched[nr][nc] &&
                !visited[nr][nc] &&
                this.state[nr][nc].type === type
              ) {
                visited[nr][nc] = true;
                q.push({ r: nr, c: nc });
              }
            });
          }
          groups.push(group);
        }
      }
    }
    return groups;
  }

  // グループの形状を判定する
  classifyShape(group) {
    const coords = group.map(o => ({ r: o.r, c: o.c }));
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
    // 少し待ってから落下アニメーションを開始（ブラウザにレイアウトを確定させる）
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
    clearTimeout(this.chronosTimerId);
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("mouseup", this.onEnd);
    window.removeEventListener("touchmove", this.onMove);
    window.removeEventListener("touchend", this.onEnd);
  }
}

// --- React App ---
const App = () => {
  // Game State
  const [tokens, setTokens] = useState(Array(6).fill(null));
  const [stars, setStars] = useState(5);
  const [target, setTarget] = useState(8);
  const [turn, setTurn] = useState(1);
  const [cycleTotalCombo, setCycleTotalCombo] = useState(0);

  /* const [energy, setEnergy] = useState(0); // REMOVED: Global Energy */
  /* const [maxEnergy] = useState(10); // REMOVED: Global Energy */

  const [activeBuffs, setActiveBuffs] = useState([]);
  const [skippedTurnsBonus, setSkippedTurnsBonus] = useState(0);
  const [nextTurnTimeMultiplier, setNextTurnTimeMultiplier] = useState(1);

  // Shop choice state
  const [pendingShopItem, setPendingShopItem] = useState(null);

  // UI State
  const [showShop, setShowShop] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalStarsSpent, setTotalStarsSpent] = useState(0);
  const [message, setMessage] = useState(null);
  const [goalReached, setGoalReached] = useState(false);
  const [targetPulse, setTargetPulse] = useState(false);
  const targetComboRef = useRef(null);

  // Refs
  const boardRef = useRef(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isEndlessMode, setIsEndlessMode] = useState(false);
  const [selectedTokenDetail, setSelectedTokenDetail] = useState(null);

  const timerRef = useRef(null);
  const comboRef = useRef(null);
  const engineRef = useRef(null);
  const handleTurnEndRef = useRef(null);

  // Derived
  const hasGiantDomain = tokens.some((t) => t?.id === "giant" || t?.enchantments?.some(e => e.effect === "expand_board"));
  // NOTE: Changing board size forces re-init.
  const rows = hasGiantDomain ? 6 : 5;
  const cols = hasGiantDomain ? 7 : 6;

  const maxTurns = 3 + tokens.reduce((acc, t) => acc + (t?.enchantments?.filter(e => e.effect === "add_turn").length || 0), 0);

  // --- Skyfall Weight Management ---
  useEffect(() => {
    if (!engineRef.current) return;
    const weights = {};
    const ALL_COLORS = ["fire", "water", "wood", "light", "dark", "heart"];
    ALL_COLORS.forEach((c) => (weights[c] = 1));

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
  }, [activeBuffs]);

  const getTimeLimit = useCallback(() => {
    let base = 5000;
    tokens.forEach((t) => {
      if (t?.effect === "time") base += (t.values[(t.level || 1) - 1] * 1000);
    });
    // 特殊消しボーナスによる操作時間延長（五星の印・十字の祈り）
    base *= nextTurnTimeMultiplier;
    return base;
  }, [tokens, nextTurnTimeMultiplier]);

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
        onCombo: () => {
          // No-op for now to avoid re-renders
        },
        onTurnEnd: (total, colorComboCounts, skyfall, shapes, overLinkMultiplier) => {
          if (handleTurnEndRef.current) {
            handleTurnEndRef.current(total, colorComboCounts, skyfall, shapes, overLinkMultiplier);
          }
        },
      },
    );

    engine.init();
    engineRef.current = engine;

    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols]);

  // Update time limit and realtime bonuses live
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.timeLimit = getTimeLimit();

      // Calculate realtime bonuses from tokens
      const bonuses = { len4: 0, row: 0, l_shape: 0, color_combo: {}, heart_combo: 0, enhancedOrbBonus: 0, overLink: null };
      tokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;

        if (t.effect === 'shape_bonus') {
          const val = t.values[lv - 1];
          if (t.params?.shape === 'len4') bonuses.len4 += val;
          if (t.params?.shape === 'row') bonuses.row += val;
          if (t.params?.shape === 'l_shape') bonuses.l_shape += val;
        }
        
        if (t.effect === 'heart_combo_bonus') {
            const val = t.values[lv - 1];
            bonuses.heart_combo += val;
        }

        if (t.effect === 'enhanced_orb_bonus') {
          bonuses.enhancedOrbBonus += t.values[lv - 1] || 0;
        }

        if (t.effect === 'enhanced_link_multiplier') {
          if (!bonuses.overLink || t.values[lv - 1] > bonuses.overLink.value) {
            bonuses.overLink = { count: t.params.count, value: t.values[lv - 1] };
          }
        }

        // Add color combo enchantments to realtime bonuses
        const enchList = t.enchantments || [];
        enchList.forEach(enc => {
          if (enc.effect === 'color_combo' && enc.params?.color) {
            const color = enc.params.color;
            bonuses.color_combo[color] = (bonuses.color_combo[color] || 0) + 1; // +1 per combo
          }
        });
      });
      engineRef.current.setRealtimeBonuses(bonuses);

      // Calculate enhance rates from tokens
      const rates = { global: 0, colors: {} };
      tokens.forEach(t => {
        if (!t) return;
        const lv = t.level || 1;

        if (t.effect === 'enhance_chance') {
          rates.global += t.values[lv - 1] || 0;
        }

        const enchList = t.enchantments || [];
        enchList.forEach(enc => {
          if (enc.effect === 'enhance_chance_color' && enc.params?.color) {
            const color = enc.params.color;
            rates.colors[color] = (rates.colors[color] || 0) + (enc.value || 0.1);
          }
        });
      });
      engineRef.current.setEnhanceRates(rates);
    }
  }, [tokens, getTimeLimit]);

  // --- Init Shop on Start ---
  useEffect(() => {
    generateShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Game Logic ---
  // Debug State
  // const [debugLog, setDebugLog] = useState(null);

  const handleTurnEnd = (turnCombo, colorComboCounts, hasSkyfallCombo, shapes = [], overLinkMultiplier = 1) => {
    let bonus = 0;
    let multiplier = 1;
    let timeMultiplier = 1; // 次手の操作時間倍率
    const matchedColorSet = new Set(Object.keys(colorComboCounts).filter(k => colorComboCounts[k] > 0));

    const logData = {
      tokens: tokens,
      matchedColors: Array.from(matchedColorSet),
      colorComboCounts,
      turnCombo,
      shapes,
      bonuses: [],
      multipliers: [],
    };

    tokens.forEach((t) => {
      if (!t) return;
      const lv = t.level || 1;

      // Base bonuses
      // エンチャント効果（複数対応）
      const enchList = t.enchantments || [];
      enchList.forEach(enc => {
        if (enc.effect === "fixed_add") { bonus += 2; logData.bonuses.push("fixed_add"); }
        if (enc.effect === "star_add") { bonus += stars; logData.bonuses.push("star_add"); }
        if (enc.effect === "skip_turn_combo") { bonus += skippedTurnsBonus; logData.bonuses.push("skip_add"); }
      });
      if (t.effect === "base_add") { const v = t.values?.[lv - 1] || 0; bonus += v; logData.bonuses.push(`base_add:${v}`); }

      // Skyfall bonus
      if (t.effect === "skyfall_bonus" && hasSkyfallCombo) {
        const v = t.values?.[lv - 1] || 0;
        bonus += v;
        logData.bonuses.push(`skyfall:${v}`);
      }

      // New: Exact Combo Bonus
      if (t.effect === "combo_if_exact" && turnCombo === t.params?.combo) {
        const v = t.values?.[lv - 1] || 0;
        bonus += v;
        logData.bonuses.push(`combo_exact_${t.params.combo}:${v}`);
      }

      // New: Combo Threshold Multiplier
      if (t.effect === "combo_if_ge" && turnCombo >= t.params?.combo) {
        const v = t.values?.[lv - 1] || 1;
        multiplier *= v;
        logData.multipliers.push(`combo_ge_${t.params.combo}:${v}`);
      }

      // --- 特殊消しボーナス（Shape Bonus） ---
      if (t.effect === "shape_bonus" && shapes.length > 0) {
        const shape = t.params?.shape;
        const v = t.values?.[lv - 1] || 0;
        // 該当形状が今回のターンで出現した回数分ボーナスを適用
        const matchCount = shapes.filter(s => s === shape).length;
        if (matchCount > 0) {
          if (shape === "square") {
            // 四方の型: コンボ倍率
            for (let i = 0; i < matchCount; i++) multiplier *= v;
            logData.multipliers.push(`shape_square:mult_x${v}_count_${matchCount}`);
          } else if (shape === "len5") {
            // 五星の印: 次手操作延長 (重複適用)
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_len5:time_x${v}_count_${matchCount}`);
          } else if (shape === "cross") {
            // 十字の祈り: 次手操作延長 (重複適用)
            for (let i = 0; i < matchCount; i++) timeMultiplier *= v;
            logData.bonuses.push(`shape_cross:time_x${v}_count_${matchCount}`);
          } else {
            // len4 / row: すでに PuzzleEngine 内でリアルタイム加算済みのためここでは何もしない
            // 表示用のログのみ追加
            logData.bonuses.push(`shape_${shape}:${v}x${matchCount}(applied)`);
          }
        }
      }

      // Multipliers
      if (t.id === "forbidden") {
        const v = t.values?.[lv - 1] || 1;
        multiplier *= v;
        logData.multipliers.push(`forbidden:${v}`);
      }
      if (t.action === "forbidden_temp" && engineRef.current?.noSkyfall) {
        multiplier *= 3;
        logData.multipliers.push("forbidden_temp:3");
      }
      enchList.forEach(enc => {
        if (enc.effect === "lvl_mult") {
          multiplier *= lv;
          logData.multipliers.push(`lvl_mult:${lv}`);
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
          multiplier *= t.values?.[lv - 1] || 1;
        }
      }

      // Giant Domain Multiplier
      if (t.id === "giant") {
        const v = t.values?.[lv - 1] || 1;
        multiplier *= v;
        logData.multipliers.push(`giant:${v}`);
      }
    });

    // Apply Overlink Multiplier from enhanced orb chains
    if (overLinkMultiplier > 1) {
      multiplier *= overLinkMultiplier;
      logData.multipliers.push(`overlink:${overLinkMultiplier}`);
    }

    // 次手の操作時間倍率を設定（1ならリセット）
    setNextTurnTimeMultiplier(timeMultiplier);

    logData.finalMultiplier = multiplier;
    logData.finalBonus = bonus;
    // setDebugLog(logData);

    const effectiveCombo = Math.floor((turnCombo + bonus) * multiplier) || 0;

    // --- effectiveCombo の段階的演出 ---
    // comboRefを使って、ボーナス加算・倍率適用を盤面上に表示
    const showComboBreakdown = async () => {
      const el = comboRef.current;
      if (!el) return;

      // ステップ1: 素コンボ → ボーナス加算表示
      if (bonus > 0) {
        await new Promise(r => setTimeout(r, 400));
        el.innerHTML = `<span class="combo-number">${turnCombo}</span><span class="combo-bonus-add">+${bonus}</span>`;
        el.classList.remove('animate-combo-pop');
        void el.offsetWidth;
        el.classList.add('animate-combo-pop');
      }

      // ステップ2: 倍率表示
      if (multiplier > 1) {
        await new Promise(r => setTimeout(r, 500));
        const baseVal = turnCombo + bonus;
        const roundedMultiplier = Math.round(multiplier * 100) / 100;
        el.innerHTML = `<span class="combo-number">${baseVal}</span><span class="combo-bonus-mult">×${roundedMultiplier}</span>`;
        el.classList.remove('animate-combo-pop');
        void el.offsetWidth;
        el.classList.add('animate-combo-pop');
      }

      // ステップ3: 最終値をパルス演出で表示
      if (bonus > 0 || multiplier > 1) {
        await new Promise(r => setTimeout(r, 600));
        el.innerHTML = `<span class="combo-number combo-number-final">${effectiveCombo}</span><span class="combo-label">COMBO</span>`;
        el.classList.remove('animate-combo-pop');
        el.classList.add('animate-combo-pulse');
        void el.offsetWidth;
      }

      // ステップ4: Target Comboの数値パルス
      await new Promise(r => setTimeout(r, 400));
      setTargetPulse(true);
      setTimeout(() => setTargetPulse(false), 800);

      // 追加: 一定時間後にコンボ表示を消す
      setTimeout(() => {
        if (comboRef.current) {
          comboRef.current.classList.remove('animate-combo-pulse');
          comboRef.current.classList.add('animate-fade-out'); // 必要ならCSSで定義、または単に中身を空にする
          setTimeout(() => {
            if (comboRef.current) comboRef.current.innerHTML = '';
          }, 500);
        }
      }, 2000); // 2秒後に消去開始
    };

    showComboBreakdown();

    let totalReduction = 0;
    tokens.forEach((t) => {
      if (t?.id === "collector") {
        const threshold = t.values?.[(t.level || 1) - 1] || 5;
        totalReduction += (5 - threshold);
      }
    });
    const starThreshold = Math.max(1, 5 - totalReduction);
    const totalStarsEarned = starThreshold > 0 ? Math.floor(effectiveCombo / starThreshold) : 0;

    if (totalStarsEarned > 0) {
      setStars((s) => s + totalStarsEarned);
      notify(`+ ${totalStarsEarned} STARS!`);
    }

    const newCycleTotalCombo = cycleTotalCombo + effectiveCombo;
    setCycleTotalCombo(newCycleTotalCombo);

    /* setEnergy((prev) => Math.min(maxEnergy, prev + 2)); // REMOVED */

    // --- Charge Skills ---
    setTokens(prevTokens => {
      return prevTokens.map(t => {
        if (!t || t.type !== 'skill') return t;
        const currentCharge = t.charge || 0;
        const maxCharge = t.cost || 0;
        // Increment charge by 1 per turn, up to max cost
        const newCharge = Math.min(maxCharge, currentCharge + 1);
        return { ...t, charge: newCharge };
      });
    });

    setActiveBuffs((prev) =>
      prev
        .map((b) => ({ ...b, duration: b.duration - 1 }))
        .filter((b) => b.duration > 0),
    );

    if (newCycleTotalCombo >= target) {
      setGoalReached(true);
    }

    setTurn((prev) => prev + 1);

    // Reset or persist noSkyfall based on passive tokens
    if (engineRef.current) {
      const hasForbiddenLiteral = tokens.some((t) => t?.id === "forbidden");
      engineRef.current.noSkyfall = hasForbiddenLiteral;
    }
  };

  // Keep handleTurnEndRef current
  useEffect(() => {
    handleTurnEndRef.current = handleTurnEnd;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isEndlessMode && turn > maxTurns) {
      if (goalReached) {
        handleCycleClear(0);
      } else {
        handleGameOver();
      }
    }
  }, [turn, goalReached, maxTurns, isEndlessMode]);

  const skipTurns = () => {
    const remainingTurns = maxTurns - turn + 1;
    if (remainingTurns <= 0) return handleCycleClear();

    let bonusMultiplier = 3;
    const skipTokens = tokens.filter(t => t?.id === 'skip_master');
    if (skipTokens.length > 0) {
      bonusMultiplier = skipTokens.reduce((acc, t) => acc + (t.values[(t.level || 1) - 1] || 0), 0);
    }

    const bonus = remainingTurns * bonusMultiplier;
    setStars((s) => s + bonus);
    notify(`SKIP BONUS: +${bonus} STARS!`);

    handleCycleClear(remainingTurns);
  };

  const handleCycleClear = (skippedTurns = 0) => {
    notify("CYCLE CLEAR!");
    setSkippedTurnsBonus(prev => prev + skippedTurns);
    setTimeout(() => {
      setTurn(1);
      setCycleTotalCombo(0);
      setTarget((t) => Math.floor(t * 1.5) + 2);
      setGoalReached(false);
      generateShop();
      setShowShop(true);
    }, 1000);
  };

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const resetGame = () => {
    setStars(5);
    setTarget(8);
    setTurn(1);
    setCycleTotalCombo(0);
    setTokens(Array(6).fill(null));
    setTokens(Array(6).fill(null));
    /* setEnergy(0); // REMOVED */
    setActiveBuffs([]);
    setActiveBuffs([]);
    setSkippedTurnsBonus(0);
    setPendingShopItem(null);
    setGoalReached(false);
    setShowShop(false);
    setIsGameOver(false);
    setIsEndlessMode(false);
    setTotalPurchases(0);
    setTotalStarsSpent(0);
    generateShop();
    if (engineRef.current) {
      engineRef.current.init();
    }
    notify("NEW GAME STARTED!");
  };

  const handleContinue = () => {
    setIsGameOver(false);
    setTurn((prev) => Math.max(1, prev - 2));
    setTurn((prev) => Math.max(1, prev - 2));
    /* setEnergy(maxEnergy); // REMOVED */
    notify("リトライ! +2手番");
  };

  const handleGiveUp = () => {
    setIsGameOver(false);
    resetGame();
  };

  const handleEndlessMode = () => {
    setIsEndlessMode(true);
    setIsGameOver(false);
    notify("ENDLESS MODE!");
  };

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  const generateShop = () => {
    const isLuxury = totalPurchases >= 6;

    let saleBonus = 0;
    tokens.forEach((t) => {
      if (t?.id === "bargain") {
        const value = t.values[(t.level || 1) - 1];
        saleBonus += (value - 1);
      }
    });
    const saleCount = 1 + saleBonus;

    const items = [];

    // 1. Guaranteed "Random Token Upgrade" item
    items.push({
      id: "upgrade_random",
      name: "ランダム強化",
      type: "upgrade_random",
      price: 5,
      desc: "所持トークンをランダムに1つ強化(Lv+1)する。",
    });

    // 2. Guaranteed "Random Enchantment" item (if unlocked)
    if (totalStarsSpent >= 20) {
      const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
      items.push({
        ...enc,
        type: "enchant_random",
        name: `ランダム付与: ${enc.name}`,
        originalName: enc.name,
        desc: `所持トークンにランダムに「${enc.name}」を付与する。`,
      });
    }

    const pool = [...ALL_TOKEN_BASES];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const base = pool[idx];
      // Initialize charge to max (cost) for new skills
      const item = { ...base, level: 1, charge: base.cost || 0 };
      item.desc = getTokenDescription(item, 1);

      if (isLuxury && Math.random() < 0.3) {
        const enc =
          ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
        item.enchantments = [{ effect: enc.effect, name: enc.name }];
        item.price += 4;
      }
      items.push(item);
    }

    // Apply sales only to the standard pool items (last 4 items)
    const standardItemsStartIndex = items.length - 4;
    const indices = [0, 1, 2, 3].map(i => i + standardItemsStartIndex);

    for (let i = 0; i < saleCount && indices.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * indices.length);
      const targetIdx = indices.splice(randIdx, 1)[0];
      if (items[targetIdx]) {
        items[targetIdx].isSale = true;
        items[targetIdx].originalPrice = items[targetIdx].price;
        items[targetIdx].price = Math.floor(items[targetIdx].price / 2);
      }
    }

    if (isLuxury) {
      const enc = ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];
      items.push({ ...enc, type: "enchant_grant", price: enc.price - 2 });
    }
    setShopItems(items);
  };

  const buyItem = (item) => {
    if (stars < item.price) return notify("★が足りません");

    if (item.type === "upgrade_random") {
      const existingTokens = tokens.filter(t => t !== null);
      if (existingTokens.length === 0) return notify("強化可能なトークンがありません");
      
      // Randomly select one
      const targetToken = existingTokens[Math.floor(Math.random() * existingTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        const nextLevel = (next[targetIdx].level || 1) + 1;
        next[targetIdx] = {
          ...next[targetIdx],
          level: nextLevel,
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify(`${targetToken.name} が強化されました!`);

    } else if (item.type === "enchant_random") {
      const existingTokens = tokens.filter(t => t !== null);
      if (existingTokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = existingTokens[Math.floor(Math.random() * existingTokens.length)];
      const targetIdx = tokens.indexOf(targetToken);

      setTokens((prev) => {
        const next = [...prev];
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), { effect: item.effect, name: item.originalName, params: item.params }],
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify(`${targetToken.name} に「${item.originalName}」を付与!`);

    } else if (item.type === "enchant_grant") {
      const targetIdx = tokens.findIndex((t) => t != null);
      if (targetIdx === -1) return notify("付与可能なトークンがありません");
      setTokens((prev) => {
        const next = [...prev];
        next[targetIdx] = {
          ...next[targetIdx],
          enchantments: [...(next[targetIdx].enchantments || []), { effect: item.effect, name: item.name, params: item.params }],
        };
        return next;
      });
      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify("購入完了!");
    } else {
      const existingIdx = tokens.findIndex((t) => t?.id === item.id);
      if (existingIdx !== -1) {
        setPendingShopItem(item);
      } else {
        const emptyIdx = tokens.indexOf(null);
        if (emptyIdx === -1) return notify("スロットがいっぱいです");
        setTokens((prev) => {
          const next = [...prev];
          next[emptyIdx] = item;
          return next;
        });
        setStars((s) => s - item.price);
        setTotalPurchases((p) => p + 1);
        setTotalStarsSpent((prev) => prev + item.price);
        setShopItems((prev) => prev.filter((i) => i !== item));
        notify("購入完了!");
      }
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
          const nextLevel = (next[idx].level || 1) + 1;
          next[idx] = {
            ...next[idx],
            level: nextLevel,
            desc: getTokenDescription(next[idx], nextLevel)
          };
        }
        return next;
      });
      notify(`${item.name} を強化しました!`);
    } else {
      const emptyIdx = tokens.indexOf(null);
      if (emptyIdx === -1) {
        notify("スロットがいっぱいです。代わりに強化します。");
        setTokens((prev) => {
          const next = [...prev];
          const idx = next.findIndex((t) => t?.id === item.id);
          if (idx !== -1) {
            const nextLevel = (next[idx].level || 1) + 1;
            next[idx] = {
              ...next[idx],
              level: nextLevel,
              desc: getTokenDescription(next[idx], nextLevel)
            };
          }
          return next;
        });
      } else {
        setTokens((prev) => {
          const next = [...prev];
          next[emptyIdx] = item;
          return next;
        });
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

    // Check individual charge
    const currentCharge = token.charge || 0;
    const cost = getEffectiveCost(token);

    if (currentCharge < cost) {
      return notify(`チャージ不足です (${currentCharge}/${cost})`);
    }

    if (engineRef.current?.processing) return notify("処理中です");

    const engine = engineRef.current;
    if (!engine) return;

    console.log("Using skill:", token);

    switch (token.action) {
      case "refresh":
        engine.init();
        break;
      case "force_refresh":
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
      case "row_fix":
        engine.fixRowColor(token.params.row, token.params.type);
        break;
      case "col_fix":
        engine.fixColColor(token.params.col, token.params.type);
        break;
      case "skyfall":
        {
          const newBuff = { ...token, duration: token.params.duration };
          setActiveBuffs(prev => [...prev, newBuff]);
        }
        break;
      case "skyfall_limit":
         {
          const newBuff = { ...token, duration: token.params.duration };
          setActiveBuffs(prev => [...prev, newBuff]);
        }
        break;
      case "charge_boost":
        {
            const amount = token.values[(token.level || 1) - 1];
            setTokens(prevTokens => {
                const newTokens = [...prevTokens];
                // 使用したスキル自身はチャージしないので、一時的にnullにする
                const selfIndex = newTokens.findIndex(t => t === token);
                if (selfIndex !== -1) newTokens[selfIndex] = null;

                // 他のスキルをチャージ
                for(let i=0; i<newTokens.length; i++) {
                    const t = newTokens[i];
                    if (t && t.type === 'skill') {
                        t.charge = Math.min(t.cost, (t.charge || 0) + amount);
                    }
                }

                // 使用したスキルを元に戻す
                if (selfIndex !== -1) newTokens[selfIndex] = token;
                return newTokens;
            });
        }
        break;
      default:
        notify(`不明なスキル: ${token.action}`);
    }

    // Consume charge
    setTokens(prevTokens => {
      return prevTokens.map(t => {
        if (t === token) {
          return { ...t, charge: 0 };
        }
        return t;
      });
    });
  };

  const handleTokenClick = (token, index) => {
    if (token?.type === 'skill') {
      activateSkill(token);
    } else {
       setSelectedTokenDetail(token);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 text-white p-4 font-sans touch-none">
      
      {message && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg z-50 text-2xl font-bold animate-fade-in-out">
          {message}
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-40">
          <h2 className="text-6xl font-bold text-red-500 mb-8">GAME OVER</h2>
          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg text-xl"
            >
              コンティニュー (-5★)
            </button>
            <button
              onClick={handleEndlessMode}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
            >
              エンドレスモード
            </button>
            <button
              onClick={handleGiveUp}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
            >
              あきらめる
            </button>
          </div>
        </div>
      )}
      
      {showShop && (
        <ShopScreen 
          items={shopItems} 
          onSelectItem={buyItem} 
          onClose={() => setShowShop(false)} 
          stars={stars}
          pendingItem={pendingShopItem}
          onChoice={handleChoice}
          onCancelChoice={() => setPendingShopItem(null)}
          getTokenDescription={getTokenDescription}
        />
      )}

      <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
        {/* Header */}
        <header className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="text-yellow-400 flex items-center gap-1">
              <StarIcon className="w-6 h-6" />
              <span className="text-2xl font-bold">{stars}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg text-gray-400">TARGET</div>
            <div ref={targetComboRef} className={`text-4xl font-bold ${targetPulse ? 'animate-pulse-quick' : ''}`}>{target}</div>
          </div>
          <div className="text-right">
            <div className="text-lg text-gray-400">TURN</div>
            <div className="text-4xl font-bold">{turn} / {maxTurns}</div>
          </div>
        </header>

        {/* Combo Display */}
        <div className="h-20 flex items-center justify-center relative">
          <div ref={comboRef} className="text-5xl font-bold text-center"></div>
        </div>
        
        {/* Board */}
        <main className="relative w-full aspect-[6/5]" style={{'--cols': cols, '--rows': rows}}>
          <div ref={boardRef} className="absolute inset-0 grid grid-cols-[--cols] grid-rows-[--rows] gap-2 bg-gray-800/50 p-1 rounded-lg border-2 border-gray-700">
             {/* Engine will populate this */}
          </div>
          <div className="absolute top-full left-0 w-full mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div ref={timerRef} className="h-full bg-green-500 rounded-full transition-all duration-100 ease-linear"></div>
          </div>
        </main>
        
        {goalReached && (
          <div className="w-full mt-4">
            <button
              onClick={skipTurns}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-4 px-4 rounded-lg text-2xl shadow-lg transform hover:scale-105 transition-transform"
            >
              SKIP TURNS
            </button>
          </div>
        )}

        {/* Tokens */}
        <footer className="grid grid-cols-6 gap-2 pt-4">
          {tokens.map((token, index) => (
            <div
              key={token?.id || index}
              onClick={() => handleTokenClick(token, index)}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all
                ${token ? 'bg-gray-800 border-2 border-gray-600 cursor-pointer hover:border-yellow-400 hover:scale-105' : 'bg-gray-800/50 border-2 border-dashed border-gray-700'}
              `}
            >
              {token && (
                <>
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {token.level || 1}
                  </div>
                  
                  {token.enchantments && token.enchantments.length > 0 && (
                     <div className="absolute -top-2 -left-2 bg-purple-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                       +{token.enchantments.length}
                     </div>
                  )}

                  <div className="text-center text-xs leading-tight">{token.name}</div>
                  
                  {token.type === 'skill' && token.cost > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-600 rounded-b-md overflow-hidden">
                       <div 
                         className="h-full bg-green-500" 
                         style={{ width: `${Math.min(100, ((token.charge || 0) / getEffectiveCost(token)) * 100)}%` }}
                       ></div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </footer>
         
         {selectedTokenDetail && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
              onClick={() => setSelectedTokenDetail(null)}
            >
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-600" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-2xl font-bold mb-2">{selectedTokenDetail.name} <span className="text-base text-yellow-400">(Lv.{selectedTokenDetail.level || 1})</span></h3>
                  <p className="text-gray-300 mb-4">{getTokenDescription(selectedTokenDetail)}</p>
                  {selectedTokenDetail.enchantments && selectedTokenDetail.enchantments.length > 0 && (
                    <div>
                      <h4 className="font-bold text-purple-400">付与効果:</h4>
                      <ul className="list-disc list-inside">
                        {selectedTokenDetail.enchantments.map((enc, i) => (
                           <li key={i}>{enc.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default App;
