import type { Lane } from "../types";
import type { PatternFn, PatternInput } from "./types";

const LANES: Lane[] = [-1, 0, 1];
const SIDE_LANES: Lane[] = [-1, 1];

function clampLane(n: number): Lane {
  if (n <= -1) return -1;
  if (n >= 1) return 1;
  return 0;
}

function zAt(input: PatternInput, t: number): number {
  // input.zStart > input.zEnd (both negative). Move inside the chunk by t in [0..1].
  const tt = Math.max(0, Math.min(1, t));
  return input.zStart + (input.zEnd - input.zStart) * tt;
}

function pickOtherLane(safe: Lane, pick01: number): Lane {
  const others = LANES.filter((l) => l !== safe);
  return others[pick01 <= 0 ? 0 : 1];
}

function pickSideNot(safe: Lane, pick01: number): Lane {
  const sides = SIDE_LANES.filter((l) => l !== safe);
  if (sides.length === 0) return safe;
  return sides[pick01 <= 0 ? 0 : Math.min(1, sides.length - 1)];
}

// ---------------------------------------------------------------------------
// Base patterns (kept small, deterministic, runner-safe)
// ---------------------------------------------------------------------------

// PATTERN: "Single blocks" that preserves a chosen safe lane
export const patternSingleBlocks: PatternFn = (b, ctx, input) => {
  const zMid = (input.zStart + input.zEnd) * 0.5;
  const safe = input.lastSafeLane;

  // place 3 rows inside the chunk
  const rows = [input.zStart - 20, zMid, input.zEnd + 20];
  for (const z of rows) {
    // block one of the non-safe lanes
    const candidates = LANES.filter((l) => l !== safe);
    const blocked = candidates[ctx.int(0, candidates.length - 1)];
    b.row(z).obstacle(blocked, "block");

    // coins on safe lane
    if (ctx.chance(0.6)) b.row(z).coinsLine(safe, ctx.int(3, 5), 3);
  }

  return { exitSafeLane: safe };
};

// PATTERN: "Zigzag safe lane" (never jumps 2 lanes at once)
export const patternZigzag: PatternFn = (b, ctx, input) => {
  let safe: Lane = input.lastSafeLane;
  const rows = 4;
  const dz = (input.zEnd - input.zStart) / rows; // note: both are negative; dz is negative

  for (let i = 1; i <= rows; i++) {
    const z = input.zStart + dz * i;

    // move safe lane by at most 1 step
    const dir = ctx.int(-1, 1);
    safe = clampLane(safe + dir);

    // block the other 2 lanes (light variant: sometimes leave one open)
    const makeGap = ctx.chance(0.18);
    for (const l of LANES) {
      if (l === safe) continue;
      if (makeGap && ctx.chance(0.5)) continue;
      b.row(z).obstacle(l, ctx.chance(0.25) ? "barricade" : "block");
    }

    // reward on safe lane
    if (ctx.chance(0.75)) b.row(z).coinsLine(safe, ctx.int(3, 5), 3);
    if (ctx.chance(0.06)) b.row(z).shield(safe);
  }

  return { exitSafeLane: safe };
};

// PATTERN: "Overhead gate" (slide/crouch check; always fair)
export const patternOverheadGate: PatternFn = (b, ctx, input) => {
  const safe = input.lastSafeLane;
  const z = zAt(input, 0.55);

  // Put an overhead in one lane, normal block in another, leave safe open
  const others = LANES.filter((l) => l !== safe);
  b.row(z).obstacle(others[0], "overhead");
  b.row(z).obstacle(others[1], "block");

  if (ctx.chance(0.8)) b.row(z).coinsLine(safe, ctx.int(3, 5), 3);
  return { exitSafeLane: safe };
};

// ---------------------------------------------------------------------------
// Phase 1 packs: helpers + new patterns
// ---------------------------------------------------------------------------

