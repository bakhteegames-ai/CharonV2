import * as THREE from "three";
import { GAME_CONFIG } from "../config/constants";
import { GameState } from "../state/GameState";
import { Player } from "../entities/Player";
import { lerp } from "../utils/math";

export class CameraSystem {
  private cameraRollZ = 0;
  private rollAxis = new THREE.Vector3(0, 0, 1);
  private rollQuat = new THREE.Quaternion();
  private lastFov = -1;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private player: Player,
    private gameState: GameState,
  ) {}

  public update(dt: number) {
    // Speed-based FOV (strong "sense of acceleration")
    const speedT = THREE.MathUtils.clamp(
      (this.gameState.currentSpeed - GAME_CONFIG.INITIAL_SPEED) /
        Math.max(1e-6, GAME_CONFIG.MAX_SPEED - GAME_CONFIG.INITIAL_SPEED),
      0,
      1,
    );
    const targetFov =
      GAME_CONFIG.CAMERA_FOV_BASE +
      (GAME_CONFIG.CAMERA_FOV_MAX - GAME_CONFIG.CAMERA_FOV_BASE) * speedT;
    this.camera.fov = lerp(
      this.camera.fov,
      targetFov,
      1 - Math.exp(-GAME_CONFIG.CAMERA_FOV_SMOOTH * dt),
    );
    if (Math.abs(this.camera.fov - this.lastFov) > 0.01) {
      this.camera.updateProjectionMatrix();
      this.lastFov = this.camera.fov;
    }

    const camFocusX = THREE.MathUtils.lerp(
      GAME_CONFIG.CAMERA_CENTER_X,
      this.player.mesh.position.x,
      GAME_CONFIG.CAMERA_LATERAL_FOLLOW,
    );

    this.camera.position.x = lerp(
      this.camera.position.x,
      camFocusX,
      1 - Math.exp(-GAME_CONFIG.CAMERA_FOLLOW_SPEED * dt),
    );

    const basePlayerY = GAME_CONFIG.PLAYER_SIZE / 2;
    const playerYOffset =
      (this.player.mesh.position.y - basePlayerY) *
      GAME_CONFIG.CAMERA_FOLLOW_PLAYER_Y;

    // Shake as translation (doesn't rotate horizon)
    let shakeX = 0;
    let shakeY = 0;
    if (this.gameState.shakeTimer > 0) {
      this.gameState.shakeTimer -= dt;
      const intensity =
        GAME_CONFIG.SHAKE_INTENSITY *
        (this.gameState.shakeTimer / GAME_CONFIG.SHAKE_DURATION);
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    }

    this.camera.position.y =
      basePlayerY + GAME_CONFIG.CAMERA_OFFSET_Y + playerYOffset + shakeY;
    this.camera.position.z =
      this.player.mesh.position.z + GAME_CONFIG.CAMERA_OFFSET_Z;
    this.camera.position.x += shakeX;

    // Optional roll (OFF by default)
    let targetRoll = 0;
    if (GAME_CONFIG.CAMERA_ROLL_ENABLED) {
      const v = THREE.MathUtils.clamp(
        this.player.velocity.x,
        -GAME_CONFIG.CAMERA_MAX_TILT_VELOCITY,
        GAME_CONFIG.CAMERA_MAX_TILT_VELOCITY,
      );
      targetRoll = THREE.MathUtils.clamp(
        -v * GAME_CONFIG.CAMERA_TILT_MULTIPLIER,
        -GAME_CONFIG.CAMERA_MAX_ROLL,
        GAME_CONFIG.CAMERA_MAX_ROLL,
      );
    }
    this.cameraRollZ = lerp(
      this.cameraRollZ,
      targetRoll,
      1 - Math.exp(-GAME_CONFIG.CAMERA_ROLL_SMOOTH * dt),
    );

    this.camera.lookAt(
      camFocusX,
      (GAME_CONFIG.CAMERA_TARGET_Y ?? basePlayerY) + playerYOffset,
      this.player.mesh.position.z - GAME_CONFIG.CAMERA_LOOK_AHEAD,
    );

    // Apply roll after lookAt
    this.camera.quaternion.multiply(
      this.rollQuat.setFromAxisAngle(this.rollAxis, this.cameraRollZ),
    );
  }
}
