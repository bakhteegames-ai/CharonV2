import { Rng } from "../core/Rng";
import { GAME_CONFIG } from "../config/constants";
import type { IMapScript, MapContext, MapQuery, MapDebugInfo } from "./IMapScript";
import type { Lane, SpawnPlan } from "./types";
import { PlanBuilder } from "./MapBuilder";
import { PatternRegistry } from "./patterns/PatternRegistry";
import type { BiomeId } from "../systems/BiomeDirector";
import { MOVEMENT_PROFILE } from "../config/movementProfile";
import { GAME_VARIANT } from "../config/variant";
import {
  PATTERN_CATALOG,
  buildPatternIndex,
  type PatternDef,
  type PatternDifficultyTag,
  type PatternFlag,
} from "./patterns/PatternCatalog";

export class ChunkMapScript implements IMapScript {
  private rng!: Rng;
  private registry = new PatternRegistry();
  private patternById = buildPatternIndex(PATTERN_CATALOG);

  private nextChunkStartZ = 0;
  private lastSafeLane: Lane = 0;

  private chunkIndex: number = 0;
  private lastPatternId: string = "none";
  private lastBiomeId: BiomeId = "styx";

  // Content "grammar" state (Phase 1 — CONTENT):
  // 1–2 Easy → 1 Medium → 1 Spike(H) → 1 Breather → repeat.
  private waveStep: number = 0;
  private waveEasyCount: number = 2;
  // Late-game: optionally add a second spike per wave
  private waveHasSecondSpike: boolean = false;
  private pendingSecondSpike: boolean = false;

  // Frequency guards (content-only)
  private overheadCooldown: number = 0;
  private shieldCooldown: number = 0;
  private jumpOnlyCooldown: number = 0;

  // chunk size in Z units (player moves along -Z, so chunks go more negative)
  private chunkLength = 90;

  constructor() {
    // Register patterns from the catalog (data-driven)
    for (const def of PATTERN_CATALOG) {
      this.registry.add(def.id, def.baseWeight, def.fn);
    }
  }

  reset(ctx: MapContext) {
    this.rng = new Rng(ctx.runSeed);
    this.nextChunkStartZ = -50;
    this.lastSafeLane = 0;
    this.chunkIndex = 0;
    this.lastPatternId = "none";
    this.lastBiomeId = "styx";

    this.waveStep = 0;
    this.waveEasyCount = 2;
    this.waveHasSecondSpike = false;
    this.pendingSecondSpike = false;
    this.overheadCooldown = 0;
    this.shieldCooldown = 0;
    this.jumpOnlyCooldown = 0;
  }

  private hasFlag(def: PatternDef, flag: PatternFlag): boolean {
    return Boolean(def.flags && def.flags.includes(flag));
  }

  private pickWaveTarget(
    difficulty01: number,
  ): { kind: "breather" } | { kind: "tier"; tier: PatternDifficultyTag } {
    // Decide wave length (1 or 2 Easy) at the wave start.
    if (this.waveStep === 0) {
      // Scale: late game -> fewer Easy.
      if (difficulty01 >= 0.85) this.waveEasyCount = 1;
      else this.waveEasyCount = this.rng.chance(0.6) ? 2 : 1;

      // Late-game spike boost: sometimes add a second spike after a breather.
      this.waveHasSecondSpike = difficulty01 >= 0.85 && this.rng.chance(0.55);
      this.pendingSecondSpike = this.waveHasSecondSpike;
    }

    // Sequence: E x (1..2) → M → H → Breather
    const easyEnd = this.waveEasyCount;
    const mediumAt = easyEnd;
    const spikeAt = easyEnd + 1;
    const breatherAt = easyEnd + 2;

    if (this.waveStep < easyEnd) return { kind: "tier", tier: "E" };
    if (this.waveStep === mediumAt) {
      // Late-game: sometimes upgrade Medium slot to Hard.
      if (difficulty01 >= 0.85 && this.rng.chance(0.35)) return { kind: "tier", tier: "H" };
      return { kind: "tier", tier: "M" };
    }
    if (this.waveStep === spikeAt) {
      // Avoid spikes too early in the run.
      if (difficulty01 < 0.25) return { kind: "tier", tier: "M" };
      return { kind: "tier", tier: "H" };
    }
    if (this.waveStep === breatherAt) return { kind: "breather" };

    // Post-breather second spike (late game): H → Breather → H → Breather
    if (this.pendingSecondSpike) return { kind: "tier", tier: "H" };
    return { kind: "breather" };
  }

