import * as THREE from "three";
import { GAME_CONFIG, getLaneX } from "../config/constants";
import { MeshFactory } from "../visual/MeshFactory";

export class Coin {
  public mesh: THREE.Mesh;
  public active: boolean = false;
  public boundingBox: THREE.Box3;

  private basePosY: number = 0;
  private time: number = 0;

  constructor() {
    this.mesh = new THREE.Mesh(
      MeshFactory.getCoinGeometry(),
      MeshFactory.getCoinMaterial(),
    );
    this.mesh.castShadow = true;
    this.mesh.visible = false;

    this.boundingBox = new THREE.Box3();
  }

  public spawn(lane: number, z: number) {
    const x = getLaneX(lane);
    this.basePosY = GAME_CONFIG.COIN_SIZE;

    this.mesh.position.set(x, this.basePosY, z);
    this.mesh.visible = true;
    this.active = true;
    this.time = Math.random() * Math.PI * 2; // Randomize start animation phase

    this.mesh.updateMatrixWorld();
    this.boundingBox.setFromObject(this.mesh);
    // Expand Y to account for bobbing animation so we don't need to update it every frame
    this.boundingBox.expandByVector(new THREE.Vector3(0, 0.2, 0));
  }

  public update(dt: number) {
    if (!this.active) return;

    this.time += dt * 3;
    // Spin
    this.mesh.rotation.y += dt * 2;
    // Bob up and down
    this.mesh.position.y = this.basePosY + Math.sin(this.time) * 0.2;

    this.mesh.updateMatrixWorld();
    this.boundingBox.setFromObject(this.mesh);
  }

  public updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }

  public recycle() {
    this.mesh.visible = false;
    this.active = false;
  }
}