// BREATHER: lots of coins, minimal threat. Optionally spawns a shield.
export const patternBreatherCoinsWide: PatternFn = (b, ctx, input) => {
  const safe = input.lastSafeLane;
  const rows = [zAt(input, 0.2), zAt(input, 0.45), zAt(input, 0.7)];

  for (const z of rows) {
    // Safe lane gets a longer line
    b.row(z).coinsLine(safe, ctx.int(5, 7), 3);

    // Other lanes get shorter lines for light routing
    for (const l of LANES) {
      if (l === safe) continue;
      if (ctx.chance(0.55)) b.row(z).coinsLine(l, ctx.int(2, 4), 3);
    }
  }

  // Shield is a rare 'bonus here (selection-level cooldown also applies)
  if (ctx.chance(0.35)) b.row(zAt(input, 0.55)).shield(safe);

  return { exitSafeLane: safe };
};

// BREATHER: S-curve coin path (no obstacles). Encourages lane changes safely.
export const patternBreatherSCurveCoins: PatternFn = (b, ctx, input) => {
  let lane: Lane = input.lastSafeLane;
  const dir = ctx.chance(0.5) ? 1 : -1;
  const steps: Lane[] = [lane];

  // Build a small S: a step to the side (if possible), then back.
  const side1 = clampLane(lane + dir);
  const side2 = clampLane(side1 - dir);
  steps.push(side1, side2, side1);

  const zs = [zAt(input, 0.2), zAt(input, 0.4), zAt(input, 0.6), zAt(input, 0.8)];
  for (let i = 0; i < zs.length; i++) {
    lane = steps[i % steps.length];
    b.row(zs[i]).coinsLine(lane, ctx.int(4, 6), 3);
  }

  return { exitSafeLane: lane };
};

// EASY: center gets blocked later; nudges away from center when needed.
export const patternCenterBarricadeSplit: PatternFn = (b, ctx, input) => {
  const zWarn = zAt(input, 0.25);
  const zMain = zAt(input, 0.6);
  const zExit = zAt(input, 0.82);

  // If player comes from center, warn early with a normal block.
  b.row(zWarn).obstacle(0, "block");

  // Big blocker in the middle to create a clear split.
  b.row(zMain).obstacle(0, "barricade");

  // Choose an exit safe lane on a side (guaranteed open).
  const exitSafe: Lane =
    input.lastSafeLane === 0
      ? (ctx.chance(0.5) ? -1 : 1)
      : (input.lastSafeLane as Lane);

  // Coins guide to the exit lane; opposite side is a smaller reward.
  b.row(zWarn).coinsLine(exitSafe, ctx.int(3, 5), 3);
  b.row(zMain).coinsLine(exitSafe, ctx.int(4, 6), 3);
  b.row(zExit).coinsLine(exitSafe, ctx.int(3, 5), 3);

  const otherSide = pickSideNot(exitSafe, 0);
  if (otherSide !== exitSafe && ctx.chance(0.6))
    b.row(zMain).coinsLine(otherSide, ctx.int(2, 4), 3);

  return { exitSafeLane: exitSafe };
};

// EASY: a single row with a choice (jump optional in v3, lane switch in v2).
export const patternBlockChoice: PatternFn = (b, ctx, input) => {
  const safe = input.lastSafeLane;
  const z = zAt(input, 0.55);

  const blocked = pickOtherLane(safe, ctx.int(0, 1));
  b.row(z).obstacle(blocked, ctx.chance(0.2) ? "barricade" : "block");

  // One lane is high coin, one lane is low coin.
  b.row(z).coinsLine(safe, ctx.int(3, 5), 3);
  const rewardLane = pickOtherLane(blocked, ctx.int(0, 1));
  if (rewardLane !== safe) b.row(z).coinsLine(rewardLane, ctx.int(4, 6), 3);

  return { exitSafeLane: safe };
};

