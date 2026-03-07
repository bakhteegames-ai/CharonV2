# Agent Handoff v0.4a

## Read this first
If you are a new AI/agent entering the Charon project, do not guess.

Read in this order:
1. `PROJECT_RULES.md`
2. `06_Current_Project_State.md`
3. `04_Checklists_v0_4.md`
4. `02_Project_Structure_And_Asset_Contract_v0_4.md`
5. `03_Roadmap_v0_4.md`

Then inspect:
6. asset manifest pack
7. the **latest project archive**

---

## Project in one paragraph
CharonV2 is a reusable Three.js endless runner skeleton with two variants (`v2` and `v3`) on one codebase. Core gameplay is frozen. The current code already has content packs, environment theming, audio hooks, primitive player visual directives, GLTF player activation with safe fallback, plus a `/public` runtime scaffold and early Phase 2C readability/polish passes. The current next step is not core gameplay invention, but first real asset drop, visual verification, then mobile must-pass, then platform/monetization.

---

## Absolute rules
- Do not redesign gameplay without explicit request.
- Do not skip diff-review.
- Do not assume old docs are accurate if a newer docs pack is present.
- Do not treat chat alone as source of truth.
- Use English for coding prompts, Russian for discussion.

---

## What the code already supports
- `ContentPacks.ts`: pack-defined art/audio contract
- `GameProfile.ts`: runtime bootstrap
- `VisualTheme.ts` / `VisualThemeSystem.ts`: environment visuals
- `TrackSystem.ts`: track presentation
- `VisualPlayer.ts`: GLTF loading + fallback
- `AudioManager.ts`: audio pack loading + ambience lifecycle

---

## Where assets are expected
Runtime:
- `public/models/...`
- `public/audio/...`
- `public/textures/...`
- `public/ui/...`

Source:
- `design_source/...`
- `marketing/...`

### Important
The runtime folders already exist in the current archive as scaffold.
Do not spend a patch recreating them unless the latest archive proves otherwise.

---

## What to ask for before changing code
If the archive is not fresh:
- ask for resync / new archive

If the task concerns assets:
- use the existing manifest pack first
- only define a new manifest if the needed asset is not covered yet

If multiple systems are touched:
- split into smaller patches unless explicitly requested otherwise

---

## Preferred patch format
Each patch should include:
- Intent / rationale
- How to test
- One single prompt block for coding agent
- Return-required diff request inside the same prompt block

---

## Status checkpoint at time of this handoff
- Phase 2B completed
- Phase 2C structural prep already applied
- runtime scaffold exists in `/public`
- manifest pack exists in Sources
- next meaningful step = first real asset drop or manual verification if assets are still absent
