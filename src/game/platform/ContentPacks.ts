import type { PlayerVisualMode } from "../config/constants";
import type { GameVariant } from "../config/variant";

/**
 * Phase 2B (Asset Layer): Content packs.
 *
 * Goal: turn the runner into a scalable multi-game engine.
 * Packs provide *assets* (art/audio/data) without changing gameplay systems.
 */

// Engine-level audio ids (mapped to URLs by AudioPack).
// Keep this list small and stable; games can re-skin by swapping URLs.
export type EngineSoundId = "coin" | "hit" | "ui_click" | "ambience";

export type SceneArtDirectives = {
  background?: number;
  fogColor?: number;
  fogNear?: number;
  fogFar?: number;
};

export type LightingArtDirectives = {
  ambientColor?: number;
  ambientIntensity?: number;
  dirColor?: number;
  dirIntensity?: number;
  dirPosition?: { x: number; y: number; z: number };
};

export type TrackArtDirectives = {
  base?: number;
  divider?: number;
  edge?: number;
  roughness?: number;
  metalness?: number;
  dividerWidth?: number;
  edgeWidth?: number;
  dividerDash?: [number, number];
  scrollMultiplier?: number;
};

export type EntityArtDirectives = {
  coin?: number;
  shield?: number;
  obstacle?: number;
};

export type EnvironmentArtPack = {
  scene?: SceneArtDirectives;
  lighting?: LightingArtDirectives;
  track?: TrackArtDirectives;
  entities?: EntityArtDirectives;
};

export type AudioPack = {
  /**
   * Map logical sound ids to URL paths (served from /public).
   * Missing files are allowed: loaders should fail silently.
   */
  sounds: Partial<Record<EngineSoundId, string>>;

  /**
   * Optional: which sound id should be treated as a looped ambience.
   * If omitted, no ambience loop is started.
   */
  ambienceLoopId?: EngineSoundId;
};

export type ArtPack = {
  /** Player visual assets (purely presentational). */
  player: {
    visualMode: PlayerVisualMode;
    modelUrl?: string;
    modelScale?: number;
    color?: number;
    roughness?: number;
    metalness?: number;
    emissiveIntensity?: number;
    colliderVisible?: boolean;
    lockRotation?: boolean;
    lockScale?: boolean;
  };
  environment?: EnvironmentArtPack;
};

export type ContentPack = {
  id: string;
  art: ArtPack;
  audio: AudioPack;
};

// ------------------------
// Built-in packs (placeholders)
// ------------------------

export const CONTENT_PACKS: Record<string, ContentPack> = {
  charon_v2: {
    id: "charon_v2",
    art: {
      player: {
        visualMode: "gltf",
        modelUrl: "/models/charon_boat.glb",
        modelScale: 1.0,
        color: 0x67fbff,
        roughness: 0.06,
        metalness: 0.92,
        emissiveIntensity: 0.95,
        colliderVisible: false,
        lockRotation: true,
        lockScale: true,
      },
      environment: {
        scene: {
          background: 0x061018,
          fogColor: 0x07131c,
          fogNear: 18,
          fogFar: 82,
        },
        lighting: {
          ambientColor: 0xbfd9ff,
          ambientIntensity: 0.38,
          dirColor: 0xaad7ff,
          dirIntensity: 1.35,
          dirPosition: { x: 20, y: 100, z: 50 },
        },
        track: {
          base: 0x08141e,
          divider: 0x1b4256,
          edge: 0x67fbff,
          roughness: 0.1,
          metalness: 0.8,
          dividerWidth: 7,
          edgeWidth: 20,
          dividerDash: [20, 30],
          scrollMultiplier: 0.04,
        },
        entities: { coin: 0xffd45a, shield: 0x00ffff, obstacle: 0xff4b83 },
      },
    },
    audio: {
      sounds: {
        coin: "/audio/coin.mp3",
        hit: "/audio/hit.mp3",
        ui_click: "/audio/ui_click.mp3",
        ambience: "/audio/v2_ambience.mp3",
      },
      ambienceLoopId: "ambience",
    },
  },

  charon_v3: {
    id: "charon_v3",
    art: {
      player: {
        visualMode: "gltf",
        modelUrl: "/models/runner.glb",
        modelScale: 1.0,
        color: 0xb8d9ff,
        roughness: 0.38,
        metalness: 0.18,
        emissiveIntensity: 0.22,
        colliderVisible: false,
        lockRotation: true,
        lockScale: true,
      },
      environment: {
        scene: {
          background: 0x0b0f1b,
          fogColor: 0x0b0f1b,
          fogNear: 24,
          fogFar: 112,
        },
        lighting: {
          ambientColor: 0xe3f2ff,
          ambientIntensity: 0.46,
          dirColor: 0xcfe9ff,
          dirIntensity: 1.62,
          dirPosition: { x: 20, y: 100, z: 50 },
        },
        track: {
          base: 0x141a2a,
          divider: 0x3b4f79,
          edge: 0xff5c8a,
          roughness: 0.8,
          metalness: 0.2,
          dividerWidth: 9,
          edgeWidth: 18,
          dividerDash: [28, 22],
          scrollMultiplier: 0.05,
        },
        entities: { coin: 0xffd700, shield: 0x00f6ff, obstacle: 0xff4f7d },
      },
    },
    audio: {
      sounds: {
        coin: "/audio/coin.mp3",
        hit: "/audio/hit.mp3",
        ui_click: "/audio/ui_click.mp3",
        ambience: "/audio/v3_ambience.mp3",
      },
      ambienceLoopId: "ambience",
    },
  },
};

export function getDefaultContentPackIdForVariant(variant: GameVariant): string {
  return variant === "v2" ? "charon_v2" : "charon_v3";
}

export function getContentPack(id: string): ContentPack {
  return CONTENT_PACKS[id] ?? CONTENT_PACKS.charon_v2;
}
