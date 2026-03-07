# Production Appendix — Charon Canon v0.4a

## 1. Why this file exists
Чтобы закрывать не “высокие идеи”, а производственные мелочи, из-за которых обычно и ломаются релизы:
- naming
- asset hygiene
- moderation pitfalls
- agent handoff discipline
- upload rules

---

## 2. Naming Conventions

## 2.1 Runtime model files
Use:
- `charon_boat.glb`
- `runner.glb`

Future pattern:
- `<game>_<role>.glb`
- lowercase, snake_case
- no spaces

## 2.2 Runtime audio files
Use:
- `coin.mp3`
- `hit.mp3`
- `ui_click.mp3`
- `v2_ambience.mp3`
- `v3_ambience.mp3`

Future pattern:
- `<scope>_<event>.mp3`
- `ui_confirm.mp3`
- `player_hit.mp3`
- `v2_loop_ambience.mp3`

## 2.3 Source files
Source file names may be richer, but manifest must map them to runtime names.

---

## 3. Asset Drop Procedure

When a new real asset is ready:

1. Create or update its manifest entry
2. Export the runtime file
3. Put it in canonical runtime path
4. Ensure code target path matches
5. Resync archive
6. Ask agent to verify:
   - path
   - format
   - fallback
   - performance / readability risk

If any of these are missing, the asset is not considered integrated.

---

## 4. Recommended export standards

## 4.1 3D models
- runtime: `.glb`
- keep polycount reasonable for mobile web
- one clean root object
- remove hidden garbage
- prefer embedded textures only when lightweight
- test in browser, not only in DCC tool

## 4.2 Audio
- runtime: `.mp3`
- keep loops seamless
- avoid clipping
- use short tails for SFX
- keep mobile bandwidth in mind

## 4.3 Textures / UI
- `.webp` or `.png`
- do not ship raw PSD / Krita / huge uncompressed exports
- produce runtime-ready dimensions

---

## 5. Suggested resolution guidelines

These are practical defaults, not holy law.

## 5.1 World textures
- 1024x1024 preferred
- 2048x2048 only if justified
- avoid 4k unless absolutely necessary

## 5.2 UI icons / buttons
- 256x256 to 1024x1024 depending on use
- alpha-safe export
- crisp readable silhouettes

## 5.3 Store / marketing
Use platform-specific requirements later, but keep source masters larger and export final copies separately.

---

## 6. Runtime Folders Policy
В текущем архиве scaffold уже существует:
- `/public/models`
- `/public/audio`
- `/public/textures`
- `/public/ui`

Это означает:
- структура под runtime asset drop уже подготовлена
- placeholder-файлы внутри этих папок не являются игровыми asset-файлами
- чекбоксы про first real model/audio нельзя закрывать, пока туда не положены реальные `.glb` / `.mp3`

Следующий real asset drop должен **наполнить** эти папки, а не создавать их заново.

---

## 7. Moderation / platform traps to remember
- no runtime crashes on startup
- no clipping UI on mobile
- no system context menu / selection
- pause/mute around fullscreen ad flows
- no misleading metadata
- consistent title across game and store materials

---

## 8. Handoff package for any new AI
Минимальный handoff bundle:
- latest project archive
- latest docs pack
- manifest pack for currently known assets
- one-line task definition

---

## 9. What not to do
- не хранить runtime target paths только “в голове”
- не давать агенту бинарные ассеты без описания, куда они должны лечь
- не держать старые docs рядом без явного помечания, какие из них актуальны
- не просить нового агента “разобраться самому”, если можно дать ему `07_Agent_Handoff_v0_4.md`
- не дублировать manifest pack заново, если он уже есть в Sources
