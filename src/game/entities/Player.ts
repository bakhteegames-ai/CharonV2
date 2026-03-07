import * as THREE from "three";
import { GAME_CONFIG, getLaneX } from "../config/constants";
import { MOVEMENT_PROFILE, hasCapability } from "../config/movementProfile";
import { InputSystem } from "../systems/InputSystem";
import { lerp } from "../utils/math";
import { GameState } from "../state/GameState";

export class Player {
  public mesh: THREE.Mesh;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;

  private input: InputSystem;
  private gameState: GameState;

  private currentLane: number = 0; // -1: Left, 0: Center, 1: Right
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private scaleMultiplier: number = 1;

  private visualRollZ: number = 0;
  private visualPitchX: number = 0;

  constructor(input: InputSystem) {
    this.input = input;
    this.gameState = GameState.getInstance();

    // Simple cube for now
    const geometry = new THREE.BoxGeometry(
      GAME_CONFIG.PLAYER_SIZE,
      GAME_CONFIG.PLAYER_SIZE,
      GAME_CONFIG.PLAYER_SIZE,
    );
    const material = new THREE.MeshStandardMaterial({
      color: GAME_CONFIG.COLOR_PLAYER,
      roughness: GAME_CONFIG.PLAYER_MATERIAL_ROUGHNESS,
      metalness: GAME_CONFIG.PLAYER_MATERIAL_METALNESS,
      emissive: GAME_CONFIG.COLOR_PLAYER,
      emissiveIntensity: GAME_CONFIG.PLAYER_EMISSIVE_INTENSITY,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.reset();
  }

  public get currentX(): number {
    return this.mesh.position.x;
  }

  public get targetX(): number {
    return getLaneX(this.currentLane);
  }

  /**
   * Axis-aligned collider box for gameplay collisions.
   * IMPORTANT: Do NOT use Box3.setFromObject(this.mesh) because Player.mesh has visual children (VFX/model),
   * which would incorrectly enlarge the collider.
   */
  public getColliderBox(out: THREE.Box3): THREE.Box3 {
    const sx = GAME_CONFIG.PLAYER_SIZE * this.mesh.scale.x;
    const baseH = this.isSliding
      ? GAME_CONFIG.PLAYER_SIZE * GAME_CONFIG.PLAYER_SLIDE_HEIGHT
      : GAME_CONFIG.PLAYER_SIZE;
    const sy = baseH * this.mesh.scale.y;
    const sz = GAME_CONFIG.PLAYER_SIZE * this.mesh.scale.z;
    return out.setFromCenterAndSize(
      this.mesh.position,
      new THREE.Vector3(sx, sy, sz),
    );
  }

  public reset() {
    this.currentLane = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.scaleMultiplier = 1;
    this.mesh.scale.set(1, 1, 1);
    this.mesh.position.set(0, GAME_CONFIG.PLAYER_SIZE / 2, 0);
    this.velocity.set(0, 0, 0);
    this.visualRollZ = 0;
    this.visualPitchX = 0;
    this.isGrounded = true;
  }

  public pulse() {
    this.scaleMultiplier = 1.4;
  }

  public update(dt: number) {
    // Forward movement based on global speed
    this.velocity.z = -this.gameState.currentSpeed;

    // Handle Lane Switching
    if (this.input.moveLeft && this.currentLane > -1) {
      this.currentLane--;
    } else if (this.input.moveRight && this.currentLane < 1) {
      this.currentLane++;
    }

    // Smooth lateral movement (lerp)
    const previousX = this.mesh.position.x;
    const targetX = getLaneX(this.currentLane);

    // Frame-rate independent lerp
    this.mesh.position.x = lerp(
      this.mesh.position.x,
      targetX,
      1 - Math.exp(-GAME_CONFIG.PLAYER_LANE_SWITCH_SPEED * dt),
    );

    // Calculate actual lateral velocity for visual effects (tilt/roll)
    // Guard against extremely small/zero dt (can happen on some frames / HMR)
    if (dt > 1e-6) {
      this.velocity.x = (this.mesh.position.x - previousX) / dt;
    } else {
      this.velocity.x = 0;
    }

    // Jumping
    if (hasCapability("jump") && this.input.jump && this.isGrounded && !this.isSliding) {
      this.velocity.y = GAME_CONFIG.PLAYER_JUMP_FORCE;
      this.isGrounded = false;
    }

    // Down action: SLIDE (v3) / CROUCH (v2). Same logic, no cooldown.
    if (hasCapability("slide") && this.input.slide && this.isGrounded && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = GAME_CONFIG.PLAYER_SLIDE_DURATION;
      this.mesh.position.y =
        (GAME_CONFIG.PLAYER_SIZE * GAME_CONFIG.PLAYER_SLIDE_HEIGHT) / 2;
    }

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.slideTimer = 0;
        this.mesh.position.y = GAME_CONFIG.PLAYER_SIZE / 2;
      }
    }

    // Apply gravity (v3 only)
    if (hasCapability("jump") && !this.isGrounded) {
      this.velocity.y += GAME_CONFIG.GRAVITY * dt;
      // Fast fall if sliding while in air
      if (this.input.slide) {
        this.velocity.y += GAME_CONFIG.GRAVITY * dt * 2;
      }
    }

    // Apply vertical and forward velocity to position
    if (MOVEMENT_PROFILE.lockVertical) {
      // v2 boat: lock collider Y stable and never accumulate vertical velocity.
      this.velocity.y = 0;
      this.isGrounded = true;
      const h = this.isSliding
        ? GAME_CONFIG.PLAYER_SIZE * GAME_CONFIG.PLAYER_SLIDE_HEIGHT
        : GAME_CONFIG.PLAYER_SIZE;
      this.mesh.position.y = h / 2;
    } else {
      this.mesh.position.y += this.velocity.y * dt;
    }
    this.mesh.position.z += this.velocity.z * dt;

    // Visual polish: Roll (lane change) and Pitch (speed) with smoothing + clamp
    const rollSign = GAME_CONFIG.PLAYER_INERTIA_ROLL ? 1 : -1;
    const targetRoll = THREE.MathUtils.clamp(
      rollSign * this.velocity.x * GAME_CONFIG.PLAYER_ROLL_MULTIPLIER,
      -GAME_CONFIG.PLAYER_MAX_ROLL,
      GAME_CONFIG.PLAYER_MAX_ROLL,
    );
    this.visualRollZ = lerp(
      this.visualRollZ,
      targetRoll,
      1 - Math.exp(-GAME_CONFIG.PLAYER_ROLL_SMOOTH * dt),
    );

    const targetPitch = THREE.MathUtils.clamp(
      -this.gameState.currentSpeed * GAME_CONFIG.PLAYER_PITCH_MULTIPLIER,
      -GAME_CONFIG.PLAYER_MAX_PITCH,
      GAME_CONFIG.PLAYER_MAX_PITCH,
    );
    this.visualPitchX = lerp(
      this.visualPitchX,
      targetPitch,
      1 - Math.exp(-GAME_CONFIG.PLAYER_PITCH_SMOOTH * dt),
    );

    this.mesh.rotation.z = this.visualRollZ;
    this.mesh.rotation.x = this.visualPitchX;

    // Visual polish: Scale pulse
    this.scaleMultiplier = lerp(
      this.scaleMultiplier,
      1,
      1 - Math.exp(-15 * dt),
    );

    // Handle slide scaling combined with pulse
    if (this.isSliding) {
      this.mesh.scale.set(
        this.scaleMultiplier,
        GAME_CONFIG.PLAYER_SLIDE_HEIGHT * this.scaleMultiplier,
        this.scaleMultiplier,
      );
    } else {
      this.mesh.scale.set(
        this.scaleMultiplier,
        this.scaleMultiplier,
        this.scaleMultiplier,
      );
    }

    // Ground collision (v3 only). v2 is hard-locked above.
    if (!MOVEMENT_PROFILE.lockVertical) {
      const currentHeight = this.isSliding
        ? GAME_CONFIG.PLAYER_SIZE * GAME_CONFIG.PLAYER_SLIDE_HEIGHT
        : GAME_CONFIG.PLAYER_SIZE;
      if (this.mesh.position.y <= currentHeight / 2) {
        this.mesh.position.y = currentHeight / 2;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }
  }
}
