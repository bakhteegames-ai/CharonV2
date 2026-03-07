import * as THREE from "three";
import { GAME_CONFIG } from "../config/constants";
import type { Player } from "../entities/Player";
import { cloneGLTF, loadGLTF } from "../core/AssetCache";

export class VisualPlayer {
  private visualRoot = new THREE.Group();
  private mixer: THREE.AnimationMixer | null = null;
  private model: THREE.Object3D | null = null;

  // Save collider material visibility so we can restore if needed
  private colliderMaterialPrevVisible: boolean | boolean[] | null = null;

  constructor(private player: Player) {
    this.visualRoot.name = "PlayerVisualRoot";
    // Attach visuals under the player object so transforms follow automatically
    this.player.mesh.add(this.visualRoot);

    // If we are still on primitive, do nothing: cube stays as-is.
    if (GAME_CONFIG.PLAYER_VISUAL_MODE !== "gltf") return;

    // In GLTF mode, hide collider draw (but keep collider for collisions)
    if (!GAME_CONFIG.PLAYER_COLLIDER_VISIBLE) this.hideColliderDraw();

    // Fire-and-forget async init (game continues even if model fails)
    void this.initGLTF();
  }

  private hideColliderDraw() {
    const mesh = this.player.mesh as any;
    if (!mesh || !mesh.material) return;
    const mat = mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) {
      this.colliderMaterialPrevVisible = mat.map((m) => m.visible);
      mat.forEach((m) => (m.visible = false));
    } else {
      this.colliderMaterialPrevVisible = mat.visible;
      mat.visible = false;
    }
    // Keep children visible; only disable the collider’s own render/shadows
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  }

  private placeModelToCollider(model: THREE.Object3D) {
    // Align model so its bottom sits on ground (y=0) when player collider bottom is on ground.
    // Player mesh origin is at its center, positioned at y = PLAYER_SIZE/2.
    // So in local space we want model bottom at y = -PLAYER_SIZE/2.
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const minY = box.min.y;

    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= minY;
    model.position.y -= GAME_CONFIG.PLAYER_SIZE / 2;

    model.scale.setScalar(GAME_CONFIG.PLAYER_MODEL_SCALE);
  }

  private async initGLTF() {
    const url = GAME_CONFIG.PLAYER_MODEL_URL;
    if (!url) return;

    try {
      const cached = await loadGLTF(url);
      const clone = cloneGLTF(cached.scene);
      this.model = clone;
      this.visualRoot.add(clone);

      // Shadows on for prettier look
      clone.traverse((o) => {
        const m = o as any;
        if (m && m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });

      this.placeModelToCollider(clone);

      // Play first animation if present (idle/run later)
      if (cached.animations && cached.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(clone);
        const action = this.mixer.clipAction(cached.animations[0]);
        action.play();
      }
    } catch (err) {
      // Fallback gracefully: keep collider visible if model failed.
      console.warn("[VisualPlayer] Failed to load GLTF:", err);
      this.restoreColliderDraw();
    }
  }

  private restoreColliderDraw() {
    const mesh = this.player.mesh as any;
    if (!mesh || !mesh.material || this.colliderMaterialPrevVisible == null)
      return;
    const mat = mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat) && Array.isArray(this.colliderMaterialPrevVisible)) {
      mat.forEach(
        (m, i) => (m.visible = this.colliderMaterialPrevVisible![i] as boolean),
      );
    } else if (
      !Array.isArray(mat) &&
      typeof this.colliderMaterialPrevVisible === "boolean"
    ) {
      mat.visible = this.colliderMaterialPrevVisible;
    }
    this.colliderMaterialPrevVisible = null;
  }

  public update(dt: number) {
    if (this.mixer) this.mixer.update(dt);

    // Keep visuals anchored to collider.
    this.visualRoot.position.y = 0;

    // Optionally cancel collider transforms so visuals aren’t “squashed/rolled” by prototype logic.
    if (GAME_CONFIG.PLAYER_VISUAL_LOCK_ROTATION) {
      // visualRoot is a child; setting it to inverse cancels parent rotation in world space
      this.visualRoot.quaternion.copy(this.player.mesh.quaternion).invert();
    } else {
      this.visualRoot.quaternion.identity();
    }

    if (GAME_CONFIG.PLAYER_VISUAL_LOCK_SCALE) {
      const s = this.player.mesh.scale;
      const invX = s.x !== 0 ? 1 / s.x : 1;
      const invY = s.y !== 0 ? 1 / s.y : 1;
      const invZ = s.z !== 0 ? 1 / s.z : 1;
      this.visualRoot.scale.set(invX, invY, invZ);
    } else {
      this.visualRoot.scale.set(1, 1, 1);
    }
  }

  public dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    if (this.model) {
      this.visualRoot.remove(this.model);
      this.model = null;
    }
    this.player.mesh.remove(this.visualRoot);
    this.restoreColliderDraw();
  }
}
