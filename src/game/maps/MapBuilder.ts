import type { Lane, SpawnEvent, SpawnPlan } from "./types";

function asLane(n: number): Lane {
  if (n <= -1) return -1;
  if (n >= 1) return 1;
  return 0;
}

export class PlanBuilder {
  public readonly events: SpawnEvent[] = [];

  public row(z: number) {
    return new RowBuilder(this, z);
  }

  public obstacle(
    lane: Lane,
    z: number,
    obstacleType: "block" | "overhead" | "barricade" = "block",
  ) {
    this.events.push({ kind: "obstacle", lane, z, obstacleType });
    return this;
  }

  public coin(lane: Lane, z: number) {
    this.events.push({ kind: "coin", lane, z });
    return this;
  }

  public coinsLine(lane: Lane, z: number, count: number, spacingZ: number = 3) {
    const c = Math.max(1, Math.floor(count));
    for (let i = 0; i < c; i++) this.coin(lane, z - i * spacingZ);
    return this;
  }

  public shield(lane: Lane, z: number) {
    this.events.push({ kind: "shield", lane, z });
    return this;
  }

  public build(): SpawnPlan {
    return { events: this.events };
  }
}

export class RowBuilder {
  constructor(
    private b: PlanBuilder,
    private z: number,
  ) {}

  public obstacle(
    lane: Lane,
    obstacleType: "block" | "overhead" | "barricade" = "block",
  ) {
    this.b.obstacle(lane, this.z, obstacleType);
    return this;
  }

  public coin(lane: Lane) {
    this.b.coin(lane, this.z);
    return this;
  }

  public coinsLine(lane: Lane, count: number, spacingZ: number = 3) {
    this.b.coinsLine(lane, this.z, count, spacingZ);
    return this;
  }

  public shield(lane: Lane) {
    this.b.shield(lane, this.z);
    return this;
  }

  // Utility for future patterns: convert any int to Lane safely
  public lane(n: number): Lane {
    return asLane(n);
  }
}
