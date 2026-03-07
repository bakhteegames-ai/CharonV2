import * as THREE from "three";
import { GAME_CONFIG } from "../config/constants";
import { GameState } from "../state/GameState";
import { Player } from "../entities/Player";

type Particle = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  ttl: number;
  active: boolean;
};

export class CoinParticlesSystem {
  private particles: Particle[] = [];
  private cursor = 0;
  private prevCoins = 0;
  private tmpPos = new THREE.Vector3();

  private geo: THREE.BufferGeometry;
  private mat: THREE.MeshStandardMaterial;

  constructor(
    private scene: THREE.Scene,
    private player: Player,
    private gameState: GameState,
  ) {
    this.prevCoins = this.gameState.coins;

    this.geo = new THREE.BoxGeometry(
      GAME_CONFIG.VFX_COIN_PARTICLE_SIZE,
      GAME_CONFIG.VFX_COIN_PARTICLE_SIZE,
      GAME_CONFIG.VFX_COIN_PARTICLE_SIZE,
    );
    this.mat = new THREE.MeshStandardMaterial({
      color: GAME_CONFIG.COLOR_COIN,
      roughness: 0.4,
      metalness: 0.2,
      emissive: GAME_CONFIG.COLOR_COIN,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 1,
    });

    const pool = GAME_CONFIG.VFX_COIN_PARTICLE_POOL;
    for (let i = 0; i < pool; i++) {
      const mesh = new THREE.Mesh(this.geo, this.mat);
      mesh.visible = false;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        ttl: GAME_CONFIG.VFX_COIN_PARTICLE_LIFETIME,
        active: false,
      });
    }
  }

  private spawnOne(base: THREE.Vector3) {
    const p = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % this.particles.length;

    p.mesh.position.copy(base);

    // Random burst: mostly sideways/up, slightly backward (runner feeling)
    const speed = GAME_CONFIG.VFX_COIN_PARTICLE_SPEED;
    p.vel.set(
      (Math.random() - 0.5) * 2.2 * speed,
      (0.4 + Math.random() * 1.2) * speed,
      -(0.4 + Math.random() * 1.0) * speed,
    );

    p.ttl = GAME_CONFIG.VFX_COIN_PARTICLE_LIFETIME;
    p.life = p.ttl;
    p.active = true;
    p.mesh.visible = true;
    p.mesh.scale.setScalar(1);
  }

  private spawnBurst() {
    this.player.mesh.getWorldPosition(this.tmpPos);
    // Slightly above the player center looks nicer
    this.tmpPos.y += 0.2;

    const n = GAME_CONFIG.VFX_COIN_PARTICLES_PER_PICKUP;
    for (let i = 0; i < n; i++) this.spawnOne(this.tmpPos);
  }

  public update(dt: number) {
    if (!GAME_CONFIG.VFX_ENABLE_COIN_PARTICLES) return;

    // Fallback trigger: coins counter increment (doesn't require EventBus wiring)
    if (this.gameState.coins > this.prevCoins) {
      this.spawnBurst();
    }
    this.prevCoins = this.gameState.coins;

    const g = GAME_CONFIG.VFX_COIN_PARTICLE_GRAVITY;
    for (const p of this.particles) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.vel.y += g * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;

      // simple fade by scale
      const t = p.life / p.ttl;
      p.mesh.scale.setScalar(0.25 + 0.75 * t);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 7;
      p.mesh.rotation.z += dt * 5;
    }
  }

  public dispose() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.geo.dispose();
    this.mat.dispose();
    this.particles = [];
  }
}
