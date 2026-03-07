import * as THREE from "three";
import { Player } from "../entities/Player";
import { GameState } from "../state/GameState";
import { EventBus } from "../core/EventBus";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export class PlayerVfxSystem {
  private shieldBubble: THREE.Mesh;
  private bubblePulse = 0;
  private bubbleIntensity = 0;
  private off: (() => void)[] = [];

  constructor(
    private player: Player,
    private gameState: GameState,
    private bus: EventBus,
  ) {
    // Simple placeholder: transparent bubble around the player
    const geo = new THREE.SphereGeometry(0.85, 20, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    this.shieldBubble = new THREE.Mesh(geo, mat);
    this.shieldBubble.visible = this.gameState.hasShield;
    this.shieldBubble.renderOrder = 10;
    this.player.mesh.add(this.shieldBubble);

    this.off.push(
      this.bus.on("SHIELD_COLLECT", () => {
        this.shieldBubble.visible = true;
        this.bubblePulse = 1;
        this.bubbleIntensity = 1;
      }),
    );

    this.off.push(
      this.bus.on("PLAYER_HIT", (e) => {
        if (e.hadShield) {
          // Shield break flash
          this.bubblePulse = 1;
          this.bubbleIntensity = 1;
        }
      }),
    );
  }

  public update(dt: number) {
    // Keep visibility synced to actual state (authoritative)
    this.shieldBubble.visible = this.gameState.hasShield;
    if (!this.shieldBubble.visible) return;

    // Gentle breathing + pulse on events
    this.bubblePulse = Math.max(0, this.bubblePulse - dt * 2.5);
    this.bubbleIntensity = lerp(this.bubbleIntensity, 0, 1 - Math.exp(-5 * dt));

    const baseScale = 1.0 + Math.sin(performance.now() * 0.004) * 0.02;
    const pulseScale = 1.0 + this.bubblePulse * 0.15;
    this.shieldBubble.scale.setScalar(baseScale * pulseScale);

    const mat = this.shieldBubble.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.14 + this.bubblePulse * 0.12;
  }

  public dispose() {
    this.off.forEach((f) => f());
    this.off = [];
    this.player.mesh.remove(this.shieldBubble);
    (this.shieldBubble.geometry as THREE.BufferGeometry).dispose();
    (this.shieldBubble.material as THREE.Material).dispose();
  }
}