  private advanceWave() {
    // Base wave: E x n + M + H + Breather
    const baseLen = this.waveEasyCount + 3;
    this.waveStep++;
    if (this.waveStep >= baseLen) {
      // After the main breather, optionally inject an extra spike then an extra breather.
      if (this.pendingSecondSpike) {
        // First extra step: spike
        this.pendingSecondSpike = false;
        this.waveStep = baseLen; // move into "extra" region
        return;
      }
      // If we are in extra region already (or no extra spike), reset.
      this.waveStep = 0;
      this.waveHasSecondSpike = false;
    }
  }

  /**
   * Safe picker:
   * tries strict wave/cooldown filters first, then relaxes them so registry never becomes empty.
   * This is Phase 1 content logic only (no new mechanics).
   */
  private pickPatternSafe(
    biome: string,
    difficulty01: number,
    waveTarget: { kind: "breather" } | { kind: "tier"; tier: PatternDifficultyTag },
  ) {
    const mkScale =
      (
        target: { kind: "breather" } | { kind: "tier"; tier: PatternDifficultyTag } | { kind: "any" },
        opts: { ignoreCooldowns?: boolean; allowBreatherInTierSlots?: boolean } = {},
      ) =>
      (id: string, base: number) => {
        const def: PatternDef | undefined = this.patternById.get(id);
        if (!def) return 0;

        // v3 jump-only governance (Phase 1 content rule)
        const isJumpOnly = this.hasFlag(def, "jumpOnly");
        if (isJumpOnly) {
          // never in breather slots
          if (target.kind === "breather") return 0;
          // only in v3 and only after mid difficulty
          if (GAME_VARIANT !== "v3") return 0;
          if (difficulty01 < 0.55) return 0;
          // frequency guard
          if (this.jumpOnlyCooldown > 0) return 0;
        }

        // Wave grammar filter (strict / relaxed)
        if (target.kind === "breather") {
          if (!this.hasFlag(def, "breather")) return 0;
        } else if (target.kind === "tier") {
          if (!opts.allowBreatherInTierSlots) {
            if (this.hasFlag(def, "breather")) return 0;
          }
          if (def.difficultyTag !== target.tier) return 0;
        } // "any" skips wave filter

        // Frequency guards
        if (!opts.ignoreCooldowns) {
          if (this.overheadCooldown > 0 && this.hasFlag(def, "overhead")) return 0;
          if (this.shieldCooldown > 0 && this.hasFlag(def, "shieldChance")) return 0;
        }

        // Variant gating
        if (def.requires && def.requires.length > 0) {
          for (const req of def.requires) {
            if (!MOVEMENT_PROFILE.capabilities.has(req)) return 0;
          }
        }

        // Biome gates
        if (def.allowedBiomes && !def.allowedBiomes.includes(biome)) return 0;
        if (def.blockedBiomes && def.blockedBiomes.includes(biome)) return 0;

        // Difficulty gates
        if (def.minDifficulty != null && difficulty01 < def.minDifficulty) return 0;
        if (def.maxDifficulty != null && difficulty01 > def.maxDifficulty) return 0;

        // Difficulty scaling
        const a = def.diffMulA ?? 1.0;
        const bMul = def.diffMulB ?? 0.0;
        const mul = Math.max(0, a + bMul * difficulty01);

        // Biome bias (Phase 1 pacing; content-only)
        let biomeMul = 1.0;

        if (biome === "styx") {
          if (this.hasFlag(def, "dense")) biomeMul *= 0.6;
          if (this.hasFlag(def, "breather")) biomeMul *= 1.25;
        } else if (biome === "tartarus") {
          if (this.hasFlag(def, "dense")) biomeMul *= 1.35;
          if (this.hasFlag(def, "coinRiskRoute")) biomeMul *= 1.2;
        }

        // If last pattern was dense, slightly bias toward breather next (anti-fatigue)
        const lastDef = this.patternById.get(this.lastPatternId);
        if (lastDef && this.hasFlag(lastDef, "dense")) {
          if (this.hasFlag(def, "breather")) biomeMul *= 1.5;
        }

        // Anti-repeat
        const repeatMul = id === this.lastPatternId ? 0.18 : 1.0;
        return base * mul * repeatMul * biomeMul;
      };

    // Attempt ladder: strict → relax tier → ignore cooldowns → last-resort any
    const relaxTier = (t: PatternDifficultyTag): PatternDifficultyTag => (t === "H" ? "M" : "E");

    const attempts: Array<{
      target: { kind: "breather" } | { kind: "tier"; tier: PatternDifficultyTag } | { kind: "any" };
      opts?: { ignoreCooldowns?: boolean; allowBreatherInTierSlots?: boolean };
    }> = [];

    // 1) strict wave target
    attempts.push({ target: waveTarget });

    // 2) relax tier if needed
    if (waveTarget.kind === "tier") {
      attempts.push({ target: { kind: "tier", tier: relaxTier(waveTarget.tier) } });
    } else {
      // breather slot fallback: allow easy tier but keep breathers allowed too
      attempts.push({ target: { kind: "tier", tier: "E" }, opts: { allowBreatherInTierSlots: true } });
    }

    // 3) ignore cooldowns (prevents deadlock with overhead/shield cooldowns)
    attempts.push({
      target: waveTarget.kind === "tier" ? { kind: "tier", tier: waveTarget.tier } : { kind: "breather" },
      opts: { ignoreCooldowns: true, allowBreatherInTierSlots: waveTarget.kind !== "tier" },
    });

    // 4) last resort: any valid pattern (still respects variant/biome/difficulty gates)
    attempts.push({ target: { kind: "any" }, opts: { ignoreCooldowns: true, allowBreatherInTierSlots: true } });

    let lastErr: unknown = null;
    for (const a of attempts) {
      try {
        return this.registry.pickScaled(this.rng.float(), mkScale(a.target, a.opts));
      } catch (e) {
        lastErr = e;
      }
    }

    // Ultra-last-resort (crash-proof): pick ANY registered pattern.
    const list = this.registry.list();
    if (list.length === 0) {
      throw lastErr ?? new Error("PatternRegistry is empty");
    }
    const any = list[this.rng.int(0, list.length - 1)];
    return { id: any.id, weight: any.weight, fn: any.fn };
  }

