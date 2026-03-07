import * as THREE from "three";
import type { BiomeId } from "../systems/BiomeDirector";
import { getVisualTheme, type VisualThemeKey, type VisualTheme } from "../visual/VisualTheme";
import { MeshFactory } from "../visual/MeshFactory";
import type { TrackSystem } from "../systems/TrackSystem";
import { GAME_VARIANT } from "../config/variant";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const _colorA = new THREE.Color();
const _colorB = new THREE.Color();

function lerpColor(hexA: number, hexB: number, t: number): number {
  _colorA.setHex(hexA);
  _colorB.setHex(hexB);
  _colorA.lerp(_colorB, t);
  return _colorA.getHex();
}

export class VisualThemeSystem {
  private lastKey: VisualThemeKey | null = null;
  private startTheme: VisualTheme | null = null;
  private targetTheme: VisualTheme | null = null;
  private blendProgress: number = 1.0;
  private readonly BLEND_DURATION = 0.8;
  private readonly _bg = new THREE.Color();

  constructor(
    private scene: THREE.Scene,
    private ambientLight: THREE.AmbientLight,
    private dirLight: THREE.DirectionalLight,
    private trackSystem: TrackSystem,
  ) {}

  public applyIfChanged(biomeId: BiomeId, variant: string) {
    const theme = getVisualTheme(biomeId, variant as any);
    if (this.lastKey === theme.key) return;
    this.lastKey = theme.key;

    if (!this.targetTheme) {
      this.targetTheme = theme;
      this.startTheme = theme;
      this.blendProgress = 1.0;
      this.applyTheme(theme);
      return;
    }

    this.startTheme = this.getInterpolatedTheme(this.blendProgress);
    this.targetTheme = theme;
    this.blendProgress = 0.0;
  }

  public update(dt: number) {
    if (this.blendProgress >= 1.0 || !this.startTheme || !this.targetTheme) return;

    const safeDt = Math.min(dt, 0.1);
    this.blendProgress += safeDt / this.BLEND_DURATION;
    if (this.blendProgress >= 1.0) {
      this.blendProgress = 1.0;
      this.applyTheme(this.targetTheme);
      return;
    }

    const current = this.getInterpolatedTheme(this.blendProgress);
    this.applyTheme(current);
  }

  private getInterpolatedTheme(t: number): VisualTheme {
    const s = this.startTheme!;
    const e = this.targetTheme!;
    return {
      key: e.key,
      scene: {
        background: lerpColor(s.scene.background, e.scene.background, t),
        fogColor: lerpColor(s.scene.fogColor, e.scene.fogColor, t),
        fogNear: lerp(s.scene.fogNear, e.scene.fogNear, t),
        fogFar: lerp(s.scene.fogFar, e.scene.fogFar, t),
      },
      lighting: {
        ambientColor: lerpColor(s.lighting.ambientColor, e.lighting.ambientColor, t),
        ambientIntensity: lerp(s.lighting.ambientIntensity, e.lighting.ambientIntensity, t),
        dirColor: lerpColor(s.lighting.dirColor, e.lighting.dirColor, t),
        dirIntensity: lerp(s.lighting.dirIntensity, e.lighting.dirIntensity, t),
        dirPosition: {
          x: lerp(s.lighting.dirPosition.x, e.lighting.dirPosition.x, t),
          y: lerp(s.lighting.dirPosition.y, e.lighting.dirPosition.y, t),
          z: lerp(s.lighting.dirPosition.z, e.lighting.dirPosition.z, t),
        },
      },
      track: {
        base: lerpColor(s.track.base, e.track.base, t),
        divider: lerpColor(s.track.divider, e.track.divider, t),
        edge: lerpColor(s.track.edge, e.track.edge, t),
        roughness: lerp(s.track.roughness, e.track.roughness, t),
        metalness: lerp(s.track.metalness, e.track.metalness, t),
        dividerWidth: lerp(s.track.dividerWidth, e.track.dividerWidth, t),
        edgeWidth: lerp(s.track.edgeWidth, e.track.edgeWidth, t),
        dividerDash: [
          lerp(s.track.dividerDash[0], e.track.dividerDash[0], t),
          lerp(s.track.dividerDash[1], e.track.dividerDash[1], t),
        ],
        scrollMultiplier: lerp(s.track.scrollMultiplier, e.track.scrollMultiplier, t),
      },
      entities: {
        coin: lerpColor(s.entities.coin, e.entities.coin, t),
        shield: lerpColor(s.entities.shield, e.entities.shield, t),
        obstacle: lerpColor(s.entities.obstacle, e.entities.obstacle, t),
      },
    };
  }

  private applyTheme(theme: VisualTheme) {
    // Scene
    const bg = this.scene.background;
    if (bg instanceof THREE.Color) {
      bg.setHex(theme.scene.background);
    } else {
      this._bg.setHex(theme.scene.background);
      this.scene.background = this._bg;
    }

    // Keep the same fog class, just update its parameters (or recreate if missing).
    if (this.scene.fog && (this.scene.fog as any).isFog && !(this.scene.fog as any).isFogExp2) {
      (this.scene.fog as THREE.Fog).color.setHex(theme.scene.fogColor);
      (this.scene.fog as THREE.Fog).near = theme.scene.fogNear;
      (this.scene.fog as THREE.Fog).far = theme.scene.fogFar;
    } else {
      this.scene.fog = new THREE.Fog(
        theme.scene.fogColor,
        theme.scene.fogNear,
        theme.scene.fogFar,
      );
    }

    // Lighting
    this.ambientLight.color.setHex(theme.lighting.ambientColor);
    this.ambientLight.intensity = theme.lighting.ambientIntensity;

    this.dirLight.color.setHex(theme.lighting.dirColor);
    this.dirLight.intensity = theme.lighting.dirIntensity;
    this.dirLight.position.set(
      theme.lighting.dirPosition.x,
      theme.lighting.dirPosition.y,
      theme.lighting.dirPosition.z,
    );

    // Track + entities
    this.trackSystem.applyTheme(theme.track);
    MeshFactory.applyTheme(theme.entities);
  }
}
