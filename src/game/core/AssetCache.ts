import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

export type CachedGLTF = {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
};

const gltfCache = new Map<string, Promise<CachedGLTF>>();
const loader = new GLTFLoader();

export async function loadGLTF(url: string): Promise<CachedGLTF> {
  if (!gltfCache.has(url)) {
    gltfCache.set(
      url,
      loader.loadAsync(url).then((gltf) => ({
        scene: gltf.scene,
        animations: gltf.animations ?? [],
      })),
    );
  }
  return gltfCache.get(url)!;
}

// Use SkeletonUtils so skinned meshes (characters) clone correctly.
export function cloneGLTF(scene: THREE.Object3D): THREE.Object3D {
  return SkeletonUtils.clone(scene) as THREE.Object3D;
}