  generate(query: MapQuery): SpawnPlan {
    const b = new PlanBuilder();
    const d = Math.max(0, Math.min(1, query.difficulty));
    this.lastBiomeId = query.biomeId;

    // Ensure chunks cover until generateToZ (more negative)
    while (this.nextChunkStartZ > query.generateToZ) {
      const zStart = this.nextChunkStartZ;
      const zEnd = this.nextChunkStartZ - this.chunkLength;
      this.nextChunkStartZ = zEnd;
      this.chunkIndex++;

      const biome = String(query.biomeId);
      const waveTarget = this.pickWaveTarget(d);
      const picked = this.pickPatternSafe(biome, d, waveTarget);

      this.lastPatternId = picked.id;
      const ctx = {
        float: () => this.rng.float(),
        int: (min: number, max: number) => this.rng.int(min, max),
        chance: (p: number) => this.rng.chance(p),
      };

      const out = picked.fn(b, ctx, {
        zStart,
        zEnd,
        lastSafeLane: this.lastSafeLane,
      });
      this.lastSafeLane = out.exitSafeLane;

      // Update frequency guards after pattern execution.
      const def = this.patternById.get(picked.id);
      if (def) {
        if (this.hasFlag(def, "overhead")) this.overheadCooldown = 2;
        else this.overheadCooldown = Math.max(0, this.overheadCooldown - 1);

        if (this.hasFlag(def, "shieldChance")) this.shieldCooldown = 5;
        else this.shieldCooldown = Math.max(0, this.shieldCooldown - 1);

        if (this.hasFlag(def, "jumpOnly")) this.jumpOnlyCooldown = 6;
        else this.jumpOnlyCooldown = Math.max(0, this.jumpOnlyCooldown - 1);
      }

      this.advanceWave();
    }

    return b.build();
  }

  public getDebugInfo(): MapDebugInfo {
    return {
      biomeId: this.lastBiomeId,
      chunkIndex: this.chunkIndex,
      patternId: this.lastPatternId,
    };
  }
}