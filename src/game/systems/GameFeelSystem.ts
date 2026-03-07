import { EventBus } from "../core/EventBus";
import { GameState } from "../state/GameState";
import { GAME_CONFIG } from "../config/constants";

// One place for ALL "juice": shake, particles, SFX triggers, camera punch, etc.
// Later you can disable/remove this system without touching gameplay logic.
export class GameFeelSystem {
  private off: (() => void)[] = [];

  constructor(
    private bus: EventBus,
    private gameState: GameState,
  ) {
    this.off.push(
      this.bus.on("PLAYER_HIT", (e) => {
        // keep it simple: a single shake source
        this.gameState.shakeTimer = GAME_CONFIG.SHAKE_DURATION;
      }),
    );
    this.off.push(
      this.bus.on("NEAR_MISS", () => {
        // optional: micro shake; keep tiny
        this.gameState.shakeTimer = Math.max(
          this.gameState.shakeTimer,
          GAME_CONFIG.SHAKE_DURATION * 0.25,
        );
      }),
    );
  }

  public dispose() {
    this.off.forEach((f) => f());
    this.off = [];
  }
}
