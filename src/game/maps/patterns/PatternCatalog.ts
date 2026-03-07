import type { PatternFn } from "./types";
import type { MovementCapability } from "../../config/movementProfile";
import { GAME_VARIANT } from "../../config/variant";
import {
  patternBarricadePairGap,
  patternBlockChoice,
  patternBreatherCoinsWide,
  patternBreatherSCurveCoins,
  patternCenterBarricadeSplit,
  patternForcedJumpDouble,
  patternForcedJumpSingle,
  patternJumpOverheadCombo,
  patternJumpThenLaneSwitch,
  patternOverheadForcedSlide,
  patternOverheadGate,
  patternOverheadRiskSide,
  patternSlalomBlocks,
  patternSingleBlocks,
  patternSpikeDenseZigzag,
  patternSpikeMaze,
  patternSpikeOverheadChain,
  patternZigzag,
} from "./defaultPatterns";

export type PatternDifficultyTag = "E" | "M" | "H";

export type PatternFlag =
  | "breather"
  | "overhead"
  | "jumpOnly"
  | "dense"
  | "coinRiskRoute"
  | "shieldChance";

export type PatternDef = {
  id: string;
  fn: PatternFn;

  // Base selection weight (before scaling)
  baseWeight: number;

  // Difficulty gate (0..1)
  minDifficulty?: number;
  maxDifficulty?: number;

  // Biome gates (string on purpose: survives biome renames without breaking types)
  allowedBiomes?: readonly string[];
  blockedBiomes?: readonly string[];

  // Difficulty weight multiplier (data-driven, linear):
  // weight = baseWeight * clamp(diffMulA + diffMulB * difficulty, 0..inf)
  diffMulA?: number;
  diffMulB?: number;

  /**
   * Movement requirements for this pattern.
   * Used to gate patterns when switching GAME_VARIANT (v2 boat vs v3 runner).
   */
  requires?: readonly MovementCapability[];

  /**
   * Content tags (canon): used by ChunkMapScript to enforce waves/frequency.
   * This is NOT a new mechanic: it only affects which content is picked.
   */
  difficultyTag?: PatternDifficultyTag;
  flags?: readonly PatternFlag[];
};

// ---------------------------------------------------------------------------
// PHASE 1 — CONTENT (canon): packs for v2 safe / v3 general / v3 jump-only.
// The active catalog is chosen by GAME_VARIANT to keep v2 and v3 balanced
// without changing any core mechanics.
// ---------------------------------------------------------------------------

