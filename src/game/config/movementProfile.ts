import { GAME_VARIANT, type GameVariant } from "./variant";

export type MovementCapability = "jump" | "slide";

export type MovementProfile = {
  variant: GameVariant;
  capabilities: Set<MovementCapability>;

  /** v2 boat: keep collider Y stable (no gravity / no vertical motion). */
  lockVertical: boolean;

  /** UI labels */
  downActionLabel: string;
  controlsHint: string;
};

export const createMovementProfile = (variant: GameVariant): MovementProfile => {
  if (variant === "v2") {
    return {
      variant,
      capabilities: new Set<MovementCapability>(["slide"]),
      lockVertical: true,
      downActionLabel: "CROUCH",
      controlsHint:
        "LANE: ←/→ (A/D) | CROUCH: ↓ (S) / swipe↓ | JUMP: — (disabled)",
    };
  }

  return {
    variant,
    capabilities: new Set<MovementCapability>(["jump", "slide"]),
    lockVertical: false,
    downActionLabel: "SLIDE",
    controlsHint:
      "LANE: ←/→ (A/D) | JUMP: ↑ (W/Space) / swipe↑ | SLIDE: ↓ (S) / swipe↓",
  };
};

export const MOVEMENT_PROFILE = createMovementProfile(GAME_VARIANT);

export const hasCapability = (cap: MovementCapability) =>
  MOVEMENT_PROFILE.capabilities.has(cap);
