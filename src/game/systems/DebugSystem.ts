import { GameState } from "../state/GameState";
import { SpawnSystem } from "./SpawnSystem";
import { Player } from "../entities/Player";

export class DebugSystem {
  private frames = 0;
  private lastFpsTime = 0;

  constructor(
    private gameState: GameState,
    private spawnSystem: SpawnSystem,
    private player: Player,
  ) {}

  public update(timeMs: number) {
    if (!this.gameState.isDebug) return;
    if (this.lastFpsTime === 0) this.lastFpsTime = timeMs;

    this.frames++;
    if (timeMs - this.lastFpsTime >= 1000) {
      this.gameState.setDebugStats(
        this.frames,
        this.spawnSystem.getActiveObstacles().length,
        this.spawnSystem.getActiveCoins().length,
        this.player.currentX,
        this.player.targetX,
      );
      this.frames = 0;
      this.lastFpsTime = timeMs;
    }
  }
}
