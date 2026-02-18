import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Star as StarIcon,
} from "lucide-react";
import ShopScreen from "./ShopScreen";

// --- Constants (RPG) ---
const ALL_TOKEN_BASES = [
  // --- Skills: Conversion ---
  { id: "fired", name: "焔の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "wood", to: "fire" }, price: 2, desc: "木を火に変換。消費E:{cost}" },
  { id: "waterd", name: "氷の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "water" }, price: 2, desc: "火を水に変換。消費E:{cost}" },
  { id: "woodd", name: "嵐の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "water", to: "wood" }, price: 2, desc: "水を木に変換。消費E:{cost}" },
  { id: "lightd", name: "雷の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "dark", to: "light" }, price: 2, desc: "闇を光に変換。消費E:{cost}" },
  { id: "darkd", name: "影の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "light", to: "dark" }, price: 2, desc: "光を闇に変換。消費E:{cost}" },
  { id: "heartd", name: "癒の変換", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "fire", to: "heart" }, price: 2, desc: "火を回復に変換。消費E:{cost}" },
  { id: "conv_h_f", name: "癒しの劫火", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "fire" }, price: 2, desc: "回復を火に変換。消費E:{cost}" },
  { id: "conv_h_w", name: "癒しの奔流", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "water" }, price: 2, desc: "回復を水に変換。消費E:{cost}" },
  { id: "conv_h_g", name: "癒しの深緑", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "wood" }, price: 2, desc: "回復を木に変換。消費E:{cost}" },
  { id: "conv_h_l", name: "癒しの聖光", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "light" }, price: 2, desc: "回復を光に変換。消費E:{cost}" },
  { id: "conv_h_d", name: "癒しの呪法", type: "skill", cost: 2, costLevels: true, action: "convert", params: { from: "heart", to: "dark" }, price: 2, desc: "回復を闇に変換。消費E:{cost}" },

  // --- Skills: Board Change (3-Color) ---
  { id: "board_tri1", name: "三色の真理・紅蓮", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "wood"] }, price: 3, desc: "盤面を火/水/木に変更。消費E:{cost}" },
  { id: "board_tri2", name: "三色の真理・天地", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "dark", "heart"] }, price: 3, desc: "盤面を光/闇/回復に変更。消費E:{cost}" },
  { id: "board_tri3", name: "三色の真理・黄昏", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "water", "dark"] }, price: 3, desc: "盤面を火/水/闇に変更。消費E:{cost}" },
  { id: "board_tri4", name: "三色の真理・神緑", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "wood", "heart"] }, price: 3, desc: "盤面を光/木/回復に変更。消費E:{cost}" },
  { id: "board_tri5", name: "三色の真理・炎光", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "light", "dark"] }, price: 3, desc: "盤面を火/光/闇に変更。消費E:{cost}" },
  { id: "board_tri6", name: "三色の真理・水光", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "light", "dark"] }, price: 3, desc: "盤面を水/光/闇に変更。消費E:{cost}" },
  { id: "board_tri7", name: "三色の真理・木光", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light", "dark"] }, price: 3, desc: "盤面を木/光/闇に変更。消費E:{cost}" },
  { id: "board_tri8", name: "三色の真理・炎木", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "wood", "light"] }, price: 3, desc: "盤面を火/木/光に変更。消費E:{cost}" },
  { id: "board_tri9", name: "三色の真理・炎闇", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "wood", "dark"] }, price: 3, desc: "盤面を火/木/闇に変更。消費E:{cost}" },
  { id: "board_tri10", name: "三色の真理・水木", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "wood", "light"] }, price: 3, desc: "盤面を水/木/光に変更。消費E:{cost}" },

  // --- Skills: Board Change (2-Color) ---
  { id: "board_bi1", name: "双龍の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "water"] }, price: 4, desc: "盤面を火/水の2色に変更。消費E:{cost}" },
  { id: "board_bi2", name: "明暗の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "dark"] }, price: 4, desc: "盤面を光/闇の2色に変更。消費E:{cost}" },
  { id: "board_bi3", name: "風癒の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "heart"] }, price: 4, desc: "盤面を木/回復の2色に変更。消費E:{cost}" },
  { id: "board_bi4", name: "炎光の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "light"] }, price: 4, desc: "盤面を火/光の2色に変更。消費E:{cost}" },
  { id: "board_bi5", name: "炎闇の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "dark"] }, price: 4, desc: "盤面を火/闇の2色に変更。消費E:{cost}" },
  { id: "board_bi6", name: "水光の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "light"] }, price: 4, desc: "盤面を水/光の2色に変更。消費E:{cost}" },
  { id: "board_bi7", name: "水闇の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "dark"] }, price: 4, desc: "盤面を水/闇の2色に変更。消費E:{cost}" },
  { id: "board_bi8", name: "木光の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "light"] }, price: 4, desc: "盤面を木/光の2色に変更。消費E:{cost}" },
  { id: "board_bi9", name: "木闇の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["wood", "dark"] }, price: 4, desc: "盤面を木/闇の2色に変更。消費E:{cost}" },
  // --- Skills: Board Change (2-Color Expansion) ---
  { id: "board_bi_fh", name: "紅蓮の至宝", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "heart"] }, price: 4, desc: "盤面を火/回復の2色に変更。消費E:{cost}" },
  { id: "board_bi_wh", name: "蒼海の至宝", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "heart"] }, price: 4, desc: "盤面を水/回復の2色に変更。消費E:{cost}" },
  { id: "board_bi_lh", name: "極光の至宝", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["light", "heart"] }, price: 4, desc: "盤面を光/回復の2色に変更。消費E:{cost}" },
  { id: "board_bi_dh", name: "奈落の至宝", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["dark", "heart"] }, price: 4, desc: "盤面を闇/回復の2色に変更。消費E:{cost}" },
  { id: "board_bi_fg", name: "業火の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["fire", "wood"] }, price: 4, desc: "盤面を火/木の2色に変更。消費E:{cost}" },
  { id: "board_bi_wg", name: "樹氷の陣", type: "skill", cost: 5, costLevels: true, action: "board_change", params: { colors: ["water", "wood"] }, price: 4, desc: "盤面を水/木の2色に変更。消費E:{cost}" },

  // --- Skills: Board Change (1-Color) ---
  { id: "board_mono1", name: "真・紅蓮の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["fire"] }, price: 6, desc: "盤面すべてを火に変更。消費E:{cost}" },
  { id: "board_mono2", name: "真・閃光の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["light"] }, price: 6, desc: "盤面すべてを光に変更。消費E:{cost}" },
  { id: "board_mono3", name: "真・蒼海の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["water"] }, price: 6, desc: "盤面すべてを水に変更。消費E:{cost}" },
  { id: "board_mono4", name: "真・深翠の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["wood"] }, price: 6, desc: "盤面すべてを木に変更。消費E:{cost}" },
  { id: "board_mono5", name: "真・常闇の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["dark"] }, price: 6, desc: "盤面すべてを闇に変更。消費E:{cost}" },
  { id: "board_mono6", name: "真・生命の極致", type: "skill", cost: 6, costLevels: true, action: "board_change", params: { colors: ["heart"] }, price: 6, desc: "盤面すべてを回復に変更。消費E:{cost}" },

  // --- Skills: Random Generation ---
  { id: "gen_rand_fire", name: "火の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "fire", count: 5 }, price: 2, desc: "火ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_water", name: "水の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "water", count: 5 }, price: 2, desc: "水ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_wood", name: "森の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "wood", count: 5 }, price: 2, desc: "木ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_light", name: "光の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "light", count: 5 }, price: 2, desc: "光ドロップをランダムに5個生成。消費E:{cost}" },
  { id: "gen_rand_dark", name: "闇の創造", type: "skill", cost: 2, costLevels: true, action: "spawn_random", params: { color: "dark", count: 5 }, price: 2, desc: "闇ドロップをランダムに5個生成。消費E:{cost}" },

  // --- Skills: Fixed Distribution ---
  { id: "board_bal_5", name: "五行の理", type: "skill", cost: 5, costLevels: true, action: "board_balance", price: 5, desc: "全ドロップを5属性各6個に変化させる。消費E:{cost}" },

  // --- Skills: Skyfall Manipulation ---
  { id: "sky_f1", name: "紅蓮の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire"], weight: 5, duration: 3 }, price: 3, desc: "3手番、火がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_w1", name: "蒼海の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water"], weight: 5, duration: 3 }, price: 3, desc: "3手番、水がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_g1", name: "深翠の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood"], weight: 5, duration: 3 }, price: 3, desc: "3手番、木がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_l1", name: "閃光の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light"], weight: 5, duration: 3 }, price: 3, desc: "3手番、光がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_d1", name: "常闇の目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["dark"], weight: 5, duration: 3 }, price: 3, desc: "3手番、闇がかなり落ちやすくなる。消費E:{cost}" },
  { id: "sky_h1", name: "癒しの目覚め", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["heart"], weight: 5, duration: 3 }, price: 3, desc: "3手番、回復がかなり落ちやすくなる。消費E:{cost}" },

  { id: "sky_w2", name: "双流の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "wood"], weight: 3, duration: 2 }, price: 3, desc: "2手番、水と木が落ちやすくなる。消費E:{cost}" },
  { id: "sky_fl_2", name: "炎光の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "light"], weight: 3, duration: 2 }, price: 3, desc: "2手番、火と光が落ちやすくなる。消費E:{cost}" },
  { id: "sky_fd_2", name: "炎闇の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["fire", "dark"], weight: 3, duration: 2 }, price: 3, desc: "2手番、火と闇が落ちやすくなる。消費E:{cost}" },
  { id: "sky_wd_2", name: "水闇の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["water", "dark"], weight: 3, duration: 2 }, price: 3, desc: "2手番、水と闇が落ちやすくなる。消費E:{cost}" },
  { id: "sky_gl_2", name: "木光の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["wood", "light"], weight: 3, duration: 2 }, price: 3, desc: "2手番、木と光が落ちやすくなる。消費E:{cost}" },
  { id: "sky_ld_2", name: "明暗の波紋", type: "skill", cost: 3, costLevels: true, action: "skyfall", params: { colors: ["light", "dark"], weight: 3, duration: 2 }, price: 3, desc: "2手番、光と闇が落ちやすくなる。消費E:{cost}" },

  { id: "sky_limit", name: "三色の結界", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["fire", "water", "wood"], duration: 3 }, price: 4, desc: "3手番、火/水/木しか落ちてこなくなる。消費E:{cost}" },
  { id: "sky_limit_ldh", name: "三界の結界", type: "skill", cost: 4, costLevels: true, action: "skyfall_limit", params: { colors: ["light", "dark", "heart"], duration: 3 }, price: 4, desc: "3手番、光/闇/回復しか落ちてこなくなる。消費E:{cost}" },

  // --- Skills: Multi-Conversion ---
  { id: "conv_m1", name: "大地の恵み", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water"], to: "wood" }, price: 3, desc: "火と水を木に変換。消費E:{cost}" },
  { id: "conv_m2", name: "福音の祈り", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "heart" }, price: 3, desc: "光と闇を回復に変換。消費E:{cost}" },
  { id: "conv_m3", name: "冥風の烈火", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "dark"], to: "fire" }, price: 3, desc: "水と闇を火に変換。消費E:{cost}" },
  { id: "conv_m4", name: "天啓の閃光", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "heart"], to: "light" }, price: 3, desc: "木と回復を光に変換。消費E:{cost}" },
  { id: "conv_m5", name: "三原色の福音", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water", "wood"], to: "heart" }, price: 4, desc: "火/水/木を回復に変換。消費E:{cost}" },
  { id: "conv_m6", name: "三原色の業火", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "wood", "heart"], to: "fire" }, price: 4, desc: "水/木/回復を火に変換。消費E:{cost}" },
  { id: "conv_m7", name: "三原色の奔流", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "wood", "heart"], to: "water" }, price: 4, desc: "火/木/回復を水に変換。消費E:{cost}" },
  { id: "conv_m8", name: "三原色の深緑", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water", "heart"], to: "wood" }, price: 4, desc: "火/水/回復を木に変換。消費E:{cost}" },
  { id: "conv_m9", name: "三原色の閃光", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water", "dark"], to: "light" }, price: 4, desc: "火/水/闇を光に変換。消費E:{cost}" },
  { id: "conv_m10", name: "三原色の常闇", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "water", "light"], to: "dark" }, price: 4, desc: "火/水/光を闇に変換。消費E:{cost}" },
  // --- Skills: Multi-Conversion (Expansion) ---
  { id: "conv_m_fire1", name: "薪の焚き付け", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "heart"], to: "fire" }, price: 3, desc: "木と回復を火に変換。消費E:{cost}" },
  { id: "conv_m_fire2", name: "混沌の浄化・炎", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "fire" }, price: 3, desc: "光と闇を火に変換。消費E:{cost}" },
  { id: "conv_m_water1", name: "鎮火の雨", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "heart"], to: "water" }, price: 3, desc: "火と回復を水に変換。消費E:{cost}" },
  { id: "conv_m_water2", name: "混沌の浄化・水", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "water" }, price: 3, desc: "光と闇を水に変換。消費E:{cost}" },
  { id: "conv_m_wood1", name: "恵みの雨", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "wood" }, price: 3, desc: "水と回復を木に変換。消費E:{cost}" },
  { id: "conv_m_wood2", name: "混沌の浄化・木", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["light", "dark"], to: "wood" }, price: 3, desc: "光と闇を木に変換。消費E:{cost}" },
  { id: "conv_m_light1", name: "浄化の炎", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "dark"], to: "light" }, price: 3, desc: "火と闇を光に変換。消費E:{cost}" },
  { id: "conv_m_light2", name: "聖なる泉", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["water", "heart"], to: "light" }, price: 3, desc: "水と回復を光に変換。消費E:{cost}" },
  { id: "conv_m_dark1", name: "蝕む影", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["fire", "light"], to: "dark" }, price: 3, desc: "火と光を闇に変換。消費E:{cost}" },
  { id: "conv_m_dark2", name: "腐敗の森", type: "skill", cost: 4, costLevels: true, action: "convert_multi", params: { types: ["wood", "heart"], to: "dark" }, price: 3, desc: "木と回復を闇に変換。消費E:{cost}" },

  // --- Skills: Row Fix ---
  { id: "row_f", name: "烈火の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "fire" }, price: 3, desc: "上段をすべて火に。消費E:{cost}" },
  { id: "row_w", name: "清流の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "water" }, price: 3, desc: "上段をすべて水に。消費E:{cost}" },
  { id: "row_g", name: "深翠の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "wood" }, price: 3, desc: "上段をすべて木に。消費E:{cost}" },
  { id: "row_l", name: "閃光の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "light" }, price: 3, desc: "上段をすべて光に。消費E:{cost}" },
  { id: "row_d", name: "常闇の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "dark" }, price: 3, desc: "上段をすべて闇に。消費E:{cost}" },
  { id: "row_h", name: "生命の横一文字", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: 0, type: "heart" }, price: 3, desc: "上段をすべて回復に。消費E:{cost}" },
  { id: "row_b_f", name: "烈火の底陣", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: -1, type: "fire" }, price: 3, desc: "下段をすべて火に。消費E:{cost}" },
  { id: "row_c_h", name: "生命の帯", type: "skill", cost: 4, costLevels: true, action: "row_fix", params: { row: "center", type: "heart" }, price: 3, desc: "中央行をすべて回復に。消費E:{cost}" },

  // --- Skills: Col Fix ---
  { id: "col_l_l", name: "閃光の縦一閃", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: 0, type: "light" }, price: 3, desc: "左端列をすべて光に。消費E:{cost}" },
  { id: "col_r_d", name: "常闇の縦一閃", type: "skill", cost: 4, costLevels: true, action: "col_fix", params: { col: -1, type: "dark" }, price: 3, desc: "右端列をすべて闇に。消費E:{cost}" },


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
    id: "dual_match",
    name: "双連の極意",
    type: "passive",
    effect: "min_match",
    values: [0.5, 0.8, 1.0],
    price: 10,
    desc: "2つ以上でドロップが消える。コンボ倍率x[0.5/0.8/1.0]。",
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

  // --- Skills: Enhance Color ---
  { id: "enh_f", name: "星の導き・火", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["fire"] }, price: 4, desc: "盤面の火を全て強化。消費E:{cost}" },
  { id: "enh_w", name: "星の導き・水", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["water"] }, price: 4, desc: "盤面の水を全て強化。消費E:{cost}" },
  { id: "enh_g", name: "星の導き・木", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["wood"] }, price: 4, desc: "盤面の木を全て強化。消費E:{cost}" },
  { id: "enh_l", name: "星の導き・光", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["light"] }, price: 4, desc: "盤面の光を全て強化。消費E:{cost}" },
  { id: "enh_d", name: "星の導き・闇", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["dark"] }, price: 4, desc: "盤面の闇を全て強化。消費E:{cost}" },
  { id: "enh_h", name: "星の導き・回復", type: "skill", cost: 4, costLevels: true, action: "enhance_color", params: { colors: ["heart"] }, price: 4, desc: "盤面の回復を全て強化。消費E:{cost}" },
  { id: "enh_fw", name: "星の導き・火水", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "water"] }, price: 5, desc: "盤面の火/水を全て強化。消費E:{cost}" },
  { id: "enh_fg", name: "星の導き・火木", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "wood"] }, price: 5, desc: "盤面の火/木を全て強化。消費E:{cost}" },
  { id: "enh_fl", name: "星の導き・火光", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "light"] }, price: 5, desc: "盤面の火/光を全て強化。消費E:{cost}" },
  { id: "enh_fd", name: "星の導き・火闇", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "dark"] }, price: 5, desc: "盤面の火/闇を全て強化。消費E:{cost}" },
  { id: "enh_wg", name: "星の導き・水木", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "wood"] }, price: 5, desc: "盤面の水/木を全て強化。消費E:{cost}" },
  { id: "enh_wl", name: "星の導き・水光", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "light"] }, price: 5, desc: "盤面の水/光を全て強化。消費E:{cost}" },
  { id: "enh_wd", name: "星の導き・水闇", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "dark"] }, price: 5, desc: "盤面の水/闇を全て強化。消費E:{cost}" },
  { id: "enh_gl", name: "星の導き・木光", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "light"] }, price: 5, desc: "盤面の木/光を全て強化。消費E:{cost}" },
  { id: "enh_gd", name: "星の導き・木闇", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "dark"] }, price: 5, desc: "盤面の木/闇を全て強化。消費E:{cost}" },
  { id: "enh_ld", name: "星の導き・光闇", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["light", "dark"] }, price: 5, desc: "盤面の光/闇を全て強化。消費E:{cost}" },
  { id: "enh_fh", name: "星の導き・火癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["fire", "heart"] }, price: 5, desc: "盤面の火/回復を全て強化。消費E:{cost}" },
  { id: "enh_wh", name: "星の導き・水癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["water", "heart"] }, price: 5, desc: "盤面の水/回復を全て強化。消費E:{cost}" },
  { id: "enh_gh", name: "星の導き・木癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["wood", "heart"] }, price: 5, desc: "盤面の木/回復を全て強化。消費E:{cost}" },
  { id: "enh_lh", name: "星の導き・光癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["light", "heart"] }, price: 5, desc: "盤面の光/回復を全て強化。消費E:{cost}" },
  { id: "enh_dh", name: "星の導き・闇癒", type: "skill", cost: 5, costLevels: true, action: "enhance_color", params: { colors: ["dark", "heart"] }, price: 5, desc: "盤面の闇/回復を全て強化。消費E:{cost}" },

  // --- Skills: Special ---
  { id: "chrono", name: "クロノス・ストップ", type: "skill", cost: 6, costLevels: true, action: "chronos_stop", params: { duration: 10000 }, price: 7, desc: "10秒間、自由に操作可能になる。消費E:{cost}" },

  // --- Passive: Enhanced Drop ---
  {
    id: "mana_crystal", name: "マナの結晶化", type: "passive", effect: "enhance_chance",
    values: [0.05, 0.1, 0.2], price: 4,
    desc: "落下ドロップの[5/10/20]%が強化ドロップになる。",
  },
  {
    id: "enhance_amp", name: "強化増幅", type: "passive", effect: "enhanced_orb_bonus",
    values: [1, 2, 3], price: 5,
    desc: "強化1個あたりのコンボ加算を+[1/2/3]する。",
  },
  {
    id: "over_link", name: "過剰結合", type: "passive", effect: "enhanced_link_multiplier",
    params: { count: 5 }, values: [1.5, 2, 3], price: 6,
    desc: "強化5個以上を消したら倍率x[1.5/2/3]。",
  },

  // --- Passive: High Risk / High Return ---
  {
    id: "desperate_stance", name: "背水の陣", type: "passive", effect: "desperate_stance",
    values: [3, 4, 5], price: 8,
    desc: "操作時間が常に4秒固定。最終コンボ倍率x[3/4/5]倍。",
  },
  {
    id: "greed_power", name: "金満の暴力", type: "passive", effect: "greed_power",
    values: [10, 7, 5], price: 7,
    desc: "★[10/7/5]個につきコンボ倍率+1加算。",
  },
  {
    id: "picky_eater", name: "偏食家", type: "passive", effect: "picky_eater",
    params: { excludeColors: ["heart", "light", "dark"] },
    values: [-2, -1, 0], price: 6,
    desc: "回復/光/闇が出現しなくなる。手番[−2/−1/±0]。",
  },
  {
    id: "cursed_power", name: "呪われた力", type: "passive", effect: "cursed_power",
    values: [10, 15, 20], price: 7,
    desc: "常にコンボ+[10/15/20]。操作時間−2秒。",
  },
  {
    id: "critical_passive",
    name: "会心の一撃",
    type: "passive",
    effect: "critical_strike",
    values: [10, 20, 30],
    price: 7,
    desc: "20%の確率で、最終コンボ倍率が[10/20/30]倍になる。",
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
  // --- Enhanced Drop Enchantments ---
  { id: "enh_drop_fire", name: "火の強化落下", effect: "enhance_chance_color", params: { color: "fire" }, value: 0.1, price: 5, desc: "火ドロップが10%強化で落下。" },
  { id: "enh_drop_water", name: "水の強化落下", effect: "enhance_chance_color", params: { color: "water" }, value: 0.1, price: 5, desc: "水ドロップが10%強化で落下。" },
  { id: "enh_drop_wood", name: "木の強化落下", effect: "enhance_chance_color", params: { color: "wood" }, value: 0.1, price: 5, desc: "木ドロップが10%強化で落下。" },
  { id: "enh_drop_light", name: "光の強化落下", effect: "enhance_chance_color", params: { color: "light" }, value: 0.1, price: 5, desc: "光ドロップが10%強化で落下。" },
  { id: "enh_drop_dark", name: "闇の強化落下", effect: "enhance_chance_color", params: { color: "dark" }, value: 0.1, price: 5, desc: "闇ドロップが10%強化で落下。" },
  { id: "enh_drop_heart", name: "回復の強化落下", effect: "enhance_chance_color", params: { color: "heart" }, value: 0.1, price: 5, desc: "回復ドロップが10%強化で落下。" },
  // --- Skyfall Boost (Probability Up) ---
  { id: "sf_up_fire", name: "火の呼び声", effect: "skyfall_boost", params: { color: "fire" }, price: 6, desc: "火ドロップが少し落ちやすくなる。" },
  { id: "sf_up_water", name: "水の呼び声", effect: "skyfall_boost", params: { color: "water" }, price: 6, desc: "水ドロップが少し落ちやすくなる。" },
  { id: "sf_up_wood", name: "森の呼び声", effect: "skyfall_boost", params: { color: "wood" }, price: 6, desc: "木ドロップが少し落ちやすくなる。" },
  { id: "sf_up_light", name: "光の呼び声", effect: "skyfall_boost", params: { color: "light" }, price: 6, desc: "光ドロップが少し落ちやすくなる。" },
  { id: "sf_up_dark", name: "闇の呼び声", effect: "skyfall_boost", params: { color: "dark" }, price: 6, desc: "闇ドロップが少し落ちやすくなる。" },
  { id: "sf_up_heart", name: "癒しの呼び声", effect: "skyfall_boost", params: { color: "heart" }, price: 6, desc: "回復ドロップが少し落ちやすくなる。" },
  // --- Skyfall Nerf (Probability Down) ---
  { id: "sf_down_fire", name: "火の静寂", effect: "skyfall_nerf", params: { color: "fire" }, price: 6, desc: "火ドロップが少し落ちにくくなる。" },
  { id: "sf_down_water", name: "水の静寂", effect: "skyfall_nerf", params: { color: "water" }, price: 6, desc: "水ドロップが少し落ちにくくなる。" },
  { id: "sf_down_wood", name: "森の静寂", effect: "skyfall_nerf", params: { color: "wood" }, price: 6, desc: "木ドロップが少し落ちにくくなる。" },
  { id: "sf_down_light", name: "光の静寂", effect: "skyfall_nerf", params: { color: "light" }, price: 6, desc: "光ドロップが少し落ちにくくなる。" },
  { id: "sf_down_dark", name: "闇の静寂", effect: "skyfall_nerf", params: { color: "dark" }, price: 6, desc: "闇ドロップが少し落ちにくくなる。" },
  { id: "sf_down_heart", name: "癒しの静寂", effect: "skyfall_nerf", params: { color: "heart" }, price: 6, desc: "回復ドロップが少し落ちにくくなる。" },
  { id: "opener", name: "先制の心得", effect: "turn_1_bonus", value: 10, price: 6, desc: "サイクルの1ターン目のみ、コンボ+10。" },
  { id: "clutch", name: "土壇場の底力", effect: "last_turn_mult", value: 1.5, price: 7, desc: "サイクルの最終ターンのみ、コンボ倍率x1.5。" },
  { id: "rainbow", name: "虹色の加護", effect: "multi_color", value: 3, price: 8, desc: "4色以上同時消しで、コンボ+3。" },
  { id: "sniper", name: "一点突破", effect: "single_color", value: 1.3, price: 6, desc: "消した色が2色以下の場合、コンボ倍率x1.3。" },
  { id: "haste", name: "疾風の刻印", effect: "time_ext_enc", value: 1, price: 7, desc: "操作時間を+1秒延長する。" },
  { id: "quick_charge", name: "急速チャージ", effect: "charge_boost_passive", price: 8, desc: "スキルのチャージ速度が2倍になる。" },
  { id: "critical", name: "会心の一撃", effect: "critical_strike", value: 10, price: 7, desc: "20%の確率で、この補正倍率が10倍になる。" },
  { id: "gamble", name: "運命の悪戯", effect: "random_bonus", price: 5, desc: "ターンごとに -5〜+15 のランダムなコンボ加算。" },

  // --- 形状別極意エンチャント (Geometry Split) ---
  { id: "shape_match4", name: "四連の極意", effect: "shape_match4", value: 1.2, price: 6, desc: "4つ消し1つにつき、コンボ倍率x1.2。" },
  { id: "shape_cross", name: "十字の極意", effect: "shape_cross", value: 1.3, price: 6, desc: "十字消し1つにつき、コンボ倍率x1.3。" },
  { id: "shape_row", name: "一列の極意", effect: "shape_row", value: 1.4, price: 6, desc: "横一列消し1つにつき、コンボ倍率x1.4。" },
  { id: "shape_l", name: "L字の極意", effect: "shape_l", value: 1.3, price: 6, desc: "L字消し1つにつき、コンボ倍率x1.3。" },
  { id: "shape_square", name: "正方形の極意", effect: "shape_square", value: 1.5, price: 6, desc: "正方形消し1つにつき、コンボ倍率x1.5。" },

  { id: "efficiency", name: "魔力節約", effect: "cost_down", price: 8, desc: "このスキルの消費エネルギーを-1する(最小1)。" },
  { id: "berserk", name: "狂戦士の刻印", effect: "berserk_mode", value: 1.5, price: 7, desc: "操作時間-1秒、コンボ倍率x1.5。" },
  { id: "aftershock", name: "追撃の心得", effect: "skyfall_mult", value: 1.4, price: 6, desc: "落ちコン発生時、最終コンボ倍率x1.4。" },
  { id: "investment", name: "資産価値", effect: "high_sell", price: 4, desc: "このトークンの売却価格が購入価格の300%になる。" },
  // --- 色別連舞エンチャント (1.2倍) ---
  { id: "enc_bonus_fire", name: "炎の連舞", effect: "color_multiplier_enc", params: { color: "fire" }, value: 1.2, price: 5, desc: "火を消しているとコンボ倍率x1.2。" },
  { id: "enc_bonus_water", name: "水の連舞", effect: "color_multiplier_enc", params: { color: "water" }, value: 1.2, price: 5, desc: "水を消しているとコンボ倍率x1.2。" },
  { id: "enc_bonus_wood", name: "木の連舞", effect: "color_multiplier_enc", params: { color: "wood" }, value: 1.2, price: 5, desc: "木を消しているとコンボ倍率x1.2。" },
  { id: "enc_bonus_light", name: "光の連舞", effect: "color_multiplier_enc", params: { color: "light" }, value: 1.2, price: 5, desc: "光を消しているとコンボ倍率x1.2。" },
  { id: "enc_bonus_dark", name: "闇の連舞", effect: "color_multiplier_enc", params: { color: "dark" }, value: 1.2, price: 5, desc: "闇を消しているとコンボ倍率x1.2。" },
  { id: "enc_bonus_heart", name: "癒しの連舞", effect: "color_multiplier_enc", params: { color: "heart" }, value: 1.2, price: 5, desc: "回復を消しているとコンボ倍率x1.2。" },
];

const getEffectiveCost = (token) => {
  if (!token || token.type !== 'skill') return token?.cost || 0;
  const baseCost = token.cost || 0;
  if (baseCost === 0) return 0;
  const level = token.level || 1;
  const reduction = Math.max(0, level - 1);

  // --- 追加: 魔力節約 (efficiency) ---
  const enchantReduction = token.enchantments?.filter(e => e.effect === "cost_down").length || 0;

  // const minCost = Math.max(1, Math.floor(baseCost / 2)); // 旧ロジック: 半分まで
  const minCost = 1; // 変更: 最小値1まで下がることを許容

  // 最後に enchantReduction を引く (最小値1は維持)
  return Math.max(minCost, baseCost - reduction - enchantReduction);
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
    this.minMatchLength = options.minMatchLength || 3;
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

  setRealtimeBonuses(bonuses) {
    this.realtimeBonuses = { len4: 0, row: 0, l_shape: 0, ...bonuses };
  }

  setEnhanceRates(rates) {
    this.enhanceRates = rates;
  }

  addPlusMark(el) {
    if (el.querySelector('.enhanced-mark')) return;
    const enhancedMark = document.createElement('div');
    enhancedMark.className = "enhanced-mark absolute top-0 right-0 w-4 h-4 bg-yellow-400 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white";
    enhancedMark.innerText = '+';
    el.appendChild(enhancedMark);
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

    const iconSpan = document.createElement("span");
    iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
    iconSpan.innerText = this.icons[type];

    inner.appendChild(iconSpan);
    el.appendChild(inner);

    // handler definition moved below orb creation
    /*
    const handler = (e) => {
      if (e.type === "touchstart") e.preventDefault();
      this.onStart(e.type === "touchstart" ? e.touches[0] : e, r, c);
    };
    el.onmousedown = handler;
    el.ontouchstart = handler;
    */

    // 基準位置を設定（top/leftは一度だけ設定し、以降transformで移動）
    const baseTop = (r * (this.orbSize + this.gap)) + (this.gap / 2);
    const baseLeft = (c * (this.orbSize + this.gap)) + (this.gap / 2);
    el.style.width = `${this.orbSize}px`;
    el.style.height = `${this.orbSize}px`;
    el.style.top = `${baseTop}px`;
    el.style.left = `${baseLeft}px`;

    const orb = { type, el, r, c, isSkyfall: isNew, baseTop, baseLeft, isEnhanced: false };

    const handler = (e) => {
      if (e.type === "touchstart") e.preventDefault();
      // 修正: クロージャの r, c ではなく、orb オブジェクトを直接渡す
      this.onStart(e.type === "touchstart" ? e.touches[0] : e, orb);
    };
    el.onmousedown = handler;
    el.ontouchstart = handler;

    // 強化ドロップ判定（新規生成時のみ）
    if (isNew && this.enhanceRates) {
      const globalRate = this.enhanceRates.global || 0;
      const colorRate = this.enhanceRates.colors?.[type] || 0;
      const totalRate = globalRate + colorRate;
      if (totalRate > 0 && Math.random() < totalRate) {
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
    let overLinkMultiplier = 1; // 過剰結合倍率

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

        // 強化ドロップボーナス
        const enhancedCount = group.filter(o => o.isEnhanced).length;
        const enhancedBonusPerOrb = 1 + (this.realtimeBonuses?.enhancedOrbBonus || 0);
        addition += enhancedCount * enhancedBonusPerOrb;

        // 過剰結合チェック
        if (enhancedCount >= (this.realtimeBonuses?.overLink?.count || 999)) {
          if (!overLinkMultiplier || overLinkMultiplier < (this.realtimeBonuses?.overLink?.value || 1)) {
            overLinkMultiplier = this.realtimeBonuses?.overLink?.value || 1;
          }
        }

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

        // Start combo animation in parallel with orb disappearance
        // ドロップ消失アニメーション(300ms)と並行してコンボ加算を開始
        const comboPromise = (group.length === this.rows * this.cols)
          ? this.animateComboAdd(10)
          : this.animateComboAdd(addition);

        await this.sleep(300);
        if (this._isDestroyed) return;
        group.forEach((o) => {
          o.el.remove();
          this.state[o.r][o.c] = null;
        });

        // Wait for combo animation to finish if it's still running
        await comboPromise;

        await this.sleep(50);
        if (this._isDestroyed) return;
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
    this.onTurnEnd(this.currentCombo, colorComboCounts, hasSkyfallCombo, shapes, overLinkMultiplier);
  }

  findCombos() {
    const matched = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false),
    );
    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= this.cols - this.minMatchLength; c++) {
        const t = this.state[r][c]?.type;
        if (!t) continue;
        let isMatch = true;
        for (let k = 1; k < this.minMatchLength; k++) {
          if (this.state[r][c + k]?.type !== t) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          for (let k = 0; k < this.minMatchLength; k++) matched[r][c + k] = true;
          let k = c + this.minMatchLength;
          while (k < this.cols && this.state[r][k]?.type === t)
            matched[r][k++] = true;
        }
      }
    }
    // Vertical
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r <= this.rows - this.minMatchLength; r++) {
        const t = this.state[r][c]?.type;
        if (!t) continue;
        let isMatch = true;
        for (let k = 1; k < this.minMatchLength; k++) {
          if (this.state[r + k][c]?.type !== t) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          for (let k = 0; k < this.minMatchLength; k++) matched[r + k][c] = true;
          let k = r + this.minMatchLength;
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
          inner.innerHTML = '';
          const iconSpan = document.createElement("span");
          iconSpan.className = "material-icons-round text-white text-3xl opacity-90 drop-shadow-md select-none";
          iconSpan.innerText = this.icons[type];
          inner.appendChild(iconSpan);
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

  const [isEndlessMode, setIsEndlessMode] = useState(false); // New: Endless Mode state
  const [starProgress, setStarProgress] = useState(0); // 累積スター進捗
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

  const maxTurns = Math.max(1, 3
    + tokens.reduce((acc, t) => acc + (t?.enchantments?.filter(e => e.effect === "add_turn").length || 0), 0)
    + tokens.reduce((acc, t) => {
      if (t?.effect === "picky_eater") return acc + (t.values[(t.level || 1) - 1] || 0);
      return acc;
    }, 0)
  );

  const minMatchLength = tokens.some(t => t?.effect === "min_match") ? 2 : 3;

  // --- Skyfall Weight Management ---
  useEffect(() => {
    if (!engineRef.current) return;
    const weights = {};
    const ALL_COLORS = ["fire", "water", "wood", "light", "dark", "heart"];
    ALL_COLORS.forEach((c) => (weights[c] = 1));

    // 偏食家: 指定色の出現率を0にする
    tokens.forEach((t) => {
      if (t?.effect === "picky_eater" && t.params?.excludeColors) {
        t.params.excludeColors.forEach((c) => { weights[c] = 0; });
      }

      // エンチャントによる出現率変動
      if (t?.enchantments) {
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
    // 背水の陣: 他の延長効果をすべて無視して4秒固定
    const hasDesperateStance = tokens.some(t => t?.effect === "desperate_stance");
    if (hasDesperateStance) {
      return 4000;
    }
    let base = 5000;
    tokens.forEach((t) => {
      if (t?.effect === "time") base += (t.values[(t.level || 1) - 1] * 1000);
      // 呪われた力: 操作時間-2秒
      if (t?.effect === "cursed_power") base -= 2000;

      // --- 追加: エンチャントによる時間変動 ---
      t?.enchantments?.forEach(enc => {
        if (enc.effect === "time_ext_enc") base += (enc.value || 1) * 1000;
        if (enc.effect === "berserk_mode") base -= 1000; // 狂戦士: -1秒
      });
    });
    // 特殊消しボーナスによる操作時間延長（五星の印・十字の祈り）
    base *= nextTurnTimeMultiplier;
    return Math.max(1000, base); // 最低1秒
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
        minMatchLength,
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
      engineRef.current.minMatchLength = minMatchLength;

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

      // 強化ドロップ確率の計算
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
  }, [tokens, getTimeLimit, minMatchLength]);

  // --- Init Shop on Start ---
  useEffect(() => {
    generateShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Game Logic ---
  // Debug State
  // const [debugLog, setDebugLog] = useState(null);

  const handleTurnEnd = async (turnCombo, colorComboCounts, hasSkyfallCombo, shapes = [], overLinkMultiplier = 1) => {
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
      const enchList = t.enchantments || [];

      // --- 共通処理関数 (トークン効果とエンチャント効果の両方をチェック) ---
      const checkEffect = (effect, params, val) => {
        // 1. 先制の心得 (Opener)
        if (effect === "turn_1_bonus" && turn === 1) {
          bonus += val || 10;
          logData.bonuses.push(`opener:+${val || 10}`);
        }
        // 2. 土壇場の底力 (Clutch)
        if (effect === "last_turn_mult" && turn === maxTurns) {
          multiplier *= val || 1.5;
          logData.multipliers.push(`clutch:x${val || 1.5}`);
        }
        // 3. 虹色の加護 (Rainbow)
        if (effect === "multi_color" && matchedColorSet.size >= 4) {
          bonus += val || 3;
          logData.bonuses.push(`rainbow:+${val || 3}`);
        }
        // 4. 一点突破 (Sniper)
        if (effect === "single_color" && matchedColorSet.size > 0 && matchedColorSet.size <= 2) {
          multiplier *= val || 1.3;
          logData.multipliers.push(`sniper:x${val || 1.3}`);
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
          }
        }
        // 6. 運命の悪戯 (Gamble)
        if (effect === "random_bonus") {
          const rand = Math.floor(Math.random() * 21) - 5; // -5 to +15
          bonus += rand;
          logData.bonuses.push(`gamble:${rand > 0 ? '+' : ''}${rand}`);
        }
        // 7. 狂戦士 (Berserk)
        if (effect === "berserk_mode") {
          multiplier *= val || 1.5;
          logData.multipliers.push(`berserk:x${val || 1.5}`);
        }
        // 8. 追撃 (Aftershock)
        if (effect === "skyfall_mult" && hasSkyfallCombo) {
          multiplier *= val || 1.4;
          logData.multipliers.push(`aftershock:x${val || 1.4}`);
        }
        // 9. 会心の一撃 (Critical) - トークン/エンチャント共通
        if (effect === "critical_strike") {
          if (Math.random() < 0.2) { // 20%
            multiplier *= val;
            logData.multipliers.push(`CRITICAL!:x${val}`);
            notify("会心の一撃！"); // 演出
          }
        }
        // 10. 色別連舞 (Color Multiplier Enchantment)
        if (effect === "color_multiplier_enc") {
          const color = params?.color;
          if (color && matchedColorSet.has(color)) {
            multiplier *= val || 1.2;
            logData.multipliers.push(`color_enc_${color}:x${val || 1.2}`);
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
            // 個数分だけ倍率を乗算 (例: 1.2の2乗)
            const totalMult = Math.pow(val || 1.0, count);
            multiplier *= totalMult;
            logData.multipliers.push(`${effect}:${val}^${count}=x${totalMult.toFixed(2)}`);
          }
        }
      };

      // トークン自体の効果をチェック
      if (t.type === 'passive') {
        // valuesから現在レベルの値を取得
        const val = t.values ? t.values[lv - 1] : t.value;
        checkEffect(t.effect, t.params, val);
      }

      // エンチャントの効果をチェック
      enchList.forEach(enc => {
        checkEffect(enc.effect, enc.params, enc.value);
      });

      // Base bonuses
      // エンチャント効果（複数対応）
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

      // --- 追加: Skill Combo Bonus (Active Skill Lv3 Effect) ---
      if (t.action === "skill_combo_bonus") {
        const val = t.params?.value || 0;
        bonus += val;
        logData.bonuses.push(`skill_lv3_bonus:+${val}`);
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

      // 背水の陣: 固定倍率
      if (t.effect === "desperate_stance") {
        const v = t.values?.[lv - 1] || 3;
        multiplier *= v;
        logData.multipliers.push(`desperate_stance:${v}`);
      }

      // 金満の暴力: スター数に依存した倍率加算
      if (t.effect === "greed_power") {
        const threshold = t.values?.[lv - 1] || 10;
        const greedBonus = Math.floor(stars / threshold);
        if (greedBonus > 0) {
          multiplier += greedBonus;
          logData.multipliers.push(`greed_power:+${greedBonus}(stars:${stars}/threshold:${threshold})`);
        }
      }

      // 呪われた力: 固定コンボ加算
      if (t.effect === "cursed_power") {
        const v = t.values?.[lv - 1] || 10;
        bonus += v;
        logData.bonuses.push(`cursed_power:${v}`);
      }
    });

    // 12. Min Match Multiplier (Dual Match)
    tokens.forEach((t) => {
      if (t?.effect === "min_match") {
        const lv = t.level || 1;
        const v = t.values?.[lv - 1] || 1;
        multiplier *= v;
        logData.multipliers.push(`min_match:${v}`);
      }
    });

    // 強化ドロップ overLink 倍率を適用
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

    await showComboBreakdown();

    let totalReduction = 0;
    tokens.forEach((t) => {
      if (t?.id === "collector") {
        const threshold = t.values?.[(t.level || 1) - 1] || 5;
        totalReduction += (5 - threshold);
      }
    });
    const starThreshold = Math.max(1, 5 - totalReduction);

    // 累積方式に変更
    const currentProgress = starProgress + effectiveCombo;
    const totalStarsEarned = starThreshold > 0 ? Math.floor(currentProgress / starThreshold) : 0;
    const nextProgress = starThreshold > 0 ? currentProgress % starThreshold : 0;

    setStarProgress(nextProgress);
    // console.log("[STAR DEBUG]", { turnCombo, bonus, multiplier, effectiveCombo, starThreshold, totalReduction, totalStarsEarned, nextProgress });

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
        // Increment charge by 1 per turn, up to max cost

        // --- 変更: 急速チャージ (Quick Charge) ---
        const chargeBoostCount = t.enchantments?.filter(e => e.effect === "charge_boost_passive").length || 0;
        const chargeAmount = 1 + chargeBoostCount;

        const nextCharge = Math.min(maxCharge, currentCharge + chargeAmount);
        return { ...t, charge: nextCharge };
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


  const startNextCycle = () => {
    setTurn(1);
    setCycleTotalCombo(0);
    setTarget((t) => Math.floor(t * 1.5) + 2);
    setGoalReached(false);
    setSkippedTurnsBonus(0);
    setStarProgress(0); // Reset progress if needed or keep it? Keeping it feels better but usually resets per cycle
    generateShop();
    setShowShop(false);
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

    const bonus = remainingTurns * bonusMultiplier;
    setStars((s) => s + bonus);
    notify(`SKIP BONUS: +${bonus} STARS!`);
    setSkippedTurnsBonus(prev => prev + remainingTurns);

    // Force turn to end state to trigger Clear Overlay
    setTurn(maxTurns + 1);
  };

  // Deprecated/Simplified: No longer takes params regarding turns, just opens shop if needed, but we do this in overlay now.
  const handleCycleClear = () => {
    // No-op or notification only, state is handled by startNextCycle
    notify("CYCLE CLEARED!");
  };

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const resetGame = () => {
    setStars(5);
    setTarget(8);
    setTurn(1);
    setCycleTotalCombo(0);
    setTokens([]);
    /* setEnergy(0); // REMOVED */
    setActiveBuffs([]);
    setSkippedTurnsBonus(0);
    setPendingShopItem(null);
    setGoalReached(false);
    setShowShop(false);
    setIsGameOver(false);
    setIsEndlessMode(false); // Reset endless mode
    setStarProgress(0); // Reset progress
    setTotalPurchases(0);
    setTotalStarsSpent(0);
    generateShop();
    if (engineRef.current) {
      engineRef.current.init();
    }
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
      // Filter only tokens that are not max level (Max Lv 3)
      const upgradeableTokens = tokens.filter(t => (t.level || 1) < 3);

      if (upgradeableTokens.length === 0) return notify("強化可能なトークンがありません (Max Lv3)");

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
          desc: getTokenDescription(next[targetIdx], nextLevel)
        };
        return next;
      });

      setStars((s) => s - item.price);
      setTotalPurchases((p) => p + 1);
      setTotalStarsSpent((prev) => prev + item.price);
      setShopItems((prev) => prev.filter((i) => i !== item));
      notify(`${targetToken.name} が強化されました! (Lv${(targetToken.level || 1) + 1})`);

    } else if (item.type === "enchant_random") {
      if (tokens.length === 0) return notify("付与可能なトークンがありません");

      const targetToken = tokens[Math.floor(Math.random() * tokens.length)];
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
      if (tokens.length === 0) return notify("付与可能なトークンがありません");
      // For now grant to the first one or random? Let's say random for simplicity or last bought?
      // Since UI doesn't allow selection easily here, random is consistent with above.
      // Or maybe we should grant to all? No.
      // Let's grant to a random one for now as per previous logic which grabbed index 0 basically if not empty?
      // Old logic: tokens.findIndex(t => t != null). Guaranteed to find one if tokens.length > 0.

      const targetIdx = Math.floor(Math.random() * tokens.length); // Randomize

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
      // Normal Token Purchase
      const isActive = item.type === 'skill';
      const activeCount = tokens.filter(t => t.type === 'skill').length;
      const passiveCount = tokens.filter(t => t.type !== 'skill').length;

      if (isActive && activeCount >= 5) return notify("アクティブスキルは5個までです");
      if (!isActive && passiveCount >= 5) return notify("パッシブアイテムは5個までです");

      const existingIdx = tokens.findIndex((t) => t?.id === item.id);
      if (existingIdx !== -1) {
        // Double check if max level
        if ((tokens[existingIdx].level || 1) >= 3) {
          return notify("これ以上強化できません (Max Lv3)");
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
          const currentLevel = next[idx].level || 1;
          if (currentLevel >= 3) {
            // Should verify in UI but safe check here
            return next;
          }
          const nextLevel = currentLevel + 1;
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
              desc: getTokenDescription(next[idx], nextLevel)
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
      case "spawn_random":
        engine.spawnRandom(token.params.color, token.params.count);
        break;
      case "board_balance":
        engine.changeBoardBalanced();
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
      case "enhance_color":
        engine.enhanceColorOrbs(token.params.colors);
        break;
      case "chronos_stop":
        engine.activateChronosStop(token.params.duration);
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
    const sellPrice = Math.floor(token.price * sellRate);
    setStars(s => s + sellPrice);

    setTokens(prev => prev.filter(t => t.instanceId !== token.instanceId));

    setSelectedTokenDetail(null);
    notify(`${token.name} を売却しました (+${sellPrice} ★)`);
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
              <span className="text-lg font-bold text-white">Turn {turn}{isEndlessMode ? ' (∞)' : ''}</span>
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
        <section className="relative z-30 px-6 py-2 flex-none mb-4 flex flex-col gap-2">
          {/* Passive Tokens Row */}
          <div>
            <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider flex justify-between">
              <span>Passive Artifacts</span>
              <span className="text-[9px]">{tokens.filter(t => t && t.type !== 'skill').length}/5</span>
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const passiveTokens = tokens.filter(t => t && t.type !== 'skill');
                const t = passiveTokens[i];
                return (
                  <div
                    key={`passive-${i}`}
                    onClick={() => t && setSelectedTokenDetail({ token: t })}
                    className={`aspect-square rounded-xl flex items-center justify-center relative border transition-all 
                      ${t ? 'bg-slate-800 border-white/10 cursor-pointer hover:bg-white/5' : 'bg-slate-900/30 border-white/5 border-dashed'}
                    `}
                  >
                    {t && (
                      <>
                        <span className="material-icons-round text-2xl text-slate-400 relative z-10">
                          auto_awesome
                        </span>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20">
                          {t.level || 1}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Tokens Row */}
          <div>
            <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider flex justify-between">
              <span>Active Spells</span>
              <span className="text-[9px]">{tokens.filter(t => t && t.type === 'skill').length}/5</span>
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const activeTokens = tokens.filter(t => t && t.type === 'skill');
                const t = activeTokens[i];
                // Calculate charge status
                const isSkill = t?.type === 'skill';
                const charge = t?.charge || 0;
                const cost = getEffectiveCost(t);
                const progress = isSkill ? Math.min(100, (charge / cost) * 100) : 100;
                const isReady = isSkill && charge >= cost;

                return (
                  <div
                    key={`active-${i}`}
                    onClick={() => t && setSelectedTokenDetail({ token: t })}
                    className={`aspect-square rounded-xl flex items-center justify-center relative border transition-all 
                      ${t ? (isReady ? 'bg-slate-800 border-primary/50 cursor-pointer shadow-[0_0_10px_rgba(91,19,236,0.2)] group hover:scale-105' : 'bg-slate-900 border-white/5 opacity-80 cursor-pointer') : 'bg-slate-900/30 border-white/5 border-dashed'}
                    `}
                  >
                    {t && (
                      <>
                        <div className="absolute inset-0 bg-primary/10 rounded-xl overflow-hidden">
                          {isSkill && (
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-500"
                              style={{ height: `${progress}%` }}
                            ></div>
                          )}
                        </div>
                        <span className={`material-icons-round text-2xl drop-shadow-md relative z-10 ${isReady ? 'text-primary' : 'text-slate-500'}`}>
                          sports_martial_arts
                        </span>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-background-dark z-20">
                          {t.level || 1}
                        </div>
                        {t.cost > 0 && (
                          <div className="absolute top-0.5 right-1 z-20 flex flex-col items-end">
                            <span className="text-[7px] text-slate-400 font-mono">{t.cost}E</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
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

          <div className="relative w-full h-full p-4 flex flex-col justify-start pt-12">
            {/* コンボ表示 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex justify-center w-full">
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

      </div>

    </div>
  );
};

export default App;