// MEDIUM: slalom that forces lane changes, but never requires 2-lane jumps.
export const patternSlalomBlocks: PatternFn = (b, ctx, input) => {
  let safe: Lane = input.lastSafeLane;
  const zs = [zAt(input, 0.22), zAt(input, 0.45), zAt(input, 0.68), zAt(input, 0.86)];

  for (const z of zs) {
    // Force move away from current safe lane with a blocker.
    b.row(z).obstacle(safe, ctx.chance(0.35) ? "barricade" : "block");
    // Next safe lane = adjacent if possible.
    const dir = safe === 0 ? (ctx.chance(0.5) ? -1 : 1) : -safe;
    safe = clampLane(safe + dir);
    b.row(z).coinsLine(safe, ctx.int(3, 5), 3);
  }

  return { exitSafeLane: safe };
};

// MEDIUM: two barricades, one clear gap. No bait coins; strong telegraph toward safe.
export const patternBarricadePairGap: PatternFn = (b, ctx, input) => {
  const zMain = zAt(input, 0.55);

  const safeLane: Lane =
    input.lastSafeLane === 0
      ? (ctx.chance(0.5) ? -1 : 1)
      : (input.lastSafeLane as Lane);

  // Block the two other lanes.
  for (const l of LANES) {
    if (l === safeLane) continue;
    b.row(zMain).obstacle(l, "barricade");
  }

  // Strong telegraph (no bait): breadcrumbs toward the safe lane before the barricades.
  b.row(zAt(input, 0.28)).coinsLine(safeLane, ctx.int(2, 4), 3);
  b.row(zAt(input, 0.4)).coinsLine(safeLane, ctx.int(3, 5), 3);

  // Main reward stays on the safe lane.
  b.row(zMain).coinsLine(safeLane, ctx.int(4, 6), 3);

  // Small confirmation after the gate.
  b.row(zAt(input, 0.72)).coinsLine(safeLane, ctx.int(2, 4), 3);

  return { exitSafeLane: safeLane };
};

// MEDIUM (v3): forced slide once (other lanes are blocked). Reward coins on safe.
export const patternOverheadForcedSlide: PatternFn = (b, ctx, input) => {
  const safe = input.lastSafeLane;
  const zWarn = zAt(input, 0.32);
  const zMain = zAt(input, 0.6);

  // Light warning coins on safe lane.
  if (ctx.chance(0.8)) b.row(zWarn).coinsLine(safe, ctx.int(2, 4), 3);

  // Force slide on safe lane.
  b.row(zMain).obstacle(safe, "overhead");

  // Block the other 2 lanes.
  for (const l of LANES) {
    if (l === safe) continue;
    b.row(zMain).obstacle(l, ctx.chance(0.35) ? "barricade" : "block");
  }

  // Reward on safe lane after the slide.
  b.row(zAt(input, 0.78)).coinsLine(safe, ctx.int(4, 6), 3);

  return { exitSafeLane: safe };
};

// MEDIUM: overhead on a risky lane (coins tempt). Safe route remains open.
export const patternOverheadRiskSide: PatternFn = (b, ctx, input) => {
  const baseSafe = input.lastSafeLane;

  // Put the main action slightly later in the chunk so breadcrumbs can appear early.
  const zRisk = zAt(input, 0.62);

  // Keep the "risk" lane adjacent to the incoming safe lane (no 2-lane jumps).
  const riskLane: Lane = baseSafe === 0 ? (ctx.chance(0.5) ? -1 : 1) : 0;

  // TELEGRAPH: early breadcrumbs lock the player's attention to the safe lane first.
  b.row(zAt(input, 0.22)).coinsLine(baseSafe, ctx.int(2, 4), 3);
  b.row(zAt(input, 0.34)).coinsLine(baseSafe, ctx.int(2, 4), 3);

  // Risk lane: overhead + big coin line at the same Z (clear "duck for coins" moment).
  b.row(zRisk).obstacle(riskLane, "overhead");
  b.row(zRisk).coinsLine(riskLane, ctx.int(5, 7), 3);

  // Safe route stays open on baseSafe with a smaller payout.
  b.row(zAt(input, 0.5)).coinsLine(baseSafe, ctx.int(2, 4), 3);
  b.row(zAt(input, 0.78)).coinsLine(baseSafe, ctx.int(2, 4), 3);

  // The remaining lane may get a light blocker (keeps at least one non-risk escape).
  const otherLane = LANES.find((l) => l !== riskLane && l !== baseSafe);
  if (otherLane != null && ctx.chance(0.55)) b.row(zRisk).obstacle(otherLane, "block");

  return { exitSafeLane: baseSafe };
};

