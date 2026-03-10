# Charon V2 — 3D Assets

## charon_gondola.glb
Low-poly / mid-poly stylized asset. Target ≤ 5 000 triangles.
Browser / mobile runtime (Three.js + GLTFLoader).

## How to generate
```bash
blender --background --python charon_generate.py
```
Blender 4.x required. Output: `charon_gondola.glb` in this folder.

## Palette
| Name | Hex |
|---|---|
| Moon Ivory | #F4E1D4 |
| Pale Aqua | #A8DCCC |
| Spectral Teal | #45A790 |
| Ethereal Mint | #2A905F |
| Gheet Gold | #F2E261 |
| Soft Bone | #E9E1D4 |

## Parts
- `Gondola` — hull mesh
- `GoldTrim` — rim trim strip
- `CharonBody` — robe (tapered cylinder)
- `Hood` — hooded head sphere
- `HoodPeak` — gold horn spike
- `FacePlane` — visible face quad
- `Shoulder_L / R` — pauldrons
- `PaddleShaft` — oar shaft
- `PaddleBlade` — oar blade
- `PaddleGlow` — emissive tip (Ethereal Mint, strength 2.0)

## Animation frames (next step)
- **READY** — neutral idle pose
- **STROKE** — paddle mid-pull
- **FOLLOW_THROUGH** — extended finish
