import * as THREE from "three";
import { GAME_CONFIG, getLaneX } from "../config/constants";
import { MeshFactory } from "../visual/MeshFactory";

export enum ObstacleType {
  BLOCK = 0, // Normal block, can be jumped over
  BARRICADE = 1, // Tall block, cannot be jumped over, must switch lane
  OVERHEAD = 2, // Floating block, must slide under
}

export class Obstacle {
  public mesh: THREE.Mesh;
  public active: boolean = false;
  public boundingBox: THREE.Box3;
  public type: ObstacleType;
  public nearMissTriggered: boolean = false;

  constructor() {
    this.type = ObstacleType.BLOCK;
    this.mesh = new THREE.Mesh(
      MeshFactory.getObstacleGeometry(),
      MeshFactory.getObstacleMaterial(),
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;

    this.boundingBox = new THREE.Box3();
  }

  public spawn(
    lane: number,
    z: number,
    type: ObstacleType = ObstacleType.BLOCK,
  ) {
    this.type = type;
    this.nearMissTriggered = false;
    const x = getLaneX(lane);

    if (type === ObstacleType.BARRICADE) {
      this.mesh.scale.set(1, 3, 1);
      this.mesh.position.set(x, (GAME_CONFIG.OBSTACLE_SIZE * 3) / 2, z);
    } else if (type === ObstacleType.OVERHEAD) {
      this.mesh.scale.set(1, 1, 1);
      // Must collide when standing, but be passable while sliding.
      // Player top while sliding is PLAYER_SIZE * PLAYER_SLIDE_HEIGHT.
      const slideTop =
        GAME_CONFIG.PLAYER_SIZE * GAME_CONFIG.PLAYER_SLIDE_HEIGHT;
      const obstacleHalfHeight = GAME_CONFIG.OBSTACLE_SIZE / 2;
      const clearance = 0.1;
      this.mesh.position.set(x, slideTop + obstacleHalfHeight + clearance, z);
    } else {
      this.mesh.scale.set(1, 1, 1);
      this.mesh.position.set(x, GAME_CONFIG.OBSTACLE_SIZE / 2, z);
    }

    this.mesh.visible = true;
    this.active = true;

    // Force matrix update to ensure bounding box is calculated correctly
    this.mesh.updateMatrixWorld();
    this.updateBoundingBox();
  }

  public updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }

  public recycle() {
    this.mesh.visible = false;
    this.active = false;
  }
}
