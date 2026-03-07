import * as THREE from "three";
import { Coin } from "../entities/Coin";
import { Obstacle, ObstacleType } from "../entities/Obstacle";
import { ShieldItem } from "../entities/ShieldItem";
import { GAME_CONFIG } from "../config/constants";
import type { SpawnEvent } from "../maps/types";

export class SpawnSystem {
  private scene: THREE.Scene;
  private pool: Obstacle[] = [];
  private poolSize: number = 40; // Enough for 3 lanes * ~13 rows

  private coinPool: Coin[] = [];
  private coinPoolSize: number = 60;

  private shieldPool: ShieldItem[] = [];
  private shieldPoolSize: number = 5;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPool();
  }

  private initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const obs = new Obstacle();
      this.scene.add(obs.mesh);
      this.pool.push(obs);
    }
    for (let i = 0; i < this.coinPoolSize; i++) {
      const coin = new Coin();
      this.scene.add(coin.mesh);
      this.coinPool.push(coin);
    }
    for (let i = 0; i < this.shieldPoolSize; i++) {
      const shield = new ShieldItem();
      this.scene.add(shield.mesh);
      this.shieldPool.push(shield);
    }
  }

  private getFreeObstacle(): Obstacle | null {
    return this.pool.find((obs) => !obs.active) || null;
  }

  private getFreeCoin(): Coin | null {
    return this.coinPool.find((coin) => !coin.active) || null;
  }

  private getFreeShield(): ShieldItem | null {
    return this.shieldPool.find((shield) => !shield.active) || null;
  }

  public update(dt: number, playerZ: number) {
    // 1. Recycle obstacles and coins behind player
    for (const obs of this.pool) {
      if (
        obs.active &&
        obs.mesh.position.z > playerZ + GAME_CONFIG.OBSTACLE_DESPAWN_DISTANCE
      ) {
        obs.recycle();
      }
    }
    for (const coin of this.coinPool) {
      if (coin.active) {
        coin.update(dt);
        if (
          coin.mesh.position.z >
          playerZ + GAME_CONFIG.OBSTACLE_DESPAWN_DISTANCE
        ) {
          coin.recycle();
        }
      }
    }
    for (const shield of this.shieldPool) {
      if (shield.active) {
        shield.update(dt);
        if (
          shield.mesh.position.z >
          playerZ + GAME_CONFIG.OBSTACLE_DESPAWN_DISTANCE
        ) {
          shield.recycle();
        }
      }
    }
  }

  public applyPlan(events: SpawnEvent[]) {
    for (const e of events) this.spawnEvent(e);
  }

  private spawnEvent(e: SpawnEvent) {
    if (e.kind === "obstacle") {
      const obs = this.getFreeObstacle();
      if (!obs) return;
      let t = ObstacleType.BLOCK;
      if (e.obstacleType === "overhead") t = ObstacleType.OVERHEAD;
      else if (e.obstacleType === "barricade") t = ObstacleType.BARRICADE;
      obs.spawn(e.lane, e.z, t);
      return;
    }

    if (e.kind === "coin") {
      const coin = this.getFreeCoin();
      if (!coin) return;
      coin.spawn(e.lane, e.z);
      return;
    }

    if (e.kind === "shield") {
      const shield = this.getFreeShield();
      if (!shield) return;
      shield.spawn(e.lane, e.z);
      return;
    }
  }

  public reset() {
    this.pool.forEach((obs) => obs.recycle());
    this.coinPool.forEach((coin) => coin.recycle());
    this.shieldPool.forEach((shield) => shield.recycle());
  }

  public getActiveObstacles(): Obstacle[] {
    return this.pool.filter((obs) => obs.active);
  }

  public getActiveCoins(): Coin[] {
    return this.coinPool.filter((coin) => coin.active);
  }

  public getActiveShields(): ShieldItem[] {
    return this.shieldPool.filter((shield) => shield.active);
  }
}