// HARD: dense zigzag with mixed obstacles. Always leaves a valid safe lane.
export const patternSpikeDenseZigzag: PatternFn = (b, ctx, input) => {
  let safe: Lane = input.lastSafeLane;
  const rows = 6;
  const dz = (input.zEnd - input.zStart) / rows;

  for (let i = 1; i <= rows; i++) {
    const z = input.zStart + dz * i;

    // Force safe lane to move often.
    if (ctx.chance(0.8)) safe = clampLane(safe + ctx.int(-1, 1));

    for (const l of LANES) {
      if (l === safe) continue;
      const kind = ctx.chance(0.35) ? "barricade" : "block";
      b.row(z).obstacle(l, kind);
    }

    // Occasional overhead on a non-safe lane only (never blocks safe).
    if (ctx.chance(0.35)) {
      const overheadLane = pickOtherLane(safe, ctx.int(0, 1));
      b.row(z).obstacle(overheadLane, "overhead");
    }

    if (ctx.chance(0.7)) b.row(z).coinsLine(safe, ctx.int(2, 4), 3);
  }

  return { exitSafeLane: safe };
};

// HARD: spike + overhead chain (safe remains passable, but requires slide timing).
export const patternSpikeOverheadChain: PatternFn = (b, ctx, input) => {
  let safe: Lane = input.lastSafeLane;
  const zs = [zAt(input, 0.28), zAt(input, 0.48), zAt(input, 0.68), zAt(input, 0.86)];

  for (const z of zs) {
    // Force move sometimes
    if (ctx.chance(0.55)) safe = clampLane(safe + ctx.int(-1, 1));

    // Safe gets overhead; other lanes get barricades/blocks
    b.row(z).obstacle(safe, "overhead");
    for (const l of LANES) {
      if (l === safe) continue;
      b.row(z).obstacle(l, ctx.chance(0.4) ? "barricade" : "block");
    }

    // Coins reinforce safe lane (telegraph)
    b.row(z).coinsLine(safe, ctx.int(2, 4), 3);
  }

  return { exitSafeLane: safe };
};

// HARD: maze routing with telegraph coins on safe lane (no guessing).
export const patternSpikeMaze: PatternFn = (b, ctx, input) => {
  let safe: Lane = input.lastSafeLane;

  // Dense routing with guaranteed telegraph coins on the current safe lane.
  const zs = [zAt(input, 0.2), zAt(input, 0.38), zAt(input, 0.56), zAt(input, 0.74), zAt(input, 0.9)];

  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];

    // Sometimes shift safe lane by 1 (never forces a 2-lane change).
    if (ctx.chance(0.55)) safe = clampLane(safe + ctx.int(-1, 1));

    // Block one random non-safe lane with a barricade; other non-safe lane gets a block.
    const others = LANES.filter((l) => l !== safe);
    const idx = ctx.int(0, 1);
    const laneA = others[idx];
    const laneB = others[1 - idx];
    b.row(z).obstacle(laneA, "barricade");
    b.row(z).obstacle(laneB, "block");

    // TELEGRAPH: always put a short coin line on the safe lane (no "coinless guessing").
    // Early rows are more generous; later rows tighten a bit.
    const n = i < 2 ? ctx.int(3, 5) : ctx.int(2, 4);
    b.row(z).coinsLine(safe, n, 3);
  }

  return { exitSafeLane: safe };
};

