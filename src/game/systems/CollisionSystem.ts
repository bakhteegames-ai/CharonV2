import * as THREE from "three";
import { Player } from "../entities/Player";
import { Obstacle } from "../entities/Obstacle";
import { Coin } from "../entities/Coin";
import { ShieldItem } from "../entities/ShieldItem";
import { GameState, GameStatus } from "../state/GameState";
import { GAME_CONFIG, GAME_HOOKS } from "../config/constants";
import { EventBus } from "../core/EventBus";

export class CollisionSystem {
  private player: Player;
  private gameState: GameState;
  private playerBox: THREE.Box3 = new THREE.Box3();
  private bus: EventBus;

  constructor(player: Player) {
    this.player = player;
    this.gameState = GameState.getInstance();
    this.bus = EventBus.getInstance();
  }

  public update(
    dt: number,
    activeObstacles: Obstacle[],
    activeCoins: Coin[],
    activeShields: ShieldItem[],
  ) {
    if (this.gameState.status !== GameStatus.PLAYING) return;

    // Update player collider bounding box (ignore visual children)
    this.player.getColliderBox(this.playerBox);
    const playerZ = this.player.mesh.position.z;

    // Check coin collisions first (don't shrink box for coins, make them easy to collect)
    for (const coin of activeCoins) {
      // Broad-phase: Z distance check
      if (Math.abs(coin.mesh.position.z - playerZ) > 3) continue;

      if (this.playerBox.intersectsBox(coin.boundingBox)) {
        coin.recycle(); // Hide and deactivate coin
        this.gameState.addCoin();
        this.player.pulse();
        this.bus.emit({ type: "COIN_COLLECT" });
      }
    }

    // Check shield collisions
    for (const shield of activeShields) {
      if (Math.abs(shield.mesh.position.z - playerZ) > 3) continue;

      if (this.playerBox.intersectsBox(shield.boundingBox)) {
        shield.recycle();
        this.gameState.activateShield();
        this.bus.emit({ type: "SHIELD_COLLECT" });
      }
    }

    // Shrink player bounding box slightly to make obstacle collisions more forgiving
    const shrinkAmount = 0.2;
    this.playerBox.expandByScalar(-shrinkAmount);

    for (const obs of activeObstacles) {
      // Broad-phase: Z distance check
      if (Math.abs(obs.mesh.position.z - playerZ) > 5) continue;

      if (this.playerBox.intersectsBox(obs.boundingBox)) {
        if (this.gameState.hasShield) {
          this.gameState.breakShield();
          obs.recycle(); // Destroy obstacle
          this.gameState.triggerShake(0.2); // Small shake for shield break
          this.bus.emit({ type: "PLAYER_HIT", hadShield: true });
        } else {
          this.gameState.triggerShake(); // Full shake for game over
          this.gameState.setStatus(GameStatus.GAME_OVER);
          this.bus.emit({ type: "PLAYER_HIT", hadShield: false });
          break;
        }
      } else if (GAME_HOOKS.ENABLE_NEAR_MISS && !obs.nearMissTriggered) {
        // Near miss detection
        const nearMissBox = this.playerBox
          .clone()
          .expandByScalar(GAME_CONFIG.NEAR_MISS_MARGIN);
        if (nearMissBox.intersectsBox(obs.boundingBox)) {
          // Only trigger if player is passing or alongside
          if (Math.abs(obs.mesh.position.z - playerZ) < 1.5) {
            obs.nearMissTriggered = true;
            this.gameState.triggerNearMiss();
            this.bus.emit({ type: "NEAR_MISS" });
          }
        }
      }
    }
  }
}