const V2_SAFE_PACK: readonly PatternDef[] = [
  // --- BREATHER (3) ---
  {
    id: "V2_E_01_BREATHER_COINS_WIDE",
    fn: patternBreatherCoinsWide,
    baseWeight: 1.0,
    difficultyTag: "E",
    flags: ["breather"],
    diffMulA: 1.0,
    diffMulB: -0.15,
  },
  {
    id: "V2_E_02_BREATHER_S_CURVE_COINS",
    fn: patternBreatherSCurveCoins,
    baseWeight: 0.9,
    difficultyTag: "E",
    flags: ["breather"],
    diffMulA: 1.0,
    diffMulB: -0.15,
  },
  {
    id: "V2_E_03_BREATHER_SHIELD_LINE",
    fn: patternBreatherCoinsWide,
    baseWeight: 0.55,
    difficultyTag: "E",
    flags: ["breather", "shieldChance"],
    diffMulA: 0.9,
    diffMulB: -0.1,
  },

  // --- EASY (4) ---
  {
    id: "V2_E_04_SINGLE_BLOCKS_SAFE",
    fn: patternSingleBlocks,
    baseWeight: 1.0,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 0.95,
    diffMulA: 1.15,
    diffMulB: -0.55,
  },
  {
    id: "V2_E_05_CENTER_BARRICADE_SPLIT",
    fn: patternCenterBarricadeSplit,
    baseWeight: 0.9,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 1.0,
    diffMulA: 1.1,
    diffMulB: -0.35,
  },
  {
    id: "V2_E_06_BLOCK_CHOICE",
    fn: patternBlockChoice,
    baseWeight: 0.8,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 0.9,
    diffMulA: 1.05,
    diffMulB: -0.35,
  },
  {
    id: "V2_E_07_ZIGZAG_LIGHT",
    fn: patternZigzag,
    baseWeight: 0.55,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 0.75,
    diffMulA: 0.85,
    diffMulB: -0.25,
  },

  // --- MEDIUM (4) ---
  {
    id: "V2_M_01_SLALOM_BLOCKS",
    fn: patternSlalomBlocks,
    baseWeight: 0.95,
    difficultyTag: "M",
    minDifficulty: 0.12,
    maxDifficulty: 1.0,
    diffMulA: 0.55,
    diffMulB: 0.75,
  },
  {
    id: "V2_M_02_BARRICADE_PAIR_GAP",
    fn: patternBarricadePairGap,
    baseWeight: 0.8,
    difficultyTag: "M",
    minDifficulty: 0.18,
    maxDifficulty: 1.0,
    diffMulA: 0.5,
    diffMulB: 0.8,
  },
  {
    id: "V2_M_03_OVERHEAD_GATE",
    fn: patternOverheadGate,
    baseWeight: 0.65,
    difficultyTag: "M",
    flags: ["overhead"],
    minDifficulty: 0.35,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.35,
    diffMulB: 1.0,
    requires: ["slide"],
  },
  {
    id: "V2_M_04_OVERHEAD_RISK_SIDE",
    fn: patternOverheadRiskSide,
    baseWeight: 0.55,
    difficultyTag: "M",
    flags: ["overhead", "coinRiskRoute"],
    minDifficulty: 0.4,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.3,
    diffMulB: 1.15,
    requires: ["slide"],
  },

  // --- HARD (3) ---
  {
    id: "V2_H_01_SPIKE_DENSE_ZIGZAG",
    fn: patternSpikeDenseZigzag,
    baseWeight: 0.8,
    difficultyTag: "H",
    flags: ["dense"],
    minDifficulty: 0.3,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.2,
    diffMulB: 1.25,
  },
  {
    id: "V2_H_02_SPIKE_OVERHEAD_CHAIN",
    fn: patternSpikeOverheadChain,
    baseWeight: 0.55,
    difficultyTag: "H",
    flags: ["dense", "overhead"],
    minDifficulty: 0.55,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.15,
    diffMulB: 1.35,
    requires: ["slide"],
  },
  {
    id: "V2_H_03_SPIKE_MAZE",
    fn: patternSpikeMaze,
    baseWeight: 0.7,
    difficultyTag: "H",
    flags: ["dense", "coinRiskRoute"],
    minDifficulty: 0.4,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.2,
    diffMulB: 1.2,
  },
];

