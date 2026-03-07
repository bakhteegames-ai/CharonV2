import { Rng } from "../core/Rng";
import type { IMapScript, MapContext, MapQuery } from "./IMapScript";
import type { Lane, SpawnPlan, SpawnEvent } from "./types";
import { GAME_CONFIG } from "../config/constants";
import { PlanBuilder } from "./MapBuilder";

// This is a TEMP map script that mimics the old random SpawnSystem behavior,
// but now lives in the "map layer". Later you will replace it with real maps/biomes.
export class RandomMapScript implements IMapScript {
  private rng!: Rng;
  private lastPlannedZ = 0;

  // keep path reachable
  private lastPreferredSafeLane: Lane = 0;

  reset(ctx: MapContext) {
    this.rng = new Rng(ctx.runSeed);
    this.lastPlannedZ = -50;
    this.lastPreferredSafeLane = 0;
  }

  generate(query: MapQuery): SpawnPlan {
    const b = new PlanBuilder();

    // Plan forward in "rows" spaced by OBSTACLE_SPAWN_GAP
    const gap = GAME_CONFIG.SPAWN_INTERVAL_MIN; // We'll just use min for now or a fixed gap for the map script
    while (this.lastPlannedZ > query.generateToZ) {
      // Move forward (remember: player z usually decreases or increases? In your code distance uses abs(z).
      // Existing project uses player moving in -Z direction, so spawning happens at more negative Z.
      this.lastPlannedZ -= gap;
      this.planRow(b, this.lastPlannedZ);
    }

    return b.build();
  }

  private planRow(b: PlanBuilder, z: number) {
    const lanes: Lane[] = [-1, 0, 1];

    // choose safe lane not 2 steps away from previous
    const safeOptions = lanes.filter(
      (l) => Math.abs(l - this.lastPreferredSafeLane) <= 1,
    );
    const preferredSafeLane =
      safeOptions.length > 0
        ? safeOptions[this.rng.int(0, safeOptions.length - 1)]
        : lanes[this.rng.int(0, 2)];

    const numObstacles = this.rng.chance(0.4) ? 2 : 1;

    let obstacleLanes: Lane[] = [];
    let freeLanes: Lane[] = [];
    if (numObstacles === 2) {
      obstacleLanes = lanes.filter((l) => l !== preferredSafeLane);
      freeLanes = [preferredSafeLane];
    } else {
      const candidates = lanes.filter((l) => l !== preferredSafeLane);
      const blocked = candidates[this.rng.int(0, candidates.length - 1)];
      obstacleLanes = [blocked];
      freeLanes = lanes.filter((l) => l !== blocked);
    }
    this.lastPreferredSafeLane = preferredSafeLane;

    // obstacles
    for (const lane of obstacleLanes) {
      let obstacleType: "block" | "overhead" | "barricade" = "block";
      const r = this.rng.float();
      // keep exact behavior similar to old logic (but without speed checks here)
      if (r > 0.88) obstacleType = "overhead";
      else if (r > 0.72) obstacleType = "barricade";

      b.row(z).obstacle(lane, obstacleType);
    }

    // item lane
    if (this.rng.float() > 0.3) {
      const itemLane = (
        freeLanes.includes(preferredSafeLane) ? preferredSafeLane : freeLanes[0]
      ) as Lane;
      if (this.rng.float() < GAME_CONFIG.SHIELD_SPAWN_CHANCE) {
        b.row(z).shield(itemLane);
      } else {
        const numCoins = this.rng.int(3, 5);
        b.row(z).coinsLine(itemLane, numCoins, 3);
      }
    }
  }
}
