export type Lane = -1 | 0 | 1;

export type SpawnObstacle = {
  kind: "obstacle";
  lane: Lane;
  z: number;
  // keep it string for now — SpawnSystem can map it to enum later
  obstacleType?: "block" | "overhead" | "barricade";
};

export type SpawnCoin = {
  kind: "coin";
  lane: Lane;
  z: number;
};

export type SpawnShield = {
  kind: "shield";
  lane: Lane;
  z: number;
};

export type SpawnEvent = SpawnObstacle | SpawnCoin | SpawnShield;

export type SpawnPlan = {
  events: SpawnEvent[];
  // reserved for future: biome switches, speed curves, setpieces, etc.
};
