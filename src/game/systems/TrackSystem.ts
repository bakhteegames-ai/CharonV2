import * as THREE from "three";
import { GAME_CONFIG } from "../config/constants";

export type TrackTheme = {
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

const toCssHex = (hex: number) => `#${hex.toString(16).padStart(6, "0")}`;

export class TrackSystem {
  private trackMesh: THREE.Mesh;
  private texture: THREE.CanvasTexture;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private theme: TrackTheme = {
    base: GAME_CONFIG.COLOR_TRACK,
    divider: 0x2a2a4a,
    edge: GAME_CONFIG.COLOR_PLAYER,
    roughness: 0.8,
    metalness: 0.2,
    dividerWidth: 8,
    edgeWidth: 16,
    dividerDash: [32, 32],
    scrollMultiplier: 0.05,
  };

  constructor(private scene: THREE.Scene) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 512;
    this.canvas.height = 512;
    this.ctx = this.canvas.getContext("2d")!;

    this.drawTexture();

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.repeat.set(1, GAME_CONFIG.TRACK_LENGTH / 5);

    const geometry = new THREE.PlaneGeometry(
      GAME_CONFIG.TRACK_WIDTH,
      GAME_CONFIG.TRACK_LENGTH * 10,
    );
    const material = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.trackMesh = new THREE.Mesh(geometry, material);
    this.trackMesh.rotation.x = -Math.PI / 2;
    this.trackMesh.receiveShadow = true;
    this.scene.add(this.trackMesh);
  }

  private drawTexture() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Base
    ctx.fillStyle = toCssHex(this.theme.base);
    ctx.fillRect(0, 0, w, h);

    // Lane dividers (dashed)
    ctx.strokeStyle = toCssHex(this.theme.divider);
    ctx.lineWidth = this.theme.dividerWidth;
    ctx.setLineDash([...this.theme.dividerDash]);
    ctx.beginPath();
    ctx.moveTo(w / 3, 0);
    ctx.lineTo(w / 3, h);
    ctx.moveTo((w * 2) / 3, 0);
    ctx.lineTo((w * 2) / 3, h);
    ctx.stroke();

    // Edges
    ctx.strokeStyle = toCssHex(this.theme.edge);
    ctx.lineWidth = this.theme.edgeWidth;
    ctx.setLineDash([]);
    const edgeInset = Math.max(this.theme.edgeWidth * 0.5, 1);
    ctx.beginPath();
    ctx.moveTo(edgeInset, 0);
    ctx.lineTo(edgeInset, h);
    ctx.moveTo(w - edgeInset, 0);
    ctx.lineTo(w - edgeInset, h);
    ctx.stroke();
  }

  public applyTheme(theme: TrackTheme) {
    // Cheap equality check (numbers only).
    if (
      theme.base === this.theme.base &&
      theme.divider === this.theme.divider &&
      theme.edge === this.theme.edge &&
      theme.roughness === this.theme.roughness &&
      theme.metalness === this.theme.metalness &&
      theme.dividerWidth === this.theme.dividerWidth &&
      theme.edgeWidth === this.theme.edgeWidth &&
      theme.dividerDash[0] === this.theme.dividerDash[0] &&
      theme.dividerDash[1] === this.theme.dividerDash[1] &&
      theme.scrollMultiplier === this.theme.scrollMultiplier
    ) {
      return;
    }

    this.theme = theme;
    this.drawTexture();
    this.texture.needsUpdate = true;

    const material = this.trackMesh.material as THREE.MeshStandardMaterial;
    material.roughness = theme.roughness;
    material.metalness = theme.metalness;
    material.needsUpdate = true;
  }

  public update(dt: number, playerZ: number, speed: number) {
    // Infinite feel (visual only)
    this.trackMesh.position.z = playerZ - GAME_CONFIG.TRACK_LENGTH;
    const material = this.trackMesh.material as THREE.MeshStandardMaterial;
    if (material.map) {
      material.map.offset.y -= speed * dt * this.theme.scrollMultiplier;
    }
  }
}