// JUMP-ONLY: forced single jump (v3 only, gated by capability + catalog)
export const patternForcedJumpSingle: PatternFn = (b, ctx, input) => {
  const z = zAt(input, 0.58);
  const safe = input.lastSafeLane;

  // Put a low obstacle across the safe lane that requires a jump.
  b.row(z).obstacle(safe, "block");

  // Other lanes are blocked to enforce the jump.
  for (const l of LANES) {
    if (l === safe) continue;
    b.row(z).obstacle(l, ctx.chance(0.5) ? "barricade" : "block");
  }

  // Reward after the jump.
  b.row(zAt(input, 0.78)).coinsLine(safe, ctx.int(4, 6), 3);

  return { exitSafeLane: safe };
};

// JUMP-ONLY: forced double jump (v3 only)
export const patternForcedJumpDouble: PatternFn = (b, ctx, input) => {
  const safe = input.lastSafeLane;

  const z1 = zAt(input, 0.42);
  const z2 = zAt(input, 0.68);

  b.row(z1).obstacle(safe, "block");
  b.row(z2).obstacle(safe, "block");

  // Block the other lanes on both jump rows.
  for (const z of [z1, z2]) {
    for (const l of LANES) {
      if (l === safe) continue;
      b.row(z).obstacle(l, ctx.chance(0.4) ? "barricade" : "block");
    }
  }

  b.row(zAt(input, 0.82)).coinsLine(safe, ctx.int(5, 7), 3);
  return { exitSafeLane: safe };
};

// JUMP-ONLY: jump then lane switch (v3 only)
export const patternJumpThenLaneSwitch: PatternFn = (b, ctx, input) => {
  let safe: Lane = input.lastSafeLane;
  const zJump = zAt(input, 0.45);
  const zSwitch = zAt(input, 0.68);

  // Force a jump in current safe lane.
  b.row(zJump).obstacle(safe, "block");
  for (const l of LANES) {
    if (l === safe) continue;
    b.row(zJump).obstacle(l, ctx.chance(0.35) ? "barricade" : "block");
  }
  b.row(zAt(input, 0.55)).coinsLine(safe, ctx.int(2, 4), 3);

  // Then force lane switch by blocking current lane.
  b.row(zSwitch).obstacle(safe, "barricade");
  const dir = safe === 0 ? (ctx.chance(0.5) ? -1 : 1) : -safe;
  safe = clampLane(safe + dir);
  b.row(zSwitch).coinsLine(safe, ctx.int(3, 5), 3);

  return { exitSafeLane: safe };
};

// JUMP-ONLY: jump + overhead combo (v3 only)
export const patternJumpOverheadCombo: PatternFn = (b, ctx, input) => {
  const safe = input.lastSafeLane;
  const zJump = zAt(input, 0.42);
  const zDuck = zAt(input, 0.7);

  // Jump requirement
  b.row(zJump).obstacle(safe, "block");
  for (const l of LANES) {
    if (l === safe) continue;
    b.row(zJump).obstacle(l, ctx.chance(0.5) ? "barricade" : "block");
  }

  // Overhead on safe lane later (duck after landing)
  b.row(zDuck).obstacle(safe, "overhead");
  for (const l of LANES) {
    if (l === safe) continue;
    b.row(zDuck).obstacle(l, ctx.chance(0.4) ? "barricade" : "block");
  }

  // Coins reward through the combo
  b.row(zAt(input, 0.55)).coinsLine(safe, ctx.int(2, 4), 3);
  b.row(zAt(input, 0.82)).coinsLine(safe, ctx.int(4, 6), 3);

  return { exitSafeLane: safe };
};