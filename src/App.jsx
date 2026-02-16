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
  }

  setRealtimeBonuses(bonuses) {
    this.realtimeBonuses = { len4: 0, row: 0, l_shape: 0, ...bonuses };
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

    const el = document.createElement("div");
    el.className = `orb absolute flex items-center justify-center orb-shadow orb-shape-${type}`;

    const inner = document.createElement("div");
    inner.className = `orb-inner orb-${type} shadow-lg`;

    const iconSpan = document.createElement("span");
    iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
    iconSpan.innerText = this.icons[type];

    inner.appendChild(iconSpan);
    el.appendChild(inner);

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

    const orb = { type, el, r, c, isSkyfall: isNew, baseTop, baseLeft };
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

    this.render();
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
    this.onTurnEnd(this.currentCombo, colorComboCounts, hasSkyfallCombo, shapes);
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
        onTurnEnd: (total, colorComboCounts, skyfall, shapes) => {
          if (handleTurnEndRef.current) {
            handleTurnEndRef.current(total, colorComboCounts, skyfall, shapes);
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
      const bonuses = { len4: 0, row: 0, l_shape: 0, color_combo: {}, heart_combo: 0 };
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

  const handleTurnEnd = (turnCombo, colorComboCounts, hasSkyfallCombo, shapes = []) => {
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
    if (turn > maxTurns) {
      if (goalReached) {
        handleCycleClear(0);
      } else {
        handleGameOver();
      }
    }
  }, [turn, goalReached, maxTurns]);

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
    notify("RETRY! +2 TURNS");
  };

  const handleGiveUp = () => {
    setIsGameOver(false);
    resetGame();
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
      case "skyfall":
      case "skyfall_limit":
        setActiveBuffs((prev) => [
          ...prev,
          {
            id: Date.now(),
            action: token.action,
            params: token.params,
            duration: token.params.duration,
          },
        ]);
        notify(`${token.name} 発動！ (${token.params.duration}手番)`);
        break;
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

  const sellToken = (tokenIndex) => {
    const tokenToSell = tokens[tokenIndex];
    if (!tokenToSell) return;

    const sellPrice = Math.floor(tokenToSell.price / 2);
    setStars(s => s + sellPrice);
    
    setTokens(prev => {
      const next = [...prev];
      next[tokenIndex] = null;
      return next;
    });

    setSelectedTokenDetail(null);
    notify(`${tokenToSell.name} を売却しました (+${sellPrice} ★)`);
  };

  const openShop = () => {
    if (shopItems.length === 0) {
      generateShop();
    }
    setShowShop(true);
  };

  const refreshShop = () => {
    if (stars < 3) return notify("★が足りません");
    setStars(s => s - 3);
    setTotalStarsSpent((prev) => prev + 3);
    generateShop();
    notify("商品を入荷しました");
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

        {/* Top Status Bar */}
        <header className="relative z-10 px-4 pt-6 pb-2 flex justify-between items-center glass-panel border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Current Stage</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">Cycle {Math.ceil(turn / maxTurns)}</span>
              <span className="text-primary font-bold">/</span>
              <span className="text-lg font-bold text-white">Turn {turn}</span>
            </div>
          </div>
          <div
            onClick={openShop}
            className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-white/10 cursor-pointer active:scale-95 transition-transform"
          >
            <span className="material-icons-round text-yellow-400 text-sm">star</span>
            <span className="font-bold text-sm tracking-wide">{stars.toLocaleString()}</span>
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
                  {(getTimeLimit() / 1000).toFixed(1)}<span className="text-xs text-slate-500 ml-0.5">s</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Token/Skill Belt */}
        <section className="relative z-30 pl-6 py-2 flex-none mb-4">
          <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-wider">Active Tokens</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pr-6 pb-2 min-h-[80px]">
            {tokens.map((t, idx) => {
              // Calculate charge status
              const isSkill = t?.type === 'skill';
              const charge = t?.charge || 0;
              const cost = getEffectiveCost(t);
              const progress = isSkill ? Math.min(100, (charge / cost) * 100) : 100;
              const isReady = isSkill && charge >= cost;

              return (
                <div
                  key={idx}
                  onClick={() => t && setSelectedTokenDetail({ token: t, index: idx })}
                  className={`flex-none w-16 h-16 rounded-xl flex items-center justify-center relative border transition-all 
                  ${t ? (isReady || !isSkill ? 'bg-slate-800 border-primary/50 cursor-pointer shadow-[0_0_10px_rgba(91,19,236,0.2)] group hover:scale-105' : 'bg-slate-900 border-white/5 opacity-80 cursor-not-allowed') : 'bg-slate-900/50 border-white/5 border-dashed'}
                `}
                >
                  {t ? (
                    <>
                      <div className="absolute inset-0 bg-primary/10 rounded-xl overflow-hidden">
                        {/* Charge Progress Bar Background for Skills */}
                        {isSkill && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-500"
                            style={{ height: `${progress}%` }}
                          ></div>
                        )}
                      </div>

                      <span className={`material-icons-round text-3xl drop-shadow-md relative z-10 ${isReady || !isSkill ? 'text-primary' : 'text-slate-500'}`}>
                        {isSkill ? 'sports_martial_arts' : 'auto_awesome'}
                      </span>

                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-background-dark z-20">
                        {t.level || 1}
                      </div>
                      {t.cost > 0 && (
                        <div className="absolute top-0.5 right-1 z-20 flex flex-col items-end">
                          <span className="text-[8px] text-slate-400 font-mono">{t.cost}E</span>
                          {isSkill && (
                            <span className={`text-[8px] font-bold ${isReady ? 'text-green-400' : 'text-orange-400'}`}>
                              {charge}/{cost}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="material-icons-round text-slate-700">lock_open</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

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

          {/* Message Toast */}
          {message && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in w-max">
              <div className="bg-slate-950 border border-primary text-white font-black px-6 py-2 rounded-full shadow-2xl text-[10px] tracking-widest uppercase">
                {message}
              </div>
            </div>
          )}

          <div className="relative w-full h-full p-4 flex flex-col justify-center">
            {/* コンボ表示 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex justify-center w-full">
              <div ref={comboRef} className="combo-display"></div>
            </div>

            {/* Timer Bar はトークンベルトの下に移動済み */}

            {/* The 6x5 Grid Container */}
            <div
              ref={boardRef}
              className="w-full relative"
              style={{ touchAction: "none", aspectRatio: `${cols} / ${rows}` }}
            >
              {/* PuzzleEngine renders orbs here */}
            </div>

            {/* Touch Guide hint */}
            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-50">
              <span className="text-[10px] text-white uppercase tracking-widest">Drag to connect</span>
            </div>
          </div>
        </section>

        {/* Shop Overlay */}
        {showShop && (
          <div className="absolute inset-0 z-50 bg-background-dark">
            <ShopScreen
              items={shopItems}
              stars={stars}
              onBuy={buyItem}
              onClose={() => setShowShop(false)}
              onRefresh={refreshShop}
              goalReached={goalReached}
            />
          </div>
        )}

        {/* Pending Shop Item Modal */}
        {pendingShopItem && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-slate-800 w-full max-w-xs rounded-2xl p-6 border border-white/10 shadow-2xl">
              <h3 className="text-xl font-bold font-display text-white mb-2 text-center italic">{pendingShopItem.name}</h3>
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
        )}

        {/* Token Detail Modal */}
        {selectedTokenDetail && (() => {
          const t = selectedTokenDetail.token;
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSkill ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {isSkill ? 'スキル' : 'パッシブ'}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">Lv.{lv}</span>
                    </div>
                  </div>
                </div>

                {/* 効果説明 */}
                <div className="bg-slate-900/60 rounded-xl p-3 mb-3 border border-white/5">
                  <p className="text-xs text-slate-300 leading-relaxed">{getTokenDescription(t, lv)}</p>
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
                    const enchDef = ENCHANTMENTS.find(e => e.effect === enc.effect);
                    return (
                      <div key={encIdx} className="bg-amber-500/10 rounded-xl p-3 mb-3 border border-amber-500/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="material-icons-round text-amber-400 text-sm">auto_fix_high</span>
                          <span className="text-xs font-bold text-amber-400">{enc.name}</span>
                        </div>
                        <p className="text-[11px] text-amber-200/70 leading-relaxed">{enchDef?.desc || ''}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-900/40 rounded-xl p-3 mb-3 border border-dashed border-white/10">
                    <p className="text-[11px] text-slate-600 text-center">エンチャントなし</p>
                  </div>
                )}

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
                    onClick={() => sellToken(selectedTokenDetail.index)}
                    className="w-full text-center bg-red-600/20 hover:bg-red-600/40 text-red-300 py-3 rounded-lg font-bold transition-colors"
                  >
                    売却 (+{Math.floor(t.price / 2)} ★)
                  </button>
                  <button onClick={() => setSelectedTokenDetail(null)} className="text-slate-400 text-xs font-bold py-2">
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Game Over / Retry Modal */}
        {isGameOver && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-8 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center animate-bounce-in">
              <span className="material-icons-round text-6xl text-red-500 mb-4 animate-pulse">broken_image</span>
              <h2 className="text-3xl font-black font-display text-white mb-2 tracking-tighter">GAME OVER</h2>
              <p className="text-slate-400 mb-8">目標未達成... まだ諦めない？</p>

              <div className="flex flex-col gap-3">
                <button onClick={handleContinue} className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-red-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span className="material-icons-round">smart_display</span>
                  動画を見てコンティニュー
                </button>
                <button onClick={handleGiveUp} className="bg-slate-800 text-slate-400 py-4 rounded-xl font-bold active:scale-95 hover:bg-slate-700 transition-colors">
                  諦める
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default App;
