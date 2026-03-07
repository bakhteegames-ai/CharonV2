import { GAME_CONFIG } from "../config/constants";
import { GAME_VARIANT, type GameVariant } from "../config/variant";
import { AudioManager } from "../audio/AudioManager";
import {
  getContentPack,
  getDefaultContentPackIdForVariant,
  type ContentPack,
} from "./ContentPacks";

/**
 * Minimal platform layer.
 *
 * - GameProfile: selects a ContentPack (art/audio/data) for the build.
 * - ContentPack: assets only; MUST NOT alter gameplay systems.
 *
 * Today we pick by GAME_VARIANT. Later we can select by env/query param
 * (multi-game engine) without touching the engine core.
 */

export type GameProfile = {
  id: string;
  gameId: string;
  variant: GameVariant;
  contentPackId: string;
};

export function getActiveGameProfile(): GameProfile {
  const variant = GAME_VARIANT;
  return {
    id: `charon_${variant}`,
    gameId: "charon",
    variant,
    contentPackId: getDefaultContentPackIdForVariant(variant),
  };
}

export function getActiveContentPack(): ContentPack {
  const profile = getActiveGameProfile();
  return getContentPack(profile.contentPackId);
}

/**
 * Call once at app startup (before Engine/GameWorld construction).
 * Applies the active ContentPack to runtime systems/config.
 */
export function bootstrapPlatform() {
  const profile = getActiveGameProfile();
  const pack = getActiveContentPack();

  // Apply ArtPack (visual-only).
  GAME_CONFIG.PLAYER_VISUAL_MODE = pack.art.player.visualMode;
  if (pack.art.player.modelUrl) GAME_CONFIG.PLAYER_MODEL_URL = pack.art.player.modelUrl;
  if (typeof pack.art.player.modelScale === "number") {
    GAME_CONFIG.PLAYER_MODEL_SCALE = pack.art.player.modelScale;
  }
  if (typeof pack.art.player.color === "number") GAME_CONFIG.COLOR_PLAYER = pack.art.player.color;
  if (typeof pack.art.player.roughness === "number") GAME_CONFIG.PLAYER_MATERIAL_ROUGHNESS = pack.art.player.roughness;
  if (typeof pack.art.player.metalness === "number") GAME_CONFIG.PLAYER_MATERIAL_METALNESS = pack.art.player.metalness;
  if (typeof pack.art.player.emissiveIntensity === "number") GAME_CONFIG.PLAYER_EMISSIVE_INTENSITY = pack.art.player.emissiveIntensity;
  if (typeof pack.art.player.colliderVisible === "boolean") GAME_CONFIG.PLAYER_COLLIDER_VISIBLE = pack.art.player.colliderVisible;
  if (typeof pack.art.player.lockRotation === "boolean") GAME_CONFIG.PLAYER_VISUAL_LOCK_ROTATION = pack.art.player.lockRotation;
  if (typeof pack.art.player.lockScale === "boolean") GAME_CONFIG.PLAYER_VISUAL_LOCK_SCALE = pack.art.player.lockScale;

  // Apply AudioPack (asset-only).
  AudioManager.getInstance().applyAudioPack(pack.audio);

  return { profile, pack };
}
