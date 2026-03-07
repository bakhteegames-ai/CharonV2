import type { BiomeId } from "../systems/BiomeDirector";
import { GAME_VARIANT, type GameVariant, VARIANT_ART_CONFIGS } from "../config/variant";
import {
  getContentPack,
  getDefaultContentPackIdForVariant,
} from "../platform/ContentPacks";

export type VisualThemeKey = `${GameVariant}:${BiomeId}`;

export type VisualTheme = {
  key: VisualThemeKey;

  scene: {
    background: number;
    fogColor: number;
    fogNear: number;
    fogFar: number;
  };

  lighting: {
    ambientColor: number;
    ambientIntensity: number;

    dirColor: number;
    dirIntensity: number;
    dirPosition: { x: number; y: number; z: number };
  };

  track: {
    base: number;
    divider: number;
    edge: number;
    roughness: number;
    metalness: number;
    dividerWidth: number;
    edgeWidth: number;
    dividerDash: [number, number];
    scrollMultiplier: number;
  };

  entities: {
    coin: number;
    shield: number;
    obstacle: number;
  };
};

const mk = (variant: GameVariant, biomeId: BiomeId): VisualThemeKey =>
  `${variant}:${biomeId}` as const;

const getEnvironmentPack = (variant: GameVariant) =>
  getContentPack(getDefaultContentPackIdForVariant(variant)).art.environment;

/**
 * Phase 2 (Visual Packaging):
 * Centralized, purely-visual theme table (variant × biome).
 * IMPORTANT: This must NOT affect gameplay, movement, collisions, or spawns.
 */
export const getVisualTheme = (
  biomeId: BiomeId,
  variant: GameVariant = GAME_VARIANT,
): VisualTheme => {
  const art = VARIANT_ART_CONFIGS[variant];
  const env = getEnvironmentPack(variant);

  const theme: VisualTheme = {
    key: mk(variant, biomeId),
    scene: {
      background: env?.scene?.background ?? art.skyColor,
      fogColor: env?.scene?.fogColor ?? art.fogColor,
      fogNear: env?.scene?.fogNear ?? art.fogNear,
      fogFar: env?.scene?.fogFar ?? art.fogFar,
    },
    lighting: {
      ambientColor: env?.lighting?.ambientColor ?? art.ambientLightColor,
      ambientIntensity: env?.lighting?.ambientIntensity ?? art.ambientIntensity,
      dirColor: env?.lighting?.dirColor ?? art.dirLightColor,
      dirIntensity: env?.lighting?.dirIntensity ?? art.dirIntensity,
      dirPosition: env?.lighting?.dirPosition ?? { x: 20, y: 100, z: 50 },
    },
    track: {
      base: env?.track?.base ?? art.trackTint,
      divider: env?.track?.divider ?? (variant === "v2" ? 0x0c2432 : 0x22314f),
      edge: env?.track?.edge ?? art.accentColor,
      roughness: env?.track?.roughness ?? art.trackRoughness,
      metalness: env?.track?.metalness ?? art.trackMetalness,
      dividerWidth: env?.track?.dividerWidth ?? 8,
      edgeWidth: env?.track?.edgeWidth ?? 16,
      dividerDash: env?.track?.dividerDash ?? (variant === "v2" ? [18, 46] : [32, 32]),
      scrollMultiplier: env?.track?.scrollMultiplier ?? (variant === "v2" ? 0.04 : 0.05),
    },
    entities: {
      coin: env?.entities?.coin ?? (variant === "v2" ? 0xffd45a : 0xffd700),
      shield: env?.entities?.shield ?? (variant === "v2" ? 0x00ffff : 0x00f6ff),
      obstacle: env?.entities?.obstacle ?? (variant === "v2" ? 0xff1b6a : 0xff0055),
    },
  };

  // Optional biome tweaks
  if (biomeId === "asphodel") {
    theme.scene.background = variant === "v2" ? 0x0b0f14 : 0x141417;
    theme.scene.fogColor = variant === "v2" ? 0x0d1218 : 0x141417;
  } else if (biomeId === "tartarus") {
    theme.scene.background = variant === "v2" ? 0x09040a : 0x12070c;
    theme.scene.fogColor = variant === "v2" ? 0x0c040a : 0x12070c;
  }

  return theme;
};
