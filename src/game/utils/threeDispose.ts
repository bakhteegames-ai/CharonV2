import * as THREE from "three";

export function disposeSceneResources(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((obj) => {
    const anyObj = obj as any;
    if (anyObj.geometry)
      geometries.add(anyObj.geometry as THREE.BufferGeometry);

    if (anyObj.material) {
      const mat = anyObj.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((m) => materials.add(m));
      else materials.add(mat);
    }
  });

  materials.forEach((m) => {
    const anyMat = m as any;
    const maybeTextures: (THREE.Texture | null | undefined)[] = [
      anyMat.map,
      anyMat.emissiveMap,
      anyMat.roughnessMap,
      anyMat.metalnessMap,
      anyMat.normalMap,
      anyMat.aoMap,
      anyMat.alphaMap,
    ];
    maybeTextures.forEach((t) => t && textures.add(t));
    m.dispose();
  });

  textures.forEach((t) => t.dispose());
  geometries.forEach((g) => g.dispose());
}