const V3_GENERAL_PACK: readonly PatternDef[] = [
  // --- BREATHER (3) ---
  {
    id: "V3_E_01_BREATHER_COINS_WIDE",
    fn: patternBreatherCoinsWide,
    baseWeight: 1.0,
    difficultyTag: "E",
    flags: ["breather"],
    diffMulA: 1.0,
    diffMulB: -0.15,
  },
  {
    id: "V3_E_02_BREATHER_S_CURVE_COINS",
    fn: patternBreatherSCurveCoins,
    baseWeight: 0.9,
    difficultyTag: "E",
    flags: ["breather"],
    diffMulA: 1.0,
    diffMulB: -0.15,
  },
  {
    id: "V3_E_03_BREATHER_SHIELD_LINE",
    fn: patternBreatherCoinsWide,
    baseWeight: 0.55,
    difficultyTag: "E",
    flags: ["breather", "shieldChance"],
    diffMulA: 0.9,
    diffMulB: -0.1,
  },

  // --- EASY (4) ---
  {
    id: "V3_E_04_SINGLE_BLOCKS_SAFE",
    fn: patternSingleBlocks,
    baseWeight: 1.0,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 0.95,
    diffMulA: 1.15,
    diffMulB: -0.55,
  },
  {
    id: "V3_E_05_BLOCK_CHOICE",
    fn: patternBlockChoice,
    baseWeight: 0.9,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 1.0,
    diffMulA: 1.1,
    diffMulB: -0.35,
  },
  {
    id: "V3_E_06_CENTER_BARRICADE_SPLIT",
    fn: patternCenterBarricadeSplit,
    baseWeight: 0.75,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 0.9,
    diffMulA: 1.05,
    diffMulB: -0.35,
  },
  {
    id: "V3_E_07_ZIGZAG_LIGHT",
    fn: patternZigzag,
    baseWeight: 0.6,
    difficultyTag: "E",
    minDifficulty: 0.0,
    maxDifficulty: 0.75,
    diffMulA: 0.85,
    diffMulB: -0.25,
  },

  // --- MEDIUM (4) ---
  {
    id: "V3_M_01_SLALOM_BLOCKS",
    fn: patternSlalomBlocks,
    baseWeight: 1.0,
    difficultyTag: "M",
    minDifficulty: 0.12,
    maxDifficulty: 1.0,
    diffMulA: 0.55,
    diffMulB: 0.75,
  },
  {
    id: "V3_M_02_BARRICADE_PAIR_GAP",
    fn: patternBarricadePairGap,
    baseWeight: 0.85,
    difficultyTag: "M",
    minDifficulty: 0.18,
    maxDifficulty: 1.0,
    diffMulA: 0.5,
    diffMulB: 0.85,
  },
  {
    id: "V3_M_03_OVERHEAD_FORCED_SLIDE",
    fn: patternOverheadForcedSlide,
    baseWeight: 0.7,
    difficultyTag: "M",
    flags: ["overhead"],
    minDifficulty: 0.35,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.35,
    diffMulB: 1.0,
    requires: ["slide"],
  },
  {
    id: "V3_M_04_OVERHEAD_RISK_SIDE",
    fn: patternOverheadRiskSide,
    baseWeight: 0.6,
    difficultyTag: "M",
    flags: ["overhead", "coinRiskRoute"],
    minDifficulty: 0.4,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.3,
    diffMulB: 1.15,
    requires: ["slide"],
  },

  // --- HARD (3) ---
  {
    id: "V3_H_01_SPIKE_DENSE_ZIGZAG",
    fn: patternSpikeDenseZigzag,
    baseWeight: 0.9,
    difficultyTag: "H",
    flags: ["dense"],
    minDifficulty: 0.25,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.25,
    diffMulB: 1.25,
  },
  {
    id: "V3_H_02_SPIKE_OVERHEAD_CHAIN",
    fn: patternSpikeOverheadChain,
    baseWeight: 0.65,
    difficultyTag: "H",
    flags: ["dense", "overhead"],
    minDifficulty: 0.5,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.15,
    diffMulB: 1.35,
    requires: ["slide"],
  },
  {
    id: "V3_H_03_SPIKE_MAZE",
    fn: patternSpikeMaze,
    baseWeight: 0.8,
    difficultyTag: "H",
    flags: ["dense", "coinRiskRoute"],
    minDifficulty: 0.35,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.2,
    diffMulB: 1.2,
  },
];

const V3_JUMP_ONLY_PACK: readonly PatternDef[] = [
  {
    id: "V3_J_01_FORCED_JUMP_SINGLE",
    fn: patternForcedJumpSingle,
    baseWeight: 0.6,
    difficultyTag: "M",
    flags: ["dense", "jumpOnly"],
    minDifficulty: 0.55,
    maxDifficulty: 1.0,
    diffMulA: 0.25,
    diffMulB: 1.0,
    requires: ["jump"],
  },
  {
    id: "V3_J_02_FORCED_JUMP_DOUBLE",
    fn: patternForcedJumpDouble,
    baseWeight: 0.45,
    difficultyTag: "H",
    flags: ["dense", "jumpOnly"],
    minDifficulty: 0.65,
    maxDifficulty: 1.0,
    diffMulA: 0.15,
    diffMulB: 1.15,
    requires: ["jump"],
  },
  {
    id: "V3_J_03_JUMP_THEN_LANE_SWITCH",
    fn: patternJumpThenLaneSwitch,
    baseWeight: 0.45,
    difficultyTag: "H",
    flags: ["dense", "jumpOnly"],
    minDifficulty: 0.7,
    maxDifficulty: 1.0,
    diffMulA: 0.15,
    diffMulB: 1.2,
    requires: ["jump"],
  },
  {
    id: "V3_J_04_JUMP_OVERHEAD_COMBO",
    fn: patternJumpOverheadCombo,
    baseWeight: 0.35,
    difficultyTag: "H",
    flags: ["dense", "overhead", "jumpOnly"],
    minDifficulty: 0.8,
    maxDifficulty: 1.0,
    blockedBiomes: ["styx"],
    diffMulA: 0.1,
    diffMulB: 1.25,
    requires: ["jump"],
  },
];

export const PATTERN_CATALOG: readonly PatternDef[] =
  GAME_VARIANT === "v2" ? V2_SAFE_PACK : [...V3_GENERAL_PACK, ...V3_JUMP_ONLY_PACK];

export function buildPatternIndex(defs: readonly PatternDef[]) {
  const map = new Map<string, PatternDef>();
  for (const d of defs) map.set(d.id, d);
  return map;
}