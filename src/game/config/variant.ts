export type GameVariant = "v2" | "v3";

export let GAME_VARIANT: GameVariant = "v2";

export function setGameVariant(v: GameVariant) {
  GAME_VARIANT = v;
}

export const IS_V2 = () => GAME_VARIANT === "v2";
export const IS_V3 = () => GAME_VARIANT === "v3";

export type VariantArtConfig = {
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambientLightColor: number;
  ambientIntensity: number;
  dirLightColor: number;
  dirIntensity: number;
  skyColor: number;
  trackTint: number;
  trackRoughness: number;
  trackMetalness: number;
  accentColor: number;
};

export const VARIANT_ART_CONFIGS: Record<GameVariant, VariantArtConfig> = {
  v2: {
    fogColor: 0x07131c,
    fogNear: 15,
    fogFar: 70,
    ambientLightColor: 0xbfd9ff,
    ambientIntensity: 0.3,
    dirLightColor: 0xaad7ff,
    dirIntensity: 1.2,
    skyColor: 0x061018,
    trackTint: 0x08141e,
    trackRoughness: 0.1,
    trackMetalness: 0.8,
    accentColor: 0x00ffff,
  },
  v3: {
    fogColor: 0x0b0f1b,
    fogNear: 20,
    fogFar: 100,
    ambientLightColor: 0xe3f2ff,
    ambientIntensity: 0.4,
    dirLightColor: 0xcfe9ff,
    dirIntensity: 1.5,
    skyColor: 0x0b0f1b,
    trackTint: 0x141a2a,
    trackRoughness: 0.8,
    trackMetalness: 0.2,
    accentColor: 0xff0055,
  }
};
