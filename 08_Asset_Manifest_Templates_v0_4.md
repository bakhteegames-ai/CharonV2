# Asset Manifest Templates v0.4

Используй эти шаблоны для любого нового ассета.  
Их можно хранить как markdown, yaml или json — главное, чтобы поля оставались одинаковыми.

---

## 1. Player model manifest

```yaml
asset_id: charon_player_model
category: player_model
variant: v2
source_file: design_source/models/charon_boat.blend
runtime_target_path: public/models/charon_boat.glb
format: glb
used_by_code:
  - src/game/platform/ContentPacks.ts
  - src/game/platform/GameProfile.ts
  - src/game/visual/VisualPlayer.ts
status: planned
expected_scale: 1.0
expected_forward_axis: -Z
animation_policy: first_clip_autoplay
fallback: primitive_player_mesh
notes: lockRotation=true, lockScale=true
```

---

## 2. Ambience manifest

```yaml
asset_id: v2_ambience_loop
category: ambience
variant: v2
source_file: design_source/audio/v2_ambience_project.flp
runtime_target_path: public/audio/v2_ambience.mp3
format: mp3
used_by_code:
  - src/game/platform/ContentPacks.ts
  - src/game/audio/AudioManager.ts
status: planned
loop: seamless
fallback: no_ambience
notes: should not clip, should stay readable under SFX
```

---

## 3. UI art manifest

```yaml
asset_id: game_over_panel_v2
category: ui_art
variant: v2
source_file: design_source/ui/game_over_panel_v2.kra
runtime_target_path: public/ui/game_over_panel_v2.webp
format: webp
used_by_code:
  - src/ui/GameOverlay.tsx
status: planned
fallback: plain_css_panel
notes: comic/manhwa framing, must preserve readability
```

---

## 4. Marketing asset manifest

```yaml
asset_id: yandex_cover_main
category: marketing_cover
variant: shared
source_file: marketing/source/cover_master.psd
runtime_target_path: marketing/export/yandex_cover_main.png
format: png
used_by_code: []
status: planned
fallback: none
notes: not runtime, for store submission only
```

---

## 5. Minimal required fields
Для любого типа ассета обязательны:
- `asset_id`
- `category`
- `source_file`
- `runtime_target_path`
- `format`
- `used_by_code`
- `status`
- `fallback`

Если этих полей нет, ассет не должен считаться интегрированным.
