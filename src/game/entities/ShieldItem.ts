import * as THREE from "three";
import { GAME_CONFIG, getLaneX } from "../config/constants";
import { MeshFactory } from "../visual/MeshFactory";

export class ShieldItem {
  public mesh: THREE.Mesh;
  public active: boolean = false;
  public boundingBox: THREE.Box3;

  private basePosY: number = 0;
  private time: number = 0;

  constructor() {
    this.mesh = new THREE.Mesh(
      MeshFactory.getShieldGeometry(),
      MeshFactory.getShieldMaterial(),
    );
    this.mesh.castShadow = true;
    this.mesh.visible = false;
    this.boundingBox = new THREE.Box3();
  }

  public spawn(lane: number, z: number) {
    const x = getLaneX(lane);
    this.basePosY = GAME_CONFIG.COIN_SIZE * 1.5;

    this.mesh.position.set(x, this.basePosY, z);
    this.mesh.visible = true;
    this.active = true;
    this.time = 0;

    this.mesh.updateMatrixWorld();
    this.boundingBox.setFromObject(this.mesh);
    this.boundingBox.expandByVector(new THREE.Vector3(0, 0.5, 0));
  }

  public update(dt: number) {
    if (!this.active) return;
    this.time += dt * 2;
    this.mesh.rotation.y += dt * 3;
    this.mesh.rotation.z += dt * 1;
    this.mesh.position.y = this.basePosY + Math.sin(this.time) * 0.3;

    this.mesh.updateMatrixWorld();
    this.boundingBox.setFromObject(this.mesh);
    this.boundingBox.expandByVector(new THREE.Vector3(0, 0.5, 0));
  }

  public recycle() {
    this.mesh.visible = false;
    this.active = false;
  }
}
