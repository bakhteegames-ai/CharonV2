import * as THREE from "three";
import { GAME_CONFIG } from "../config/constants";

export type EntityTheme = {
  coin: number;
  shield: number;
  obstacle: number;
};

export class MeshFactory {
  private static coinGeo: THREE.BufferGeometry | null = null;
  private static coinMat: THREE.Material | null = null;

  private static shieldGeo: THREE.BufferGeometry | null = null;
  private static shieldMat: THREE.Material | null = null;

  private static obstacleGeo: THREE.BufferGeometry | null = null;
  private static obstacleMat: THREE.Material | null = null;

  // Current theme colors (used for materials created in the future)
  private static theme: EntityTheme = {
    coin: GAME_CONFIG.COLOR_COIN,
    shield: GAME_CONFIG.COLOR_SHIELD,
    obstacle: GAME_CONFIG.COLOR_OBSTACLE,
  };

  public static applyTheme(theme: EntityTheme) {
    this.theme = theme;

    // If materials already exist, update them in-place (safe, visual-only).
    const coinMat = this.coinMat as THREE.MeshStandardMaterial | null;
    if (coinMat && (coinMat as any).isMeshStandardMaterial) {
      coinMat.color.setHex(theme.coin);
      coinMat.emissive.setHex(theme.coin);
    }

    const shieldMat = this.shieldMat as THREE.MeshStandardMaterial | null;
    if (shieldMat && (shieldMat as any).isMeshStandardMaterial) {
      shieldMat.color.setHex(theme.shield);
      shieldMat.emissive.setHex(theme.shield);
    }

    const obstacleMat = this.obstacleMat as THREE.MeshStandardMaterial | null;
    if (obstacleMat && (obstacleMat as any).isMeshStandardMaterial) {
      obstacleMat.color.setHex(theme.obstacle);
      obstacleMat.emissive.setHex(theme.obstacle);
    }
  }

  public static getCoinGeometry() {
    if (!this.coinGeo) {
      const g = new THREE.CylinderGeometry(
        GAME_CONFIG.COIN_SIZE,
        GAME_CONFIG.COIN_SIZE,
        0.2,
        16,
      );
      g.rotateX(Math.PI / 2);
      this.coinGeo = g;
    }
    return this.coinGeo;
  }
  public static getCoinMaterial() {
    if (!this.coinMat) {
      this.coinMat = new THREE.MeshStandardMaterial({
        color: this.theme.coin,
        roughness: 0.1,
        metalness: 0.9,
        emissive: this.theme.coin,
        emissiveIntensity: 0.4,
      });
    }
    return this.coinMat;
  }

  public static getShieldGeometry() {
    if (!this.shieldGeo) {
      this.shieldGeo = new THREE.OctahedronGeometry(
        GAME_CONFIG.COIN_SIZE * 1.2,
        0,
      );
    }
    return this.shieldGeo;
  }
  public static getShieldMaterial() {
    if (!this.shieldMat) {
      this.shieldMat = new THREE.MeshStandardMaterial({
        color: this.theme.shield,
        metalness: 0.5,
        roughness: 0.1,
        emissive: this.theme.shield,
        emissiveIntensity: 0.5,
      });
    }
    return this.shieldMat;
  }

  public static getObstacleGeometry() {
    if (!this.obstacleGeo) {
      this.obstacleGeo = new THREE.BoxGeometry(
        GAME_CONFIG.LANE_WIDTH * 0.8,
        GAME_CONFIG.OBSTACLE_SIZE,
        GAME_CONFIG.OBSTACLE_SIZE,
      );
    }
    return this.obstacleGeo;
  }
  public static getObstacleMaterial() {
    if (!this.obstacleMat) {
      this.obstacleMat = new THREE.MeshStandardMaterial({
        color: this.theme.obstacle,
        roughness: 0.2,
        metalness: 0.5,
        emissive: this.theme.obstacle,
        emissiveIntensity: 0.3,
      });
    }
    return this.obstacleMat;
  }
}
