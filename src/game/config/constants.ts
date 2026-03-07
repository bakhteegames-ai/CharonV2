export type PlayerVisualMode = "primitive" | "gltf";

export const GAME_HOOKS = {
  ENABLE_COIN_COMBO: true,
  ENABLE_SHIELD: true,
  ENABLE_NEAR_MISS: true,
};

export const GAME_CONFIG = {
  // Difficulty ramp (skeleton progression)
  DIFFICULTY_RAMP_DISTANCE: 2200,
  DIFFICULTY_CURVE: 1.6,
  DIFFICULTY_MIN: 0,
  DIFFICULTY_MAX: 1,

  // VFX (easy to remove later)
  VFX_ENABLE_COIN_PARTICLES: true,
  VFX_COIN_PARTICLE_POOL: 96,
  VFX_COIN_PARTICLES_PER_PICKUP: 7,
  VFX_COIN_PARTICLE_LIFETIME: 0.35, // seconds
  VFX_COIN_PARTICLE_SPEED: 7.5,
  VFX_COIN_PARTICLE_GRAVITY: -18,
  VFX_COIN_PARTICLE_SIZE: 0.08,

  // World
  GRAVITY: -40,
  TRACK_WIDTH: 9, // Exactly 3x LANE_WIDTH for perfect centering
  TRACK_LENGTH: 200,
  LANE_WIDTH: 3,

  // Speed System
  INITIAL_SPEED: 20,
  MAX_SPEED: 60,
  SPEED_ACCELERATION: 0.5, // units per second

  // Camera FOV (speed feel)
  CAMERA_FOV_BASE: 75,
  CAMERA_FOV_MAX: 90,
  CAMERA_FOV_SMOOTH: 6,

  // Obstacles & Spawning
  OBSTACLE_SPAWN_DISTANCE: 120, // How far ahead to spawn
  OBSTACLE_DESPAWN_DISTANCE: 20, // How far behind player to despawn
  SPAWN_INTERVAL_MIN: 20, // Minimum distance between obstacle rows
  SPAWN_INTERVAL_MAX: 45, // Maximum distance between obstacle rows
  OBSTACLE_SIZE: 1,

  // Coins
  COIN_SIZE: 0.5,
  SCORE_PER_COIN: 10,
  COIN_COMBO_TIMEOUT: 2.0, // seconds
  MAX_COIN_COMBO: 5,

  // Shield
  SHIELD_SPAWN_CHANCE: 0.1, // 10% chance instead of a coin line

  // Near Miss
  NEAR_MISS_MARGIN: 0.8, // Extra collision box margin to trigger near miss
  NEAR_MISS_BONUS: 25,

  // Player
  PLAYER_LANE_SWITCH_SPEED: 15, // How fast to lerp between lanes
  PLAYER_JUMP_FORCE: 15,
  PLAYER_SIZE: 1,
  PLAYER_SLIDE_HEIGHT: 0.5,
  PLAYER_MATERIAL_ROUGHNESS: 0.1,
  PLAYER_MATERIAL_METALNESS: 0.8,
  PLAYER_EMISSIVE_INTENSITY: 0.6,

  PLAYER_SLIDE_DURATION: 0.8, // seconds

  // Player visuals / models (future-proofing)
  // "primitive" = current cube
  // "gltf" = load GLTF model and attach to player
  PLAYER_VISUAL_MODE: "primitive" as PlayerVisualMode,
  // Put your model here later (Vite: place file in /public/models/charon.glb)
  PLAYER_MODEL_URL: "/models/charon.glb",
  PLAYER_MODEL_SCALE: 1.0,
  // If true, the visual model will NOT inherit collider rotation (roll/pitch)
  PLAYER_VISUAL_LOCK_ROTATION: false,
  // If true, the visual model will NOT inherit collider scale (slide squash / pulse)
  PLAYER_VISUAL_LOCK_SCALE: false,
  // Debug: keep collider rendered even in GLTF mode
  PLAYER_COLLIDER_VISIBLE: true,

  // Player visuals (feel)
  // "Physical" inertial lean: move right => lean left (default true)
  PLAYER_INERTIA_ROLL: true,
  PLAYER_ROLL_MULTIPLIER: 0.06, // radians per (units/sec) of lateral velocity
  PLAYER_MAX_ROLL: 0.35, // radians clamp
  PLAYER_ROLL_SMOOTH: 18, // higher = smoother
  PLAYER_PITCH_MULTIPLIER: 0.006, // radians per speed unit
  PLAYER_MAX_PITCH: 0.25,
  PLAYER_PITCH_SMOOTH: 10,

  // Camera
  CAMERA_OFFSET_Y: 5,
  CAMERA_OFFSET_Z: 8,
  CAMERA_LOOK_AHEAD: 15,

  // Camera stability (fixes lane-switch horizon shift)
  // 0.0 = camera stays centered on track; 1.0 = camera fully follows player X
  CAMERA_LATERAL_FOLLOW: 0.0,
  CAMERA_CENTER_X: 0,
  // IMPORTANT: keep camera independent from jump
  CAMERA_FOLLOW_PLAYER_Y: 0.0, // 0.0 = never follow jump/slide, 1.0 = follow fully
  CAMERA_TARGET_Y: 0.5, // where camera aims on Y (player center on ground)

  // Roll/tilt is the main cause of "lane jitter" feelings.
  // Disable by default for stability. Enable later if you want juice.
  CAMERA_ROLL_ENABLED: false,
  CAMERA_MAX_ROLL: 0.18, // radians (reduced)
  CAMERA_MAX_TILT_VELOCITY: 25, // reduced clamp
  CAMERA_ROLL_SMOOTH: 12, // higher = smoother roll

  // Colors (Neon/Synthwave vibe)
  COLOR_BG: 0x0f0f1b,
  COLOR_TRACK: 0x1a1a2e,
  COLOR_PLAYER: 0x00f0ff, // Neon Cyan
  COLOR_OBSTACLE: 0xff0055, // Neon Pink
  COLOR_COIN: 0xffd700, // Gold
  COLOR_SHIELD: 0x00ffff, // Cyan

  // Camera & Feel
  CAMERA_FOLLOW_SPEED: 5,
  CAMERA_TILT_MULTIPLIER: 0.015,
  SHAKE_DURATION: 0.4,
  SHAKE_INTENSITY: 0.5,
};

export const getLaneX = (laneIndex: number): number => {
  // laneIndex: -1 (left), 0 (center), 1 (right)
  return laneIndex * GAME_CONFIG.LANE_WIDTH;
};
