import type { SpawnPlan } from "./types";
import type { BiomeId } from "../systems/BiomeDirector";

export type MapContext = {
  runSeed: number;
};

export type MapQuery = {
  // We generate content ahead of the player to avoid pop-in
  playerZ: number;
  // Generate until this Z (playerZ - lookAhead)
  generateToZ: number;

  // progression inputs (skeleton)
  distance: number;
  speed: number;
  difficulty: number; // 0..1
  biomeId: BiomeId;
};

export type MapDebugInfo = {
  biomeId: BiomeId;
  chunkIndex: number;
  patternId: string;
};

// "MapScript" decides WHAT to spawn and WHERE (content design layer).
export interface IMapScript {
  reset(ctx: MapContext): void;
  generate(query: MapQuery): SpawnPlan;
  // Optional debug hook
  getDebugInfo?(): MapDebugInfo;
}
